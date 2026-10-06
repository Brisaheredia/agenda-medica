package ar.com.agendamedica.service;

import ar.com.agendamedica.domain.entity.Usuario;
import ar.com.agendamedica.dto.LoginRequest;
import ar.com.agendamedica.dto.LoginResponse;
import ar.com.agendamedica.exception.BadRequestException;
import ar.com.agendamedica.repository.UsuarioRepository;
import ar.com.agendamedica.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UsuarioRepository usuarioRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        Usuario usuario = usuarioRepository.findByEmailIgnoreCase(request.email().trim())
                .filter(Usuario::isActivo)
                .orElseThrow(() -> new BadRequestException("Credenciales inválidas"));

        if (!passwordEncoder.matches(request.password(), usuario.getPasswordHash())) {
            throw new BadRequestException("Credenciales inválidas");
        }

        String token = jwtService.generarToken(usuario.getEmail(), usuario.getRol().name());

        return new LoginResponse(
                token,
                "Bearer",
                jwtService.getExpirationMinutes(),
                usuario.getEmail(),
                usuario.getRol()
        );
    }
}
