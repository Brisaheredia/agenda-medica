package ar.com.agendamedica.controller;

import ar.com.agendamedica.dto.CancelarTurnoRequest;
import ar.com.agendamedica.dto.CrearTurnoRequest;
import ar.com.agendamedica.dto.ReprogramarTurnoRequest;
import ar.com.agendamedica.dto.TurnoResponse;
import ar.com.agendamedica.service.TurnoService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
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
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        return turnoService.listarPorProfesionalYFecha(profesionalId, fecha);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TurnoResponse crear(@Valid @RequestBody CrearTurnoRequest request) {
        return turnoService.crear(request);
    }

    @GetMapping("/{id}")
    public TurnoResponse obtener(@PathVariable Long id) {
        return turnoService.obtener(id);
    }

    @PostMapping("/{id}/cancelacion")
    public TurnoResponse cancelar(
            @PathVariable Long id,
            @Valid @RequestBody CancelarTurnoRequest request) {
        return turnoService.cancelar(id, request);
    }

    @PostMapping("/{id}/reprogramacion")
    public TurnoResponse reprogramar(
            @PathVariable Long id,
            @Valid @RequestBody ReprogramarTurnoRequest request) {
        return turnoService.reprogramar(id, request);
    }

    @PostMapping("/{id}/atencion")
    public TurnoResponse marcarAtendido(@PathVariable Long id) {
        return turnoService.marcarAtendido(id);
    }

    @PostMapping("/{id}/ausencia")
    public TurnoResponse marcarAusente(@PathVariable Long id) {
        return turnoService.marcarAusente(id);
    }
}
