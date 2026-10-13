import { useState } from "react";
import { detalleError } from "../api";
import { hoy } from "../types";
import { Icon } from "../components/Icon";

type Resultado = {
  franjasCreadas: number;
  franjasBloqueadas: number;
  turnosAfectados: number[];
};
type Props = {
  api: <T>(path: string, options?: RequestInit) => Promise<T>;
  profesionalId?: number;
  esAdmin: boolean;
};

export function BloqueosPage({ api, profesionalId, esAdmin }: Props) {
  const [fecha, setFecha] = useState(hoy());
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFin, setHoraFin] = useState("");
  const [motivo, setMotivo] = useState("");
  const [esApertura, setEsApertura] = useState(false);
  const [duracionMin, setDuracionMin] = useState(30);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [resultado, setResultado] = useState<Resultado | null>(null);

  async function guardar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profesionalId || busy) return;
    setBusy(true);
    setError("");
    setResultado(null);
    const body = {
      profesionalId,
      fecha,
      horaInicio: horaInicio || null,
      horaFin: horaFin || null,
      motivo: motivo.trim() || null,
    };
    try {
      const path = esApertura
        ? "/api/agenda/excepciones"
        : "/api/agenda/bloqueos";
      const payload = esApertura
        ? { ...body, tipo: "APERTURA", duracionMin }
        : body;
      const response = await api<Resultado>(path, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setResultado(response);
      setMotivo("");
    } catch (e) {
      setError(detalleError(e));
    } finally {
      setBusy(false);
    }
  }

  if (!esAdmin)
    return (
      <section>
        <div className="page-heading">
          <div>
            <p className="eyebrow">AGENDA</p>
            <h1>Bloqueos y excepciones</h1>
          </div>
        </div>
        <div className="alert error" role="alert">
          El backend permite crear bloqueos y excepciones únicamente a usuarios
          con rol ADMIN.
        </div>
      </section>
    );

  return (
    <section aria-labelledby="blocks-title">
      <div className="page-heading">
        <div>
          <p className="eyebrow">CONFIGURACIÓN DEL CONSULTORIO</p>
          <h1 id="blocks-title">Bloqueos y excepciones</h1>
          <p className="muted">
            Cerrá horarios puntuales o agregá una apertura extraordinaria.
          </p>
        </div>
        <span className="page-label">
          <Icon name="block" size={16} />
          Agenda del profesional
        </span>
      </div>
      {error && (
        <div className="alert error" role="alert">
          {error}
        </div>
      )}
      {resultado && (
        <div className="alert success" role="status">
          {esApertura
            ? `Se agregaron ${resultado.franjasCreadas} franjas de atención.`
            : `Se bloquearon ${resultado.franjasBloqueadas} franjas.`}
          {resultado.turnosAfectados.length > 0 && (
            <span>
              {" "}
              Turnos activos afectados: {resultado.turnosAfectados.join(", ")}.
            </span>
          )}
        </div>
      )}
      <div className="card block-card">
        <form className="stack" onSubmit={guardar}>
          <fieldset disabled={busy || !profesionalId}>
            <div
              className="block-mode"
              role="group"
              aria-label="Tipo de cambio"
            >
              <button
                type="button"
                className={!esApertura ? "filter active" : "filter"}
                aria-pressed={!esApertura}
                onClick={() => {
                  setEsApertura(false);
                  setResultado(null);
                }}
              >
                Bloquear horarios
              </button>
              <button
                type="button"
                className={esApertura ? "filter active" : "filter"}
                aria-pressed={esApertura}
                onClick={() => {
                  setEsApertura(true);
                  setResultado(null);
                  if (!horaInicio) {
                    setHoraInicio("09:00");
                    setHoraFin("12:00");
                  }
                }}
              >
                Apertura extraordinaria
              </button>
            </div>
            <p className="muted block-help">
              {esApertura
                ? "La apertura crea franjas adicionales para esta fecha, con la duración de turno indicada."
                : "El bloqueo cierra la fecha completa o solo el rango horario elegido. Los turnos reservados se informan para que puedas gestionarlos."}
            </p>
            <div className="availability-fields">
              <label>
                Fecha
                <input
                  type="date"
                  min={hoy()}
                  required
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                />
              </label>
              <label>
                Motivo <span className="optional">(opcional)</span>
                <input
                  maxLength={255}
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Ej. feriado, capacitación"
                />
              </label>
            </div>
            <label className="check-field">
              <input
                type="checkbox"
                checked={!horaInicio && !horaFin}
                onChange={(e) => {
                  if (e.target.checked) {
                    setHoraInicio("");
                    setHoraFin("");
                  } else {
                    setHoraInicio("09:00");
                    setHoraFin("12:00");
                  }
                }}
              />
              {esApertura
                ? "Usar horario del día completo"
                : "Bloquear el día completo"}
            </label>
            {!!horaInicio && (
              <div className="availability-fields">
                <label>
                  Desde
                  <input
                    type="time"
                    required
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                  />
                </label>
                <label>
                  Hasta
                  <input
                    type="time"
                    required
                    min={horaInicio}
                    value={horaFin}
                    onChange={(e) => setHoraFin(e.target.value)}
                  />
                </label>
                {esApertura && (
                  <label>
                    Duración de cada turno (minutos)
                    <input
                      type="number"
                      min="5"
                      step="5"
                      required
                      value={duracionMin}
                      onChange={(e) => setDuracionMin(Number(e.target.value))}
                    />
                  </label>
                )}
              </div>
            )}
            {esApertura && !horaInicio && (
              <p className="alert error">
                Para una apertura extraordinaria, indicá el horario y la
                duración.
              </p>
            )}
            <button
              className="primary"
              disabled={!profesionalId || busy || (esApertura && !horaInicio)}
            >
              {busy
                ? "Guardando…"
                : esApertura
                  ? "Crear apertura"
                  : "Crear bloqueo"}
            </button>
          </fieldset>
        </form>
      </div>
    </section>
  );
}
