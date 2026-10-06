package ar.com.agendamedica.controller;

import ar.com.agendamedica.dto.*;
import ar.com.agendamedica.service.AgendaService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/agenda")
public class AgendaController {
    private final AgendaService agendaService;

    public AgendaController(AgendaService agendaService) {
        this.agendaService = agendaService;
    }

    @GetMapping
    public List<FranjaResponse> agendaDiaria(
            @RequestParam Long profesionalId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
        return agendaService.agendaDiaria(profesionalId, fecha);
    }

    @GetMapping("/disponibles")
    public List<FranjaResponse> disponibles(
            @RequestParam Long profesionalId,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime desde) {
        return agendaService.disponibles(profesionalId, desde);
    }

    @PostMapping("/plantillas")
    @ResponseStatus(HttpStatus.CREATED)
    public PlantillaDisponibilidadResponse crearPlantilla(
            @Valid @RequestBody PlantillaDisponibilidadRequest request) {
        return agendaService.crearPlantilla(request);
    }

    @PostMapping("/generar-franjas")
    public GenerarFranjasResponse generarFranjas(
            @Valid @RequestBody GenerarFranjasRequest request) {
        return agendaService.generarFranjas(request);
    }

    @PostMapping("/excepciones")
    @ResponseStatus(HttpStatus.CREATED)
    public ExcepcionAgendaResponse crearExcepcion(
            @Valid @RequestBody ExcepcionAgendaRequest request) {
        return agendaService.crearExcepcion(request);
    }

    @PostMapping("/bloqueos")
    @ResponseStatus(HttpStatus.CREATED)
    public ExcepcionAgendaResponse crearBloqueo(
            @Valid @RequestBody BloqueoAgendaRequest request) {
        return agendaService.crearBloqueo(request);
    }
}

