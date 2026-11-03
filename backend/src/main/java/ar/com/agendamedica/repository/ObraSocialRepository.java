package ar.com.agendamedica.repository;

import ar.com.agendamedica.domain.entity.ObraSocial;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ObraSocialRepository extends JpaRepository<ObraSocial, Long> {
    List<ObraSocial> findAllByOrderByNombreAsc();
    Optional<ObraSocial> findByNombreIgnoreCase(String nombre);
}
