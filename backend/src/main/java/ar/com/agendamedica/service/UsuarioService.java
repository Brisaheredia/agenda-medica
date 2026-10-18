package ar.com.agendamedica.service;

import ar.com.agendamedica.domain.entity.Usuario;
import ar.com.agendamedica.domain.enums.RolUsuario;
import ar.com.agendamedica.dto.UsuarioRequest;
import ar.com.agendamedica.dto.UsuarioResponse;
import ar.com.agendamedica.exception.ConflictException;
import ar.com.agendamedica.exception.BadRequestException;
import ar.com.agendamedica.exception.ResourceNotFoundException;
import ar.com.agendamedica.repository.UsuarioRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Isolation;

import java.util.List;

@Service
public class UsuarioService {
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditoriaService auditoriaService;

    public UsuarioService(
            UsuarioRepository usuarioRepository,
            PasswordEncoder passwordEncoder, AuditoriaService auditoriaService) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.auditoriaService = auditoriaService;
    }

    @Transactional(readOnly = true)
    public List<UsuarioResponse> listar() {
        return usuarioRepository.findAll().stream()
                .map(UsuarioResponse::from)
                .toList();
    }

    @Transactional
    public UsuarioResponse crear(UsuarioRequest request) {
        validarPassword(request.password());
        String email = request.email().trim().toLowerCase();

        usuarioRepository.findByEmailIgnoreCase(email).ifPresent(u -> {
            throw new ConflictException("Ya existe un usuario con email " + email);
        });

        Usuario usuario = new Usuario();
        usuario.setEmail(email);
        usuario.setPasswordHash(passwordEncoder.encode(request.password()));
        usuario.setRol(request.rol());
        usuario.setActivo(true);

        usuario = usuarioRepository.save(usuario);
        auditoriaService.registrar("CREAR_USUARIO", "Usuario", usuario.getId(), "Rol: " + usuario.getRol());
        return UsuarioResponse.from(usuario);
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public UsuarioResponse cambiarActivo(Long id, boolean activo) {
        List<Usuario> administradores = usuarioRepository.bloquearPorRol(RolUsuario.ADMIN);
        Usuario usuario = obtener(id);
        if (!activo) protegerUltimoAdmin(usuario, administradores);
        usuario.setActivo(activo);
        auditoriaService.registrar("CAMBIAR_ACTIVO_USUARIO", "Usuario", id, "Activo: " + activo);
        return UsuarioResponse.from(usuarioRepository.save(usuario));
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public UsuarioResponse cambiarRol(Long id, RolUsuario rol) {
        List<Usuario> administradores = usuarioRepository.bloquearPorRol(RolUsuario.ADMIN);
        Usuario usuario = obtener(id);
        if (rol != RolUsuario.ADMIN) protegerUltimoAdmin(usuario, administradores);
        usuario.setRol(rol);
        auditoriaService.registrar("CAMBIAR_ROL_USUARIO", "Usuario", id, "Rol: " + rol);
        return UsuarioResponse.from(usuarioRepository.save(usuario));
    }

    @Transactional
    public void cambiarPassword(Long id, String password) {
        validarPassword(password);
        Usuario usuario = obtener(id);
        usuario.setPasswordHash(passwordEncoder.encode(password));
        usuarioRepository.save(usuario);
        auditoriaService.registrar("CAMBIAR_PASSWORD_USUARIO", "Usuario", id, "Contraseña restablecida");
    }

    private Usuario obtener(Long id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado: " + id));
    }

    private void validarPassword(String password) {
        if (password == null || password.isBlank() || password.length() < 8
                || password.getBytes(java.nio.charset.StandardCharsets.UTF_8).length > 72) {
            throw new BadRequestException("La contraseña debe tener al menos 8 caracteres y hasta 72 bytes UTF-8");
        }
    }

    private void protegerUltimoAdmin(Usuario usuario, List<Usuario> administradores) {
        if (usuario.isActivo() && usuario.getRol() == RolUsuario.ADMIN
                && administradores.stream().noneMatch(otro -> otro.isActivo() && !otro.getId().equals(usuario.getId()))) {
            throw new ConflictException("Debe quedar al menos un administrador activo");
        }
    }
}
