package ar.com.agendamedica.service;

import ar.com.agendamedica.time.TiempoAgenda;

import ar.com.agendamedica.domain.entity.Franja;
import ar.com.agendamedica.domain.entity.Paciente;
import ar.com.agendamedica.domain.entity.Turno;
import ar.com.agendamedica.domain.entity.TurnoEvento;
import ar.com.agendamedica.domain.enums.EstadoTurno;
import ar.com.agendamedica.domain.enums.OrigenCancelacion;
import ar.com.agendamedica.domain.enums.TipoEventoTurno;
import ar.com.agendamedica.dto.CancelarTurnoRequest;
import ar.com.agendamedica.dto.CrearTurnoRequest;
import ar.com.agendamedica.dto.ReprogramarTurnoRequest;
import ar.com.agendamedica.dto.TurnoResponse;
import ar.com.agendamedica.dto.TurnoAfectadoResponse;
import ar.com.agendamedica.exception.BadRequestException;
import ar.com.agendamedica.exception.ConflictException;
import ar.com.agendamedica.exception.ResourceNotFoundException;
import ar.com.agendamedica.repository.TurnoEventoRepository;
import ar.com.agendamedica.repository.TurnoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Isolation;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class TurnoService {
    private static final List<EstadoTurno> ESTADOS_ACTIVOS =
            List.of(EstadoTurno.RESERVADO, EstadoTurno.CONFIRMADO);

    private final TurnoRepository turnoRepository;
    private final TurnoEventoRepository turnoEventoRepository;
    private final DisponibilidadService disponibilidad;
    private final PacienteService pacienteService;
    private final AuditoriaService auditoriaService;

    public TurnoService(TurnoRepository turnoRepository,
                        TurnoEventoRepository turnoEventoRepository,
                        DisponibilidadService disponibilidad,
                        PacienteService pacienteService,
                        AuditoriaService auditoriaService) {
        this.turnoRepository = turnoRepository;
        this.turnoEventoRepository = turnoEventoRepository;
        this.disponibilidad = disponibilidad;
        this.pacienteService = pacienteService;
        this.auditoriaService = auditoriaService;
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public TurnoResponse crear(CrearTurnoRequest request) {
        disponibilidad.bloquearProfesional(disponibilidad.profesionalDeFranja(request.franjaId()));
        Paciente paciente = pacienteService.obtenerEntidadActiva(request.pacienteId());
        Franja franja = disponibilidad.bloquear(request.franjaId());
        disponibilidad.validarReservable(franja);

        Turno turno = new Turno();
        turno.setPaciente(paciente);
        turno.setProfesional(franja.getProfesional());
        turno.setFranja(franja);
        turno.setInicio(franja.getInicio());
        turno.setFin(franja.getFin());
        turno.setEstado(EstadoTurno.RESERVADO);
        turno.setMotivoConsulta(normalize(request.motivoConsulta()));
        turno = turnoRepository.save(turno);

        disponibilidad.ocupar(franja);

        registrarEvento(turno, TipoEventoTurno.CREACION, null, franja.getId(), "Turno creado");
        auditoriaService.registrar(
                "CREAR_TURNO",
                "Turno",
                turno.getId(),
                "pacienteId=" + paciente.getId() + ", franjaId=" + franja.getId()
        );

        return TurnoResponse.from(turno);
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public TurnoResponse cancelar(Long id, CancelarTurnoRequest request) {
        bloquearAgendaDelTurno(id);
        Turno turno = obtenerParaModificar(id);
        validarTurnoActivo(turno);

        Franja franja = disponibilidad.bloquear(turno.getFranja().getId());
        OrigenCancelacion origen = request.origen() == null ? OrigenCancelacion.PACIENTE : request.origen();
        turno.setEstado(EstadoTurno.CANCELADO);
        turno.setOrigenCancelacion(origen);
        turno.setMotivoCancelacion(request.motivo().trim());
        turnoRepository.save(turno);

        if (origen == OrigenCancelacion.CONSULTORIO) disponibilidad.suspender(franja);
        else disponibilidad.liberar(franja);

        registrarEvento(
                turno,
                TipoEventoTurno.CANCELACION,
                franja.getId(),
                null,
                "Cancelación " + origen + ": " + request.motivo().trim()
        );
        auditoriaService.registrar(
                "CANCELAR_TURNO",
                "Turno",
                turno.getId(),
                "franjaId=" + franja.getId() + ", origen=" + origen
        );

        return TurnoResponse.from(turno);
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public TurnoResponse reprogramar(Long id, ReprogramarTurnoRequest request) {
        Long origenProfesional = profesionalDelTurno(id);
        Long destinoProfesional = disponibilidad.profesionalDeFranja(request.franjaId());
        java.util.stream.Stream.of(origenProfesional, destinoProfesional).distinct().sorted()
                .forEach(disponibilidad::bloquearProfesional);
        Turno turno = obtenerParaModificar(id);
        boolean canceladoPorConsultorio = turno.getEstado() == EstadoTurno.CANCELADO
                && turno.getOrigenCancelacion() == OrigenCancelacion.CONSULTORIO;
        if (!canceladoPorConsultorio) validarTurnoActivo(turno);

        Long franjaAnteriorId = turno.getFranja().getId();
        if (franjaAnteriorId.equals(request.franjaId())) {
            throw new BadRequestException("La nueva franja debe ser distinta de la actual");
        }

        Franja primera = disponibilidad.bloquear(Math.min(franjaAnteriorId, request.franjaId()));
        Franja segunda = disponibilidad.bloquear(Math.max(franjaAnteriorId, request.franjaId()));
        Franja franjaAnterior = primera.getId().equals(franjaAnteriorId) ? primera : segunda;
        Franja franjaNueva = primera.getId().equals(request.franjaId()) ? primera : segunda;
        disponibilidad.validarReservable(franjaNueva);

        disponibilidad.liberar(franjaAnterior);
        disponibilidad.ocupar(franjaNueva);

        turno.setFranja(franjaNueva);
        turno.setProfesional(franjaNueva.getProfesional());
        turno.setInicio(franjaNueva.getInicio());
        turno.setFin(franjaNueva.getFin());
        if (canceladoPorConsultorio) turno.setEstado(EstadoTurno.RESERVADO);
        turno.setOrigenCancelacion(null);
        turno.setMotivoCancelacion(null);
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

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public TurnoResponse marcarAtendido(Long id) {
        bloquearAgendaDelTurno(id);
        return cambiarEstadoFinal(id, EstadoTurno.ATENDIDO, TipoEventoTurno.ATENCION, "MARCAR_ATENDIDO");
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public TurnoResponse marcarAusente(Long id) {
        bloquearAgendaDelTurno(id);
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

    @Transactional(readOnly = true)
    public List<TurnoAfectadoResponse> consultarPorPeriodo(Long profesionalId, LocalDateTime desde, LocalDateTime hasta) {
        return turnoRepository.findPorPeriodo(profesionalId, desde, hasta).stream()
                .map(t -> TurnoAfectadoResponse.from(t, t.getMotivoCancelacion())).toList();
    }

    private Long profesionalDelTurno(Long id) {
        return turnoRepository.findProfesionalId(id)
                .orElseThrow(() -> new ResourceNotFoundException("Turno no encontrado: " + id));
    }

    private void bloquearAgendaDelTurno(Long id) {
        disponibilidad.bloquearProfesional(profesionalDelTurno(id));
    }

    private TurnoResponse cambiarEstadoFinal(Long id,
                                             EstadoTurno nuevoEstado,
                                             TipoEventoTurno tipoEvento,
                                             String accionAuditoria) {
        Turno turno = obtenerParaModificar(id);
        validarTurnoActivo(turno);

        if (turno.getInicio().isAfter(TiempoAgenda.ahora())) {
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

    private Turno obtenerParaModificar(Long id) {
        return turnoRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("Turno no encontrado: " + id));
    }

    private void validarTurnoActivo(Turno turno) {
        if (!ESTADOS_ACTIVOS.contains(turno.getEstado())) {
            throw new ConflictException("El turno no está activo y no puede modificarse");
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
