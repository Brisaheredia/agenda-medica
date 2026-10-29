import { useEffect, useState } from "react";
import type { Api } from "../api";
import { abortado, detalleError } from "../api";
import type { DiaAgendaRango } from "../types";
import { fechaCorta, hoy, moverDia } from "../types";
import { FechaInput } from "./FechaInput";
import { LeyendaAgenda } from "./LeyendaAgenda";
import { DiaCalendarioAgenda } from "./DiaCalendarioAgenda";

const DIAS_POR_PAGINA = 7;

export function CalendarioRangoAgenda({ profesionalId, api, irAlDia, verContactos = true }: {
  profesionalId?: number;
  api: Api;
  irAlDia: (fecha: string) => void;
  verContactos?: boolean;
}) {
  const [desde, setDesde] = useState(() => hoy());
  const [hasta, setHasta] = useState(() => moverDia(hoy(), 6));
  const [consulta, setConsulta] = useState(() => ({ desde: hoy(), hasta: moverDia(hoy(), 6) }));
  const [dias, setDias] = useState<DiaAgendaRango[]>([]);
  const [pagina, setPagina] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [validacion, setValidacion] = useState("");

  useEffect(() => {
    if (!profesionalId) { setDias([]); return; }
    const controller = new AbortController();
    setCargando(true);
    setError("");
    api<DiaAgendaRango[]>(
      `/api/agenda/rango?profesionalId=${profesionalId}&desde=${consulta.desde}&hasta=${consulta.hasta}`,
      { signal: controller.signal },
    )
      .then(respuesta => { if (!controller.signal.aborted) setDias(respuesta); })
      .catch(e => { if (!abortado(e) && !controller.signal.aborted) { setError(detalleError(e)); setDias([]); } })
      .finally(() => { if (!controller.signal.aborted) setCargando(false); });
    return () => controller.abort();
  }, [api, profesionalId, consulta]);

  function consultar() {
    if (!desde || !hasta) { setValidacion("Elegí las dos fechas."); return; }
    if (hasta < desde) { setValidacion("La fecha final no puede ser anterior a la inicial."); return; }
    const diasElegidos = (Date.parse(`${hasta}T12:00:00Z`) - Date.parse(`${desde}T12:00:00Z`)) / 86_400_000 + 1;
    if (diasElegidos > 90) { setValidacion("Podés consultar hasta 90 días por vez."); return; }
    setValidacion("");
    setPagina(0);
    setConsulta({ desde, hasta });
  }

  const totalPaginas = Math.ceil(dias.length / DIAS_POR_PAGINA);
  const diasVisibles = dias.slice(pagina * DIAS_POR_PAGINA, (pagina + 1) * DIAS_POR_PAGINA);
  const primerDia = diasVisibles[0];
  const ultimoDia = diasVisibles[diasVisibles.length - 1];

  return <section className="card availability-calendar agenda-week agenda-range" aria-label="Agenda por rango" aria-busy={cargando}>
    <div className="availability-calendar-heading">
      <div>
        <h2>Agenda por rango</h2>
        <p className="muted">Consultá fechas específicas con la misma vista de la agenda semanal.</p>
      </div>
    </div>
    <div className="agenda-range-controls">
      <label>Desde<FechaInput value={desde} onChange={setDesde} required aria-label="Fecha desde" /></label>
      <label>Hasta<FechaInput value={hasta} onChange={setHasta} required aria-label="Fecha hasta" /></label>
      <button className="primary" disabled={cargando || !profesionalId} onClick={consultar}>Consultar rango</button>
    </div>
    {validacion && <p className="alert error" role="alert">{validacion}</p>}
    {error && <div className="alert error" role="alert">
      <span>{error}</span>
      <button className="secondary small" onClick={() => setConsulta({ ...consulta })}>Reintentar</button>
    </div>}
    <LeyendaAgenda />
    <div className="agenda-range-pagination">
      <span className="muted" aria-live="polite">
        {cargando ? "Cargando agenda…" : `${dias.length} días consultados`}
      </span>
      {!cargando && totalPaginas > 0 && <div className="availability-week-controls">
        <button className="secondary small" aria-label="Días anteriores del rango" disabled={pagina === 0}
          onClick={() => setPagina(n => n - 1)}>‹</button>
        <strong>{primerDia && ultimoDia ? `${fechaCorta(primerDia.fecha)} – ${fechaCorta(ultimoDia.fecha)}` : ""}</strong>
        <button className="secondary small" aria-label="Días siguientes del rango" disabled={pagina + 1 >= totalPaginas}
          onClick={() => setPagina(n => n + 1)}>›</button>
      </div>}
    </div>
    {cargando ? <p className="availability-empty">Cargando horarios…</p>
      : diasVisibles.length === 0 ? <p className="availability-empty">No hay días para mostrar.</p>
      : <div className="availability-week-grid" style={{ gridTemplateColumns: `repeat(${diasVisibles.length}, minmax(105px, 1fr))` }}>
        {diasVisibles.map(dia => (
          <DiaCalendarioAgenda
            key={dia.fecha}
            fecha={dia.fecha}
            dia={dia}
            irAlDia={irAlDia}
            verContactos={verContactos}
          />
        ))}
      </div>}
  </section>;
}
