package ar.com.agendamedica.config;

import ar.com.agendamedica.domain.entity.Usuario;
import ar.com.agendamedica.domain.enums.RolUsuario;
import ar.com.agendamedica.repository.UsuarioRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

@Component
@Profile("dev")
@Order(10)
@ConditionalOnProperty(name = "app.dev.usuarios.habilitado", havingValue = "true")
@EnableConfigurationProperties(UsuariosDesarrolloProperties.class)
public class DevUsuariosSeeder implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(DevUsuariosSeeder.class);
    private final UsuarioRepository usuarios;
    private final PasswordEncoder passwords;
    private final UsuariosDesarrolloProperties configuracion;

    public DevUsuariosSeeder(UsuarioRepository usuarios, PasswordEncoder passwords,
                             UsuariosDesarrolloProperties configuracion) {
        this.usuarios = usuarios;
        this.passwords = passwords;
        this.configuracion = configuracion;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        var emails = new HashSet<String>();
        var roles = new HashSet<RolUsuario>();
        var faltantes = new ArrayList<UsuariosDesarrolloProperties.Cuenta>();
        for (var cuenta : configuracion.cuentas()) {
            String email = normalizar(cuenta.email());
            if (!email.matches("[^\\s@]+@[^\\s@]+\\.[^\\s@]+") || !emails.add(email)
                    || cuenta.rol() == null || !roles.add(cuenta.rol())) {
                throw new IllegalStateException("Las cuentas de desarrollo deben tener emails válidos distintos y un usuario por rol");
            }
            if (usuarios.findByEmailIgnoreCase(email).isEmpty()) {
                validarPassword(cuenta.password());
                faltantes.add(new UsuariosDesarrolloProperties.Cuenta(email, cuenta.password(), cuenta.rol()));
            }
        }
        if (!roles.equals(Set.of(RolUsuario.values()))) {
            throw new IllegalStateException("Configurar una cuenta de desarrollo para cada uno de los cuatro roles");
        }

        // Se validan todas las cuentas antes de insertar. Las existentes nunca se sobrescriben.
        for (var cuenta : faltantes) {
            var usuario = new Usuario();
            usuario.setEmail(cuenta.email());
            usuario.setPasswordHash(passwords.encode(cuenta.password()));
            usuario.setRol(cuenta.rol());
            usuario.setActivo(true);
            usuarios.save(usuario);
        }
        log.info("Usuarios de desarrollo: {} creados; {} existentes conservados", faltantes.size(), emails.size() - faltantes.size());
    }

    private String normalizar(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    private void validarPassword(String password) {
        if (password == null || password.isBlank() || password.length() < 8
                || password.getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new IllegalStateException("Las contraseñas de desarrollo nuevas deben tener al menos 8 caracteres y hasta 72 bytes UTF-8");
        }
    }
}
