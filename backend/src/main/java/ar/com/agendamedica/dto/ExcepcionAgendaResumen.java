package ar.com.agendamedica.dto;

import ar.com.agendamedica.domain.entity.ExcepcionAgenda;
import ar.com.agendamedica.domain.enums.TipoExcepcionAgenda;
import java.time.LocalDate;
import java.time.LocalTime;

public record ExcepcionAgendaResumen(Long id, Long profesionalId, LocalDate fecha,
                                    LocalTime horaInicio, LocalTime horaFin,
                                    TipoExcepcionAgenda tipo, String motivo) {
    public static ExcepcionAgendaResumen from(ExcepcionAgenda excepcion) {
        return new ExcepcionAgendaResumen(excepcion.getId(), excepcion.getProfesional().getId(),
                excepcion.getFecha(), excepcion.getHoraInicio(), excepcion.getHoraFin(),
                excepcion.getTipo(), excepcion.getMotivo());
    }
}
