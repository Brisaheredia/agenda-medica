package ar.com.agendamedica.repository;

import ar.com.agendamedica.domain.entity.TurnoEvento;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TurnoEventoRepository extends JpaRepository<TurnoEvento, Long> {
    List<TurnoEvento> findByTurnoIdOrderByFechaAsc(Long turnoId);
}
