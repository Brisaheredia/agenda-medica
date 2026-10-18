package ar.com.agendamedica;

import ar.com.agendamedica.config.DevUsuariosSeeder;
import ar.com.agendamedica.domain.enums.RolUsuario;
import ar.com.agendamedica.dto.LoginRequest;
import ar.com.agendamedica.repository.UsuarioRepository;
import ar.com.agendamedica.service.AuthService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(properties = {"APP_BOOTSTRAP_ADMIN_EMAIL=", "APP_BOOTSTRAP_ADMIN_PASSWORD=", "APP_DEV_USERS_ENABLED=true",
        "APP_DEV_ADMIN_EMAIL=admin@agenda.local", "APP_DEV_ADMIN_PASSWORD=admin123",
        "APP_DEV_MEDICO_PASSWORD=medico123", "APP_DEV_RECEPCION_PASSWORD=recepcion123", "APP_DEV_OBRAS_SOCIALES_PASSWORD=obras123"})
@ActiveProfiles("dev")
@Testcontainers
class DevUsuariosIntegrationTest {
    @Container
    static final MySQLContainer<?> MYSQL = new MySQLContainer<>("mysql:8.4")
            .withDatabaseName("agenda_dev_independiente_test").withUsername("test").withPassword("test");

    @DynamicPropertySource
    static void datasource(DynamicPropertyRegistry registro) {
        registro.add("spring.datasource.url", MYSQL::getJdbcUrl);
        registro.add("spring.datasource.username", MYSQL::getUsername);
        registro.add("spring.datasource.password", MYSQL::getPassword);
        registro.add("spring.jpa.hibernate.ddl-auto", () -> "create-drop");
        registro.add("app.jwt.secret", () -> "clave-exclusiva-para-pruebas-de-arranque-dev-independiente");
    }

    @Autowired AuthService auth;
    @Autowired UsuarioRepository usuarios;
    @Autowired DevUsuariosSeeder seeder;

    @Test
    void arranqueEnBaseNuevaPermiteIngresarConLosCuatroRolesYSinDuplicarlos() {
        assertEquals(4, usuarios.count());
        assertEquals(RolUsuario.ADMIN, auth.login(new LoginRequest("admin@agenda.local", "admin123")).rol());
        assertEquals(RolUsuario.MEDICO, auth.login(new LoginRequest("medico@agenda.local", "medico123")).rol());
        assertEquals(RolUsuario.RECEPCION, auth.login(new LoginRequest("recepcion@agenda.local", "recepcion123")).rol());
        assertEquals(RolUsuario.OBRAS_SOCIALES, auth.login(new LoginRequest("obras.sociales@agenda.local", "obras123")).rol());
        var hashAnterior = usuarios.findByEmailIgnoreCase("admin@agenda.local").orElseThrow().getPasswordHash();
        assertNotEquals("admin123", hashAnterior);
        seeder.run(new DefaultApplicationArguments(new String[0]));
        assertEquals(4, usuarios.count());
        assertEquals(hashAnterior, usuarios.findByEmailIgnoreCase("admin@agenda.local").orElseThrow().getPasswordHash());
    }
}
