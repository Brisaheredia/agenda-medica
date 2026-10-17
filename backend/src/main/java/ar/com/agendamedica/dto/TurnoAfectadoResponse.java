package ar.com.agendamedica.dto;

import ar.com.agendamedica.domain.entity.Turno;

public record TurnoAfectadoResponse(TurnoResponse turno, String dni, String telefono,
                                   String email, String motivo) {
    public static TurnoAfectadoResponse from(Turno turno, String motivo) {
        return new TurnoAfectadoResponse(TurnoResponse.from(turno), turno.getPaciente().getDni(),
                turno.getPaciente().getTelefono(), turno.getPaciente().getEmail(), motivo);
    }
}
