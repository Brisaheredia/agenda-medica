package ar.com.agendamedica.service;

import ar.com.agendamedica.domain.entity.Turno;
import ar.com.agendamedica.domain.enums.EstadoTurno;
import ar.com.agendamedica.domain.enums.OrigenCancelacion;
import ar.com.agendamedica.dto.ReprogramarTurnoRequest;
import ar.com.agendamedica.repository.FranjaRepository;
import ar.com.agendamedica.repository.TurnoEventoRepository;
import ar.com.agendamedica.repository.TurnoRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

class TurnoServicePermisosTest {
    @AfterEach
    void limpiar() { SecurityContextHolder.clearContext(); }

    @Test
    void obrasSocialesNoPuedeRecuperarCancelacionDelConsultorio() {
        TurnoRepository turnos = mock(TurnoRepository.class);
        DisponibilidadService disponibilidad = mock(DisponibilidadService.class);
        TurnoService servicio = new TurnoService(turnos, mock(TurnoEventoRepository.class),
                mock(FranjaRepository.class), disponibilidad,
                mock(PacienteService.class), mock(AuditoriaService.class));
        Turno cancelado = new Turno();
        cancelado.setEstado(EstadoTurno.CANCELADO);
        cancelado.setOrigenCancelacion(OrigenCancelacion.CONSULTORIO);
        when(turnos.findProfesionalId(8L)).thenReturn(Optional.of(1L));
        when(disponibilidad.profesionalDeFranja(9L)).thenReturn(1L);
        when(turnos.findByIdForUpdate(8L)).thenReturn(Optional.of(cancelado));

        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("obras@example.test", null,
                        List.of(new SimpleGrantedAuthority("ROLE_OBRAS_SOCIALES"))));

        assertThrows(AccessDeniedException.class, () ->
                servicio.reprogramar(8L, new ReprogramarTurnoRequest(9L, "Prueba")));
        verify(turnos, never()).save(any());
        verify(disponibilidad, never()).ocupar(any());
    }

    @Test
    void obrasSocialesTampocoPuedeMoverTurnoActivoEnDiaSuspendido() {
        TurnoRepository turnos = mock(TurnoRepository.class);
        DisponibilidadService disponibilidad = mock(DisponibilidadService.class);
        TurnoService servicio = new TurnoService(turnos, mock(TurnoEventoRepository.class),
                mock(FranjaRepository.class), disponibilidad,
                mock(PacienteService.class), mock(AuditoriaService.class));
        Turno reservado = new Turno();
        reservado.setEstado(EstadoTurno.RESERVADO);
        ar.com.agendamedica.domain.entity.Franja franja = new ar.com.agendamedica.domain.entity.Franja();
        reservado.setFranja(franja);
        when(turnos.findProfesionalId(8L)).thenReturn(Optional.of(1L));
        when(disponibilidad.profesionalDeFranja(9L)).thenReturn(1L);
        when(turnos.findByIdForUpdate(8L)).thenReturn(Optional.of(reservado));
        when(disponibilidad.estaCerrada(franja)).thenReturn(true);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("obras@example.test", null,
                        List.of(new SimpleGrantedAuthority("ROLE_OBRAS_SOCIALES"))));
        assertThrows(AccessDeniedException.class, () ->
                servicio.reprogramar(8L, new ReprogramarTurnoRequest(9L, "Prueba")));
        verify(turnos, never()).save(any());
    }
}
