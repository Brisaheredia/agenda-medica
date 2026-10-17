package ar.com.agendamedica.service;

import ar.com.agendamedica.domain.enums.EstadoTurno;
import ar.com.agendamedica.domain.enums.OrigenCancelacion;
import ar.com.agendamedica.dto.ExcepcionAgendaResumen;
import ar.com.agendamedica.dto.TurnoAfectadoResponse;
import ar.com.agendamedica.exception.BadRequestException;
import ar.com.agendamedica.repository.ExcepcionAgendaRepository;
import ar.com.agendamedica.repository.TurnoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class AgendaConsultaService {
    private final TurnoRepository turnos;
    private final ExcepcionAgendaRepository excepciones;

    public AgendaConsultaService(TurnoRepository turnos, ExcepcionAgendaRepository excepciones) {
        this.turnos = turnos;
        this.excepciones = excepciones;
    }

    public List<ExcepcionAgendaResumen> excepciones(Long profesionalId, LocalDate desde, LocalDate hasta) {
        if (hasta.isBefore(desde)) throw new BadRequestException("La fecha hasta no puede ser anterior a desde");
        return excepciones.findByProfesionalIdAndFechaBetweenOrderByFechaAsc(profesionalId, desde, hasta)
                .stream().map(ExcepcionAgendaResumen::from).toList();
    }

    public List<TurnoAfectadoResponse> pendientes(Long profesionalId) {
        var candidatos = turnos.findCandidatosReprogramacion(profesionalId,
                List.of(EstadoTurno.RESERVADO, EstadoTurno.CONFIRMADO), EstadoTurno.CANCELADO, OrigenCancelacion.CONSULTORIO);
        if (candidatos.isEmpty()) return List.of();
        var cierres = excepciones.findByProfesionalIdAndFechaBetweenOrderByFechaAsc(profesionalId,
                candidatos.getFirst().getInicio().toLocalDate(),
                candidatos.stream().map(t -> t.getFin().toLocalDate()).max(LocalDate::compareTo).orElseThrow());
        List<TurnoAfectadoResponse> pendientes = new ArrayList<>();
        for (var turno : candidatos) {
            if (turno.getEstado() == EstadoTurno.CANCELADO) {
                pendientes.add(TurnoAfectadoResponse.from(turno, turno.getMotivoCancelacion()));
                continue;
            }
            cierres.stream().filter(cierre -> cierre.afecta(turno.getInicio(), turno.getFin())).findFirst()
                    .ifPresent(cierre -> pendientes.add(TurnoAfectadoResponse.from(turno, cierre.getMotivo())));
        }
        return pendientes;
    }
}
