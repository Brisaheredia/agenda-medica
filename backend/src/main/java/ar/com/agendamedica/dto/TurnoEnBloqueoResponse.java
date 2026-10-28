package ar.com.agendamedica.dto;

import ar.com.agendamedica.domain.entity.Turno;

import java.time.LocalTime;

public record TurnoEnBloqueoResponse(
        Long turnoId,
        String paciente,
        LocalTime horaInicio,
        LocalTime horaFin
) {
    public static TurnoEnBloqueoResponse from(Turno turno) {
        return new TurnoEnBloqueoResponse(
                turno.getId(),
                turno.getPaciente().getApellido() + ", " + turno.getPaciente().getNombre(),
                turno.getInicio().toLocalTime(),
                turno.getFin().toLocalTime()
        );
    }
}
