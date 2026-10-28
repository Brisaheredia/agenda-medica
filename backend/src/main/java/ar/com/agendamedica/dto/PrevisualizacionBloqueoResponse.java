package ar.com.agendamedica.dto;

import java.util.List;

public record PrevisualizacionBloqueoResponse(
        int cantidadTurnosAfectados,
        List<TurnoEnBloqueoResponse> turnosAfectados
) {}
