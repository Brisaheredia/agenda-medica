package ar.com.agendamedica.dto;

import java.time.LocalDate;
import java.util.List;

/** Agenda de un día dentro de una consulta acotada por fechas (RF-11). */
public record AgendaDiaRangoResponse(
        LocalDate fecha,
        List<FranjaResponse> franjas,
        List<TurnoResponse> turnos,
        List<ExcepcionAgendaResumen> excepciones
) {}
