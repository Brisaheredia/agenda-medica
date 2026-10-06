package ar.com.agendamedica.dto;

import ar.com.agendamedica.domain.entity.Franja;
import ar.com.agendamedica.domain.enums.EstadoFranja;
import java.time.LocalDateTime;

public record FranjaResponse(
        Long id,
        Long profesionalId,
        LocalDateTime inicio,
        LocalDateTime fin,
        EstadoFranja estado,
        String origen
) {
    public static FranjaResponse from(Franja franja) {
        return new FranjaResponse(
                franja.getId(),
                franja.getProfesional().getId(),
                franja.getInicio(),
                franja.getFin(),
                franja.getEstado(),
                franja.getOrigen()
        );
    }
}
