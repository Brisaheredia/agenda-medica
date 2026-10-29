import { useEffect, useState } from "react";
import type { Api } from "../api";
import { abortado, detalleError } from "../api";
import type { DiaAgendaRango } from "../types";
import { fechaLarga, hoy, moverDia, lunesDe } from "../types";
import { LeyendaAgenda } from "./LeyendaAgenda";
import { DiaCalendarioAgenda } from "./DiaCalendarioAgenda";

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
  const [agenda, setAgenda] = useState<Record<string, DiaAgendaRango>>({});
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
    api<DiaAgendaRango[]>(
      `/api/agenda/rango?profesionalId=${profesionalId}&desde=${fechas[0]}&hasta=${fechas[6]}`,
      { signal: controller.signal },
    )
      .then((dias) => {
        if (controller.signal.aborted) return;
        setAgenda(Object.fromEntries(dias.map((dia) => [dia.fecha, dia])));
      })
      .catch((e) => {
        if (!abortado(e)) {
          setError(detalleError(e));
          setAgenda({});
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
        {fechas.map((fecha) => (
          <DiaCalendarioAgenda
            key={fecha}
            fecha={fecha}
            dia={agenda[fecha]}
            irAlDia={irAlDia}
            verContactos={verContactos}
            cargando={cargando}
          />
        ))}
      </div>
    </section>
  );
}
