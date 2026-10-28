package ar.com.agendamedica.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ReprogramarTurnoRequest(
        @NotNull(message = "La nueva franja es obligatoria")
        Long franjaId,
        @NotBlank(message = "El motivo de reprogramación es obligatorio")
        @Size(max = 500, message = "El motivo no puede superar 500 caracteres")
        String motivo
) {}
