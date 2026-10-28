package ar.com.agendamedica.dto;

import ar.com.agendamedica.domain.entity.Franja;
import ar.com.agendamedica.domain.entity.TurnoEvento;
import ar.com.agendamedica.domain.enums.TipoEventoTurno;
import java.time.LocalDateTime;
import java.util.Map;

public record TurnoHistorialResponse(
        Long id, TipoEventoTurno tipo, LocalDateTime fecha, String usuario,
        Long franjaAnteriorId, LocalDateTime inicioAnterior, LocalDateTime finAnterior,
        Long franjaNuevaId, LocalDateTime inicioNuevo, LocalDateTime finNuevo,
        String detalle
) {
    public static TurnoHistorialResponse from(TurnoEvento evento, Map<Long, Franja> franjas) {
        Franja anterior = franjas.get(evento.getFranjaAnteriorId());
        Franja nueva = franjas.get(evento.getFranjaNuevaId());
        return new TurnoHistorialResponse(
                evento.getId(), evento.getTipo(), evento.getFecha(),
                evento.getUsuario() == null ? null : evento.getUsuario().getEmail(),
                evento.getFranjaAnteriorId(),
                anterior == null ? null : anterior.getInicio(),
                anterior == null ? null : anterior.getFin(),
                evento.getFranjaNuevaId(),
                nueva == null ? null : nueva.getInicio(),
                nueva == null ? null : nueva.getFin(),
                evento.getDetalle());
    }
}
