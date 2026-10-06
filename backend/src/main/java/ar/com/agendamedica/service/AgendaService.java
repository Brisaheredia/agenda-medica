package ar.com.agendamedica.service;

import ar.com.agendamedica.domain.entity.ExcepcionAgenda;
import ar.com.agendamedica.domain.entity.Franja;
import ar.com.agendamedica.domain.entity.PlantillaDisponibilidad;
import ar.com.agendamedica.domain.entity.Profesional;
import ar.com.agendamedica.domain.entity.Turno;
import ar.com.agendamedica.domain.enums.EstadoFranja;
import ar.com.agendamedica.domain.enums.EstadoTurno;
import ar.com.agendamedica.domain.enums.TipoExcepcionAgenda;
import ar.com.agendamedica.dto.*;
import ar.com.agendamedica.exception.BadRequestException;
import ar.com.agendamedica.exception.ResourceNotFoundException;
import ar.com.agendamedica.repository.ExcepcionAgendaRepository;
import ar.com.agendamedica.repository.FranjaRepository;
import ar.com.agendamedica.repository.PlantillaDisponibilidadRepository;
import ar.com.agendamedica.repository.ProfesionalRepository;
import ar.com.agendamedica.repository.TurnoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Service
public class AgendaService {
    private static final List<EstadoTurno> ESTADOS_ACTIVOS =
            List.of(EstadoTurno.RESERVADO, EstadoTurno.CONFIRMADO);

    private final FranjaRepository franjaRepository;
    private final ProfesionalRepository profesionalRepository;
    private final PlantillaDisponibilidadRepository plantillaRepository;
    private final ExcepcionAgendaRepository excepcionRepository;
    private final TurnoRepository turnoRepository;
    private final AuditoriaService auditoriaService;

    public AgendaService(FranjaRepository franjaRepository,
                         ProfesionalRepository profesionalRepository,
                         PlantillaDisponibilidadRepository plantillaRepository,
                         ExcepcionAgendaRepository excepcionRepository,
                         TurnoRepository turnoRepository,
                         AuditoriaService auditoriaService) {
        this.franjaRepository = franjaRepository;
        this.profesionalRepository = profesionalRepository;
        this.plantillaRepository = plantillaRepository;
        this.excepcionRepository = excepcionRepository;
        this.turnoRepository = turnoRepository;
        this.auditoriaService = auditoriaService;
    }

    @Transactional(readOnly = true)
    public List<FranjaResponse> agendaDiaria(Long profesionalId, LocalDate fecha) {
        obtenerProfesional(profesionalId);

        return franjasDelDia(profesionalId, fecha)
                .stream()
                .map(FranjaResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<FranjaResponse> disponibles(Long profesionalId, LocalDateTime desde) {
        obtenerProfesional(profesionalId);

        LocalDateTime inicioBusqueda = desde == null ? LocalDateTime.now() : desde;

        return franjaRepository
                .findByProfesionalIdAndEstadoAndInicioGreaterThanEqualOrderByInicioAsc(
                        profesionalId,
                        EstadoFranja.LIBRE,
                        inicioBusqueda)
                .stream()
                .map(FranjaResponse::from)
                .toList();
    }

    @Transactional
    public PlantillaDisponibilidadResponse crearPlantilla(PlantillaDisponibilidadRequest request) {
        Profesional profesional = obtenerProfesional(request.profesionalId());

        if (!request.horaFin().isAfter(request.horaInicio())) {
            throw new BadRequestException("La hora de fin debe ser posterior a la hora de inicio");
        }
        if (request.vigenciaHasta() != null && request.vigenciaHasta().isBefore(request.vigenciaDesde())) {
            throw new BadRequestException("La vigencia hasta no puede ser anterior a la vigencia desde");
        }

        PlantillaDisponibilidad plantilla = new PlantillaDisponibilidad();
        plantilla.setProfesional(profesional);
        plantilla.setDiaSemana(request.diaSemana());
        plantilla.setHoraInicio(request.horaInicio());
        plantilla.setHoraFin(request.horaFin());
        plantilla.setDuracionMin(request.duracionMin());
        plantilla.setVigenciaDesde(request.vigenciaDesde());
        plantilla.setVigenciaHasta(request.vigenciaHasta());

        plantilla = plantillaRepository.save(plantilla);
        auditoriaService.registrar(
                "CREAR_PLANTILLA",
                "PlantillaDisponibilidad",
                plantilla.getId(),
                "profesionalId=" + profesional.getId() + ", dia=" + plantilla.getDiaSemana()
        );

        return PlantillaDisponibilidadResponse.from(plantilla);
    }

    @Transactional
    public GenerarFranjasResponse generarFranjas(GenerarFranjasRequest request) {
        Profesional profesional = obtenerProfesional(request.profesionalId());

        if (request.hasta().isBefore(request.desde())) {
            throw new BadRequestException("La fecha hasta no puede ser anterior a desde");
        }
        if (ChronoUnit.DAYS.between(request.desde(), request.hasta()) > 90) {
            throw new BadRequestException("Se pueden generar como máximo 90 días por operación");
        }

        List<PlantillaDisponibilidad> plantillas =
                plantillaRepository.findByProfesionalIdAndVigenciaDesdeLessThanEqual(
                        profesional.getId(), request.hasta());

        List<ExcepcionAgenda> excepciones =
                excepcionRepository.findByProfesionalIdAndFechaBetweenOrderByFechaAsc(
                        profesional.getId(), request.desde(), request.hasta());

        int creadas = 0;
        int existentes = 0;
        int omitidasPorCierre = 0;

        for (LocalDate fecha = request.desde(); !fecha.isAfter(request.hasta()); fecha = fecha.plusDays(1)) {
            final LocalDate fechaActual = fecha;

            for (PlantillaDisponibilidad plantilla : plantillas) {
                if (plantilla.getDiaSemana() != fechaActual.getDayOfWeek()) {
                    continue;
                }
                if (fechaActual.isBefore(plantilla.getVigenciaDesde())) {
                    continue;
                }
                if (plantilla.getVigenciaHasta() != null && fechaActual.isAfter(plantilla.getVigenciaHasta())) {
                    continue;
                }

                LocalTime hora = plantilla.getHoraInicio();
                while (!hora.plusMinutes(plantilla.getDuracionMin()).isAfter(plantilla.getHoraFin())) {
                    LocalDateTime inicio = LocalDateTime.of(fechaActual, hora);
                    LocalDateTime fin = inicio.plusMinutes(plantilla.getDuracionMin());

                    if (estaCerrada(excepciones, fechaActual, hora, fin.toLocalTime())) {
                        omitidasPorCierre++;
                    } else if (franjaRepository.existsByProfesionalIdAndInicio(profesional.getId(), inicio)) {
                        existentes++;
                    } else {
                        Franja franja = new Franja();
                        franja.setProfesional(profesional);
                        franja.setInicio(inicio);
                        franja.setFin(fin);
                        franja.setEstado(EstadoFranja.LIBRE);
                        franja.setOrigen("PLANTILLA");
                        franjaRepository.save(franja);
                        creadas++;
                    }

                    hora = hora.plusMinutes(plantilla.getDuracionMin());
                }
            }
        }

        auditoriaService.registrar(
                "GENERAR_FRANJAS",
                "Profesional",
                profesional.getId(),
                "desde=" + request.desde() + ", hasta=" + request.hasta() + ", creadas=" + creadas
        );

        return new GenerarFranjasResponse(creadas, existentes, omitidasPorCierre);
    }

    @Transactional
    public ExcepcionAgendaResponse crearBloqueo(BloqueoAgendaRequest request) {
        return crearExcepcion(new ExcepcionAgendaRequest(
                request.profesionalId(),
                request.fecha(),
                request.horaInicio(),
                request.horaFin(),
                TipoExcepcionAgenda.CIERRE,
                null,
                request.motivo()
        ));
    }

    @Transactional
    public ExcepcionAgendaResponse crearExcepcion(ExcepcionAgendaRequest request) {
        Profesional profesional = obtenerProfesional(request.profesionalId());

        if (request.fecha().isBefore(LocalDate.now())) {
            throw new BadRequestException("No se pueden crear excepciones en fechas pasadas");
        }

        validarRangoExcepcion(request);

        ExcepcionAgenda excepcion = new ExcepcionAgenda();
        excepcion.setProfesional(profesional);
        excepcion.setFecha(request.fecha());
        excepcion.setHoraInicio(request.horaInicio());
        excepcion.setHoraFin(request.horaFin());
        excepcion.setTipo(request.tipo());
        excepcion.setMotivo(normalize(request.motivo()));
        excepcion = excepcionRepository.save(excepcion);

        int franjasCreadas = 0;
        int franjasBloqueadas = 0;
        List<Long> turnosAfectados = new ArrayList<>();

        if (request.tipo() == TipoExcepcionAgenda.CIERRE) {
            List<Franja> franjas = franjasDelDia(profesional.getId(), request.fecha());

            for (Franja franja : franjas) {
                if (!solapa(request, franja.getInicio().toLocalTime(), franja.getFin().toLocalTime())) {
                    continue;
                }

                if (franja.getEstado() == EstadoFranja.LIBRE && !franja.getInicio().isBefore(LocalDateTime.now())) {
                    franja.setEstado(EstadoFranja.BLOQUEADA);
                    franjaRepository.save(franja);
                    franjasBloqueadas++;
                }
            }

            turnosAfectados = turnoRepository.findByProfesionalIdAndInicioBetweenOrderByInicioAsc(
                            profesional.getId(),
                            request.fecha().atStartOfDay(),
                            request.fecha().plusDays(1).atStartOfDay().minusNanos(1))
                    .stream()
                    .filter(t -> ESTADOS_ACTIVOS.contains(t.getEstado()))
                    .filter(t -> solapa(
                            request,
                            t.getInicio().toLocalTime(),
                            t.getFin().toLocalTime()))
                    .map(Turno::getId)
                    .toList();
        } else {
            if (request.horaInicio() == null || request.horaFin() == null || request.duracionMin() == null) {
                throw new BadRequestException(
                        "Una apertura requiere horaInicio, horaFin y duracionMin");
            }

            LocalTime hora = request.horaInicio();
            while (!hora.plusMinutes(request.duracionMin()).isAfter(request.horaFin())) {
                LocalDateTime inicio = LocalDateTime.of(request.fecha(), hora);
                LocalDateTime fin = inicio.plusMinutes(request.duracionMin());

                if (!inicio.isBefore(LocalDateTime.now())) {
                    Franja existente = franjasDelDia(profesional.getId(), request.fecha())
                            .stream()
                            .filter(f -> f.getInicio().equals(inicio))
                            .findFirst()
                            .orElse(null);

                    if (existente == null) {
                        Franja franja = new Franja();
                        franja.setProfesional(profesional);
                        franja.setInicio(inicio);
                        franja.setFin(fin);
                        franja.setEstado(EstadoFranja.LIBRE);
                        franja.setOrigen("EXCEPCION_APERTURA");
                        franjaRepository.save(franja);
                        franjasCreadas++;
                    } else if (existente.getEstado() == EstadoFranja.BLOQUEADA) {
                        existente.setEstado(EstadoFranja.LIBRE);
                        existente.setOrigen("EXCEPCION_APERTURA");
                        franjaRepository.save(existente);
                        franjasCreadas++;
                    }
                }

                hora = hora.plusMinutes(request.duracionMin());
            }
        }

        auditoriaService.registrar(
                "CREAR_EXCEPCION_AGENDA",
                "ExcepcionAgenda",
                excepcion.getId(),
                "tipo=" + excepcion.getTipo()
                        + ", fecha=" + excepcion.getFecha()
                        + ", turnosAfectados=" + turnosAfectados
        );

        return ExcepcionAgendaResponse.from(
                excepcion,
                franjasCreadas,
                franjasBloqueadas,
                turnosAfectados
        );
    }

    private void validarRangoExcepcion(ExcepcionAgendaRequest request) {
        if ((request.horaInicio() == null) != (request.horaFin() == null)) {
            throw new BadRequestException("horaInicio y horaFin deben informarse juntas");
        }
        if (request.horaInicio() != null && !request.horaFin().isAfter(request.horaInicio())) {
            throw new BadRequestException("La hora de fin debe ser posterior a la hora de inicio");
        }
    }

    private boolean solapa(ExcepcionAgendaRequest request, LocalTime inicio, LocalTime fin) {
        if (request.horaInicio() == null || request.horaFin() == null) {
            return true;
        }
        return inicio.isBefore(request.horaFin()) && fin.isAfter(request.horaInicio());
    }

    private boolean estaCerrada(List<ExcepcionAgenda> excepciones,
                                LocalDate fecha,
                                LocalTime inicio,
                                LocalTime fin) {
        return excepciones.stream()
                .filter(e -> e.getTipo() == TipoExcepcionAgenda.CIERRE)
                .filter(e -> e.getFecha().equals(fecha))
                .anyMatch(e -> {
                    if (e.getHoraInicio() == null || e.getHoraFin() == null) {
                        return true;
                    }
                    return inicio.isBefore(e.getHoraFin()) && fin.isAfter(e.getHoraInicio());
                });
    }

    private List<Franja> franjasDelDia(Long profesionalId, LocalDate fecha) {
        return franjaRepository.findByProfesionalIdAndInicioBetweenOrderByInicioAsc(
                profesionalId,
                fecha.atStartOfDay(),
                fecha.plusDays(1).atStartOfDay().minusNanos(1));
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
