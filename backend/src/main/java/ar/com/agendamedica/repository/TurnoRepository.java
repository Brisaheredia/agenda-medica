package ar.com.agendamedica.repository;

import ar.com.agendamedica.domain.entity.Turno;
import ar.com.agendamedica.domain.enums.EstadoTurno;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface TurnoRepository extends JpaRepository<Turno, Long> {
    List<Turno> findByProfesionalIdAndInicioBetweenOrderByInicioAsc(Long profesionalId, LocalDateTime desde, LocalDateTime hasta);
    List<Turno> findByPacienteIdOrderByInicioDesc(Long pacienteId);
    boolean existsByFranjaIdAndEstadoIn(Long franjaId, List<EstadoTurno> estados);
}
