package ar.com.agendamedica.config;

import ar.com.agendamedica.domain.entity.Usuario;
import ar.com.agendamedica.domain.enums.RolUsuario;
import ar.com.agendamedica.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class BootstrapAdmin implements ApplicationRunner {
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final String email;
    private final String password;

    public BootstrapAdmin(
            UsuarioRepository usuarioRepository,
            PasswordEncoder passwordEncoder,
            @Value("${APP_BOOTSTRAP_ADMIN_EMAIL:}") String email,
            @Value("${APP_BOOTSTRAP_ADMIN_PASSWORD:}") String password) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.email = email;
        this.password = password;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (usuarioRepository.count() > 0) {
            return;
        }
        if (email == null || email.isBlank() || password == null || password.isBlank()) {
            return;
        }

        Usuario admin = new Usuario();
        admin.setEmail(email.trim().toLowerCase());
        admin.setPasswordHash(passwordEncoder.encode(password));
        admin.setRol(RolUsuario.ADMIN);
        admin.setActivo(true);
        usuarioRepository.save(admin);
    }
}
