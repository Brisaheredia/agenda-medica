package ar.com.agendamedica.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record GenerarFranjasRequest(
        @NotNull Long profesionalId,
        @NotNull LocalDate desde,
        @NotNull LocalDate hasta
) {}
