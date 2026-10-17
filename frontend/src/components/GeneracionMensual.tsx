import { useRef, useState } from "react";
import type { Api } from "../api";
import { detalleError } from "../api";
import { hoy, moverDia } from "../types";

export function GeneracionMensual({ api, profesionalId, horizonteDias, habilitada,
  onBusyChange, onConfirmado }: {
  api: Api;
  profesionalId?: number;
  horizonteDias: number;
  habilitada: boolean;
  onBusyChange: (busy: boolean) => void;
  onConfirmado: () => void;
}) {
  const [mes, setMes] = useState(hoy().slice(0, 7));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const mutation = useRef(false);

  async function generar(event: React.FormEvent) {
    event.preventDefault();
    if (!profesionalId || !habilitada || mutation.current || !mes) return;
    mutation.current = true;
    setBusy(true);
    onBusyChange(true);
    setError("");
    setMensaje("");
    try {
      const [anio, numeroMes] = mes.split("-").map(Number);
      const ultimoDia = new Date(anio, numeroMes, 0).getDate();
      const resultado = await api<{ creadas: number; existentes: number; omitidasPorCierre: number }>("/api/agenda/generar-franjas", {
        method: "POST",
        body: JSON.stringify({ profesionalId, desde: `${mes}-01`, hasta: `${mes}-${ultimoDia}` }),
      });
      setMensaje(`Horarios habilitados: ${resultado.creadas} nuevos de 40 minutos, ${resultado.existentes} existentes y ${resultado.omitidasPorCierre} omitidos por cierres.`);
      onConfirmado();
    } catch (e) {
      setError(detalleError(e));
    } finally {
      mutation.current = false;
      setBusy(false);
      onBusyChange(false);
    }
  }

  return <form className="card availability-form" onSubmit={generar}>
    <div className="panel-heading"><div>
      <h2>2. Habilitar horarios del mes</h2>
      <p>Todos los turnos duran 40 minutos.</p>
    </div></div>
    {error && <p className="alert error" role="alert">{error}</p>}
    {mensaje && <p className="alert success" role="status">{mensaje}</p>}
    <fieldset disabled={!habilitada || busy}>
      <label>Mes de atención<input type="month" required min={hoy().slice(0, 7)}
        max={moverDia(hoy(), horizonteDias).slice(0, 7)} value={mes}
        onChange={(e) => { setMes(e.target.value); setMensaje(""); setError(""); }} /></label>
      <p className="booking-note">Se habilita un mes por vez dentro de la anticipación máxima. Los turnos asignados, los horarios pasados y los cierres se conservan. Repetir la generación no duplica los horarios.</p>
      <button className="primary" disabled={!mes}>{busy ? "Habilitando…" : "Habilitar horarios"}</button>
    </fieldset>
  </form>;
}
