package ar.com.agendamedica.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record ConfiguracionAgendaRequest(
        @Min(value = 40, message = "La duración es fija: 40 minutos") @Max(value = 40, message = "La duración es fija: 40 minutos") Integer duracionEstandarMin,
        @NotNull @Min(1) @Max(365) Integer horizonteReservaDias
) {}
