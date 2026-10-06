package ar.com.agendamedica.dto;

import ar.com.agendamedica.domain.entity.Usuario;
import ar.com.agendamedica.domain.enums.RolUsuario;

public record UsuarioResponse(
        Long id,
        String email,
        RolUsuario rol,
        boolean activo
) {
    public static UsuarioResponse from(Usuario usuario) {
        return new UsuarioResponse(
                usuario.getId(),
                usuario.getEmail(),
                usuario.getRol(),
                usuario.isActivo()
        );
    }
}
