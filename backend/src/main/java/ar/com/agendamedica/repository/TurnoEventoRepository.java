package ar.com.agendamedica.repository;

import ar.com.agendamedica.domain.entity.TurnoEvento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import java.util.List;

public interface TurnoEventoRepository extends JpaRepository<TurnoEvento, Long> {
    @EntityGraph(attributePaths = "usuario")
    List<TurnoEvento> findByTurnoIdOrderByFechaAscIdAsc(Long turnoId);
}
