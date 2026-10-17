package ar.com.agendamedica.config;

import ar.com.agendamedica.domain.entity.Paciente;
import ar.com.agendamedica.domain.entity.Profesional;
import ar.com.agendamedica.repository.PacienteRepository;
import ar.com.agendamedica.repository.ProfesionalRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;


@Component
@Profile("dev")
public class DevDataSeeder implements CommandLineRunner {

    private final ProfesionalRepository profesionalRepository;
    private final PacienteRepository pacienteRepository;

    public DevDataSeeder(
            ProfesionalRepository profesionalRepository,
            PacienteRepository pacienteRepository) {
        this.profesionalRepository = profesionalRepository;
        this.pacienteRepository = pacienteRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        profesionalRepository.findByMatricula("MN-12345")
                .orElseGet(() -> {
                    Profesional p = new Profesional();
                    p.setNombre("Salvador");
                    p.setApellido("Amado");
                    p.setMatricula("MN-12345");
                    p.setActivo(true);
                    return profesionalRepository.save(p);
                });

        crearPacienteSiNoExiste("30111222", "Ana", "Pérez", "2326-400001", "ana.perez@test.local");
        crearPacienteSiNoExiste("28999888", "Carlos", "Gómez", "2326-400002", "carlos.gomez@test.local");

        // La agenda se habilita explícitamente desde la planificación mensual.

    }

    private void crearPacienteSiNoExiste(String dni, String nombre, String apellido, String telefono, String email) {
        if (pacienteRepository.findByDni(dni).isPresent()) {
            return;
        }

        Paciente paciente = new Paciente();
        paciente.setDni(dni);
        paciente.setNombre(nombre);
        paciente.setApellido(apellido);
        paciente.setTelefono(telefono);
        paciente.setEmail(email);
        paciente.setActivo(true);
        pacienteRepository.save(paciente);
    }
}
