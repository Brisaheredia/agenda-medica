package ar.com.agendamedica.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotNull;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;

public record PlantillaDisponibilidadRequest(
        @NotNull Long profesionalId,
        @NotNull DayOfWeek diaSemana,
        @NotNull LocalTime horaInicio,
        @NotNull LocalTime horaFin,
        @Min(40) @Max(40) Integer duracionMin,
        @NotNull LocalDate vigenciaDesde,
        LocalDate vigenciaHasta
) {}
