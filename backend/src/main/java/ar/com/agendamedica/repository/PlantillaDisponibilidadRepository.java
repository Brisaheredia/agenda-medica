package ar.com.agendamedica.repository;

import ar.com.agendamedica.domain.entity.PlantillaDisponibilidad;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface PlantillaDisponibilidadRepository extends JpaRepository<PlantillaDisponibilidad, Long> {
    List<PlantillaDisponibilidad> findByProfesionalIdAndVigenciaDesdeLessThanEqual(Long profesionalId, LocalDate fecha);
}
