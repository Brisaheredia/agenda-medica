package ar.com.agendamedica.dto;

import ar.com.agendamedica.domain.enums.TipoExcepcionAgenda;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalTime;

public record ExcepcionAgendaRequest(
        @NotNull Long profesionalId,
        @NotNull LocalDate fecha,
        LocalTime horaInicio,
        LocalTime horaFin,
        @NotNull TipoExcepcionAgenda tipo,
        @Min(5) Integer duracionMin,
        @Size(max = 255) String motivo
) {}
