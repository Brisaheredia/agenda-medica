import { useEffect, useState } from "react";
import { detalleError } from "../api";
import { etiquetas, fechaLarga, Franja, hora, hoy, moverDia } from "../types";

type Props = {
  profesionalId: number | undefined;
  api: <T>(path: string, options?: RequestInit) => Promise<T>;
  revision?: number;
};

const dias = [
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

export function CalendarioSemanalDisponibilidad({ profesionalId, api, revision = 0 }: Props) {
  const [inicioSemana, setInicioSemana] = useState(() => lunesDe(hoy()));
  const [franjasSemana, setFranjasSemana] = useState<Franja[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!profesionalId) {
      setFranjasSemana([]);
      return;
    }
    let vigente = true;
    setCargando(true);
    setError("");
    Promise.all(
      Array.from({ length: 7 }, (_, indice) =>
        api<Franja[]>(
          `/api/agenda?profesionalId=${profesionalId}&fecha=${moverDia(inicioSemana, indice)}`,
        ),
      ),
    )
      .then((diasConsultados) => {
        if (vigente) setFranjasSemana(diasConsultados.flat());
      })
      .catch((e) => {
        if (vigente) setError(detalleError(e));
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });
    return () => {
      vigente = false;
    };
  }, [api, inicioSemana, profesionalId, revision]);

  const fechas = Array.from({ length: 7 }, (_, indice) =>
    moverDia(inicioSemana, indice),
  );
  const corto = new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "short",
  });
  const largo = new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const titulo = `${corto.format(new Date(`${fechas[0]}T12:00:00`))} – ${largo.format(new Date(`${fechas[6]}T12:00:00`))}`;

  return (
    <section
      className="card availability-calendar"
      aria-labelledby="availability-week-title"
      aria-busy={cargando}
    >
      <div className="availability-calendar-heading">
        <div>
          <h2 id="availability-week-title">Semana de atención</h2>
          <p className="muted">
            Consultá qué horarios están disponibles, reservados o bloqueados.
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
      <div className="availability-legend" aria-label="Estados de horarios">
        <span>
          <i className="availability-dot available" /> Disponible
        </span>
        <span>
          <i className="availability-dot unavailable" /> No disponible
        </span>
      </div>
      <div className="availability-week-grid">
        {fechas.map((fecha, indice) => {
          const franjasDia = franjasSemana
            .filter((franja) => franja.inicio.startsWith(fecha))
            .sort((a, b) => a.inicio.localeCompare(b.inicio));
          return (
            <section
              className={`availability-day ${fecha === hoy() ? "is-today" : ""}`}
              key={fecha}
              aria-label={fechaLarga(fecha)}
            >
              <header>
                <span>{dias[indice]}</span>
                <strong>
                  {new Intl.DateTimeFormat("es-AR", { day: "numeric" }).format(
                    new Date(`${fecha}T12:00:00`),
                  )}
                </strong>
              </header>
              {cargando ? (
                <p className="availability-empty">Cargando…</p>
              ) : franjasDia.length === 0 ? (
                <p className="availability-empty">Sin horarios</p>
              ) : (
                <ul>
                  {franjasDia.map((franja) => {
                    const disponible = franja.estado === "LIBRE";
                    return (
                      <li
                        key={franja.id}
                        className={
                          disponible ? "slot-available" : "slot-unavailable"
                        }
                      >
                        <span>
                          {hora(franja.inicio)}–{hora(franja.fin)}
                        </span>
                        <small>
                          {disponible
                            ? "Disponible"
                            : franja.estado === "BLOQUEADA"
                              ? "Bloqueado"
                              : (etiquetas[franja.estado] ?? "Ocupado")}
                        </small>
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
