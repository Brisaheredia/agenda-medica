package ar.com.agendamedica.domain;

import ar.com.agendamedica.domain.entity.ConfiguracionAgenda;
import ar.com.agendamedica.domain.entity.Franja;
import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

// Horario habitual confirmado por el consultorio; no es configurable en este MVP.
public final class HorarioConsultorio {
    public static final LocalTime APERTURA = LocalTime.of(8, 0);
    public static final LocalTime CIERRE = LocalTime.of(20, 0);

    private HorarioConsultorio() {}

    public static boolean atiende(LocalDate fecha) {
        return fecha.getDayOfWeek() != DayOfWeek.SATURDAY
                && fecha.getDayOfWeek() != DayOfWeek.SUNDAY;
    }

    public static boolean esFranjaHabitual(Franja franja) {
        LocalDateTime inicio = franja.getInicio();
        LocalDateTime fin = franja.getFin();
        if (!atiende(inicio.toLocalDate()) || !fin.toLocalDate().equals(inicio.toLocalDate())) return false;
        if (inicio.toLocalTime().isBefore(APERTURA) || fin.toLocalTime().isAfter(CIERRE)) return false;
        if (!Duration.between(inicio, fin).equals(Duration.ofMinutes(ConfiguracionAgenda.DURACION_TURNO_MIN))) return false;
        long minutosDesdeApertura = Duration.between(APERTURA, inicio.toLocalTime()).toMinutes();
        return minutosDesdeApertura % ConfiguracionAgenda.DURACION_TURNO_MIN == 0;
    }

    // Una apertura excepcional se mantiene como excepción explícita, no como cambio del horario base.
    public static boolean esReservablePorHorario(Franja franja) {
        return "EXCEPCION_APERTURA".equals(franja.getOrigen()) || esFranjaHabitual(franja);
    }
}
