package ar.com.agendamedica.service;

import ar.com.agendamedica.time.TiempoAgenda;

import ar.com.agendamedica.domain.HorarioConsultorio;
import ar.com.agendamedica.domain.entity.Franja;
import ar.com.agendamedica.domain.entity.Profesional;
import ar.com.agendamedica.domain.enums.EstadoFranja;
import ar.com.agendamedica.domain.enums.EstadoTurno;
import ar.com.agendamedica.exception.BadRequestException;
import ar.com.agendamedica.exception.ConflictException;
import ar.com.agendamedica.exception.ResourceNotFoundException;
import ar.com.agendamedica.repository.ExcepcionAgendaRepository;
import ar.com.agendamedica.repository.FranjaRepository;
import ar.com.agendamedica.repository.TurnoRepository;
import ar.com.agendamedica.repository.ProfesionalRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class DisponibilidadService {
    private final FranjaRepository franjas;
    private final ExcepcionAgendaRepository excepciones;
    private final TurnoRepository turnos;
    private final ConfiguracionAgendaService configuracion;
    private final ProfesionalRepository profesionales;

    public DisponibilidadService(FranjaRepository franjas, ExcepcionAgendaRepository excepciones,
                                 TurnoRepository turnos, ConfiguracionAgendaService configuracion,
                                 ProfesionalRepository profesionales) {
        this.franjas = franjas;
        this.excepciones = excepciones;
        this.turnos = turnos;
        this.configuracion = configuracion;
        this.profesionales = profesionales;
    }

    public Profesional bloquearProfesional(Long id) {
        return profesionales.findByIdForUpdate(id).filter(Profesional::isActivo)
                .orElseThrow(() -> new ResourceNotFoundException("Profesional activo no encontrado: " + id));
    }

    public Long profesionalDeFranja(Long id) {
        return franjas.findProfesionalId(id)
                .orElseThrow(() -> new ResourceNotFoundException("Franja no encontrada: " + id));
    }

    public Franja bloquear(Long id) {
        return franjas.findByIdForUpdate(id)
                .orElseThrow(() -> new ResourceNotFoundException("Franja no encontrada: " + id));
    }

    public boolean estaCerrada(Franja franja) {
        return excepciones.findByProfesionalIdAndFechaBetweenOrderByFechaAsc(
                        franja.getProfesional().getId(), franja.getInicio().toLocalDate(), franja.getFin().toLocalDate())
                .stream().anyMatch(cierre -> cierre.afecta(franja.getInicio(), franja.getFin()));
    }

    public void validarReservable(Franja franja) {
        if (!java.time.Duration.between(franja.getInicio(), franja.getFin()).equals(java.time.Duration.ofMinutes(40))) {
            throw new ConflictException("Sólo se pueden reservar horarios de 40 minutos");
        }
        LocalDateTime ahora = TiempoAgenda.ahora();
        if (franja.getInicio().isBefore(ahora)) {
            throw new BadRequestException("No se puede reservar una franja en el pasado");
        }
        if (franja.getInicio().toLocalDate().isAfter(configuracion.ultimoDiaHabilitable())) {
            throw new BadRequestException("No se puede reservar más allá de los tres meses siguientes");
        }
        if (!HorarioConsultorio.esReservablePorHorario(franja)) {
            throw new ConflictException("Ese horario no pertenece al horario habitual de atención");
        }
        if (franja.getEstado() != EstadoFranja.LIBRE || estaCerrada(franja)) {
            throw new ConflictException("El horario está ocupado o cerrado por el consultorio");
        }
        if (turnos.existsByProfesionalIdAndEstadoInAndInicioLessThanAndFinGreaterThan(
                franja.getProfesional().getId(), List.of(EstadoTurno.RESERVADO, EstadoTurno.CONFIRMADO),
                franja.getFin(), franja.getInicio())) {
            throw new ConflictException("El profesional ya tiene un turno en ese intervalo");
        }
    }

    public void ocupar(Franja franja) {
        franja.setEstado(EstadoFranja.OCUPADA);
        franjas.save(franja);
    }

    public void liberar(Franja franja) {
        boolean cerrada = franja.getEstado() == EstadoFranja.BLOQUEADA || estaCerrada(franja);
        franja.setEstado(cerrada ? EstadoFranja.BLOQUEADA : EstadoFranja.LIBRE);
        franjas.save(franja);
    }

    public void suspender(Franja franja) {
        franja.setEstado(EstadoFranja.BLOQUEADA);
        franjas.save(franja);
    }
}
