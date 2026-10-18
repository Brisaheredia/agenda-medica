package ar.com.agendamedica.config;

import ar.com.agendamedica.domain.entity.Usuario;
import ar.com.agendamedica.domain.enums.RolUsuario;
import ar.com.agendamedica.repository.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.core.io.support.ResourcePropertySource;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class DevUsuariosSeederTest {
    private final UsuarioRepository usuarios = mock(UsuarioRepository.class);
    private final PasswordEncoder passwords = new BCryptPasswordEncoder();
    private final Map<String, Usuario> tabla = new LinkedHashMap<>();
    private final DefaultApplicationArguments argumentos = new DefaultApplicationArguments(new String[0]);

    private UsuariosDesarrolloProperties configuracion() {
        return new UsuariosDesarrolloProperties(Arrays.stream(RolUsuario.values())
                .map(rol -> new UsuariosDesarrolloProperties.Cuenta(rol.name().toLowerCase() + "@example.test", "PruebaDev123!", rol))
                .toList());
    }

    private void prepararRepositorio() {
        when(usuarios.findByEmailIgnoreCase(anyString())).thenAnswer(invocacion -> Optional.ofNullable(tabla.get(invocacion.getArgument(0))));
        when(usuarios.save(any(Usuario.class))).thenAnswer(invocacion -> {
            Usuario usuario = invocacion.getArgument(0);
            usuario.setId((long) tabla.size() + 1);
            tabla.put(usuario.getEmail(), usuario);
            return usuario;
        });
    }

    private ApplicationContextRunner contexto() {
        return new ApplicationContextRunner().withUserConfiguration(DevUsuariosSeeder.class)
                .withBean(UsuarioRepository.class, () -> usuarios)
                .withBean(PasswordEncoder.class, () -> passwords);
    }

    private ApplicationContextRunner contextoDev() {
        return contexto().withInitializer(context -> {
            context.getEnvironment().setActiveProfiles("dev");
            try {
                context.getEnvironment().getPropertySources().addLast(new ResourcePropertySource("classpath:application-dev.properties"));
            } catch (IOException exception) {
                throw new IllegalStateException(exception);
            }
        });
    }

    @Test
    void creaSoloLasCuentasFaltantesYNoSobrescribeCambiosManuales() {
        prepararRepositorio();
        var seeder = new DevUsuariosSeeder(usuarios, passwords, configuracion());
        seeder.run(argumentos);
        assertEquals(4, tabla.size());
        assertEquals(4, tabla.values().stream().map(Usuario::getRol).distinct().count());
        for (var usuario : tabla.values()) {
            assertTrue(usuario.isActivo());
            assertTrue(passwords.matches("PruebaDev123!", usuario.getPasswordHash()));
        }
        var existente = tabla.values().iterator().next();
        existente.setActivo(false);
        existente.setRol(RolUsuario.MEDICO);
        existente.setPasswordHash(passwords.encode("OtraClave123!"));
        seeder.run(argumentos);
        assertEquals(4, tabla.size());
        assertFalse(existente.isActivo());
        assertEquals(RolUsuario.MEDICO, existente.getRol());
        assertTrue(passwords.matches("OtraClave123!", existente.getPasswordHash()));
        verify(usuarios, times(4)).save(any());
    }

    @Test
    void validaTodasLasClavesAntesDeInsertar() {
        prepararRepositorio();
        var cuentas = new ArrayList<>(configuracion().cuentas());
        var ultima = cuentas.getLast();
        cuentas.set(cuentas.size() - 1, new UsuariosDesarrolloProperties.Cuenta(ultima.email(), "corta", ultima.rol()));
        var seeder = new DevUsuariosSeeder(usuarios, passwords, new UsuariosDesarrolloProperties(cuentas));
        assertThrows(IllegalStateException.class, () -> seeder.run(argumentos));
        verify(usuarios, never()).save(any());
    }

    @Test
    void rechazaEmailsDuplicadosAunqueCambieMayusculas() {
        prepararRepositorio();
        var cuentas = new ArrayList<>(configuracion().cuentas());
        cuentas.set(1, new UsuariosDesarrolloProperties.Cuenta("  " + cuentas.getFirst().email().toUpperCase() + "  ", "PruebaDev123!", cuentas.get(1).rol()));
        var seeder = new DevUsuariosSeeder(usuarios, passwords, new UsuariosDesarrolloProperties(cuentas));
        assertThrows(IllegalStateException.class, () -> seeder.run(argumentos));
        verify(usuarios, never()).save(any());
    }

    @Test
    void fueraDeDevNoSeHabilitaAunqueLaPropiedadSeaTrue() {
        contexto().withPropertyValues("app.dev.usuarios.habilitado=true").run(context -> {
            assertTrue(context.getBeansOfType(DevUsuariosSeeder.class).isEmpty());
            verifyNoInteractions(usuarios);
        });
    }

    @Test
    void permiteDeshabilitarElSeedEnDev() {
        contextoDev().withPropertyValues("APP_DEV_USERS_ENABLED=false").run(context -> {
            assertTrue(context.getBeansOfType(DevUsuariosSeeder.class).isEmpty());
            verifyNoInteractions(usuarios);
        });
    }

    @Test
    void perfilDevCargaDefaultsVersionadosYPermiteReemplazarCredenciales() {
        prepararRepositorio();
        contextoDev().withPropertyValues("APP_BOOTSTRAP_ADMIN_EMAIL=equipo@example.test", "APP_BOOTSTRAP_ADMIN_PASSWORD=AdminPropio123!",
                "APP_DEV_MEDICO_PASSWORD=MedicoPropio123!").run(context -> {
            assertNull(context.getStartupFailure());
            context.getBean(DevUsuariosSeeder.class).run(argumentos);
            assertEquals(4, tabla.size());
            assertTrue(passwords.matches("AdminPropio123!", tabla.get("equipo@example.test").getPasswordHash()));
            assertTrue(passwords.matches("MedicoPropio123!", tabla.get("medico@agenda.local").getPasswordHash()));
            assertTrue(passwords.matches("recepcion123", tabla.get("recepcion@agenda.local").getPasswordHash()));
            assertTrue(passwords.matches("obras123", tabla.get("obras.sociales@agenda.local").getPasswordHash()));
        });
    }
}
