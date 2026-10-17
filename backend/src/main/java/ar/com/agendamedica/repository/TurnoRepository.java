package ar.com.agendamedica.repository;

import ar.com.agendamedica.domain.entity.Turno;
import ar.com.agendamedica.domain.enums.EstadoTurno;
import ar.com.agendamedica.domain.enums.OrigenCancelacion;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface TurnoRepository extends JpaRepository<Turno, Long> {
    List<Turno> findByProfesionalIdAndInicioBetweenOrderByInicioAsc(Long profesionalId, LocalDateTime desde, LocalDateTime hasta);
    List<Turno> findByPacienteIdOrderByInicioDesc(Long pacienteId);
    boolean existsByProfesionalIdAndEstadoInAndInicioLessThanAndFinGreaterThan(
            Long profesionalId, List<EstadoTurno> estados, LocalDateTime fin, LocalDateTime inicio);
    List<Turno> findByProfesionalIdAndEstadoInAndInicioLessThanAndFinGreaterThan(
            Long profesionalId, List<EstadoTurno> estados, LocalDateTime fin, LocalDateTime inicio);

    @Query("select t.profesional.id from Turno t where t.id = :id")
    Optional<Long> findProfesionalId(@Param("id") Long id);

    @Query("""
            select t from Turno t join fetch t.paciente join fetch t.profesional join fetch t.franja
            where t.profesional.id = :profesionalId and t.inicio < :hasta and t.fin > :desde
            order by t.inicio
            """)
    List<Turno> findPorPeriodo(@Param("profesionalId") Long profesionalId,
                              @Param("desde") LocalDateTime desde, @Param("hasta") LocalDateTime hasta);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select t from Turno t where t.id = :id")
    Optional<Turno> findByIdForUpdate(@Param("id") Long id);

    @Query("""
            select t from Turno t
            join fetch t.paciente join fetch t.profesional join fetch t.franja
            where t.profesional.id = :profesionalId
              and (t.estado in :activos or (t.estado = :cancelado and t.origenCancelacion = :consultorio))
            order by t.inicio asc
            """)
    List<Turno> findCandidatosReprogramacion(@Param("profesionalId") Long profesionalId,
                                           @Param("activos") List<EstadoTurno> activos,
                                           @Param("cancelado") EstadoTurno cancelado,
                                           @Param("consultorio") OrigenCancelacion consultorio);
}
