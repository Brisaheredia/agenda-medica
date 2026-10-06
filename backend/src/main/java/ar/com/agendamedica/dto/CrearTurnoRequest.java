package ar.com.agendamedica.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CrearTurnoRequest(
        @NotNull Long pacienteId,
        @NotNull Long franjaId,
        @Size(max = 500) String motivoConsulta
) {}
