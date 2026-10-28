package ar.com.agendamedica.controller;

import ar.com.agendamedica.dto.CancelarTurnoRequest;
import ar.com.agendamedica.dto.CrearTurnoRequest;
import ar.com.agendamedica.dto.ReprogramarTurnoRequest;
import ar.com.agendamedica.dto.TurnoResponse;
import ar.com.agendamedica.dto.TurnoHistorialResponse;
import ar.com.agendamedica.service.TurnoService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.AccessDeniedException;
import ar.com.agendamedica.domain.enums.OrigenCancelacion;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/turnos")
public class TurnoController {
    private final TurnoService turnoService;

    public TurnoController(TurnoService turnoService) {
        this.turnoService = turnoService;
    }

    @GetMapping
    public List<TurnoResponse> listar(
            @RequestParam Long profesionalId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha,
            Authentication authentication) {
        return turnoService.listarPorProfesionalYFecha(profesionalId, fecha).stream()
                .map(turno -> visible(turno, authentication)).toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TurnoResponse crear(@Valid @RequestBody CrearTurnoRequest request, Authentication authentication) {
        if (esObraSocial(authentication)) {
            request = new CrearTurnoRequest(request.pacienteId(), request.franjaId(), null);
        }
        return visible(turnoService.crear(request), authentication);
    }

    @GetMapping("/{id}")
    public TurnoResponse obtener(@PathVariable Long id, Authentication authentication) {
        return visible(turnoService.obtener(id), authentication);
    }

    @GetMapping("/{id}/historial")
    public List<TurnoHistorialResponse> historial(@PathVariable Long id) {
        return turnoService.historial(id);
    }

    @PostMapping("/{id}/cancelacion")
    public TurnoResponse cancelar(
            @PathVariable Long id,
            @Valid @RequestBody CancelarTurnoRequest request, Authentication authentication) {
        if (esObraSocial(authentication) && request.origen() == OrigenCancelacion.CONSULTORIO) {
            throw new AccessDeniedException("Obras sociales no puede suspender la atención del consultorio");
        }
        return visible(turnoService.cancelar(id, request), authentication);
    }

    @PostMapping("/{id}/reprogramacion")
    public TurnoResponse reprogramar(
            @PathVariable Long id,
            @Valid @RequestBody ReprogramarTurnoRequest request, Authentication authentication) {
        return visible(turnoService.reprogramar(id, request), authentication);
    }

    @PostMapping("/{id}/atencion")
    public TurnoResponse marcarAtendido(@PathVariable Long id) {
        return turnoService.marcarAtendido(id);
    }

    @PostMapping("/{id}/ausencia")
    public TurnoResponse marcarAusente(@PathVariable Long id) {
        return turnoService.marcarAusente(id);
    }

    private boolean esObraSocial(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_OBRAS_SOCIALES"));
    }

    private TurnoResponse visible(TurnoResponse turno, Authentication authentication) {
        return esObraSocial(authentication) ? turno.sinMotivos() : turno;
    }
}
