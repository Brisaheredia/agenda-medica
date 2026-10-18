package ar.com.agendamedica.controller;

import ar.com.agendamedica.dto.UsuarioRequest;
import ar.com.agendamedica.dto.UsuarioResponse;
import ar.com.agendamedica.dto.CambiarRolRequest;
import ar.com.agendamedica.dto.CambiarPasswordRequest;
import ar.com.agendamedica.service.UsuarioService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {
    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @GetMapping
    public List<UsuarioResponse> listar() {
        return usuarioService.listar();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UsuarioResponse crear(@Valid @RequestBody UsuarioRequest request) {
        return usuarioService.crear(request);
    }

    @PatchMapping("/{id}/activo")
    public UsuarioResponse cambiarActivo(
            @PathVariable Long id,
            @RequestParam boolean activo) {
        return usuarioService.cambiarActivo(id, activo);
    }

    @PutMapping("/{id}/rol")
    public UsuarioResponse cambiarRol(@PathVariable Long id, @Valid @RequestBody CambiarRolRequest request) {
        return usuarioService.cambiarRol(id, request.rol());
    }

    @PutMapping("/{id}/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cambiarPassword(@PathVariable Long id, @Valid @RequestBody CambiarPasswordRequest request) {
        usuarioService.cambiarPassword(id, request.password());
    }
}
