package ar.com.agendamedica.service;

import ar.com.agendamedica.domain.entity.ObraSocial;
import ar.com.agendamedica.dto.ObraSocialRequest;
import ar.com.agendamedica.dto.ObraSocialResponse;
import ar.com.agendamedica.exception.BadRequestException;
import ar.com.agendamedica.exception.ConflictException;
import ar.com.agendamedica.exception.ResourceNotFoundException;
import ar.com.agendamedica.repository.ObraSocialRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ObraSocialService {
    private final ObraSocialRepository repository;

    public ObraSocialService(ObraSocialRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<ObraSocialResponse> listar() {
        return repository.findAllByOrderByNombreAsc().stream().map(ObraSocialResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public ObraSocial obtenerEntidad(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Obra social no encontrada: " + id));
    }

    @Transactional
    public ObraSocialResponse crear(ObraSocialRequest request) {
        String nombre = request.nombre().trim().replaceAll("\\s+", " ");
        if (nombre.isEmpty()) throw new BadRequestException("Ingresá el nombre de la obra social");
        if (repository.findByNombreIgnoreCase(nombre).isPresent()) {
            throw new ConflictException("Esa obra social ya está registrada");
        }
        ObraSocial entidad = new ObraSocial();
        entidad.setNombre(nombre);
        try {
            return ObraSocialResponse.from(repository.saveAndFlush(entidad));
        } catch (DataIntegrityViolationException ex) {
            throw new ConflictException("Esa obra social ya está registrada");
        }
    }
}
