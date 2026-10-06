package ar.com.agendamedica.config;

import ar.com.agendamedica.domain.entity.Franja;
import ar.com.agendamedica.domain.entity.Paciente;
import ar.com.agendamedica.domain.entity.Profesional;
import ar.com.agendamedica.domain.enums.EstadoFranja;
import ar.com.agendamedica.repository.FranjaRepository;
import ar.com.agendamedica.repository.PacienteRepository;
import ar.com.agendamedica.repository.ProfesionalRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Component
@Profile("dev")
public class DevDataSeeder implements CommandLineRunner {

    private final ProfesionalRepository profesionalRepository;
    private final PacienteRepository pacienteRepository;
    private final FranjaRepository franjaRepository;

    public DevDataSeeder(
            ProfesionalRepository profesionalRepository,
            PacienteRepository pacienteRepository,
            FranjaRepository franjaRepository) {
        this.profesionalRepository = profesionalRepository;
        this.pacienteRepository = pacienteRepository;
        this.franjaRepository = franjaRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        Profesional profesional = profesionalRepository.findByMatricula("MN-12345")
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

        LocalDate fecha = LocalDate.now().plusDays(1);
        LocalTime hora = LocalTime.of(9, 0);

        for (int i = 0; i < 8; i++) {
            LocalDateTime inicio = LocalDateTime.of(fecha, hora.plusMinutes(i * 30L));
            if (!franjaRepository.existsByProfesionalIdAndInicio(profesional.getId(), inicio)) {
                Franja franja = new Franja();
                franja.setProfesional(profesional);
                franja.setInicio(inicio);
                franja.setFin(inicio.plusMinutes(30));
                franja.setEstado(EstadoFranja.LIBRE);
                franja.setOrigen("SEED_DEV");
                franjaRepository.save(franja);
            }
        }
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
