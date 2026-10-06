package ar.com.agendamedica.dto;

import ar.com.agendamedica.domain.entity.Auditoria;

import java.time.LocalDateTime;

public record AuditoriaResponse(
        Long id,
        String accion,
        String entidad,
        Long entidadId,
        LocalDateTime fecha,
        String metadata,
        Long usuarioId
) {
    public static AuditoriaResponse from(Auditoria a) {
        return new AuditoriaResponse(
                a.getId(),
                a.getAccion(),
                a.getEntidad(),
                a.getEntidadId(),
                a.getFecha(),
                a.getMetadata(),
                a.getUsuario() == null ? null : a.getUsuario().getId()
        );
    }
}
