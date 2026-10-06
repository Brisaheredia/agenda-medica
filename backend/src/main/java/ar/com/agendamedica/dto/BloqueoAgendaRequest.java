package ar.com.agendamedica.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalTime;

public record BloqueoAgendaRequest(
        @NotNull Long profesionalId,
        @NotNull LocalDate fecha,
        LocalTime horaInicio,
        LocalTime horaFin,
        @Size(max = 255) String motivo
) {}
