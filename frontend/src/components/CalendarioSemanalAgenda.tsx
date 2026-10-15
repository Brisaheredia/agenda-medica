import { useEffect, useState } from "react";
import type { Api } from "../api";
import { abortado, detalleError } from "../api";
import type { Franja, Turno } from "../types";
import { etiquetas, fechaLarga, hora, hoy, moverDia } from "../types";

type DiaAgenda = { franjas: Franja[]; turnos: Turno[] };

const nombresDias = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

function lunesDe(fecha: string) {
  const date = new Date(`${fecha}T12:00:00`);
  date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function CalendarioSemanalAgenda({
  profesionalId,
  api,
  irAlDia,
}: {
  profesionalId: number | undefined;
  api: Api;
  irAlDia: (fecha: string) => void;
}) {
  const [inicioSemana, setInicioSemana] = useState(() => lunesDe(hoy()));
  const [agenda, setAgenda] = useState<Record<string, DiaAgenda>>({});
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const fechas = Array.from({ length: 7 }, (_, index) =>
    moverDia(inicioSemana, index),
  );

  useEffect(() => {
    if (!profesionalId) return;
    const controller = new AbortController();
    setCargando(true);
    setError("");
    Promise.all(
      fechas.map(async (fecha) => {
        const query = `profesionalId=${profesionalId}&fecha=${fecha}`;
        const [franjas, turnos] = await Promise.all([
          api<Franja[]>(`/api/agenda?${query}`, { signal: controller.signal }),
          api<Turno[]>(`/api/turnos?${query}`, { signal: controller.signal }),
        ]);
        return [fecha, { franjas, turnos }] as const;
      }),
    )
      .then((dias) => setAgenda(Object.fromEntries(dias)))
      .catch((e) => {
        if (!abortado(e)) setError(detalleError(e));
      })
      .finally(() => {
        if (!controller.signal.aborted) setCargando(false);
      });
    return () => controller.abort();
  }, [api, profesionalId, inicioSemana]);

  const titulo = `${fechaLarga(fechas[0])} – ${fechaLarga(fechas[6])}`;
  return (
    <section
      className="card availability-calendar agenda-week"
      aria-label="Agenda semanal"
      aria-busy={cargando}
    >
      <div className="availability-calendar-heading">
        <div>
          <h2>Agenda semanal</h2>
          <p className="muted">
            Turnos y disponibilidad de toda la semana. Elegí un día para
            gestionarlo en detalle.
          </p>
        </div>
        <div className="availability-week-controls">
          <button
            className="secondary small"
            onClick={() => setInicioSemana(moverDia(inicioSemana, -7))}
            aria-label="Semana anterior"
          >
            ‹
          </button>
          <strong>{titulo}</strong>
          <button
            className="secondary small"
            onClick={() => setInicioSemana(moverDia(inicioSemana, 7))}
            aria-label="Semana siguiente"
          >
            ›
          </button>
          <button
            className="secondary small"
            onClick={() => setInicioSemana(lunesDe(hoy()))}
          >
            Esta semana
          </button>
        </div>
      </div>
      {error && (
        <div className="alert error" role="alert">
          {error}
        </div>
      )}
      <div className="availability-week-grid">
        {fechas.map((fecha, index) => {
          const dia = agenda[fecha];
          const turnosPorFranja = new Map(
            dia?.turnos
              .filter((turno) => turno.estado !== "CANCELADO")
              .map((turno) => [turno.franjaId, turno]),
          );
          const filas: { franja?: Franja; turno?: Turno }[] = (
            dia?.franjas ?? []
          ).map((franja) => ({
            franja,
            turno: turnosPorFranja.get(franja.id),
          }));
          (dia?.turnos ?? [])
            .filter(
              (turno) =>
                turno.estado === "CANCELADO" ||
                !dia?.franjas.some((franja) => franja.id === turno.franjaId),
            )
            .forEach((turno) => filas.push({ turno }));
          return (
            <section
              className={`availability-day ${fecha === hoy() ? "is-today" : ""}`}
              key={fecha}
            >
              <button
                className="agenda-week-day"
                onClick={() => irAlDia(fecha)}
              >
                <span>{nombresDias[index]}</span>
                <strong>
                  {new Intl.DateTimeFormat("es-AR", { day: "numeric" }).format(
                    new Date(`${fecha}T12:00:00`),
                  )}
                </strong>
              </button>
              {cargando ? (
                <p className="availability-empty">Cargando…</p>
              ) : !filas.length ? (
                <p className="availability-empty">Sin horarios</p>
              ) : (
                <ul>
                  {filas
                    .sort((a, b) =>
                      (a.turno?.inicio ?? a.franja?.inicio ?? "").localeCompare(
                        b.turno?.inicio ?? b.franja?.inicio ?? "",
                      ),
                    )
                    .map(({ franja, turno }, slotIndex) => {
                      const estado = turno?.estado ?? franja?.estado ?? "LIBRE";
                      const inicio = turno?.inicio ?? franja?.inicio ?? "";
                      const fin = turno?.fin ?? franja?.fin;
                      return (
                        <li
                          className={`agenda-week-slot slot-${estado.toLowerCase()}`}
                          key={
                            turno
                              ? `t-${turno.id}`
                              : `f-${franja?.id}-${slotIndex}`
                          }
                        >
                          <strong>
                            {hora(inicio)}
                            {fin ? `–${hora(fin)}` : ""}
                          </strong>
                          <span>
                            {turno?.paciente ?? etiquetas[estado] ?? estado}
                          </span>
                        </li>
                      );
                    })}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </section>
  );
}
