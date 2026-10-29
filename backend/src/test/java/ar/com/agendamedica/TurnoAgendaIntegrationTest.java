package ar.com.agendamedica;

import ar.com.agendamedica.domain.entity.Franja;
import ar.com.agendamedica.domain.entity.Paciente;
import ar.com.agendamedica.domain.entity.Profesional;
import ar.com.agendamedica.domain.enums.EstadoFranja;
import ar.com.agendamedica.domain.enums.EstadoTurno;
import ar.com.agendamedica.domain.enums.OrigenCancelacion;
import ar.com.agendamedica.dto.CancelarTurnoRequest;
import ar.com.agendamedica.dto.CrearTurnoRequest;
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
import ar.com.agendamedica.service.AgendaConsultaService;
import ar.com.agendamedica.service.TurnoService;
import ar.com.agendamedica.service.ConfiguracionAgendaService;
import ar.com.agendamedica.dto.*;
import org.junit.jupiter.api.BeforeEach;
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
        registry.add("app.jwt.secret", () -> "agenda-tests-only-secret-at-least-32-characters-long");
    }

    @Autowired TurnoService turnoService;
    @Autowired AgendaService agendaService;
    @Autowired AgendaConsultaService consultas;
    @Autowired ProfesionalRepository profesionalRepository;
    @Autowired PacienteRepository pacienteRepository;
    @Autowired FranjaRepository franjaRepository;
    @Autowired TurnoRepository turnoRepository;
    @Autowired TurnoEventoRepository turnoEventoRepository;
    @Autowired ConfiguracionAgendaService configuracion;
    @Autowired org.springframework.jdbc.core.JdbcTemplate jdbc;
    @Autowired ar.com.agendamedica.service.UsuarioService usuarios;
    @Autowired ar.com.agendamedica.service.AuthService auth;
    @Autowired ar.com.agendamedica.repository.UsuarioRepository usuarioRepository;
    @Autowired ar.com.agendamedica.security.JwtService jwt;
    @Autowired ar.com.agendamedica.security.AgendaUserDetailsService userDetails;

    @Test
    void recuperaMarcaAntiguaSoloConCancelacionExplicitaDelConsultorio() throws Exception {
        var profesional = crearProfesional();
        var paciente = crearPaciente();
        var fecha = LocalDate.now().plusDays(23);
        var origen = crearFranja(profesional, fecha.atTime(8, 0));
        var destino = crearFranja(profesional, fecha.atTime(8, 40));
        var origenPaciente = crearFranja(profesional, fecha.atTime(10, 0));
        var destinoPaciente = crearFranja(profesional, fecha.atTime(10, 40));
        var suspendido = turnoService.crear(new CrearTurnoRequest(paciente.getId(), origen.getId(), "Control"));
        turnoService.cancelar(suspendido.id(), new CancelarTurnoRequest("Urgencia", OrigenCancelacion.CONSULTORIO));
        turnoService.reprogramar(suspendido.id(), new ReprogramarTurnoRequest(destino.getId(), "Coordinado"));
        var voluntario = turnoService.crear(new CrearTurnoRequest(paciente.getId(), origenPaciente.getId(), "Control"));
        turnoService.reprogramar(voluntario.id(), new ReprogramarTurnoRequest(destinoPaciente.getId(), "Cambio pedido por paciente"));
        jdbc.update("UPDATE turnos SET reprogramado_por_consultorio = FALSE WHERE id = ?", suspendido.id());
        var script = java.nio.file.Files.readString(java.nio.file.Path.of("sql/2026-10-17-reprogramado-consultorio.sql"));
        jdbc.update(script.substring(script.indexOf("UPDATE turnos")));
        assertTrue(turnoService.obtener(suspendido.id()).reprogramadoPorConsultorio());
        assertFalse(turnoService.obtener(voluntario.id()).reprogramadoPorConsultorio());
    }

    @Test
    void usuariosPersistenCuartoRolYRevocanSesionAlCambiarCredenciales() {
        String sufijo = UUID.randomUUID().toString();
        var admin = usuarios.crear(new UsuarioRequest("admin-" + sufijo + "@example.test", "PruebaAnterior123!",
                ar.com.agendamedica.domain.enums.RolUsuario.ADMIN));
        var obra = usuarios.crear(new UsuarioRequest("obra-" + sufijo + "@example.test", "PruebaAnterior123!",
                ar.com.agendamedica.domain.enums.RolUsuario.OBRAS_SOCIALES));
        assertEquals(ar.com.agendamedica.domain.enums.RolUsuario.OBRAS_SOCIALES,
                usuarioRepository.findById(obra.id()).orElseThrow().getRol());
        assertNotEquals("PruebaAnterior123!", usuarioRepository.findById(obra.id()).orElseThrow().getPasswordHash());
        var sesion = auth.login(new LoginRequest(obra.email(), "PruebaAnterior123!"));
        assertTrue(jwt.esValido(sesion.token(), userDetails.loadUserByUsername(obra.email())));
        usuarios.cambiarPassword(obra.id(), "PruebaNueva456!");
        assertThrows(BadRequestException.class, () -> usuarios.cambiarPassword(obra.id(), "á".repeat(40)));
        assertThrows(BadRequestException.class, () -> usuarios.cambiarPassword(obra.id(), "corta"));
        assertFalse(jwt.esValido(sesion.token(), userDetails.loadUserByUsername(obra.email())));
        assertThrows(BadRequestException.class, () -> auth.login(new LoginRequest(obra.email(), "PruebaAnterior123!")));
        sesion = auth.login(new LoginRequest(obra.email(), "PruebaNueva456!"));
        usuarios.cambiarRol(obra.id(), ar.com.agendamedica.domain.enums.RolUsuario.RECEPCION);
        assertFalse(jwt.esValido(sesion.token(), userDetails.loadUserByUsername(obra.email())));
        usuarios.cambiarActivo(obra.id(), false);
        assertThrows(org.springframework.security.core.userdetails.UsernameNotFoundException.class,
                () -> userDetails.loadUserByUsername(obra.email()));
        assertThrows(ConflictException.class, () -> usuarios.cambiarActivo(admin.id(), false));
        assertThrows(ConflictException.class, () -> usuarios.cambiarRol(admin.id(), ar.com.agendamedica.domain.enums.RolUsuario.MEDICO));
    }

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
        Franja nueva = crearFranja(profesional, base.plusMinutes(40));

        TurnoResponse creado = turnoService.crear(
                new CrearTurnoRequest(paciente.getId(), anterior.getId(), "Seguimiento"));

        TurnoResponse reprogramado = turnoService.reprogramar(
                creado.id(),
                new ReprogramarTurnoRequest(nueva.getId(), "Cambio solicitado"));

        assertEquals(nueva.getId(), reprogramado.franjaId());
        assertFalse(reprogramado.reprogramadoPorConsultorio());
        assertFalse(turnoService.obtener(reprogramado.id()).reprogramadoPorConsultorio());
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
        Franja libre = crearFranja(profesional, fecha.atTime(9, 40));

        TurnoResponse turno = turnoService.crear(
                new CrearTurnoRequest(paciente.getId(), ocupada.getId(), "Control"));

        var respuesta = agendaService.crearBloqueo(new BloqueoAgendaRequest(
                profesional.getId(), fecha, LocalTime.of(9, 0), LocalTime.of(10, 0),
                "Capacitación", java.util.List.of(turno.id())));

        assertEquals(1, respuesta.franjasBloqueadas());
        assertTrue(respuesta.turnosAfectados().contains(turno.id()));
        assertEquals(EstadoFranja.OCUPADA, franjaRepository.findById(ocupada.getId()).orElseThrow().getEstado());
        assertEquals(EstadoFranja.BLOQUEADA, franjaRepository.findById(libre.getId()).orElseThrow().getEstado());
        assertEquals(EstadoTurno.RESERVADO, turnoRepository.findById(turno.id()).orElseThrow().getEstado());
        var pendientes = consultas.pendientes(profesional.getId());
        assertEquals(1, pendientes.size());
        assertEquals(paciente.getDni(), pendientes.getFirst().dni());
        assertEquals(paciente.getEmail(), pendientes.getFirst().email());

        Franja destino = crearFranja(profesional, fecha.plusDays(1).atTime(9, 0));
        turnoService.reprogramar(turno.id(), new ReprogramarTurnoRequest(destino.getId(), "Coordinado por teléfono"));
        assertTrue(turnoService.obtener(turno.id()).reprogramadoPorConsultorio());
        assertTrue(turnoService.listarPorProfesionalYFecha(profesional.getId(), fecha.plusDays(1))
                .getFirst().reprogramadoPorConsultorio());
        assertTrue(consultas.pendientes(profesional.getId()).isEmpty());
        assertEquals(EstadoFranja.BLOQUEADA, franjaRepository.findById(ocupada.getId()).orElseThrow().getEstado());
    }

    @Test
    void cancelacionDelConsultorioConservaContactoYPermiteReprogramar() {
        Profesional profesional = crearProfesional(); Paciente paciente = crearPaciente();
        LocalDate fecha = LocalDate.now().plusDays(15);
        Franja origen = crearFranja(profesional, fecha.atTime(9, 0));
        Franja destino = crearFranja(profesional, fecha.plusDays(1).atTime(9, 0));
        TurnoResponse turno = turnoService.crear(new CrearTurnoRequest(paciente.getId(), origen.getId(), "Control"));
        turnoService.cancelar(turno.id(), new CancelarTurnoRequest("Urgencia del médico", OrigenCancelacion.CONSULTORIO));

        assertEquals(OrigenCancelacion.CONSULTORIO, turnoService.obtener(turno.id()).origenCancelacion());
        assertEquals(EstadoFranja.BLOQUEADA, franjaRepository.findById(origen.getId()).orElseThrow().getEstado());
        assertEquals(1, consultas.pendientes(profesional.getId()).size());
        TurnoResponse nuevo = turnoService.reprogramar(turno.id(), new ReprogramarTurnoRequest(destino.getId(), "Paciente contactado"));
        assertEquals(turno.id(), nuevo.id()); assertEquals(EstadoTurno.RESERVADO, nuevo.estado());
        assertNull(nuevo.origenCancelacion());
        assertTrue(nuevo.reprogramadoPorConsultorio());
        assertTrue(consultas.pendientes(profesional.getId()).isEmpty());
        assertEquals(EstadoFranja.BLOQUEADA, franjaRepository.findById(origen.getId()).orElseThrow().getEstado());
        assertEquals(3, turnoEventoRepository.findByTurnoIdOrderByFechaAsc(turno.id()).size());

        Franja otroDestino = crearFranja(profesional, fecha.plusDays(2).atTime(9, 0));
        turnoService.reprogramar(turno.id(), new ReprogramarTurnoRequest(otroDestino.getId(), "Otro horario coordinado"));
        assertTrue(turnoService.obtener(turno.id()).reprogramadoPorConsultorio());
    }

    @Test
    void pacienteQueCancelaEnDiaSuspendidoNoEntraEnPendientesNiReabreHorario() {
        Profesional profesional = crearProfesional(); Paciente paciente = crearPaciente();
        LocalDate fecha = LocalDate.now().plusDays(17);
        Franja franja = crearFranja(profesional, fecha.atTime(9, 0));
        TurnoResponse turno = turnoService.crear(new CrearTurnoRequest(paciente.getId(), franja.getId(), "Control"));
        agendaService.crearBloqueo(new BloqueoAgendaRequest(
                profesional.getId(), fecha, null, null, "Urgencia", java.util.List.of(turno.id())));
        turnoService.cancelar(turno.id(), new CancelarTurnoRequest("No quiere otro turno", OrigenCancelacion.PACIENTE));
        assertTrue(consultas.pendientes(profesional.getId()).isEmpty());
        assertEquals(OrigenCancelacion.PACIENTE, turnoService.obtener(turno.id()).origenCancelacion());
        assertEquals(EstadoFranja.BLOQUEADA, franjaRepository.findById(franja.getId()).orElseThrow().getEstado());
        assertTrue(agendaService.disponibles(profesional.getId(), fecha.atStartOfDay()).isEmpty());
    }

    @Test
    void noReprogramaCancelacionSolicitadaPorPaciente() {
        Profesional profesional = crearProfesional(); Paciente paciente = crearPaciente();
        LocalDate fecha = LocalDate.now().plusDays(18);
        Franja origen = crearFranja(profesional, fecha.atTime(9, 0));
        Franja destino = crearFranja(profesional, fecha.atTime(10, 0));
        TurnoResponse turno = turnoService.crear(new CrearTurnoRequest(paciente.getId(), origen.getId(), "Control"));
        turnoService.cancelar(turno.id(), new CancelarTurnoRequest("Paciente cancela", OrigenCancelacion.PACIENTE));
        assertThrows(ConflictException.class, () -> turnoService.reprogramar(turno.id(), new ReprogramarTurnoRequest(destino.getId(), "")));
        assertEquals(EstadoFranja.LIBRE, franjaRepository.findById(destino.getId()).orElseThrow().getEstado());
    }

    @Test
    void dosReprogramacionesConcurrentesDelMismoTurnoNoDejanFranjasHuerfanas() throws Exception {
        Profesional profesional = crearProfesional(); Paciente paciente = crearPaciente();
        LocalDate fecha = LocalDate.now().plusDays(19);
        Franja origen = crearFranja(profesional, fecha.atTime(9, 0));
        Franja destinoA = crearFranja(profesional, fecha.atTime(10, 0));
        Franja destinoB = crearFranja(profesional, fecha.atTime(11, 0));
        TurnoResponse turno = turnoService.crear(new CrearTurnoRequest(paciente.getId(), origen.getId(), "Control"));
        CountDownLatch inicio = new CountDownLatch(1);
        AtomicReference<Throwable> error = new AtomicReference<>();
        ExecutorService executor = Executors.newFixedThreadPool(2);
        for (Long destinoId : java.util.List.of(destinoA.getId(), destinoB.getId())) {
            executor.submit(() -> {
                try {
                    inicio.await();
                    turnoService.reprogramar(turno.id(), new ReprogramarTurnoRequest(destinoId, "Cambio concurrente"));
                } catch (Throwable e) { error.compareAndSet(null, e); }
            });
        }
        inicio.countDown(); executor.shutdown();
        assertTrue(executor.awaitTermination(20, TimeUnit.SECONDS));
        assertNull(error.get(), () -> "Error concurrente: " + error.get());
        var finalizado = turnoService.obtener(turno.id());
        assertEquals(EstadoFranja.LIBRE, franjaRepository.findById(origen.getId()).orElseThrow().getEstado());
        long ocupadas = java.util.List.of(destinoA.getId(), destinoB.getId()).stream()
                .map(id -> franjaRepository.findById(id).orElseThrow())
                .filter(f -> f.getEstado() == EstadoFranja.OCUPADA).count();
        assertEquals(1, ocupadas);
        assertEquals(EstadoFranja.OCUPADA, franjaRepository.findById(finalizado.franjaId()).orElseThrow().getEstado());
        assertEquals(3, turnoEventoRepository.findByTurnoIdOrderByFechaAsc(turno.id()).size());
    }

    @Test
    void generaCuarentaAunqueLaPlantillaSeaAntiguaYLimpiaSoloLibresSinHistoria() {
        var profesional = crearProfesional();
        var fecha = LocalDate.now().plusDays(10);
        var antigua = new ar.com.agendamedica.domain.entity.PlantillaDisponibilidad();
        antigua.setProfesional(profesional); antigua.setDiaSemana(fecha.getDayOfWeek());
        antigua.setHoraInicio(LocalTime.of(8, 0)); antigua.setHoraFin(LocalTime.of(20, 0));
        antigua.setDuracionMin(30); antigua.setVigenciaDesde(fecha);
        plantillaRepository.saveAndFlush(antigua);
        var obsoleta = crearFranja(profesional, fecha.atTime(9, 0));
        obsoleta.setFin(obsoleta.getInicio().plusMinutes(30)); franjaRepository.saveAndFlush(obsoleta);
        assertTrue(agendaService.disponibles(profesional.getId(), fecha.atStartOfDay()).isEmpty());
        var resultado = agendaService.generarFranjas(new GenerarFranjasRequest(profesional.getId(), fecha, fecha));
        assertEquals(18, resultado.creadas()); assertFalse(franjaRepository.existsById(obsoleta.getId()));
        var franjas = agendaService.agendaDiaria(profesional.getId(), fecha);
        assertEquals(18, franjas.size());
        assertTrue(franjas.stream().allMatch(f -> java.time.Duration.between(f.inicio(), f.fin()).toMinutes() == 40));
        var repetido = agendaService.generarFranjas(new GenerarFranjasRequest(profesional.getId(), fecha, fecha));
        assertEquals(0, repetido.creadas()); assertEquals(18, repetido.existentes());
    }

    @Test
    void duracionFijaYHorarioHabitualNoConfigurables() {
        assertEquals(40, configuracion.obtener().getDuracionEstandarMin());
        assertTrue(ar.com.agendamedica.domain.HorarioConsultorio.atiende(LocalDate.of(2026, 11, 2)));
        assertFalse(ar.com.agendamedica.domain.HorarioConsultorio.atiende(LocalDate.of(2026, 11, 1)));
    }

    @Test
    void noBorraNiModificaTurnoAntiguoCuandoImpideGenerarCuarenta() {
        var profesional = crearProfesional(); var paciente = crearPaciente(); var fecha = LocalDate.now().plusDays(7);
        var franja = crearFranja(profesional, fecha.atTime(8, 0));
        franja.setFin(franja.getInicio().plusMinutes(30)); franja.setEstado(EstadoFranja.OCUPADA); franjaRepository.saveAndFlush(franja);
        var turno = new ar.com.agendamedica.domain.entity.Turno(); turno.setProfesional(profesional); turno.setPaciente(paciente);
        turno.setFranja(franja); turno.setInicio(franja.getInicio()); turno.setFin(franja.getFin());
        turno = turnoRepository.saveAndFlush(turno);
        assertThrows(ConflictException.class, () -> agendaService.generarFranjas(new GenerarFranjasRequest(profesional.getId(), fecha, fecha)));
        assertEquals(EstadoTurno.RESERVADO, turnoService.obtener(turno.getId()).estado());
        assertEquals(franja.getFin(), turnoService.obtener(turno.getId()).fin());
        assertTrue(franjaRepository.existsById(franja.getId()));
    }

    @Test
    void reservasDeCuarentaEnFranjasDiferentesSuperpuestasSeSerializan() throws Exception {
        var profesional = crearProfesional(); var paciente = crearPaciente(); var fecha = LocalDate.now().plusDays(8);
        var primera = crearFranja(profesional, fecha.atTime(9, 0)); var segunda = crearFranja(profesional, fecha.atTime(9, 20));
        CountDownLatch salida = new CountDownLatch(1); AtomicInteger exitos = new AtomicInteger(); AtomicInteger conflictos = new AtomicInteger();
        AtomicReference<Throwable> error = new AtomicReference<>(); var executor = Executors.newFixedThreadPool(2);
        for (Long id : java.util.List.of(primera.getId(), segunda.getId())) executor.submit(() -> {
            try { salida.await(); turnoService.crear(new CrearTurnoRequest(paciente.getId(), id, "Prueba")); exitos.incrementAndGet(); }
            catch (ConflictException e) { conflictos.incrementAndGet(); }
            catch (Throwable e) { error.compareAndSet(null, e); }
        });
        salida.countDown(); executor.shutdown(); assertTrue(executor.awaitTermination(20, TimeUnit.SECONDS));
        assertNull(error.get(), () -> "Error: " + error.get()); assertEquals(1, exitos.get()); assertEquals(1, conflictos.get());
    }

    @Test
    void generacionMensualUsaHorarioFijoYRechazaDosMeses() {
        var profesional = crearProfesional();
        LocalDate candidata = LocalDate.now().plusDays(9);
        while (!ar.com.agendamedica.domain.HorarioConsultorio.atiende(candidata)) {
            candidata = candidata.plusDays(1);
        }
        final LocalDate fecha = candidata;
        assertTimeoutPreemptively(java.time.Duration.ofSeconds(5), () ->
                assertEquals(18, agendaService.generarFranjas(new GenerarFranjasRequest(profesional.getId(), fecha, fecha)).creadas()));
        assertEquals(fecha.atTime(8, 40), agendaService.agendaDiaria(profesional.getId(), fecha).getFirst().fin());
        var mes = java.time.YearMonth.from(fecha);
        assertThrows(BadRequestException.class, () -> agendaService.generarFranjas(new GenerarFranjasRequest(
                profesional.getId(), mes.atDay(1), mes.plusMonths(1).atDay(1))));
    }

    @Autowired ar.com.agendamedica.repository.PlantillaDisponibilidadRepository plantillaRepository;

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
        f.setFin(inicio.plusMinutes(40));
        f.setEstado(EstadoFranja.LIBRE);
        f.setOrigen("TEST");
        return franjaRepository.saveAndFlush(f);
    }
}
