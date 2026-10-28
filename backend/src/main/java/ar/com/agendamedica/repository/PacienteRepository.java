package ar.com.agendamedica.repository;

import ar.com.agendamedica.domain.entity.Paciente;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PacienteRepository extends JpaRepository<Paciente, Long> {
    Optional<Paciente> findByDni(String dni);

    // La búsqueda vacía se limita en SQL y no carga la tabla completa.
    List<Paciente> findTop20ByActivoTrueOrderByApellidoAscNombreAsc();

    @Query("""
            SELECT p FROM Paciente p
            WHERE p.activo = true AND (
                LOWER(p.apellido) LIKE :patron ESCAPE '!'
                OR p.telefono LIKE :patron ESCAPE '!'
                OR LOWER(p.email) LIKE :patron ESCAPE '!'
            )
            ORDER BY p.apellido ASC, p.nombre ASC
            """)
    List<Paciente> buscarPorApellidoOTelefonoOEmail(@Param("patron") String patron, Pageable limite);
}
