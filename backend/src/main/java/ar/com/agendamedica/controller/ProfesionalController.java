package ar.com.agendamedica.controller;

import ar.com.agendamedica.dto.ProfesionalResponse;
import ar.com.agendamedica.repository.ProfesionalRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/profesionales")
public class ProfesionalController {
    private final ProfesionalRepository profesionalRepository;

    public ProfesionalController(ProfesionalRepository profesionalRepository) {
        this.profesionalRepository = profesionalRepository;
    }

    @GetMapping
    public List<ProfesionalResponse> listarActivos() {
        return profesionalRepository.findAll().stream()
                .filter(p -> p.isActivo())
                .map(ProfesionalResponse::from)
                .toList();
    }
}
