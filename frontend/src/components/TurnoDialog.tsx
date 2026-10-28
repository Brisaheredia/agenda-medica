import { useEffect, useState } from "react";
import type { Api } from "../api";
import { abortado, detalleError } from "../api";
import type { Franja, Turno } from "../types";
import { fechaLarga, hora, hoy, reservable } from "../types";
import { Modal } from "./Modal";
import { FechaInput } from "./FechaInput";
import { BadgeReprogramacion } from "./BadgeReprogramacion";
export type Accion = "cancelar" | "reprogramar" | "atencion" | "ausencia";
export function TurnoDialog({
  turno,
  tipo,
  api,
  busy,
  close,
  submit,
  cancelarPorConsultorio = true,
}: {
  turno: Turno;
  tipo: Accion;
  api: Api;
  busy: boolean;
  close: () => void;
  submit: (path: string, body?: object) => Promise<boolean>;
  cancelarPorConsultorio?: boolean;
}) {
  const [fecha, setFecha] = useState(turno.inicio.slice(0, 10) < hoy() ? hoy() : turno.inicio.slice(0, 10));
  const [origen, setOrigen] = useState<"PACIENTE" | "CONSULTORIO">("PACIENTE");
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
      `/api/agenda/disponibles?profesionalId=${turno.profesionalId}&desde=${fecha}T00:00:00`,
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
              ? { motivo: motivo.trim(), origen }
              : tipo === "reprogramar"
                ? { franjaId: Number(destino), motivo: motivo.trim() }
                : undefined;
          if (await submit(`/api/turnos/${turno.id}/${endpoint}`, body))
            close();
          else {
            setError(
              "No se guardó el cambio. Revisá los datos y el mensaje de error e intentá nuevamente.",
            );
            if (tipo === "reprogramar") setRetry((n) => n + 1);
          }
        }}
      >
        <div className="slot-summary">
          <div>
            <strong>{turno.paciente}</strong>
            <BadgeReprogramacion turno={turno} />
            <span>
              {fechaLarga(turno.inicio.slice(0, 10))} · {hora(turno.inicio)} hs
            </span>
          </div>
        </div>
        <fieldset disabled={busy}>
          {tipo === "reprogramar" && (
            <>
              <label>
                Buscar horarios desde
                <FechaInput
                  aria-label="Buscar horarios desde"
                  min={hoy()}
                  required
                  value={fecha}
                  onChange={(valor) => {
                    if (valor) {
                      setDestino("");
                      setFranjas([]);
                      setFecha(valor);
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
                      {fechaLarga(f.inicio.slice(0, 10))} · {hora(f.inicio)} – {hora(f.fin)}
                    </option>
                  ))}
                </select>
              </label>
              {!cargando && !franjas.length && (
                <p className="muted">
                  No hay horarios disponibles desde esta fecha dentro del período habilitado.
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
              Motivo
              <textarea
                rows={3}
                maxLength={500}
                required
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
              />
            </label>
          )}
          {tipo === "cancelar" && (
            <label>
              ¿Quién solicitó la cancelación?
              <select value={origen} onChange={(event) => setOrigen(event.target.value as typeof origen)}>
                <option value="PACIENTE">El paciente llamó y canceló</option>
                {cancelarPorConsultorio && <option value="CONSULTORIO">El médico o el consultorio suspendió la atención</option>}
              </select>
            </label>
          )}
          {tipo === "cancelar" && (
            <p className="muted">
              {origen === "PACIENTE"
                ? "El horario se liberará si no está cerrado por el consultorio. Se conservará el registro de cancelación."
                : "El horario quedará cerrado y el paciente aparecerá en Reprogramaciones para coordinar otro turno."}
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
                  ? !destino || cargando || !motivo.trim()
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
