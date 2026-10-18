package ar.com.agendamedica.time;

import org.junit.jupiter.api.Test;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.TimeZone;
import static org.junit.jupiter.api.Assertions.*;

class TiempoAgendaTest {
    @Test
    void madrugadaUtcTodaviaPerteneceAlDiaAnteriorEnBuenosAires() {
        var reloj = Clock.fixed(Instant.parse("2026-10-18T01:30:00Z"), ZoneOffset.UTC);
        assertEquals(LocalDateTime.of(2026, 10, 17, 22, 30), TiempoAgenda.ahora(reloj));
    }

    @Test
    void diaCambiaALasTresUtc() {
        var reloj = Clock.fixed(Instant.parse("2026-10-18T03:00:00Z"), ZoneOffset.UTC);
        assertEquals(LocalDateTime.of(2026, 10, 18, 0, 0), TiempoAgenda.ahora(reloj));
    }

    @Test
    void zonaDelServidorNoModificaLaHoraDelConsultorio() {
        var original = TimeZone.getDefault();
        try {
            TimeZone.setDefault(TimeZone.getTimeZone("Asia/Tokyo"));
            var antes = LocalDateTime.ofInstant(Instant.now(), TiempoAgenda.ZONA);
            var actual = TiempoAgenda.ahora();
            var despues = LocalDateTime.ofInstant(Instant.now(), TiempoAgenda.ZONA);
            assertFalse(actual.isBefore(antes));
            assertFalse(actual.isAfter(despues));
            assertTrue(TiempoAgenda.hoy().equals(antes.toLocalDate()) || TiempoAgenda.hoy().equals(despues.toLocalDate()));
        } finally {
            TimeZone.setDefault(original);
        }
    }
}
