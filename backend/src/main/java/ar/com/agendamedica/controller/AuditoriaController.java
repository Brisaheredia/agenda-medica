package ar.com.agendamedica.controller;

import ar.com.agendamedica.dto.AuditoriaResponse;
import ar.com.agendamedica.service.AuditoriaService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/auditoria")
public class AuditoriaController {
    private final AuditoriaService auditoriaService;

    public AuditoriaController(AuditoriaService auditoriaService) {
        this.auditoriaService = auditoriaService;
    }

    @GetMapping
    public List<AuditoriaResponse> ultimas() {
        return auditoriaService.ultimas();
    }
}
