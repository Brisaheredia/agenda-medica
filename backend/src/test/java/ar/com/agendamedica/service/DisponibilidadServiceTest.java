package ar.com.agendamedica.service;

import ar.com.agendamedica.domain.entity.*;
import ar.com.agendamedica.domain.enums.*;
import ar.com.agendamedica.exception.ConflictException;
import ar.com.agendamedica.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import java.time.LocalDateTime;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class DisponibilidadServiceTest {
    private final FranjaRepository franjas = mock(FranjaRepository.class);
    private final ExcepcionAgendaRepository excepciones = mock(ExcepcionAgendaRepository.class);
    private final TurnoRepository turnos = mock(TurnoRepository.class);
    private final ConfiguracionAgendaService configuracion = mock(ConfiguracionAgendaService.class);
    private final DisponibilidadService servicio = new DisponibilidadService(franjas, excepciones, turnos, configuracion, mock(ProfesionalRepository.class));
    private Franja franja;

    @BeforeEach
    void preparar() {
        Profesional profesional = new Profesional(); profesional.setId(1L);
        franja = new Franja(); franja.setId(2L); franja.setProfesional(profesional);
        franja.setInicio(LocalDateTime.now().plusDays(2).withHour(9).withMinute(0));
        franja.setFin(franja.getInicio().plusMinutes(40)); franja.setEstado(EstadoFranja.OCUPADA);
        when(excepciones.findByProfesionalIdAndFechaBetweenOrderByFechaAsc(anyLong(), any(), any())).thenReturn(List.of());
    }

    private ExcepcionAgenda cierre() {
        ExcepcionAgenda cierre = new ExcepcionAgenda();
        cierre.setFecha(franja.getInicio().toLocalDate()); cierre.setTipo(TipoExcepcionAgenda.CIERRE);
        return cierre;
    }

    @Test
    void rechazaFranjaAntiguaDeTreintaMinutosAunqueFigureLibre() {
        franja.setEstado(EstadoFranja.LIBRE);
        franja.setFin(franja.getInicio().plusMinutes(30));
        assertThrows(ConflictException.class, () -> servicio.validarReservable(franja));
    }

    @Test
    void liberarTurnoDeDiaSuspendidoNoReabreElHorario() {
        when(excepciones.findByProfesionalIdAndFechaBetweenOrderByFechaAsc(anyLong(), any(), any())).thenReturn(List.of(cierre()));
        servicio.liberar(franja);
        assertEquals(EstadoFranja.BLOQUEADA, franja.getEstado());
    }

    @Test
    void horarioSuspendidoIndividualmenteSigueBloqueadoAlReprogramar() {
        franja.setEstado(EstadoFranja.BLOQUEADA);
        servicio.liberar(franja);
        assertEquals(EstadoFranja.BLOQUEADA, franja.getEstado());
    }

    @Test
    void cancelacionDePacienteSinCierreLiberaHorario() {
        servicio.liberar(franja);
        assertEquals(EstadoFranja.LIBRE, franja.getEstado());
    }

    @Test
    void rechazaFranjaLibreQuePerteneceAUnCierrePersistido() {
        franja.setEstado(EstadoFranja.LIBRE);
        when(configuracion.obtener()).thenReturn(new ConfiguracionAgenda());
        when(excepciones.findByProfesionalIdAndFechaBetweenOrderByFechaAsc(anyLong(), any(), any())).thenReturn(List.of(cierre()));
        assertThrows(ConflictException.class, () -> servicio.validarReservable(franja));
    }

    @Test
    void cierreParcialRespetaLosLimitesSinBloquearElTurnoSiguiente() {
        ExcepcionAgenda cierre = cierre();
        cierre.setHoraInicio(franja.getInicio().toLocalTime());
        cierre.setHoraFin(franja.getFin().toLocalTime());
        assertTrue(cierre.afecta(franja.getInicio(), franja.getFin()));
        assertFalse(cierre.afecta(franja.getFin(), franja.getFin().plusMinutes(40)));
        assertFalse(cierre.afecta(franja.getInicio().minusMinutes(40), franja.getInicio()));
    }
}
