import { useRef, useState } from "react";
import type { Api } from "../api";
import { detalleError } from "../api";
import { hoy, moverDia } from "../types";
import { finDeMes, meses, rangoDelMes } from "../lib/fechas";

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
  const fechaHoy = hoy();
  const limite = moverDia(fechaHoy, horizonteDias);
  const mesesDisponibles: string[] = [];
  for (let siguiente = `${fechaHoy.slice(0, 7)}-01`; siguiente.slice(0, 7) <= limite.slice(0, 7);
    siguiente = moverDia(finDeMes(siguiente.slice(0, 7)), 1)) {
    mesesDisponibles.push(siguiente.slice(0, 7));
  }

  async function generar(event: React.FormEvent) {
    event.preventDefault();
    if (!profesionalId || !habilitada || mutation.current || !mes) return;
    mutation.current = true;
    setBusy(true);
    onBusyChange(true);
    setError("");
    setMensaje("");
    try {
      const resultado = await api<{ creadas: number; existentes: number; omitidasPorCierre: number }>("/api/agenda/generar-franjas", {
        method: "POST",
        body: JSON.stringify({ profesionalId, ...rangoDelMes(mes, fechaHoy, horizonteDias) }),
      });
      setMensaje(`Horarios habilitados: ${resultado.creadas} nuevos, ${resultado.existentes} existentes y ${resultado.omitidasPorCierre} omitidos por cierres.`);
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
      <p>Elegí el mes y habilitá los horarios para reservar.</p>
    </div></div>
    {error && <p className="alert error" role="alert">{error}</p>}
    {mensaje && <p className="alert success" role="status">{mensaje}</p>}
    <fieldset disabled={!habilitada || busy}>
      <label>Mes de atención<select required value={mes} lang="es-AR"
        onChange={(e) => { setMes(e.target.value); setMensaje(""); setError(""); }}>
        {mesesDisponibles.map((valor) => <option key={valor} value={valor}>{meses[Number(valor.slice(5)) - 1]} de {valor.slice(0, 4)}</option>)}
      </select></label>
      <p className="booking-note">Se habilita un mes por vez dentro de la anticipación máxima. Los turnos asignados, los horarios pasados y los cierres se conservan. Repetir la generación no duplica los horarios.</p>
      <button className="primary" disabled={!mes}>{busy ? "Habilitando…" : "Habilitar horarios"}</button>
    </fieldset>
  </form>;
}
