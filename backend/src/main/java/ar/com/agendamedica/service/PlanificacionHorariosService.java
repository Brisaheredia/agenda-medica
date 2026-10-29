package ar.com.agendamedica.service;

import ar.com.agendamedica.time.TiempoAgenda;
import ar.com.agendamedica.domain.HorarioConsultorio;
import ar.com.agendamedica.domain.entity.ConfiguracionAgenda;
import ar.com.agendamedica.domain.entity.ExcepcionAgenda;
import ar.com.agendamedica.domain.entity.Franja;
import ar.com.agendamedica.domain.entity.Profesional;
import ar.com.agendamedica.domain.enums.TipoExcepcionAgenda;
import ar.com.agendamedica.dto.GenerarFranjasRequest;
import ar.com.agendamedica.dto.GenerarFranjasResponse;
import ar.com.agendamedica.exception.BadRequestException;
import ar.com.agendamedica.exception.ConflictException;
import ar.com.agendamedica.exception.ResourceNotFoundException;
import ar.com.agendamedica.repository.ExcepcionAgendaRepository;
import ar.com.agendamedica.repository.FranjaRepository;
import ar.com.agendamedica.repository.ProfesionalRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.stream.Collectors;

@Service
public class PlanificacionHorariosService {
    private final FranjaRepository franjaRepository;
    private final ProfesionalRepository profesionalRepository;
    private final ExcepcionAgendaRepository excepcionRepository;
    private final AuditoriaService auditoriaService;
    private final ConfiguracionAgendaService configuracionService;

    public PlanificacionHorariosService(FranjaRepository franjaRepository,
                                       ProfesionalRepository profesionalRepository,
                                       ExcepcionAgendaRepository excepcionRepository,
                                       AuditoriaService auditoriaService,
                                       ConfiguracionAgendaService configuracionService) {
        this.franjaRepository = franjaRepository;
        this.profesionalRepository = profesionalRepository;
        this.excepcionRepository = excepcionRepository;
        this.auditoriaService = auditoriaService;
        this.configuracionService = configuracionService;
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public GenerarFranjasResponse generarFranjas(GenerarFranjasRequest request) {
        Profesional profesional = bloquearProfesional(request.profesionalId());
        if (request.hasta().isBefore(request.desde())) throw new BadRequestException("La fecha hasta no puede ser anterior a desde");
        if (!java.time.YearMonth.from(request.desde()).equals(java.time.YearMonth.from(request.hasta()))) {
            throw new BadRequestException("Habilitá un mes por vez");
        }
        if (request.hasta().isAfter(configuracionService.ultimoDiaHabilitable())) {
            throw new BadRequestException("Solo se puede habilitar el mes actual y los tres meses siguientes");
        }
        var cierres = excepcionRepository.findByProfesionalIdAndFechaBetweenOrderByFechaAsc(profesional.getId(), request.desde(), request.hasta());
        var obsoletas = franjaRepository.findLibresSinHistorial(profesional.getId(), request.desde().atStartOfDay(),
                        request.hasta().plusDays(1).atStartOfDay().minusNanos(1)).stream()
                .filter(f -> f.getInicio().isAfter(TiempoAgenda.ahora()) && "PLANTILLA".equals(f.getOrigen())
                        && !HorarioConsultorio.esFranjaHabitual(f)).toList();
        franjaRepository.deleteAll(obsoletas);
        franjaRepository.flush();

        // Las franjas generadas por el sistema no cruzan de un día a otro.
        // Se consulta una sola vez el mes y se reutiliza el conjunto de cada día.
        // Así no repetimos SELECT por cada horario ni consultas exists por franja.
        var franjasPorDia = franjaRepository.findPorRango(
                        profesional.getId(),
                        request.desde().atStartOfDay(),
                        request.hasta().plusDays(1).atStartOfDay())
                .stream().collect(Collectors.groupingBy(
                        f -> f.getInicio().toLocalDate(),
                        HashMap::new,
                        Collectors.toCollection(ArrayList::new)));

        int creadas = 0, existentes = 0, omitidas = 0;
        for (LocalDate fecha = request.desde(); !fecha.isAfter(request.hasta()); fecha = fecha.plusDays(1)) {
            if (!HorarioConsultorio.atiende(fecha)) continue;
            var limite = fecha.atTime(HorarioConsultorio.CIERRE);
            var franjasExistentesDelDia = franjasPorDia.computeIfAbsent(fecha, d -> new ArrayList<>());
            for (var inicio = fecha.atTime(HorarioConsultorio.APERTURA);
                 !inicio.plusMinutes(ConfiguracionAgenda.DURACION_TURNO_MIN).isAfter(limite);
                 inicio = inicio.plusMinutes(ConfiguracionAgenda.DURACION_TURNO_MIN)) {
                var fin = inicio.plusMinutes(ConfiguracionAgenda.DURACION_TURNO_MIN);
                if (!inicio.isAfter(TiempoAgenda.ahora())) continue;
                final var inicioFranja = inicio;
                var iguales = franjasExistentesDelDia.stream()
                        .anyMatch(f -> f.getInicio().equals(inicioFranja) && f.getFin().equals(fin));
                if (estaCerrada(cierres, fecha, inicio.toLocalTime(), fin.toLocalTime())) {
                    omitidas++;
                } else if (iguales) {
                    existentes++;
                } else if (franjasExistentesDelDia.stream().anyMatch(f ->
                        f.getInicio().isBefore(fin) && f.getFin().isAfter(inicioFranja))) {
                    throw new ConflictException("Hay horarios incompatibles con turnos o historial. Se conservaron todos los datos; gestioná esos horarios antes de habilitar el mes");
                } else {
                    Franja franja = new Franja();
                    franja.setProfesional(profesional);
                    franja.setInicio(inicio);
                    franja.setFin(fin);
                    franja = franjaRepository.save(franja);
                    franjasExistentesDelDia.add(franja);
                    creadas++;
                }
            }
        }
        auditoriaService.registrar("GENERAR_FRANJAS", "Profesional", profesional.getId(),
                "desde=" + request.desde() + ", hasta=" + request.hasta() + ", creadas=" + creadas
                        + ", obsoletasSinHistorial=" + obsoletas.size());
        return new GenerarFranjasResponse(creadas, existentes, omitidas);
    }

    private boolean estaCerrada(List<ExcepcionAgenda> excepciones,
                                LocalDate fecha,
                                LocalTime inicio,
                                LocalTime fin) {
        return excepciones.stream()
                .filter(e -> e.getTipo() == TipoExcepcionAgenda.CIERRE)
                .filter(e -> e.getFecha().equals(fecha))
                .anyMatch(e -> {
                    if (e.getHoraInicio() == null || e.getHoraFin() == null) {
                        return true;
                    }
                    return inicio.isBefore(e.getHoraFin()) && fin.isAfter(e.getHoraInicio());
                });
    }

    private Profesional bloquearProfesional(Long id) {
        return profesionalRepository.findByIdForUpdate(id).filter(Profesional::isActivo)
                .orElseThrow(() -> new ResourceNotFoundException("Profesional activo no encontrado: " + id));
    }
}
