import { useEffect, useState } from "react";
import type { Api } from "../api";
import { abortado, detalleError } from "../api";
import type { EventoTurno, Turno } from "../types";
import { fechaHora, fechaLarga, hora } from "../types";
import { Modal } from "./Modal";
import { Icon } from "./Icon";

const nombres: Record<EventoTurno["tipo"], string> = {
  CREACION: "Creación del turno",
  CONFIRMACION: "Confirmación",
  CANCELACION: "Cancelación",
  REPROGRAMACION: "Reprogramación",
  ATENCION: "Paciente atendido",
  AUSENCIA: "Paciente ausente",
};

function franja(inicio: string | null, fin: string | null, id: number | null) {
  if (!inicio || !fin) return id == null ? "—" : `Franja #${id} (horario no disponible)`;
  return `${fechaLarga(inicio.slice(0, 10))} · ${hora(inicio)}–${hora(fin)}`;
}

export function HistorialTurnoDialog({ turno, api, close }: {
  turno: Turno;
  api: Api;
  close: () => void;
}) {
  const [eventos, setEventos] = useState<EventoTurno[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setCargando(true);
    setError("");
    api<EventoTurno[]>(`/api/turnos/${turno.id}/historial`, { signal: controller.signal })
      .then(setEventos)
      .catch((e) => { if (!abortado(e)) setError(detalleError(e)); })
      .finally(() => { if (!controller.signal.aborted) setCargando(false); });
    return () => controller.abort();
  }, [api, turno.id, intento]);

  return <Modal title="Historial del turno" busy={false} close={close}>
    <div className="stack turno-history">
      <div className="slot-summary">
        <div><strong>{turno.paciente}</strong><span>Turno #{turno.id}</span></div>
      </div>
      {cargando && <p className="muted" role="status">Cargando historial…</p>}
      {error && <div className="alert error" role="alert">
        <span>{error}</span>
        <button className="secondary small" onClick={() => setIntento(n => n + 1)}>Reintentar</button>
      </div>}
      {!cargando && !error && !eventos.length && <p className="muted">Este turno todavía no tiene eventos registrados.</p>}
      {!cargando && !error && eventos.length > 0 && <div className="audit-list turno-history-list">
        {eventos.map(e => <article className="audit-entry" key={e.id}>
          <span className="audit-mark"><Icon name="audit" size={17} /></span>
          <div className="audit-event">
            <div className="audit-event-heading"><strong>{nombres[e.tipo]}</strong><time dateTime={e.fecha}>{fechaHora(e.fecha)}</time></div>
            <p>Realizado por: {e.usuario || "Usuario no registrado (evento anterior)"}</p>
            {e.tipo === "REPROGRAMACION" && <div className="turno-history-change">
              <span><strong>Antes:</strong> {franja(e.inicioAnterior, e.finAnterior, e.franjaAnteriorId)}</span>
              <span><strong>Después:</strong> {franja(e.inicioNuevo, e.finNuevo, e.franjaNuevaId)}</span>
            </div>}
            {e.detalle && <small>{e.detalle}</small>}
          </div>
        </article>)}
      </div>}
      <div className="dialog-actions"><button type="button" className="secondary" onClick={close}>Cerrar</button></div>
    </div>
  </Modal>;
}
