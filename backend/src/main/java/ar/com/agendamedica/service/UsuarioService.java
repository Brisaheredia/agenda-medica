package ar.com.agendamedica.service;

import ar.com.agendamedica.domain.entity.Usuario;
import ar.com.agendamedica.dto.UsuarioRequest;
import ar.com.agendamedica.dto.UsuarioResponse;
import ar.com.agendamedica.exception.ConflictException;
import ar.com.agendamedica.exception.ResourceNotFoundException;
import ar.com.agendamedica.repository.UsuarioRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class UsuarioService {
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public UsuarioService(
            UsuarioRepository usuarioRepository,
            PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<UsuarioResponse> listar() {
        return usuarioRepository.findAll().stream()
                .map(UsuarioResponse::from)
                .toList();
    }

    @Transactional
    public UsuarioResponse crear(UsuarioRequest request) {
        String email = request.email().trim().toLowerCase();

        usuarioRepository.findByEmailIgnoreCase(email).ifPresent(u -> {
            throw new ConflictException("Ya existe un usuario con email " + email);
        });

        Usuario usuario = new Usuario();
        usuario.setEmail(email);
        usuario.setPasswordHash(passwordEncoder.encode(request.password()));
        usuario.setRol(request.rol());
        usuario.setActivo(true);

        return UsuarioResponse.from(usuarioRepository.save(usuario));
    }

    @Transactional
    public UsuarioResponse cambiarActivo(Long id, boolean activo) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado: " + id));

        usuario.setActivo(activo);
        return UsuarioResponse.from(usuarioRepository.save(usuario));
    }
}
