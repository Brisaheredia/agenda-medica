package ar.com.agendamedica.dto;

import ar.com.agendamedica.domain.entity.PlantillaDisponibilidad;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;

public record PlantillaDisponibilidadResponse(
        Long id,
        Long profesionalId,
        DayOfWeek diaSemana,
        LocalTime horaInicio,
        LocalTime horaFin,
        Integer duracionMin,
        LocalDate vigenciaDesde,
        LocalDate vigenciaHasta
) {
    public static PlantillaDisponibilidadResponse from(PlantillaDisponibilidad p) {
        return new PlantillaDisponibilidadResponse(
                p.getId(), p.getProfesional().getId(), p.getDiaSemana(),
                p.getHoraInicio(), p.getHoraFin(), p.getDuracionMin(),
                p.getVigenciaDesde(), p.getVigenciaHasta()
        );
    }
}
