package ar.com.agendamedica.service;

import ar.com.agendamedica.domain.entity.ConfiguracionAgenda;
import ar.com.agendamedica.repository.ConfiguracionAgendaRepository;
import ar.com.agendamedica.time.TiempoAgenda;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;

@Service
public class ConfiguracionAgendaService {
    private static final int MESES_FUTUROS_HABILITABLES = 3;
    private final ConfiguracionAgendaRepository repository;

    public ConfiguracionAgendaService(ConfiguracionAgendaRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public ConfiguracionAgenda obtener() {
        return repository.findById(ConfiguracionAgenda.ID_UNICA).orElseGet(ConfiguracionAgenda::new);
    }

    // El mes actual (solo fechas futuras) y los tres meses siguientes completos.
    public LocalDate ultimoDiaHabilitable() {
        return YearMonth.from(TiempoAgenda.hoy()).plusMonths(MESES_FUTUROS_HABILITABLES).atEndOfMonth();
    }
}
