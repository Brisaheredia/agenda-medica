package ar.com.agendamedica.service;

import ar.com.agendamedica.domain.entity.*;
import ar.com.agendamedica.domain.enums.*;
import ar.com.agendamedica.exception.BadRequestException;
import ar.com.agendamedica.repository.*;
import org.junit.jupiter.api.Test;
import java.time.LocalDate;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class AgendaConsultaServiceTest {
    private final TurnoRepository turnos = mock(TurnoRepository.class);
    private final ExcepcionAgendaRepository excepciones = mock(ExcepcionAgendaRepository.class);
    private final AgendaConsultaService servicio = new AgendaConsultaService(turnos, excepciones);

    private Turno turno(EstadoTurno estado) {
        Paciente paciente = new Paciente(); paciente.setId(1L); paciente.setNombre("Ana"); paciente.setApellido("Prueba");
        paciente.setDni("12345678"); paciente.setTelefono("1112345678"); paciente.setEmail("ana@example.test");
        Profesional profesional = new Profesional(); profesional.setId(2L);
        Franja franja = new Franja(); franja.setId(3L);
        Turno turno = new Turno(); turno.setId(4L); turno.setPaciente(paciente); turno.setProfesional(profesional);
        turno.setFranja(franja); turno.setInicio(LocalDate.now().plusDays(1).atTime(9, 0));
        turno.setFin(turno.getInicio().plusMinutes(40)); turno.setEstado(estado);
        return turno;
    }

    @Test
    void recuperaContactoDeTurnoSuspendidoSinDuplicarPorCierresSolapados() {
        Turno turno = turno(EstadoTurno.RESERVADO);
        ExcepcionAgenda cierre = new ExcepcionAgenda(); cierre.setFecha(turno.getInicio().toLocalDate());
        cierre.setTipo(TipoExcepcionAgenda.CIERRE); cierre.setMotivo("Urgencia médica");
        when(turnos.findCandidatosReprogramacion(anyLong(), anyList(), any(), any())).thenReturn(List.of(turno));
        when(excepciones.findByProfesionalIdAndFechaBetweenOrderByFechaAsc(anyLong(), any(), any())).thenReturn(List.of(cierre, cierre));
        var lista = servicio.pendientes(2L);
        assertEquals(1, lista.size());
        assertEquals("1112345678", lista.getFirst().telefono());
        assertEquals("12345678", lista.getFirst().dni());
        assertEquals("Urgencia médica", lista.getFirst().motivo());
    }

    @Test
    void cancelacionIndividualDeConsultorioSeRecuperaSinExcepcionDeDiaCompleto() {
        Turno turno = turno(EstadoTurno.CANCELADO); turno.setOrigenCancelacion(OrigenCancelacion.CONSULTORIO);
        turno.setMotivoCancelacion("Médico ausente");
        when(turnos.findCandidatosReprogramacion(anyLong(), anyList(), any(), any())).thenReturn(List.of(turno));
        when(excepciones.findByProfesionalIdAndFechaBetweenOrderByFechaAsc(anyLong(), any(), any())).thenReturn(List.of());
        assertEquals("Médico ausente", servicio.pendientes(2L).getFirst().motivo());
        verify(turnos).findCandidatosReprogramacion(2L, List.of(EstadoTurno.RESERVADO, EstadoTurno.CONFIRMADO), EstadoTurno.CANCELADO, OrigenCancelacion.CONSULTORIO);
    }

    @Test
    void rechazaRangoDeFechasInvertido() {
        assertThrows(BadRequestException.class, () -> servicio.excepciones(2L, LocalDate.now(), LocalDate.now().minusDays(1)));
    }
}
