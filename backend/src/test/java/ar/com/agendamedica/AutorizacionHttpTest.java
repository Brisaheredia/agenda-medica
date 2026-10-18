package ar.com.agendamedica;

import ar.com.agendamedica.config.SecurityConfig;
import ar.com.agendamedica.controller.*;
import ar.com.agendamedica.domain.entity.ConfiguracionAgenda;
import ar.com.agendamedica.domain.entity.Usuario;
import ar.com.agendamedica.domain.enums.RolUsuario;
import ar.com.agendamedica.repository.ProfesionalRepository;
import ar.com.agendamedica.repository.UsuarioRepository;
import ar.com.agendamedica.security.AgendaUserDetailsService;
import ar.com.agendamedica.security.JwtAuthenticationFilter;
import ar.com.agendamedica.security.JwtService;
import ar.com.agendamedica.service.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.Arguments;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Stream;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/** Verifica los filtros y controladores reales con JWT, sin escribir datos del consultorio. */
@WebMvcTest(controllers = {AgendaController.class, AgendaConsultaController.class, TurnoController.class,
        PacienteController.class, UsuarioController.class, AuditoriaController.class,
        ConfiguracionAgendaController.class, ProfesionalController.class, AuthController.class},
        properties = {"app.jwt.secret=clave-exclusiva-para-pruebas-http-de-autorizacion",
                "app.jwt.expiration-minutes=480"})
@Import({SecurityConfig.class, JwtService.class, JwtAuthenticationFilter.class,
        AgendaUserDetailsService.class, AuthService.class})
class AutorizacionHttpTest {
    private static final String CLAVE_PRUEBA = "SoloParaPruebas123!";
    private static final String HASH_PRUEBA = new BCryptPasswordEncoder().encode(CLAVE_PRUEBA);
    private static final Set<RolUsuario> TODOS = Set.of(RolUsuario.values());
    private static final Set<RolUsuario> ADMIN = Set.of(RolUsuario.ADMIN);
    private static final Set<RolUsuario> GESTION = Set.of(RolUsuario.ADMIN, RolUsuario.RECEPCION);
    private static final Set<RolUsuario> TURNOS = Set.of(RolUsuario.ADMIN, RolUsuario.RECEPCION, RolUsuario.OBRAS_SOCIALES);
    private static final Set<RolUsuario> HORARIOS = Set.of(RolUsuario.ADMIN, RolUsuario.MEDICO);
    private static final Set<RolUsuario> RESULTADOS = Set.of(RolUsuario.ADMIN, RolUsuario.MEDICO, RolUsuario.RECEPCION);

    @Autowired MockMvc mvc;
    @Autowired JwtService jwt;
    @MockitoBean UsuarioRepository usuarios;
    @MockitoBean ProfesionalRepository profesionales;
    @MockitoBean AgendaService agenda;
    @MockitoBean AgendaConsultaService consultas;
    @MockitoBean TurnoService turnos;
    @MockitoBean PacienteService pacientes;
    @MockitoBean UsuarioService gestionUsuarios;
    @MockitoBean AuditoriaService auditoria;
    @MockitoBean ConfiguracionAgendaService configuracion;

    private record Operacion(String metodo, String ruta, String cuerpo, int exito, Set<RolUsuario> permitidos) {
        @Override public String toString() { return metodo + " " + ruta; }
    }

    private static List<Operacion> operaciones() {
        String paciente = """
                {"dni":"12345678","nombre":"Paciente","apellido":"Prueba","telefono":"1112345678","email":"prueba@example.test"}
                """;
        return List.of(
                new Operacion("GET", "/api/profesionales", null, 200, TODOS),
                new Operacion("GET", "/api/agenda?profesionalId=1&fecha=2099-01-05", null, 200, TODOS),
                new Operacion("GET", "/api/agenda/disponibles?profesionalId=1", null, 200, TODOS),
                new Operacion("GET", "/api/agenda/excepciones?profesionalId=1&desde=2099-01-01&hasta=2099-01-31", null, 200, TODOS),
                new Operacion("GET", "/api/agenda/reprogramaciones-pendientes?profesionalId=1", null, 200, RESULTADOS),
                new Operacion("POST", "/api/agenda/plantillas", """
                        {"profesionalId":1,"diaSemana":"MONDAY","horaInicio":"08:00","horaFin":"20:00","vigenciaDesde":"2099-01-01"}
                        """, 201, HORARIOS),
                new Operacion("POST", "/api/agenda/generar-franjas", """
                        {"profesionalId":1,"desde":"2099-01-01","hasta":"2099-01-31"}
                        """, 200, HORARIOS),
                new Operacion("POST", "/api/agenda/excepciones", """
                        {"profesionalId":1,"fecha":"2099-01-05","tipo":"CIERRE","motivo":"Prueba"}
                        """, 201, HORARIOS),
                new Operacion("POST", "/api/agenda/bloqueos", """
                        {"profesionalId":1,"fecha":"2099-01-05","motivo":"Prueba"}
                        """, 201, HORARIOS),
                new Operacion("GET", "/api/configuracion/agenda", null, 200, TODOS),
                new Operacion("PUT", "/api/configuracion/agenda", "{\"horizonteReservaDias\":90}", 200, ADMIN),
                new Operacion("GET", "/api/turnos?profesionalId=1&fecha=2099-01-05", null, 200, TODOS),
                new Operacion("GET", "/api/turnos/1", null, 200, TODOS),
                new Operacion("POST", "/api/turnos", "{\"pacienteId\":1,\"franjaId\":1}", 201, TURNOS),
                new Operacion("POST", "/api/turnos/1/cancelacion", "{\"motivo\":\"Prueba\",\"origen\":\"PACIENTE\"}", 200, TURNOS),
                new Operacion("POST", "/api/turnos/1/reprogramacion", "{\"franjaId\":2}", 200, TURNOS),
                new Operacion("POST", "/api/turnos/1/atencion", null, 200, RESULTADOS),
                new Operacion("POST", "/api/turnos/1/ausencia", null, 200, RESULTADOS),
                new Operacion("GET", "/api/pacientes?query=Prueba", null, 200, RESULTADOS),
                new Operacion("GET", "/api/pacientes/1", null, 200, RESULTADOS),
                new Operacion("GET", "/api/pacientes/seleccion?query=Prueba", null, 200, TODOS),
                new Operacion("POST", "/api/pacientes", paciente, 201, GESTION),
                new Operacion("PUT", "/api/pacientes/1", paciente, 200, GESTION),
                new Operacion("DELETE", "/api/pacientes/1", null, 204, GESTION),
                new Operacion("GET", "/api/auditoria", null, 200, ADMIN),
                new Operacion("GET", "/api/usuarios", null, 200, ADMIN),
                new Operacion("POST", "/api/usuarios", """
                        {"email":"nuevo@example.test","password":"ClaveExclusivaDePrueba123!","rol":"MEDICO"}
                        """, 201, ADMIN),
                new Operacion("PATCH", "/api/usuarios/2/activo?activo=false", null, 200, ADMIN),
                new Operacion("PUT", "/api/usuarios/2/rol", "{\"rol\":\"OBRAS_SOCIALES\"}", 200, ADMIN),
                new Operacion("PUT", "/api/usuarios/2/password", "{\"password\":\"ClaveSoloDePrueba123!\"}", 204, ADMIN));
    }

    static Stream<Arguments> matrizVigente() {
        return Arrays.stream(RolUsuario.values()).flatMap(rol -> operaciones().stream().map(op -> Arguments.of(rol, op)));
    }

    static Stream<Operacion> rutasProtegidas() { return operaciones().stream(); }

    @BeforeEach
    void prepararCuentasFicticias() {
        when(usuarios.findByEmailIgnoreCase(anyString())).thenAnswer(invocacion -> {
            String email = invocacion.getArgument(0);
            return Arrays.stream(RolUsuario.values()).filter(rol -> email(rol).equals(email)).findFirst().map(rol -> {
                Usuario usuario = new Usuario(); usuario.setEmail(email); usuario.setRol(rol);
                usuario.setActivo(true); usuario.setPasswordHash(HASH_PRUEBA);
                return usuario;
            });
        });
        when(configuracion.obtener()).thenReturn(new ConfiguracionAgenda());
        var turno = new ar.com.agendamedica.dto.TurnoResponse(1L, 1L, "Paciente Prueba", 1L, 1L,
                java.time.LocalDateTime.of(2099, 1, 5, 8, 0), java.time.LocalDateTime.of(2099, 1, 5, 8, 40),
                ar.com.agendamedica.domain.enums.EstadoTurno.RESERVADO, "Dato reservado", null, null, "Dato cancelación", true);
        when(turnos.obtener(anyLong())).thenReturn(turno);
        when(turnos.listarPorProfesionalYFecha(anyLong(), any())).thenReturn(List.of(turno));
        when(turnos.crear(any())).thenReturn(turno);
        when(turnos.cancelar(anyLong(), any())).thenReturn(turno);
        when(turnos.reprogramar(anyLong(), any())).thenReturn(turno);
        when(pacientes.seleccionar(anyString())).thenReturn(List.of(
                new ar.com.agendamedica.dto.PacienteSeleccionResponse(1L, "12345678", "Paciente", "Prueba", true)));
    }

    @ParameterizedTest(name = "{0}: {1}")
    @MethodSource("matrizVigente")
    void aplicaRolDeBaseDeDatosConJwtReal(RolUsuario rol, Operacion op) throws Exception {
        var request = peticion(op).header("Authorization", "Bearer " + token(rol));
        boolean permitido = op.permitidos().contains(rol);
        mvc.perform(request).andExpect(status().is(permitido ? op.exito() : 403));
        if (!permitido) verificarNegocioNoEjecutado();
    }

    @ParameterizedTest(name = "Sin sesion: {0}")
    @MethodSource("rutasProtegidas")
    void rechazaTodasLasRutasProtegidasSinSesion(Operacion op) throws Exception {
        mvc.perform(peticion(op)).andExpect(status().isUnauthorized());
        verificarNegocioNoEjecutado();
    }

    @ParameterizedTest
    @EnumSource(RolUsuario.class)
    void loginConClaveDePruebaDevuelveElRolReal(RolUsuario rol) throws Exception {
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + email(rol) + "\",\"password\":\"" + CLAVE_PRUEBA + "\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.rol").value(rol.name()))
                .andExpect(jsonPath("$.token").isNotEmpty());
    }

    @Test
    void claimAdminNoElevaPermisosDeRecepcion() throws Exception {
        String token = jwt.generarToken(email(RolUsuario.RECEPCION), "ADMIN", HASH_PRUEBA);
        mvc.perform(get("/api/usuarios").header("Authorization", "Bearer " + token)).andExpect(status().isUnauthorized());
        verifyNoInteractions(gestionUsuarios);
    }

    @Test
    void firmaInvalidaNoPermiteAccederComoAdmin() throws Exception {
        var otraClave = new JwtService("otra-clave-exclusiva-de-prueba-sin-acceso-al-sistema", 480);
        String token = otraClave.generarToken(email(RolUsuario.ADMIN), "ADMIN", HASH_PRUEBA);
        mvc.perform(get("/api/usuarios").header("Authorization", "Bearer " + token)).andExpect(status().isUnauthorized());
        verifyNoInteractions(gestionUsuarios);
    }

    @Test
    void adminPuedeCrearObrasSociales() throws Exception {
        mvc.perform(post("/api/usuarios").header("Authorization", "Bearer " + token(RolUsuario.ADMIN))
                .contentType(MediaType.APPLICATION_JSON).content("""
                        {"email":"obra@example.test","password":"ClaveExclusivaDePrueba123!","rol":"OBRAS_SOCIALES"}
                        """))
                .andExpect(status().isCreated());
        verify(gestionUsuarios).crear(argThat(request -> request.rol() == RolUsuario.OBRAS_SOCIALES));
    }

    @Test
    void obrasSocialesRecibeDatosMinimosYSinMotivos() throws Exception {
        String autorizacion = "Bearer " + token(RolUsuario.OBRAS_SOCIALES);
        mvc.perform(get("/api/pacientes/seleccion?query=Prueba").header("Authorization", autorizacion))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].dni").value("12345678"))
                .andExpect(jsonPath("$[0].telefono").doesNotExist()).andExpect(jsonPath("$[0].email").doesNotExist());
        mvc.perform(get("/api/turnos/1").header("Authorization", autorizacion))
                .andExpect(status().isOk()).andExpect(jsonPath("$.motivoConsulta").isEmpty())
                .andExpect(jsonPath("$.motivoCancelacion").isEmpty())
                .andExpect(jsonPath("$.reprogramadoPorConsultorio").value(true));
        mvc.perform(get("/api/turnos?profesionalId=1&fecha=2099-01-05").header("Authorization", autorizacion))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].motivoConsulta").isEmpty());
        mvc.perform(post("/api/turnos").header("Authorization", autorizacion).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"pacienteId\":1,\"franjaId\":1,\"motivoConsulta\":\"No guardar\"}"))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.motivoConsulta").isEmpty());
        verify(turnos).crear(argThat(request -> request.motivoConsulta() == null));
    }

    @Test
    void obrasSocialesNoPuedeSuspenderAtencion() throws Exception {
        mvc.perform(post("/api/turnos/1/cancelacion").header("Authorization", "Bearer " + token(RolUsuario.OBRAS_SOCIALES))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"motivo\":\"Prueba\",\"origen\":\"CONSULTORIO\"}"))
                .andExpect(status().isForbidden());
        verifyNoInteractions(turnos);
    }

    @Test
    void cuentaDesactivadaYPasswordAnteriorInvalidanJwt() throws Exception {
        String token = token(RolUsuario.ADMIN);
        when(usuarios.findByEmailIgnoreCase(email(RolUsuario.ADMIN))).thenReturn(java.util.Optional.empty());
        mvc.perform(get("/api/usuarios").header("Authorization", "Bearer " + token)).andExpect(status().isUnauthorized());
        when(usuarios.findByEmailIgnoreCase(email(RolUsuario.ADMIN))).thenAnswer(invocation -> {
            Usuario usuario = new Usuario(); usuario.setEmail(email(RolUsuario.ADMIN)); usuario.setRol(RolUsuario.ADMIN);
            usuario.setActivo(true); usuario.setPasswordHash("otro-hash"); return java.util.Optional.of(usuario);
        });
        mvc.perform(get("/api/usuarios").header("Authorization", "Bearer " + token)).andExpect(status().isUnauthorized());
        verifyNoInteractions(gestionUsuarios);
    }

    @Test
    void parametroOmitidoNoSeConfundeConPermisos() throws Exception {
        mvc.perform(get("/api/agenda?fecha=2099-01-05").header("Authorization", "Bearer " + token(RolUsuario.ADMIN)))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(agenda);
    }

    @Test
    void rutaNuevaNoSeHabilitaAutomaticamente() throws Exception {
        mvc.perform(post("/api/futura-operacion").header("Authorization", "Bearer " + token(RolUsuario.ADMIN)))
                .andExpect(status().isForbidden());
    }

    private String token(RolUsuario rol) { return jwt.generarToken(email(rol), rol.name(), HASH_PRUEBA); }

    private static String email(RolUsuario rol) { return rol.name().toLowerCase(java.util.Locale.ROOT) + "@example.test"; }

    private MockHttpServletRequestBuilder peticion(Operacion op) {
        var request = request(HttpMethod.valueOf(op.metodo()), op.ruta());
        return op.cuerpo() == null ? request : request.contentType(MediaType.APPLICATION_JSON).content(op.cuerpo());
    }

    private void verificarNegocioNoEjecutado() {
        verifyNoInteractions(agenda, consultas, turnos, pacientes, gestionUsuarios, auditoria, configuracion, profesionales);
    }
}
