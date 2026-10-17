package ar.com.agendamedica.repository;

import ar.com.agendamedica.domain.entity.Profesional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import java.util.Optional;

public interface ProfesionalRepository extends JpaRepository<Profesional, Long> {
    Optional<Profesional> findByMatricula(String matricula);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Profesional p where p.id = :id")
    Optional<Profesional> findByIdForUpdate(@Param("id") Long id);
}
