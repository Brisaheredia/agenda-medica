import { useEffect, useState } from "react";
import type { Api } from "../api";
import { abortado, detalleError } from "../api";
import type { ExcepcionAgenda, Franja, Turno } from "../types";
import { fechaLarga, hora, hoy, moverDia, lunesDe } from "../types";
import { estadoVisual, franjasParaMostrar } from "../lib/agendaVisual";
import { LeyendaAgenda } from "./LeyendaAgenda";
import { BadgeReprogramacion } from "./BadgeReprogramacion";

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

export function CalendarioSemanalAgenda({
  profesionalId,
  api,
  irAlDia,
  revision = 0,
  verContactos = true,
}: {
  profesionalId: number | undefined;
  api: Api;
  irAlDia?: (fecha: string) => void;
  revision?: number;
  verContactos?: boolean;
}) {
  const [inicioSemana, setInicioSemana] = useState(() => lunesDe(hoy()));
  const [agenda, setAgenda] = useState<Record<string, DiaAgenda>>({});
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [excepciones, setExcepciones] = useState<ExcepcionAgenda[]>([]);
  const fechas = Array.from({ length: 7 }, (_, index) =>
    moverDia(inicioSemana, index),
  );

  useEffect(() => {
    if (!profesionalId) return;
    const controller = new AbortController();
    setCargando(true);
    setError("");
    Promise.all([
      api<ExcepcionAgenda[]>(`/api/agenda/excepciones?profesionalId=${profesionalId}&desde=${fechas[0]}&hasta=${fechas[6]}`, { signal: controller.signal }),
      Promise.all(
        fechas.map(async (fecha) => {
          const query = `profesionalId=${profesionalId}&fecha=${fecha}`;
          const [franjas, turnos] = await Promise.all([
            api<Franja[]>(`/api/agenda?${query}`, { signal: controller.signal }),
            api<Turno[]>(`/api/turnos?${query}`, { signal: controller.signal }),
          ]);
          return [fecha, { franjas: franjasParaMostrar(franjas, turnos), turnos }] as const;
        }),
      ),
    ])
      .then(([cierres, dias]) => {
        setAgenda(Object.fromEntries(dias));
        setExcepciones(cierres);
      })
      .catch((e) => {
        if (!abortado(e)) {
          setError(detalleError(e));
          setAgenda({});
          setExcepciones([]);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setCargando(false);
      });
    return () => controller.abort();
  }, [api, profesionalId, inicioSemana, revision]);

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
            Turnos y disponibilidad de toda la semana.
            {irAlDia && " Elegí un día para gestionarlo en detalle."}
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
      <LeyendaAgenda />
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
          const cierres = excepciones.filter((e) => e.fecha === fecha && e.tipo === "CIERRE");
          const estados = filas.map(({ franja, turno }) => estadoVisual(franja, turno, excepciones).clase);
          const colorDia = cierres.length || estados.includes("consultorio") ? "consultorio"
            : estados.includes("libre") ? "libre" : estados.includes("paciente") ? "paciente"
            : estados.includes("ocupado") ? "ocupado" : "neutro";
          return (
            <section
              className={`availability-day day-${colorDia} ${index === 6 ? "is-sunday" : ""} ${fecha === hoy() ? "is-today" : ""}`}
              key={fecha}
            >
              <button
                className="agenda-week-day"
                onClick={() => irAlDia?.(fecha)}
                disabled={!irAlDia}
              >
                <span>{nombresDias[index]}</span>
                <strong>
                  {Number(fecha.slice(8, 10))}
                </strong>
              </button>
              {!cargando && cierres.map((cierre) => <p className="closure-note" key={cierre.id}>
                {cierre.horaInicio ? `Cierre ${cierre.horaInicio.slice(0, 5)}–${cierre.horaFin?.slice(0, 5) ?? "fin del día"}` : "Día cerrado"}
                {cierre.motivo && <span>{cierre.motivo}</span>}
              </p>)}
              {!cargando && verContactos && colorDia === "consultorio" && <a className="reprogram-link" href="/reprogramaciones">Ver reprogramaciones</a>}
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
                      const visual = estadoVisual(franja, turno, excepciones);
                      const inicio = turno?.inicio ?? franja?.inicio ?? "";
                      const fin = turno?.fin ?? franja?.fin;
                      return (
                        <li
                          className={`agenda-week-slot status-${visual.clase}`}
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
                            {turno?.paciente ?? visual.etiqueta}
                          </span>
                          {turno && <small>{visual.etiqueta}</small>}
                          {turno && <BadgeReprogramacion turno={turno} />}
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
