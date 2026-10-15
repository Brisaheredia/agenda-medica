package ar.com.agendamedica.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record ConfiguracionAgendaRequest(
        @NotNull @Min(5) @Max(240) Integer duracionEstandarMin,
        @NotNull @Min(1) @Max(365) Integer horizonteReservaDias
) {}
