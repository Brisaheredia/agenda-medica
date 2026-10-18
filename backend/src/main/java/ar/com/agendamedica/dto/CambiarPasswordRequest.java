package ar.com.agendamedica.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CambiarPasswordRequest(@NotBlank @Size(min = 8, max = 72) String password) {}
