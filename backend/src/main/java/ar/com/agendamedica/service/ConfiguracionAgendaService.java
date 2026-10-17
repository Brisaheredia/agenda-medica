package ar.com.agendamedica.service;

import ar.com.agendamedica.domain.entity.ConfiguracionAgenda;
import ar.com.agendamedica.dto.ConfiguracionAgendaRequest;
import ar.com.agendamedica.dto.ConfiguracionAgendaResponse;
import ar.com.agendamedica.exception.BadRequestException;
import ar.com.agendamedica.repository.ConfiguracionAgendaRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ConfiguracionAgendaService {
    private final ConfiguracionAgendaRepository repository;
    private final AuditoriaService auditoriaService;
    @PersistenceContext
    private EntityManager entityManager;

    public ConfiguracionAgendaService(ConfiguracionAgendaRepository repository, AuditoriaService auditoriaService) {
        this.repository = repository;
        this.auditoriaService = auditoriaService;
    }

    @Transactional(readOnly = true)
    public ConfiguracionAgenda obtener() {
        return repository.findById(ConfiguracionAgenda.ID_UNICA).orElseGet(ConfiguracionAgenda::new);
    }

    @Transactional
    public ConfiguracionAgendaResponse actualizar(ConfiguracionAgendaRequest request) {
        if (request.duracionEstandarMin() != null && request.duracionEstandarMin() != ConfiguracionAgenda.DURACION_TURNO_MIN) {
            throw new BadRequestException("La duración de los turnos es fija: 40 minutos");
        }
        ConfiguracionAgenda config = repository.findById(ConfiguracionAgenda.ID_UNICA).orElse(null);
        boolean nueva = config == null;
        if (nueva) config = new ConfiguracionAgenda();
        config.setDuracionEstandarMin(ConfiguracionAgenda.DURACION_TURNO_MIN);
        config.setHorizonteReservaDias(request.horizonteReservaDias());
        if (nueva) entityManager.persist(config);
        else config = repository.save(config);
        auditoriaService.registrar("ACTUALIZAR_CONFIGURACION_AGENDA", "ConfiguracionAgenda", config.getId(),
                "duracionEstandarMin=" + config.getDuracionEstandarMin()
                        + ", horizonteReservaDias=" + config.getHorizonteReservaDias());
        return ConfiguracionAgendaResponse.from(config);
    }
}
