package ar.com.agendamedica.service;

import ar.com.agendamedica.domain.entity.Auditoria;
import ar.com.agendamedica.dto.AuditoriaResponse;
import ar.com.agendamedica.repository.AuditoriaRepository;
import ar.com.agendamedica.repository.UsuarioRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AuditoriaService {
    private final AuditoriaRepository auditoriaRepository;
    private final UsuarioRepository usuarioRepository;

    public AuditoriaService(
            AuditoriaRepository auditoriaRepository,
            UsuarioRepository usuarioRepository) {
        this.auditoriaRepository = auditoriaRepository;
        this.usuarioRepository = usuarioRepository;
    }

    @Transactional
    public void registrar(String accion, String entidad, Long entidadId, String metadata) {
        Auditoria auditoria = new Auditoria();
        auditoria.setAccion(accion);
        auditoria.setEntidad(entidad);
        auditoria.setEntidadId(entidadId);
        auditoria.setMetadata(metadata);

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null
                && authentication.isAuthenticated()
                && authentication.getName() != null) {
            usuarioRepository.findByEmailIgnoreCase(authentication.getName())
                    .ifPresent(auditoria::setUsuario);
        }

        auditoriaRepository.save(auditoria);
    }

    @Transactional(readOnly = true)
    public List<AuditoriaResponse> ultimas() {
        return auditoriaRepository.findTop100ByOrderByFechaDesc()
                .stream()
                .map(AuditoriaResponse::from)
                .toList();
    }
}
