package ar.com.agendamedica.dto;

import ar.com.agendamedica.domain.entity.Turno;
import ar.com.agendamedica.domain.enums.EstadoTurno;
import ar.com.agendamedica.domain.enums.OrigenCancelacion;
import java.time.LocalDateTime;

public record TurnoResponse(
        Long id,
        Long pacienteId,
        String paciente,
        Long profesionalId,
        Long franjaId,
        LocalDateTime inicio,
        LocalDateTime fin,
        EstadoTurno estado,
        String motivoConsulta,
        LocalDateTime createdAt,
        OrigenCancelacion origenCancelacion,
        String motivoCancelacion,
        boolean reprogramadoPorConsultorio
) {
    public TurnoResponse sinMotivos() {
        return new TurnoResponse(id, pacienteId, paciente, profesionalId, franjaId, inicio, fin,
                estado, null, createdAt, origenCancelacion, null, reprogramadoPorConsultorio);
    }

    public static TurnoResponse from(Turno turno) {
        return new TurnoResponse(
                turno.getId(),
                turno.getPaciente().getId(),
                turno.getPaciente().getApellido() + ", " + turno.getPaciente().getNombre(),
                turno.getProfesional().getId(),
                turno.getFranja().getId(),
                turno.getInicio(),
                turno.getFin(),
                turno.getEstado(),
                turno.getMotivoConsulta(),
                turno.getCreatedAt(),
                turno.getOrigenCancelacion(),
                turno.getMotivoCancelacion(),
                turno.isReprogramadoPorConsultorio()
        );
    }
}
