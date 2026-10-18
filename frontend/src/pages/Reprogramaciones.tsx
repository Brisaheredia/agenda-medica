import { useEffect, useRef, useState } from "react";
import type { Api } from "../api";
import { abortado, detalleError } from "../api";
import type { Turno, TurnoAfectado } from "../types";
import { fechaLarga, hora } from "../types";
import { TurnoDialog } from "../components/TurnoDialog";
import { FechaInput } from "../components/FechaInput";

export function ReprogramacionesPage({ api, profesionalId, puedeGestionar }: {
  api: Api;
  profesionalId?: number;
  puedeGestionar: boolean;
}) {
  const [pendientes, setPendientes] = useState<TurnoAfectado[]>([]);
  const [revision, setRevision] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [fecha, setFecha] = useState("");
  const [turno, setTurno] = useState<Turno | null>(null);
  const [busy, setBusy] = useState(false);
  const mutation = useRef(false);

  useEffect(() => {
    if (!profesionalId) return;
    const controller = new AbortController();
    setCargando(true);
    setError("");
    api<TurnoAfectado[]>(`/api/agenda/reprogramaciones-pendientes?profesionalId=${profesionalId}`, { signal: controller.signal })
      .then(setPendientes)
      .catch((e) => { if (!abortado(e)) { setError(detalleError(e)); setPendientes([]); } })
      .finally(() => { if (!controller.signal.aborted) setCargando(false); });
    return () => controller.abort();
  }, [api, profesionalId, revision]);

  async function guardar(path: string, body?: object) {
    if (mutation.current) return false;
    mutation.current = true;
    setBusy(true);
    setError("");
    setMensaje("");
    try {
      await api(path, { method: "POST", body: JSON.stringify(body) });
      setMensaje("Turno reprogramado. El paciente ya no figura entre los pendientes.");
      setRevision((r) => r + 1);
      return true;
    } catch (e) {
      setError(detalleError(e));
      return false;
    } finally {
      mutation.current = false;
      setBusy(false);
    }
  }

  const texto = busqueda.trim().toLocaleLowerCase("es-AR");
  const visibles = pendientes.filter((p) => (!fecha || p.turno.inicio.startsWith(fecha)) &&
    `${p.turno.paciente} ${p.dni} ${p.telefono ?? ""} ${p.email ?? ""}`.toLocaleLowerCase("es-AR").includes(texto));

  return <section aria-labelledby="reprogramaciones-title">
    <div className="page-heading"><div>
      <p className="eyebrow">SEGUIMIENTO DEL CONSULTORIO</p>
      <h1 id="reprogramaciones-title">Reprogramaciones</h1>
      <p className="muted">Pacientes afectados por una suspensión del médico o del consultorio. Llamalos para coordinar un nuevo horario disponible.</p>
    </div><button className="secondary" disabled={busy || cargando || !profesionalId} onClick={() => setRevision((r) => r + 1)}>Actualizar</button></div>
    {error && <div className="alert error" role="alert">{error}</div>}
    {mensaje && <div className="alert success" role="status">{mensaje}</div>}
    <div className="card pending-card" aria-busy={cargando}>
      <div className="availability-fields">
        <label>Buscar paciente o contacto<input type="search" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} /></label>
        <label>Fecha del turno original<FechaInput aria-label="Fecha del turno original" value={fecha} onChange={setFecha} /></label>
      </div>
      <p className="muted">{cargando ? "Cargando pacientes…" : `${visibles.length} turnos pendientes de ${pendientes.length} en total.`} Las cancelaciones solicitadas por el paciente quedan fuera de esta lista.</p>
      {!cargando && !error && !visibles.length && <p className="empty-state">No hay reprogramaciones pendientes para esta búsqueda.</p>}
      {!cargando && visibles.length > 0 && <div className="table-scroll"><table className="pending-table">
        <thead><tr><th>Paciente</th><th>Contacto</th><th>Turno original</th><th>Motivo de suspensión</th><th>Acción</th></tr></thead>
        <tbody>{visibles.map((p) => <tr key={p.turno.id}>
          <td><strong>{p.turno.paciente}</strong><span>DNI: {p.dni}</span></td>
          <td>{p.telefono && <a href={`tel:${p.telefono}`}>{p.telefono}</a>}{p.email && <a href={`mailto:${p.email}`}>{p.email}</a>}{!p.telefono && !p.email && <span>Sin contacto registrado. Completalo en Pacientes.</span>}</td>
          <td>{fechaLarga(p.turno.inicio.slice(0, 10))}<span>{hora(p.turno.inicio)}–{hora(p.turno.fin)}</span></td>
          <td>{p.motivo || "Suspensión del consultorio"}</td>
          <td>{puedeGestionar ? <button className="secondary small" disabled={busy} onClick={() => setTurno(p.turno)}>Reprogramar</button> : "Sólo consulta"}</td>
        </tr>)}</tbody>
      </table></div>}
    </div>
    {turno && <TurnoDialog key={turno.id} turno={turno} tipo="reprogramar" api={api} busy={busy} close={() => setTurno(null)} submit={guardar} />}
  </section>;
}
