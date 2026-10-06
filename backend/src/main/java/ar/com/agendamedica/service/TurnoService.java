package ar.com.agendamedica.service;

import ar.com.agendamedica.domain.entity.Franja;
import ar.com.agendamedica.domain.entity.Paciente;
import ar.com.agendamedica.domain.entity.Turno;
import ar.com.agendamedica.domain.entity.TurnoEvento;
import ar.com.agendamedica.domain.enums.EstadoFranja;
import ar.com.agendamedica.domain.enums.EstadoTurno;
import ar.com.agendamedica.domain.enums.TipoEventoTurno;
import ar.com.agendamedica.dto.CancelarTurnoRequest;
import ar.com.agendamedica.dto.CrearTurnoRequest;
import ar.com.agendamedica.dto.ReprogramarTurnoRequest;
import ar.com.agendamedica.dto.TurnoResponse;
import ar.com.agendamedica.exception.BadRequestException;
import ar.com.agendamedica.exception.ConflictException;
import ar.com.agendamedica.exception.ResourceNotFoundException;
import ar.com.agendamedica.repository.FranjaRepository;
import ar.com.agendamedica.repository.TurnoEventoRepository;
import ar.com.agendamedica.repository.TurnoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class TurnoService {
    private static final List<EstadoTurno> ESTADOS_ACTIVOS =
            List.of(EstadoTurno.RESERVADO, EstadoTurno.CONFIRMADO);

    private final TurnoRepository turnoRepository;
    private final TurnoEventoRepository turnoEventoRepository;
    private final FranjaRepository franjaRepository;
    private final PacienteService pacienteService;
    private final AuditoriaService auditoriaService;

    public TurnoService(TurnoRepository turnoRepository,
                        TurnoEventoRepository turnoEventoRepository,
                        FranjaRepository franjaRepository,
                        PacienteService pacienteService,
                        AuditoriaService auditoriaService) {
        this.turnoRepository = turnoRepository;
        this.turnoEventoRepository = turnoEventoRepository;
        this.franjaRepository = franjaRepository;
        this.pacienteService = pacienteService;
        this.auditoriaService = auditoriaService;
    }

    @Transactional
    public TurnoResponse crear(CrearTurnoRequest request) {
        Paciente paciente = pacienteService.obtenerEntidadActiva(request.pacienteId());
        Franja franja = bloquearFranja(request.franjaId());
        validarFranjaDisponible(franja);

        Turno turno = new Turno();
        turno.setPaciente(paciente);
        turno.setProfesional(franja.getProfesional());
        turno.setFranja(franja);
        turno.setInicio(franja.getInicio());
        turno.setFin(franja.getFin());
        turno.setEstado(EstadoTurno.RESERVADO);
        turno.setMotivoConsulta(normalize(request.motivoConsulta()));
        turno = turnoRepository.save(turno);

        franja.setEstado(EstadoFranja.OCUPADA);
        franjaRepository.save(franja);

        registrarEvento(turno, TipoEventoTurno.CREACION, null, franja.getId(), "Turno creado");
        auditoriaService.registrar(
                "CREAR_TURNO",
                "Turno",
                turno.getId(),
                "pacienteId=" + paciente.getId() + ", franjaId=" + franja.getId()
        );

        return TurnoResponse.from(turno);
    }

    @Transactional
    public TurnoResponse cancelar(Long id, CancelarTurnoRequest request) {
        Turno turno = obtenerEntidad(id);
        validarTurnoActivo(turno);

        Franja franja = bloquearFranja(turno.getFranja().getId());
        turno.setEstado(EstadoTurno.CANCELADO);
        turnoRepository.save(turno);

        franja.setEstado(EstadoFranja.LIBRE);
        franjaRepository.save(franja);

        registrarEvento(
                turno,
                TipoEventoTurno.CANCELACION,
                franja.getId(),
                null,
                "Cancelación: " + request.motivo().trim()
        );
        auditoriaService.registrar(
                "CANCELAR_TURNO",
                "Turno",
                turno.getId(),
                "franjaLiberadaId=" + franja.getId() + ", motivo=" + request.motivo().trim()
        );

        return TurnoResponse.from(turno);
    }

    @Transactional
    public TurnoResponse reprogramar(Long id, ReprogramarTurnoRequest request) {
        Turno turno = obtenerEntidad(id);
        validarTurnoActivo(turno);

        Long franjaAnteriorId = turno.getFranja().getId();
        if (franjaAnteriorId.equals(request.franjaId())) {
            throw new BadRequestException("La nueva franja debe ser distinta de la actual");
        }

        Franja franjaAnterior = bloquearFranja(franjaAnteriorId);
        Franja franjaNueva = bloquearFranja(request.franjaId());
        validarFranjaDisponible(franjaNueva);

        franjaAnterior.setEstado(EstadoFranja.LIBRE);
        franjaNueva.setEstado(EstadoFranja.OCUPADA);
        franjaRepository.save(franjaAnterior);
        franjaRepository.save(franjaNueva);

        turno.setFranja(franjaNueva);
        turno.setProfesional(franjaNueva.getProfesional());
        turno.setInicio(franjaNueva.getInicio());
        turno.setFin(franjaNueva.getFin());
        turnoRepository.save(turno);

        String detalle = normalize(request.motivo());
        registrarEvento(
                turno,
                TipoEventoTurno.REPROGRAMACION,
                franjaAnteriorId,
                franjaNueva.getId(),
                detalle == null ? "Turno reprogramado" : "Reprogramación: " + detalle
        );
        auditoriaService.registrar(
                "REPROGRAMAR_TURNO",
                "Turno",
                turno.getId(),
                "franjaAnteriorId=" + franjaAnteriorId + ", franjaNuevaId=" + franjaNueva.getId()
        );

        return TurnoResponse.from(turno);
    }

    @Transactional
    public TurnoResponse marcarAtendido(Long id) {
        return cambiarEstadoFinal(id, EstadoTurno.ATENDIDO, TipoEventoTurno.ATENCION, "MARCAR_ATENDIDO");
    }

    @Transactional
    public TurnoResponse marcarAusente(Long id) {
        return cambiarEstadoFinal(id, EstadoTurno.AUSENTE, TipoEventoTurno.AUSENCIA, "MARCAR_AUSENTE");
    }

    @Transactional(readOnly = true)
    public TurnoResponse obtener(Long id) {
        return TurnoResponse.from(obtenerEntidad(id));
    }

    @Transactional(readOnly = true)
    public List<TurnoResponse> listarPorProfesionalYFecha(Long profesionalId, LocalDate fecha) {
        LocalDateTime desde = fecha.atStartOfDay();
        LocalDateTime hasta = fecha.plusDays(1).atStartOfDay().minusNanos(1);

        return turnoRepository.findByProfesionalIdAndInicioBetweenOrderByInicioAsc(
                        profesionalId, desde, hasta)
                .stream()
                .map(TurnoResponse::from)
                .toList();
    }

    private TurnoResponse cambiarEstadoFinal(Long id,
                                             EstadoTurno nuevoEstado,
                                             TipoEventoTurno tipoEvento,
                                             String accionAuditoria) {
        Turno turno = obtenerEntidad(id);
        validarTurnoActivo(turno);

        if (turno.getInicio().isAfter(LocalDateTime.now())) {
            throw new BadRequestException("No se puede registrar el resultado antes del horario del turno");
        }

        turno.setEstado(nuevoEstado);
        turnoRepository.save(turno);

        registrarEvento(
                turno,
                tipoEvento,
                turno.getFranja().getId(),
                turno.getFranja().getId(),
                nuevoEstado == EstadoTurno.ATENDIDO ? "Paciente atendido" : "Paciente ausente"
        );

        auditoriaService.registrar(
                accionAuditoria,
                "Turno",
                turno.getId(),
                "estado=" + nuevoEstado
        );

        return TurnoResponse.from(turno);
    }

    private Turno obtenerEntidad(Long id) {
        return turnoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Turno no encontrado: " + id));
    }

    private Franja bloquearFranja(Long id) {
        return franjaRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("Franja no encontrada: " + id));
    }

    private void validarTurnoActivo(Turno turno) {
        if (!ESTADOS_ACTIVOS.contains(turno.getEstado())) {
            throw new ConflictException("El turno no está activo y no puede modificarse");
        }
    }

    private void validarFranjaDisponible(Franja franja) {
        if (franja.getInicio().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("No se puede reservar una franja en el pasado");
        }
        if (franja.getEstado() != EstadoFranja.LIBRE) {
            throw new ConflictException("La franja ya no está disponible");
        }
        if (turnoRepository.existsByFranjaIdAndEstadoIn(franja.getId(), ESTADOS_ACTIVOS)) {
            throw new ConflictException("La franja ya posee un turno activo");
        }
    }

    private void registrarEvento(Turno turno,
                                 TipoEventoTurno tipo,
                                 Long franjaAnteriorId,
                                 Long franjaNuevaId,
                                 String detalle) {
        TurnoEvento evento = new TurnoEvento();
        evento.setTurno(turno);
        evento.setTipo(tipo);
        evento.setFranjaAnteriorId(franjaAnteriorId);
        evento.setFranjaNuevaId(franjaNuevaId);
        evento.setDetalle(detalle);
        turnoEventoRepository.save(evento);
    }

    private String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
