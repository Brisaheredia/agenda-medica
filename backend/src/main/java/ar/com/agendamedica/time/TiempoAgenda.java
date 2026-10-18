package ar.com.agendamedica.time;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;

/** Fecha y hora civil del consultorio, independientes de la zona de la JVM. */
public final class TiempoAgenda {
    public static final ZoneId ZONA = ZoneId.of("America/Argentina/Buenos_Aires");

    private TiempoAgenda() {}

    public static LocalDateTime ahora() {
        return ahora(Clock.systemUTC());
    }

    public static LocalDate hoy() {
        return ahora().toLocalDate();
    }

    public static LocalDateTime ahora(Clock reloj) {
        return LocalDateTime.ofInstant(reloj.instant(), ZONA);
    }
}
