package ar.com.agendamedica.service;

import ar.com.agendamedica.domain.entity.Paciente;
import ar.com.agendamedica.dto.PacienteRequest;
import ar.com.agendamedica.dto.PacienteResponse;
import ar.com.agendamedica.exception.ConflictException;
import ar.com.agendamedica.exception.ResourceNotFoundException;
import ar.com.agendamedica.repository.PacienteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PacienteService {
    private final PacienteRepository pacienteRepository;

    public PacienteService(PacienteRepository pacienteRepository) {
        this.pacienteRepository = pacienteRepository;
    }

    @Transactional
    public PacienteResponse crear(PacienteRequest request) {
        pacienteRepository.findByDni(request.dni().trim()).ifPresent(p -> {
            throw new ConflictException("Ya existe un paciente con DNI " + request.dni());
        });

        Paciente paciente = new Paciente();
        aplicarDatos(paciente, request);
        paciente.setActivo(true);
        return PacienteResponse.from(pacienteRepository.save(paciente));
    }

    @Transactional(readOnly = true)
    public List<PacienteResponse> buscar(String query) {
        if (query == null || query.isBlank()) {
            return pacienteRepository.findAll().stream()
                    .filter(Paciente::isActivo)
                    .limit(20)
                    .map(PacienteResponse::from)
                    .toList();
        }

        String q = query.trim();
        var exacto = pacienteRepository.findByDni(q);
        if (exacto.isPresent() && exacto.get().isActivo()) {
            return List.of(PacienteResponse.from(exacto.get()));
        }

        return pacienteRepository.findTop20ByActivoTrueAndApellidoContainingIgnoreCaseOrderByApellidoAscNombreAsc(q)
                .stream()
                .map(PacienteResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public PacienteResponse obtener(Long id) {
        return PacienteResponse.from(obtenerEntidad(id));
    }

    @Transactional
    public PacienteResponse actualizar(Long id, PacienteRequest request) {
        Paciente paciente = obtenerEntidad(id);

        pacienteRepository.findByDni(request.dni().trim())
                .filter(otro -> !otro.getId().equals(id))
                .ifPresent(otro -> {
                    throw new ConflictException("Ya existe otro paciente con DNI " + request.dni());
                });

        aplicarDatos(paciente, request);
        return PacienteResponse.from(pacienteRepository.save(paciente));
    }

    @Transactional
    public void desactivar(Long id) {
        Paciente paciente = obtenerEntidad(id);
        paciente.setActivo(false);
        pacienteRepository.save(paciente);
    }

    @Transactional(readOnly = true)
    public Paciente obtenerEntidadActiva(Long id) {
        Paciente paciente = obtenerEntidad(id);
        if (!paciente.isActivo()) {
            throw new ConflictException("El paciente está inactivo");
        }
        return paciente;
    }

    private Paciente obtenerEntidad(Long id) {
        return pacienteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Paciente no encontrado: " + id));
    }

    private void aplicarDatos(Paciente paciente, PacienteRequest request) {
        paciente.setDni(request.dni().trim());
        paciente.setNombre(request.nombre().trim());
        paciente.setApellido(request.apellido().trim());
        paciente.setTelefono(normalize(request.telefono()));
        paciente.setEmail(normalize(request.email()));
    }

    private String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
