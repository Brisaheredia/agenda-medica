package ar.com.agendamedica.dto;

import ar.com.agendamedica.domain.entity.ExcepcionAgenda;
import ar.com.agendamedica.domain.enums.TipoExcepcionAgenda;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public record ExcepcionAgendaResponse(
        Long id,
        Long profesionalId,
        LocalDate fecha,
        LocalTime horaInicio,
        LocalTime horaFin,
        TipoExcepcionAgenda tipo,
        String motivo,
        int franjasCreadas,
        int franjasBloqueadas,
        List<Long> turnosAfectados
) {
    public static ExcepcionAgendaResponse from(
            ExcepcionAgenda e,
            int franjasCreadas,
            int franjasBloqueadas,
            List<Long> turnosAfectados) {
        return new ExcepcionAgendaResponse(
                e.getId(),
                e.getProfesional().getId(),
                e.getFecha(),
                e.getHoraInicio(),
                e.getHoraFin(),
                e.getTipo(),
                e.getMotivo(),
                franjasCreadas,
                franjasBloqueadas,
                turnosAfectados
        );
    }
}
