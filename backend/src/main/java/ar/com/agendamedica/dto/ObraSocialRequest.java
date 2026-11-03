package ar.com.agendamedica.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ObraSocialRequest(@NotBlank @Size(max = 120) String nombre) {}
