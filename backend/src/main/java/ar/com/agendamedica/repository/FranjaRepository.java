package ar.com.agendamedica.repository;

import ar.com.agendamedica.domain.entity.Franja;
import ar.com.agendamedica.domain.enums.EstadoFranja;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface FranjaRepository extends JpaRepository<Franja, Long> {
    List<Franja> findByProfesionalIdAndInicioBetweenOrderByInicioAsc(Long profesionalId, LocalDateTime desde, LocalDateTime hasta);
    List<Franja> findByProfesionalIdAndEstadoAndInicioGreaterThanEqualOrderByInicioAsc(Long profesionalId, EstadoFranja estado, LocalDateTime desde);
    boolean existsByProfesionalIdAndInicio(Long profesionalId, LocalDateTime inicio);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select f from Franja f where f.id = :id")
    Optional<Franja> findByIdForUpdate(@Param("id") Long id);
}
