package ar.com.agendamedica.dto;

import ar.com.agendamedica.domain.entity.ConfiguracionAgenda;

public record ConfiguracionAgendaResponse(Integer duracionEstandarMin, Integer horizonteReservaDias) {
    public static ConfiguracionAgendaResponse from(ConfiguracionAgenda config) {
        return new ConfiguracionAgendaResponse(config.getDuracionEstandarMin(), config.getHorizonteReservaDias());
    }
}
