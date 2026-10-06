package ar.com.agendamedica.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PacienteRequest(
        @NotBlank @Size(max = 20) String dni,
        @NotBlank @Size(max = 100) String nombre,
        @NotBlank @Size(max = 100) String apellido,
        @Size(max = 50) String telefono,
        @Email @Size(max = 150) String email
) {}
