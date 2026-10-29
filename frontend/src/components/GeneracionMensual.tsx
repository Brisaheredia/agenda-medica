import { useRef, useState } from "react";
import type { Api } from "../api";
import { detalleError } from "../api";
import { hoy, moverDia } from "../types";
import { finDeMes, meses, rangoDelMes } from "../lib/fechas";

const MESES_FUTUROS_HABILITABLES = 3;

export function GeneracionMensual({ api, profesionalId, habilitada,
  onBusyChange, onConfirmado }: {
  api: Api;
  profesionalId?: number;
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
  const mesesDisponibles: string[] = [];
  let siguiente = `${fechaHoy.slice(0, 7)}-01`;
  for (let i = 0; i <= MESES_FUTUROS_HABILITABLES; i++) {
    mesesDisponibles.push(siguiente.slice(0, 7));
    siguiente = moverDia(finDeMes(siguiente.slice(0, 7)), 1);
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
        body: JSON.stringify({ profesionalId, ...rangoDelMes(mes, fechaHoy) }),
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
      <h2>Habilitar horarios del mes</h2>
      <p>Elegí el mes actual o uno de los tres meses siguientes para habilitar los horarios.</p>
    </div></div>
    {error && <p className="alert error" role="alert">{error}</p>}
    {mensaje && <p className="alert success" role="status">{mensaje}</p>}
    <fieldset disabled={!habilitada || busy}>
      <label>Mes de atención<select required value={mes} lang="es-AR"
        onChange={(e) => { setMes(e.target.value); setMensaje(""); setError(""); }}>
        {mesesDisponibles.map((valor) => <option key={valor} value={valor}>{meses[Number(valor.slice(5)) - 1]} de {valor.slice(0, 4)}</option>)}
      </select></label>
      <p className="booking-note">Se habilita el mes completo seleccionado (o desde hoy si es el mes actual). Los turnos asignados, los horarios pasados y los cierres se conservan. Repetir la generación no duplica los horarios.</p>
      <button className="primary" disabled={!mes}>{busy ? "Habilitando…" : "Habilitar horarios"}</button>
    </fieldset>
  </form>;
}
