package ar.com.agendamedica;

import ar.com.agendamedica.domain.entity.Franja;
import ar.com.agendamedica.domain.entity.Paciente;
import ar.com.agendamedica.domain.entity.Profesional;
import ar.com.agendamedica.domain.enums.EstadoFranja;
import ar.com.agendamedica.domain.enums.EstadoTurno;
import ar.com.agendamedica.domain.enums.TipoExcepcionAgenda;
import ar.com.agendamedica.dto.CancelarTurnoRequest;
import ar.com.agendamedica.dto.CrearTurnoRequest;
import ar.com.agendamedica.dto.ExcepcionAgendaRequest;
import ar.com.agendamedica.dto.ReprogramarTurnoRequest;
import ar.com.agendamedica.dto.TurnoResponse;
import ar.com.agendamedica.exception.BadRequestException;
import ar.com.agendamedica.exception.ConflictException;
import ar.com.agendamedica.repository.FranjaRepository;
import ar.com.agendamedica.repository.PacienteRepository;
import ar.com.agendamedica.repository.ProfesionalRepository;
import ar.com.agendamedica.repository.TurnoEventoRepository;
import ar.com.agendamedica.repository.TurnoRepository;
import ar.com.agendamedica.service.AgendaService;
import ar.com.agendamedica.service.TurnoService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Testcontainers
class TurnoAgendaIntegrationTest {

    @Container
    static final MySQLContainer<?> MYSQL = new MySQLContainer<>("mysql:8.4")
            .withDatabaseName("agenda_medica_test")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void datasource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", MYSQL::getJdbcUrl);
        registry.add("spring.datasource.username", MYSQL::getUsername);
        registry.add("spring.datasource.password", MYSQL::getPassword);
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "create-drop");
    }

    @Autowired TurnoService turnoService;
    @Autowired AgendaService agendaService;
    @Autowired ProfesionalRepository profesionalRepository;
    @Autowired PacienteRepository pacienteRepository;
    @Autowired FranjaRepository franjaRepository;
    @Autowired TurnoRepository turnoRepository;
    @Autowired TurnoEventoRepository turnoEventoRepository;

    @Test
    void dobleReservaConcurrenteSoloPermiteUnTurno() throws Exception {
        Profesional profesional = crearProfesional();
        Paciente paciente = crearPaciente();
        Franja franja = crearFranja(
                profesional,
                LocalDateTime.now().plusDays(10).withHour(9).withMinute(0).withSecond(0).withNano(0));

        AtomicInteger exitos = new AtomicInteger();
        AtomicInteger conflictos = new AtomicInteger();
        AtomicReference<Throwable> inesperado = new AtomicReference<>();
        CountDownLatch inicio = new CountDownLatch(1);

        ExecutorService executor = Executors.newFixedThreadPool(2);
        Runnable intento = () -> {
            try {
                inicio.await();
                turnoService.crear(new CrearTurnoRequest(paciente.getId(), franja.getId(), "Concurrencia"));
                exitos.incrementAndGet();
            } catch (ConflictException e) {
                conflictos.incrementAndGet();
            } catch (Throwable e) {
                inesperado.compareAndSet(null, e);
            }
        };

        executor.submit(intento);
        executor.submit(intento);
        inicio.countDown();

        executor.shutdown();
        assertTrue(executor.awaitTermination(20, TimeUnit.SECONDS));
        assertNull(inesperado.get(), () -> "Excepción inesperada: " + inesperado.get());
        assertEquals(1, exitos.get());
        assertEquals(1, conflictos.get());

        long turnosEnFranja = turnoRepository.findAll().stream()
                .filter(t -> t.getFranja().getId().equals(franja.getId()))
                .count();

        assertEquals(1, turnosEnFranja);
        assertEquals(EstadoFranja.OCUPADA, franjaRepository.findById(franja.getId()).orElseThrow().getEstado());
    }

    @Test
    void cancelarLiberaLaFranjaYRegistraEvento() {
        Profesional profesional = crearProfesional();
        Paciente paciente = crearPaciente();
        Franja franja = crearFranja(
                profesional,
                LocalDateTime.now().plusDays(11).withHour(10).withMinute(0).withSecond(0).withNano(0));

        TurnoResponse creado = turnoService.crear(
                new CrearTurnoRequest(paciente.getId(), franja.getId(), "Control"));

        TurnoResponse cancelado = turnoService.cancelar(
                creado.id(),
                new CancelarTurnoRequest("Paciente no puede asistir"));

        assertEquals(EstadoTurno.CANCELADO, cancelado.estado());
        assertEquals(EstadoFranja.LIBRE, franjaRepository.findById(franja.getId()).orElseThrow().getEstado());
        assertEquals(2, turnoEventoRepository.findByTurnoIdOrderByFechaAsc(creado.id()).size());
    }

    @Test
    void reprogramarLiberaAnteriorYOcupaNueva() {
        Profesional profesional = crearProfesional();
        Paciente paciente = crearPaciente();
        LocalDateTime base = LocalDateTime.now().plusDays(12).withHour(9).withMinute(0).withSecond(0).withNano(0);
        Franja anterior = crearFranja(profesional, base);
        Franja nueva = crearFranja(profesional, base.plusMinutes(30));

        TurnoResponse creado = turnoService.crear(
                new CrearTurnoRequest(paciente.getId(), anterior.getId(), "Seguimiento"));

        TurnoResponse reprogramado = turnoService.reprogramar(
                creado.id(),
                new ReprogramarTurnoRequest(nueva.getId(), "Cambio solicitado"));

        assertEquals(nueva.getId(), reprogramado.franjaId());
        assertEquals(EstadoFranja.LIBRE, franjaRepository.findById(anterior.getId()).orElseThrow().getEstado());
        assertEquals(EstadoFranja.OCUPADA, franjaRepository.findById(nueva.getId()).orElseThrow().getEstado());

        var eventos = turnoEventoRepository.findByTurnoIdOrderByFechaAsc(creado.id());
        assertEquals(2, eventos.size());
        assertEquals(anterior.getId(), eventos.get(1).getFranjaAnteriorId());
        assertEquals(nueva.getId(), eventos.get(1).getFranjaNuevaId());
    }

    @Test
    void noPermiteMarcarAtendidoAntesDelHorario() {
        Profesional profesional = crearProfesional();
        Paciente paciente = crearPaciente();
        Franja franja = crearFranja(
                profesional,
                LocalDateTime.now().plusDays(13).withHour(9).withMinute(0).withSecond(0).withNano(0));

        TurnoResponse creado = turnoService.crear(
                new CrearTurnoRequest(paciente.getId(), franja.getId(), "Control"));

        assertThrows(BadRequestException.class, () -> turnoService.marcarAtendido(creado.id()));
    }

    @Test
    void cierreBloqueaLibresPeroConservaTurnosActivos() {
        Profesional profesional = crearProfesional();
        Paciente paciente = crearPaciente();
        LocalDate fecha = LocalDate.now().plusDays(14);
        Franja ocupada = crearFranja(profesional, fecha.atTime(9, 0));
        Franja libre = crearFranja(profesional, fecha.atTime(9, 30));

        TurnoResponse turno = turnoService.crear(
                new CrearTurnoRequest(paciente.getId(), ocupada.getId(), "Control"));

        var respuesta = agendaService.crearExcepcion(new ExcepcionAgendaRequest(
                profesional.getId(),
                fecha,
                LocalTime.of(9, 0),
                LocalTime.of(10, 0),
                TipoExcepcionAgenda.CIERRE,
                null,
                "Capacitación"
        ));

        assertEquals(1, respuesta.franjasBloqueadas());
        assertTrue(respuesta.turnosAfectados().contains(turno.id()));
        assertEquals(EstadoFranja.OCUPADA, franjaRepository.findById(ocupada.getId()).orElseThrow().getEstado());
        assertEquals(EstadoFranja.BLOQUEADA, franjaRepository.findById(libre.getId()).orElseThrow().getEstado());
        assertEquals(EstadoTurno.RESERVADO, turnoRepository.findById(turno.id()).orElseThrow().getEstado());
    }

    private Profesional crearProfesional() {
        String sufijo = UUID.randomUUID().toString().substring(0, 8);
        Profesional p = new Profesional();
        p.setNombre("Salvador");
        p.setApellido("Prueba");
        p.setMatricula("MAT-" + sufijo);
        p.setActivo(true);
        return profesionalRepository.saveAndFlush(p);
    }

    private Paciente crearPaciente() {
        String sufijo = UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        Paciente p = new Paciente();
        p.setDni(sufijo);
        p.setNombre("Paciente");
        p.setApellido("Prueba");
        p.setEmail(sufijo + "@test.local");
        p.setActivo(true);
        return pacienteRepository.saveAndFlush(p);
    }

    private Franja crearFranja(Profesional profesional, LocalDateTime inicio) {
        Franja f = new Franja();
        f.setProfesional(profesional);
        f.setInicio(inicio);
        f.setFin(inicio.plusMinutes(30));
        f.setEstado(EstadoFranja.LIBRE);
        f.setOrigen("TEST");
        return franjaRepository.saveAndFlush(f);
    }
}
