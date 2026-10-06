package ar.com.agendamedica.repository;

import ar.com.agendamedica.domain.entity.Profesional;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ProfesionalRepository extends JpaRepository<Profesional, Long> {
    Optional<Profesional> findByMatricula(String matricula);
}
