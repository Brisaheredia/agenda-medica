package ar.com.agendamedica.controller;

import ar.com.agendamedica.dto.ObraSocialRequest;
import ar.com.agendamedica.dto.ObraSocialResponse;
import ar.com.agendamedica.service.ObraSocialService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/obras-sociales")
public class ObraSocialController {
    private final ObraSocialService service;

    public ObraSocialController(ObraSocialService service) {
        this.service = service;
    }

    @GetMapping
    public List<ObraSocialResponse> listar() {
        return service.listar();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ObraSocialResponse crear(@Valid @RequestBody ObraSocialRequest request) {
        return service.crear(request);
    }
}
