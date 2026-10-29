package ar.com.agendamedica.service;

import ar.com.agendamedica.domain.HorarioConsultorio;
import ar.com.agendamedica.domain.enums.EstadoFranja;
import ar.com.agendamedica.dto.AgendaDiaRangoResponse;
import ar.com.agendamedica.dto.ExcepcionAgendaResumen;
import ar.com.agendamedica.dto.FranjaResponse;
import ar.com.agendamedica.dto.TurnoResponse;
import ar.com.agendamedica.exception.BadRequestException;
import ar.com.agendamedica.exception.ResourceNotFoundException;
import ar.com.agendamedica.repository.ExcepcionAgendaRepository;
import ar.com.agendamedica.repository.FranjaRepository;
import ar.com.agendamedica.repository.ProfesionalRepository;
import ar.com.agendamedica.repository.TurnoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class AgendaRangoService {
    private static final int MAX_DIAS = 90;

    private final ProfesionalRepository profesionales;
    private final FranjaRepository franjas;
    private final TurnoRepository turnos;
    private final ExcepcionAgendaRepository excepciones;

    public AgendaRangoService(ProfesionalRepository profesionales, FranjaRepository franjas,
                              TurnoRepository turnos, ExcepcionAgendaRepository excepciones) {
        this.profesionales = profesionales;
        this.franjas = franjas;
        this.turnos = turnos;
        this.excepciones = excepciones;
    }

    public List<AgendaDiaRangoResponse> consultar(Long profesionalId, LocalDate desde, LocalDate hasta,
                                                   boolean ocultarMotivos) {
        if (desde == null || hasta == null) {
            throw new BadRequestException("Debés indicar ambas fechas");
        }
        long dias = ChronoUnit.DAYS.between(desde, hasta) + 1;
        if (dias <= 0) throw new BadRequestException("La fecha hasta no puede ser anterior a desde");
        if (dias > MAX_DIAS) throw new BadRequestException("El rango no puede superar 90 días");
        if (profesionalId == null || !profesionales.existsById(profesionalId)) {
            throw new ResourceNotFoundException("Profesional no encontrado");
        }

        // Tres consultas por período (más existencia del profesional), sin una consulta por día.
        var inicio = desde.atStartOfDay();
        var finExclusivo = hasta.plusDays(1).atStartOfDay();
        Map<LocalDate, List<FranjaResponse>> franjasPorDia = franjas
                .findPorRango(profesionalId, inicio, finExclusivo).stream()
                .filter(f -> f.getEstado() != EstadoFranja.LIBRE || HorarioConsultorio.esReservablePorHorario(f))
                .map(FranjaResponse::from)
                .collect(Collectors.groupingBy(f -> f.inicio().toLocalDate()));
        Map<LocalDate, List<TurnoResponse>> turnosPorDia = turnos
                .findInicioEnRango(profesionalId, inicio, finExclusivo).stream()
                .map(TurnoResponse::from)
                .map(t -> ocultarMotivos ? t.sinMotivos() : t)
                .collect(Collectors.groupingBy(t -> t.inicio().toLocalDate()));
        Map<LocalDate, List<ExcepcionAgendaResumen>> excepcionesPorDia = excepciones
                .findByProfesionalIdAndFechaBetweenOrderByFechaAsc(profesionalId, desde, hasta)
                .stream().map(ExcepcionAgendaResumen::from)
                .collect(Collectors.groupingBy(ExcepcionAgendaResumen::fecha));

        // Se devuelven también los días sin horarios para que el rango sea completo.
        return desde.datesUntil(finExclusivo.toLocalDate())
                .map(fecha -> new AgendaDiaRangoResponse(
                        fecha,
                        franjasPorDia.getOrDefault(fecha, List.of()),
                        turnosPorDia.getOrDefault(fecha, List.of()),
                        excepcionesPorDia.getOrDefault(fecha, List.of())))
                .toList();
    }
}
