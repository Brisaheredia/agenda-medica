package ar.com.agendamedica.dto;

import ar.com.agendamedica.domain.enums.OrigenCancelacion;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CancelarTurnoRequest(
        @NotBlank(message = "El motivo es obligatorio")
        @Size(max = 500, message = "El motivo no puede superar 500 caracteres")
        String motivo,
        OrigenCancelacion origen
) {
    public CancelarTurnoRequest(String motivo) {
        this(motivo, OrigenCancelacion.PACIENTE);
    }
}
