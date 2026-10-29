package ar.com.agendamedica.controller;

import ar.com.agendamedica.dto.ConfiguracionAgendaResponse;
import ar.com.agendamedica.service.ConfiguracionAgendaService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/configuracion/agenda")
public class ConfiguracionAgendaController {
    private final ConfiguracionAgendaService service;

    public ConfiguracionAgendaController(ConfiguracionAgendaService service) {
        this.service = service;
    }

    @GetMapping
    public ConfiguracionAgendaResponse obtener() {
        return ConfiguracionAgendaResponse.from(service.obtener());
    }

}
