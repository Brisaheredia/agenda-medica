package ar.com.agendamedica.controller;

import ar.com.agendamedica.dto.AgendaDiaRangoResponse;
import ar.com.agendamedica.service.AgendaRangoService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/agenda")
public class AgendaRangoController {
    private final AgendaRangoService servicio;

    public AgendaRangoController(AgendaRangoService servicio) {
        this.servicio = servicio;
    }

    @GetMapping("/rango")
    public List<AgendaDiaRangoResponse> consultar(
            @RequestParam Long profesionalId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
            Authentication authentication) {
        boolean ocultarMotivos = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_OBRAS_SOCIALES"));
        return servicio.consultar(profesionalId, desde, hasta, ocultarMotivos);
    }
}
