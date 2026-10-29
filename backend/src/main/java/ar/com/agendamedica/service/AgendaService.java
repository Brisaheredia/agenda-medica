package ar.com.agendamedica.service;

import ar.com.agendamedica.time.TiempoAgenda;
import ar.com.agendamedica.domain.HorarioConsultorio;

import ar.com.agendamedica.domain.entity.ExcepcionAgenda;
import ar.com.agendamedica.domain.entity.ConfiguracionAgenda;
import ar.com.agendamedica.domain.entity.Franja;
import ar.com.agendamedica.domain.entity.Profesional;
import ar.com.agendamedica.domain.entity.Turno;
import ar.com.agendamedica.domain.enums.EstadoFranja;
import ar.com.agendamedica.domain.enums.EstadoTurno;
import ar.com.agendamedica.domain.enums.TipoExcepcionAgenda;
import ar.com.agendamedica.dto.*;
import ar.com.agendamedica.exception.BadRequestException;
import ar.com.agendamedica.exception.ConflictException;
import ar.com.agendamedica.exception.ResourceNotFoundException;
import ar.com.agendamedica.repository.ExcepcionAgendaRepository;
import ar.com.agendamedica.repository.FranjaRepository;
import ar.com.agendamedica.repository.ProfesionalRepository;
import ar.com.agendamedica.repository.TurnoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Isolation;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Service
public class AgendaService {
    private static final List<EstadoTurno> ESTADOS_ACTIVOS =
            List.of(EstadoTurno.RESERVADO, EstadoTurno.CONFIRMADO);

    private final FranjaRepository franjaRepository;
    private final ProfesionalRepository profesionalRepository;
    private final PlanificacionHorariosService planificacionHorariosService;
    private final ExcepcionAgendaRepository excepcionRepository;
    private final TurnoRepository turnoRepository;
    private final AuditoriaService auditoriaService;
    private final ConfiguracionAgendaService configuracionService;

    public AgendaService(FranjaRepository franjaRepository,
                         ProfesionalRepository profesionalRepository,
                         PlanificacionHorariosService planificacionHorariosService,
                         ExcepcionAgendaRepository excepcionRepository,
                         TurnoRepository turnoRepository,
                         AuditoriaService auditoriaService,
                         ConfiguracionAgendaService configuracionService) {
        this.franjaRepository = franjaRepository;
        this.profesionalRepository = profesionalRepository;
        this.planificacionHorariosService = planificacionHorariosService;
        this.excepcionRepository = excepcionRepository;
        this.turnoRepository = turnoRepository;
        this.auditoriaService = auditoriaService;
        this.configuracionService = configuracionService;
    }

    @Transactional(readOnly = true)
    public List<FranjaResponse> agendaDiaria(Long profesionalId, LocalDate fecha) {
        obtenerProfesional(profesionalId);

        return franjasDelDia(profesionalId, fecha)
                .stream()
                .filter(franja -> franja.getEstado() != EstadoFranja.LIBRE
                        || HorarioConsultorio.esReservablePorHorario(franja))
                .map(FranjaResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<FranjaResponse> disponibles(Long profesionalId, LocalDateTime desde) {
        obtenerProfesional(profesionalId);

        LocalDateTime ahora = TiempoAgenda.ahora();
        LocalDateTime inicioBusqueda = desde == null || desde.isBefore(ahora) ? ahora : desde;

        LocalDateTime limite = configuracionService.ultimoDiaHabilitable().atTime(LocalTime.MAX);
        if (inicioBusqueda.isAfter(limite)) return List.of();
        var cierres = excepcionRepository.findByProfesionalIdAndFechaBetweenOrderByFechaAsc(
                profesionalId, inicioBusqueda.toLocalDate(), limite.toLocalDate());
        var compromisos = turnoRepository.findByProfesionalIdAndEstadoInAndInicioLessThanAndFinGreaterThan(
                profesionalId, ESTADOS_ACTIVOS, limite, inicioBusqueda);
        return franjaRepository
                .findByProfesionalIdAndEstadoAndInicioBetweenOrderByInicioAsc(
                        profesionalId,
                        EstadoFranja.LIBRE,
                        inicioBusqueda,
                        limite)
                .stream()
                .filter(this::duracionCorrecta)
                .filter(HorarioConsultorio::esReservablePorHorario)
                .filter(franja -> cierres.stream().noneMatch(cierre -> cierre.afecta(franja.getInicio(), franja.getFin())))
                .filter(franja -> compromisos.stream().noneMatch(t -> franja.getInicio().isBefore(t.getFin())
                        && franja.getFin().isAfter(t.getInicio())))
                .map(FranjaResponse::from)
                .toList();
    }

    public GenerarFranjasResponse generarFranjas(GenerarFranjasRequest request) {
        return planificacionHorariosService.generarFranjas(request);
    }

    @Transactional(readOnly = true)
    public PrevisualizacionBloqueoResponse previsualizarBloqueo(BloqueoAgendaRequest request) {
        validarFechaYHorario(request.fecha(), request.horaInicio(), request.horaFin());
        obtenerProfesional(request.profesionalId());
        List<TurnoEnBloqueoResponse> afectados = buscarTurnosAfectados(
                request.profesionalId(), request.fecha(), request.horaInicio(), request.horaFin())
                .stream().map(TurnoEnBloqueoResponse::from).toList();
        return new PrevisualizacionBloqueoResponse(afectados.size(), afectados);
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public ExcepcionAgendaResponse crearBloqueo(BloqueoAgendaRequest request) {
        if (request.turnosAfectadosEsperados() == null) {
            throw new BadRequestException("Revisá primero los turnos afectados antes de confirmar el cierre");
        }
        // Se valida otra vez bajo el mismo bloqueo usado al asignar/reprogramar turnos.
        Profesional profesional = bloquearProfesional(request.profesionalId());
        validarFechaYHorario(request.fecha(), request.horaInicio(), request.horaFin());

        List<Long> turnosAfectados = buscarTurnosAfectados(
                profesional.getId(), request.fecha(), request.horaInicio(), request.horaFin())
                .stream().map(Turno::getId).toList();
        if (!turnosAfectados.equals(request.turnosAfectadosEsperados())) {
            throw new ConflictException("Los turnos afectados cambiaron. Volvé a revisar antes de confirmar el cierre");
        }

        ExcepcionAgenda cierre = new ExcepcionAgenda();
        cierre.setProfesional(profesional);
        cierre.setFecha(request.fecha());
        cierre.setHoraInicio(request.horaInicio());
        cierre.setHoraFin(request.horaFin());
        cierre.setTipo(TipoExcepcionAgenda.CIERRE);
        cierre.setMotivo(normalize(request.motivo()));
        cierre = excepcionRepository.save(cierre);

        int franjasBloqueadas = 0;
        for (Franja franja : franjasDelDia(profesional.getId(), request.fecha())) {
            if (!solapa(request, franja.getInicio().toLocalTime(), franja.getFin().toLocalTime())) {
                continue;
            }
            if (franja.getEstado() == EstadoFranja.LIBRE && !franja.getInicio().isBefore(TiempoAgenda.ahora())) {
                franja.setEstado(EstadoFranja.BLOQUEADA);
                franjaRepository.save(franja);
                franjasBloqueadas++;
            }
        }

        auditoriaService.registrar("CREAR_EXCEPCION_AGENDA", "ExcepcionAgenda", cierre.getId(),
                "tipo=CIERRE, fecha=" + cierre.getFecha() + ", turnosAfectados=" + turnosAfectados);
        // franjasCreadas=0 se mantiene por compatibilidad con el DTO de respuesta.
        return ExcepcionAgendaResponse.from(cierre, 0, franjasBloqueadas, turnosAfectados);
    }

    private boolean duracionCorrecta(Franja franja) {
        return java.time.Duration.between(franja.getInicio(), franja.getFin())
                .equals(java.time.Duration.ofMinutes(ConfiguracionAgenda.DURACION_TURNO_MIN));
    }

    private void validarFechaYHorario(LocalDate fecha, LocalTime horaInicio, LocalTime horaFin) {
        if (!HorarioConsultorio.atiende(fecha)) {
            throw new BadRequestException("El consultorio no atiende sábados ni domingos; elegí un día de lunes a viernes");
        }
        if (fecha.isBefore(TiempoAgenda.hoy())) {
            throw new BadRequestException("No se pueden crear excepciones en fechas pasadas");
        }
        if ((horaInicio == null) != (horaFin == null)) {
            throw new BadRequestException("horaInicio y horaFin deben informarse juntas");
        }
        if (horaInicio != null && !horaFin.isAfter(horaInicio)) {
            throw new BadRequestException("La hora de fin debe ser posterior a la hora de inicio");
        }
    }

    private List<Turno> buscarTurnosAfectados(Long profesionalId, LocalDate fecha,
                                             LocalTime horaInicio, LocalTime horaFin) {
        LocalDateTime desde = horaInicio == null ? fecha.atStartOfDay() : fecha.atTime(horaInicio);
        LocalDateTime hasta = horaFin == null ? fecha.plusDays(1).atStartOfDay() : fecha.atTime(horaFin);
        return turnoRepository.findAfectadosPorCierre(profesionalId, ESTADOS_ACTIVOS, desde, hasta);
    }

    private boolean solapa(BloqueoAgendaRequest request, LocalTime inicio, LocalTime fin) {
        if (request.horaInicio() == null || request.horaFin() == null) {
            return true;
        }
        return inicio.isBefore(request.horaFin()) && fin.isAfter(request.horaInicio());
    }

    private List<Franja> franjasDelDia(Long profesionalId, LocalDate fecha) {
        return franjaRepository.findByProfesionalIdAndInicioBetweenOrderByInicioAsc(
                profesionalId,
                fecha.atStartOfDay(),
                fecha.plusDays(1).atStartOfDay().minusNanos(1));
    }

    private Profesional bloquearProfesional(Long id) {
        return profesionalRepository.findByIdForUpdate(id).filter(Profesional::isActivo)
                .orElseThrow(() -> new ResourceNotFoundException("Profesional activo no encontrado: " + id));
    }

    private Profesional obtenerProfesional(Long id) {
        return profesionalRepository.findById(id)
                .filter(Profesional::isActivo)
                .orElseThrow(() -> new ResourceNotFoundException("Profesional activo no encontrado: " + id));
    }

    private String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
