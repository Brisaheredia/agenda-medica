package ar.com.agendamedica.repository;

import ar.com.agendamedica.domain.entity.ExcepcionAgenda;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface ExcepcionAgendaRepository extends JpaRepository<ExcepcionAgenda, Long> {
    List<ExcepcionAgenda> findByProfesionalIdAndFechaBetweenOrderByFechaAsc(Long profesionalId, LocalDate desde, LocalDate hasta);
}
