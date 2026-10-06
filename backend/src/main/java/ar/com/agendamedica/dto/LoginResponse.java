package ar.com.agendamedica.dto;

import ar.com.agendamedica.domain.enums.RolUsuario;

public record LoginResponse(
        String token,
        String tokenType,
        long expiresInMinutes,
        String email,
        RolUsuario rol
) {}
