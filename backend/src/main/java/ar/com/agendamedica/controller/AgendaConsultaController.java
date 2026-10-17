package ar.com.agendamedica.controller;

import ar.com.agendamedica.dto.ExcepcionAgendaResumen;
import ar.com.agendamedica.dto.TurnoAfectadoResponse;
import ar.com.agendamedica.service.AgendaConsultaService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/agenda")
public class AgendaConsultaController {
    private final AgendaConsultaService consulta;

    public AgendaConsultaController(AgendaConsultaService consulta) {
        this.consulta = consulta;
    }

    @GetMapping("/excepciones")
    public List<ExcepcionAgendaResumen> excepciones(@RequestParam Long profesionalId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return consulta.excepciones(profesionalId, desde, hasta);
    }

    @GetMapping("/reprogramaciones-pendientes")
    public List<TurnoAfectadoResponse> pendientes(@RequestParam Long profesionalId) {
        return consulta.pendientes(profesionalId);
    }
}
