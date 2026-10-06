package ar.com.agendamedica.repository;

import ar.com.agendamedica.domain.entity.Paciente;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PacienteRepository extends JpaRepository<Paciente, Long> {
    Optional<Paciente> findByDni(String dni);
    List<Paciente> findTop20ByActivoTrueAndApellidoContainingIgnoreCaseOrderByApellidoAscNombreAsc(String apellido);
}
