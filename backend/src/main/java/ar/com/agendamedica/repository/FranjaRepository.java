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
    boolean existsByProfesionalIdAndInicioLessThanAndFinGreaterThan(Long profesionalId, LocalDateTime fin, LocalDateTime inicio);

    @Query("select f.profesional.id from Franja f where f.id = :id")
    Optional<Long> findProfesionalId(@Param("id") Long id);

    @Query("""
            select f from Franja f where f.profesional.id = :profesionalId
              and f.inicio >= :desde and f.inicio <= :hasta
              and f.estado = ar.com.agendamedica.domain.enums.EstadoFranja.LIBRE
              and not exists (select t from Turno t where t.franja = f)
              and not exists (select e from TurnoEvento e where e.franjaAnteriorId = f.id or e.franjaNuevaId = f.id)
            """)
    List<Franja> findLibresSinHistorial(@Param("profesionalId") Long profesionalId,
                                     @Param("desde") LocalDateTime desde, @Param("hasta") LocalDateTime hasta);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select f from Franja f where f.id = :id")
    Optional<Franja> findByIdForUpdate(@Param("id") Long id);
}
