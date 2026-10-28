import { useState } from "react";
import { detalleError } from "../api";
import { hoy } from "../types";
import { Icon } from "../components/Icon";
import { FechaInput } from "../components/FechaInput";

type TurnoEnBloqueo = {
  turnoId: number;
  paciente: string;
  horaInicio: string;
  horaFin: string;
};
type PrevisualizacionBloqueo = {
  cantidadTurnosAfectados: number;
  turnosAfectados: TurnoEnBloqueo[];
};
type Resultado = {
  franjasCreadas: number;
  franjasBloqueadas: number;
  turnosAfectados: number[];
};
type Props = {
  api: <T>(path: string, options?: RequestInit) => Promise<T>;
  profesionalId?: number;
  puedeGestionar: boolean;
  onGuardado?: () => Promise<void>;
};

export function BloqueosPage({ api, profesionalId, puedeGestionar, onGuardado }: Props) {
  const [fecha, setFecha] = useState(hoy());
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFin, setHoraFin] = useState("");
  const [motivo, setMotivo] = useState("");
  const [esApertura, setEsApertura] = useState(false);
  const [esFeriado, setEsFeriado] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [previsualizacion, setPrevisualizacion] = useState<PrevisualizacionBloqueo | null>(null);

  async function guardar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!puedeGestionar || !profesionalId || busy) return;
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
      if (!esApertura && !previsualizacion) {
        // Primera etapa: no modifica la agenda.
        const previa = await api<PrevisualizacionBloqueo>(
          "/api/agenda/bloqueos/previsualizacion",
          { method: "POST", body: JSON.stringify(body) },
        );
        setPrevisualizacion(previa);
        return;
      }

      const path = esApertura ? "/api/agenda/excepciones" : "/api/agenda/bloqueos";
      const payload = esApertura
        ? { ...body, tipo: "APERTURA" }
        : { ...body, turnosAfectadosEsperados: previsualizacion!.turnosAfectados.map((t) => t.turnoId) };
      const response = await api<Resultado>(path, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setResultado(response);
      setPrevisualizacion(null);
      setMotivo("");
      await onGuardado?.();
    } catch (e) {
      setPrevisualizacion(null); // Un conflicto requiere consultar nuevamente los afectados.
      setError(detalleError(e));
    } finally {
      setBusy(false);
    }
  }

  if (!puedeGestionar)
    return (
      <section>
        <div className="page-heading">
          <div>
            <p className="eyebrow">AGENDA</p>
            <h1>Bloqueos y excepciones</h1>
          </div>
        </div>
        <div className="alert error" role="alert">
          Tu cuenta no tiene permiso para modificar los horarios de atención.
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
              {resultado.turnosAfectados.length} turnos necesitan reprogramación. <a href="/reprogramaciones">Ver pacientes y datos de contacto</a>.
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
                  setEsFeriado(false);
                  setResultado(null);
                  setPrevisualizacion(null);
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
                  setEsFeriado(false);
                  setResultado(null);
                  setPrevisualizacion(null);
                  if (!horaInicio) {
                    setHoraInicio("08:00");
                    setHoraFin("12:00");
                  }
                }}
              >
                Apertura extraordinaria
              </button>
              <button
                type="button"
                className={esFeriado ? "filter active" : "filter"}
                aria-pressed={esFeriado}
                onClick={() => {
                  setEsApertura(false);
                  setEsFeriado(true);
                  setHoraInicio("");
                  setHoraFin("");
                  setMotivo((actual) => actual || "Feriado / día no laborable");
                  setResultado(null);
                  setPrevisualizacion(null);
                }}
              >
                Feriado / día no laborable
              </button>
            </div>
            <p className="muted block-help">
              {esApertura
                ? "La apertura agrega horarios de atención para esta fecha."
                : "El bloqueo cierra la fecha completa o solo el rango horario elegido. Conservamos los turnos y sus pacientes aparecen en Reprogramaciones para coordinar otro horario."}
            </p>
            <div className="availability-fields">
              <label>
                Fecha
                <FechaInput
                  aria-label="Fecha del bloqueo o apertura"
                  min={hoy()}
                  required
                  value={fecha}
                  onChange={(value) => {
                    setFecha(value);
                    setPrevisualizacion(null);
                  }}
                />
              </label>
              <label>
                Motivo <span className="optional">(opcional)</span>
                <input
                  maxLength={255}
                  value={motivo}
                  onChange={(e) => {
                    setMotivo(e.target.value);
                    setPrevisualizacion(null);
                  }}
                  placeholder="Ej. feriado, capacitación"
                />
              </label>
            </div>
            <label className="check-field">
              <input
                type="checkbox"
                checked={!horaInicio && !horaFin}
                onChange={(e) => {
                  setPrevisualizacion(null);
                  if (e.target.checked) {
                    setHoraInicio("");
                    setHoraFin("");
                  } else {
                    setHoraInicio("08:00");
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
                    onChange={(e) => {
                      setHoraInicio(e.target.value);
                      setPrevisualizacion(null);
                    }}
                  />
                </label>
                <label>
                  Hasta
                  <input
                    type="time"
                    required
                    min={horaInicio}
                    value={horaFin}
                    onChange={(e) => {
                      setHoraFin(e.target.value);
                      setPrevisualizacion(null);
                    }}
                  />
                </label>

              </div>
            )}
            {esApertura && !horaInicio && (
              <p className="alert error">
                Para una apertura extraordinaria, indicá el horario.
              </p>
            )}
            {!esApertura && previsualizacion && (
              <div className="block-preview" role="status">
                <strong>
                  {previsualizacion.cantidadTurnosAfectados === 0
                    ? "No hay turnos afectados por este cierre."
                    : previsualizacion.cantidadTurnosAfectados === 1
                      ? "1 turno se verá afectado por este cierre."
                      : `${previsualizacion.cantidadTurnosAfectados} turnos se verán afectados por este cierre.`}
                </strong>
                {previsualizacion.turnosAfectados.length > 0 && (
                  <>
                    <p>Estos turnos se conservarán para reprogramarlos después:</p>
                    <ul className="block-preview-list">
                      {previsualizacion.turnosAfectados.map((turno) => (
                        <li key={turno.turnoId}>
                          <strong>{turno.paciente}</strong>
                          <span>{turno.horaInicio.slice(0, 5)}–{turno.horaFin.slice(0, 5)} (turno #{turno.turnoId})</span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                <p>Confirmá solo si corresponde suspender la atención. Los turnos no se borrarán.</p>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setPrevisualizacion(null)}
                >
                  Modificar antes de confirmar
                </button>
              </div>
            )}
            <button
              className={!esApertura && previsualizacion ? "danger" : "primary"}
              disabled={!profesionalId || busy || (esApertura && !horaInicio)}
            >
              {busy
                ? "Procesando…"
                : esApertura
                  ? "Crear apertura"
                  : previsualizacion
                    ? "Confirmar cierre de agenda"
                    : "Revisar turnos afectados"}
            </button>
          </fieldset>
        </form>
      </div>
    </section>
  );
}
