package ar.com.agendamedica.dto;

import ar.com.agendamedica.domain.enums.RolUsuario;
import jakarta.validation.constraints.NotNull;

public record CambiarRolRequest(@NotNull RolUsuario rol) {}
