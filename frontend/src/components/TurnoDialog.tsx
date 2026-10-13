import { useEffect, useState } from "react";
import type { Api } from "../api";
import { abortado, detalleError } from "../api";
import type { Franja, Turno } from "../types";
import { fechaLarga, hora, reservable } from "../types";
import { Modal } from "./Modal";
export type Accion = "cancelar" | "reprogramar" | "atencion" | "ausencia";
export function TurnoDialog({
  turno,
  tipo,
  api,
  busy,
  close,
  submit,
}: {
  turno: Turno;
  tipo: Accion;
  api: Api;
  busy: boolean;
  close: () => void;
  submit: (path: string, body?: object) => Promise<boolean>;
}) {
  const [fecha, setFecha] = useState(turno.inicio.slice(0, 10));
  const [motivo, setMotivo] = useState("");
  const [destino, setDestino] = useState("");
  const [franjas, setFranjas] = useState<Franja[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (tipo !== "reprogramar") return;
    const controller = new AbortController();
    setDestino("");
    setFranjas([]);
    setCargando(true);
    setError("");
    api<Franja[]>(
      `/api/agenda?profesionalId=${turno.profesionalId}&fecha=${fecha}`,
      { signal: controller.signal },
    )
      .then((data) => setFranjas(data.filter(reservable)))
      .catch((e) => {
        if (!abortado(e)) setError(detalleError(e));
      })
      .finally(() => {
        if (!controller.signal.aborted) setCargando(false);
      });
    return () => controller.abort();
  }, [api, turno.profesionalId, fecha, tipo, retry]);
  const title = {
    cancelar: "Cancelar turno",
    reprogramar: "Reprogramar turno",
    atencion: "Marcar como atendido",
    ausencia: "Marcar como ausente",
  }[tipo];
  return (
    <Modal title={title} busy={busy} close={close}>
      <form
        className="stack"
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");
          const endpoint = {
            cancelar: "cancelacion",
            reprogramar: "reprogramacion",
            atencion: "atencion",
            ausencia: "ausencia",
          }[tipo];
          const body =
            tipo === "cancelar"
              ? { motivo: motivo.trim() }
              : tipo === "reprogramar"
                ? { franjaId: Number(destino), motivo: motivo.trim() }
                : undefined;
          if (await submit(`/api/turnos/${turno.id}/${endpoint}`, body))
            close();
          else {
            setError(
              "No se guardó el cambio. Revisá el mensaje de la agenda e intentá nuevamente.",
            );
            if (tipo === "reprogramar") setRetry((n) => n + 1);
          }
        }}
      >
        <div className="slot-summary">
          <div>
            <strong>{turno.paciente}</strong>
            <span>
              {fechaLarga(turno.inicio.slice(0, 10))} · {hora(turno.inicio)} hs
            </span>
          </div>
        </div>
        <fieldset disabled={busy}>
          {tipo === "reprogramar" && (
            <>
              <label>
                Nueva fecha
                <input
                  type="date"
                  required
                  value={fecha}
                  onChange={(e) => {
                    if (e.target.value) {
                      setDestino("");
                      setFranjas([]);
                      setFecha(e.target.value);
                    }
                  }}
                />
              </label>
              <label>
                Nuevo horario
                <select
                  required
                  value={destino}
                  disabled={cargando || !franjas.length}
                  onChange={(e) => setDestino(e.target.value)}
                >
                  <option value="">
                    {cargando ? "Cargando horarios…" : "Seleccionar horario…"}
                  </option>
                  {franjas.map((f) => (
                    <option key={f.id} value={f.id}>
                      {hora(f.inicio)} – {hora(f.fin)}
                    </option>
                  ))}
                </select>
              </label>
              {!cargando && !franjas.length && (
                <p className="muted">
                  No hay horarios disponibles para esta fecha.
                </p>
              )}
              <p className="muted">
                El turno original se conserva si el nuevo horario no puede
                reservarse.
              </p>
            </>
          )}
          {(tipo === "cancelar" || tipo === "reprogramar") && (
            <label>
              Motivo{" "}
              {tipo === "reprogramar" && (
                <span className="optional">(opcional)</span>
              )}
              <textarea
                rows={3}
                maxLength={500}
                required={tipo === "cancelar"}
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
              />
            </label>
          )}
          {tipo === "cancelar" && (
            <p className="muted">
              Se liberará el horario y se conservará el registro de cancelación.
            </p>
          )}
          {(tipo === "atencion" || tipo === "ausencia") && (
            <p className="muted">Confirmá el resultado de este turno.</p>
          )}
          {error && (
            <p className="alert error" role="alert">
              {error}
            </p>
          )}
          <div className="dialog-actions">
            <button type="button" className="secondary" onClick={close}>
              Volver
            </button>
            <button
              className={tipo === "cancelar" ? "danger" : "primary"}
              disabled={
                tipo === "reprogramar"
                  ? !destino || cargando
                  : tipo === "cancelar"
                    ? !motivo.trim()
                    : false
              }
            >
              {busy ? "Guardando…" : "Confirmar"}
            </button>
          </div>
        </fieldset>
      </form>
    </Modal>
  );
}
