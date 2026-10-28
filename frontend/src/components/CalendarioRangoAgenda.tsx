import { useEffect, useState } from "react";
import type { Api } from "../api";
import { abortado, detalleError } from "../api";
import type { DiaAgendaRango, Franja, Turno } from "../types";
import { fechaCorta, fechaLarga, hora, hoy, moverDia } from "../types";
import { estadoVisual, franjasParaMostrar } from "../lib/agendaVisual";
import { FechaInput } from "./FechaInput";
import { LeyendaAgenda } from "./LeyendaAgenda";
import { BadgeReprogramacion } from "./BadgeReprogramacion";

const diasSemana = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const DIAS_POR_PAGINA = 7;

function filasDelDia(dia: DiaAgendaRango) {
  const franjas = franjasParaMostrar(dia.franjas, dia.turnos);
  const porFranja = new Map(dia.turnos.filter(t => t.estado !== "CANCELADO").map(t => [t.franjaId, t]));
  const idsFranja = new Set(franjas.map(franja => franja.id));
  const filas: { franja?: Franja; turno?: Turno }[] = franjas.map(franja => ({
    franja, turno: porFranja.get(franja.id),
  }));
  for (const turno of dia.turnos) {
    if (turno.estado === "CANCELADO" || !idsFranja.has(turno.franjaId)) {
      filas.push({ turno });
    }
  }
  return filas.sort((a, b) => (a.turno?.inicio ?? a.franja?.inicio ?? "")
    .localeCompare(b.turno?.inicio ?? b.franja?.inicio ?? ""));
}

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
        {diasVisibles.map(dia => {
          const filas = filasDelDia(dia);
          const cierres = dia.excepciones.filter(e => e.tipo === "CIERRE");
          const estados = filas.map(({ franja, turno }) => estadoVisual(franja, turno, dia.excepciones).clase);
          const colorDia = cierres.length || estados.includes("consultorio") ? "consultorio"
            : estados.includes("libre") ? "libre" : estados.includes("paciente") ? "paciente"
            : estados.includes("ocupado") ? "ocupado" : "neutro";
          const numeroDia = new Date(`${dia.fecha}T12:00:00Z`).getUTCDay();
          return <section className={`availability-day day-${colorDia} ${numeroDia === 0 ? "is-sunday" : ""} ${dia.fecha === hoy() ? "is-today" : ""}`} key={dia.fecha}>
            <button className="agenda-week-day" onClick={() => irAlDia(dia.fecha)}
              aria-label={`Abrir agenda del ${fechaLarga(dia.fecha)}`} title="Abrir agenda del día">
              <span>{diasSemana[numeroDia]}</span>
              <strong>{Number(dia.fecha.slice(8, 10))}</strong>
            </button>
            {cierres.map(cierre => <p key={cierre.id} className="closure-note">
              {cierre.horaInicio ? `Cierre ${cierre.horaInicio.slice(0, 5)}–${cierre.horaFin?.slice(0, 5) ?? "fin del día"}` : "Día cerrado"}
              {cierre.motivo && <span>{cierre.motivo}</span>}
            </p>)}
            {verContactos && colorDia === "consultorio" && <a className="reprogram-link" href="/reprogramaciones">Ver reprogramaciones</a>}
            {!filas.length ? <p className="availability-empty">Sin horarios</p> : <ul>
              {filas.map(({ franja, turno }, indice) => {
                const visual = estadoVisual(franja, turno, dia.excepciones);
                const inicio = turno?.inicio ?? franja?.inicio ?? "";
                const fin = turno?.fin ?? franja?.fin ?? "";
                return <li className={`agenda-week-slot status-${visual.clase}`}
                  key={turno ? `t-${turno.id}` : `f-${franja?.id}-${indice}`}>
                  <strong>{hora(inicio)}–{hora(fin)}</strong>
                  <span>{turno?.paciente ?? visual.etiqueta}</span>
                  {turno && <small>{visual.etiqueta}</small>}
                  {turno && <BadgeReprogramacion turno={turno} />}
                </li>;
              })}
            </ul>}
          </section>;
        })}
      </div>}
  </section>;
}
