import type { ExcepcionAgenda, Filtro, Franja, Paciente, Profesional, Turno } from "../types";
import { activo, reservable, fechaCorta } from "../types";
import { Agenda } from "../components/ListaTurnos";
import { BookingPanel } from "../components/BookingPanel";
import { Icon } from "../components/Icon";
import type { Accion } from "../components/TurnoDialog";
import { CalendarioSemanalAgenda } from "../components/CalendarioSemanalAgenda";
import { CalendarioRangoAgenda } from "../components/CalendarioRangoAgenda";
import { useState } from "react";
import { LeyendaAgenda } from "../components/LeyendaAgenda";
import { cierreDelHorario } from "../lib/agendaVisual";
import { FechaInput } from "../components/FechaInput";

type Props = {
  busy: boolean;
  mensaje: { tipo: "error" | "success"; texto: string } | null;
  setMensaje: (
    value: { tipo: "error" | "success"; texto: string } | null,
  ) => void;
  fecha: string;
  cambiarFecha: (value: string) => void;
  hoy: () => string;
  moverDia: (fecha: string, dias: number) => string;
  fechaLarga: (fecha: string) => string;
  profesional: Profesional | null;
  profesionalId?: number;
  cargando: boolean;
  errorAgenda: string;
  setErrorAgenda: (value: string) => void;
  setRevision: (value: (n: number) => number) => void;
  setIntentoProfesional: (value: (n: number) => number) => void;
  franjas: Franja[];
  turnos: Turno[];
  excepciones: ExcepcionAgenda[];
  ready: boolean;
  filtro: Filtro;
  setFiltro: (value: Filtro) => void;
  gestionar: boolean;
  cerrar: boolean;
  gestionarPacientes: boolean;
  verContactos: boolean;
  selected: Franja | null;
  setSelected: (value: Franja | null) => void;
  setDialog: (value: { turno: Turno; tipo: Accion } | null) => void;
  api: <T>(path: string, options?: RequestInit) => Promise<T>;
  irAFranja: (franja: Franja) => void;
  guardar: (path: string, body?: object) => Promise<boolean>;
};
export function AgendaPage(props: Props) {
  const {
    busy,
    mensaje,
    setMensaje,
    fecha,
    cambiarFecha,
    hoy,
    moverDia,
    fechaLarga,
    profesional,
    profesionalId,
    cargando,
    errorAgenda,
    setErrorAgenda,
    setRevision,
    setIntentoProfesional,
    franjas,
    turnos,
    excepciones,
    ready,
    filtro,
    setFiltro,
    gestionar,
    cerrar,
    gestionarPacientes,
    verContactos,
    selected,
    setSelected,
    setDialog,
    api,
    guardar,
    irAFranja,
  } = props;
  const [vista, setVista] = useState<"dia" | "semana" | "rango">("dia");
  const esHoy = fecha === hoy();
  const diaAnterior = moverDia(fecha, -1);
  const diaSiguiente = moverDia(fecha, 1);
  const filters: { id: Filtro; label: string }[] = [
    { id: "TODOS", label: "Todos" },
    { id: "LIBRE", label: "Disponibles" },
    { id: "RESERVADO", label: "Reservados" },
    { id: "ATENDIDO", label: "Atendidos" },
    { id: "AUSENTE", label: "Ausentes" },
    { id: "BLOQUEADA", label: "Bloqueados" },
    { id: "CANCELADO", label: "Cancelados" },
  ];
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">{vista === "dia" ? "ORGANIZACIÓN DIARIA" : vista === "semana" ? "ORGANIZACIÓN SEMANAL" : "CONSULTA POR RANGO"}</p>
          <h1>Agenda del consultorio</h1>
          <p className="muted">
            {vista === "dia"
              ? "Todos los horarios del día, en un solo lugar."
              : vista === "semana" ? "Consultá los turnos y horarios de toda la semana."
              : "Consultá horarios y turnos entre las fechas que elijas."}
          </p>
        </div>
        <div className="page-heading-actions agenda-view-toggle" role="group" aria-label="Vista de agenda">
          <button className={vista === "dia" ? "filter active" : "filter"} aria-pressed={vista === "dia"} onClick={() => setVista("dia")}>Día</button>
          <button className={vista === "semana" ? "filter active" : "filter"} aria-pressed={vista === "semana"} onClick={() => setVista("semana")}>Semana</button>
          <button className={vista === "rango" ? "filter active" : "filter"} aria-pressed={vista === "rango"} onClick={() => setVista("rango")}>Rango</button>
        </div>
      </div>
      {mensaje && (
        <div
          className={`alert ${mensaje.tipo}`}
          role={mensaje.tipo === "error" ? "alert" : "status"}
        >
          <span>{mensaje.texto}</span>
          <button
            className="icon-button"
            aria-label="Cerrar mensaje"
            onClick={() => setMensaje(null)}
          >
            <Icon name="close" size={16} />
          </button>
        </div>
      )}
      {vista === "dia" && <section className="date-toolbar card" aria-label="Navegación por fecha">
        <div className="date-controls">
          <button
            className="secondary date-step"
            aria-label={`Día anterior: ${fechaLarga(diaAnterior)}`}
            disabled={busy}
            onClick={() => cambiarFecha(diaAnterior)}
          >
            <Icon name="left" size={18} />
            <time dateTime={diaAnterior}>{fechaCorta(diaAnterior)}</time>
          </button>
          <div className="date-title" aria-live="polite">
            <time dateTime={fecha} title={fechaLarga(fecha)} aria-current={esHoy ? "date" : undefined}>
              <strong>{esHoy ? "Hoy" : fechaCorta(fecha)}</strong>
              {esHoy && <span>{fechaCorta(fecha)}</span>}
            </time>
          </div>
          <button
            className="secondary date-step"
            aria-label={`Día siguiente: ${fechaLarga(diaSiguiente)}`}
            disabled={busy}
            onClick={() => cambiarFecha(diaSiguiente)}
          >
            <time dateTime={diaSiguiente}>{fechaCorta(diaSiguiente)}</time>
            <Icon name="right" size={18} />
          </button>
        </div>
        {!esHoy && (
          <button className="text-button" disabled={busy} onClick={() => cambiarFecha(hoy())}>
            Volver a hoy
          </button>
        )}
        <div className="date-toolbar-actions">
          <FechaInput
            aria-label="Fecha de la agenda"
            value={fecha}
            disabled={busy}
            onChange={cambiarFecha}
          />
          <button
            className="secondary"
            disabled={busy || cargando || !profesional}
            onClick={() => setRevision((n) => n + 1)}
          >
            <Icon name="refresh" size={16} />
            Actualizar
          </button>
        </div>
      </section>}
      {vista === "semana" && profesional && <CalendarioSemanalAgenda profesionalId={profesionalId} api={api} verContactos={verContactos} irAlDia={(dia) => { cambiarFecha(dia); setVista("dia"); }} />}
      {vista === "rango" && profesional && <CalendarioRangoAgenda profesionalId={profesionalId} api={api} verContactos={verContactos} irAlDia={(dia) => { cambiarFecha(dia); setVista("dia"); }} />}
      {errorAgenda && (
        <div className="alert error" role="alert">
          <span>{errorAgenda}</span>
          <button
            className="secondary"
            onClick={() => {
              setErrorAgenda("");
              if (profesional) setRevision((n) => n + 1);
              else setIntentoProfesional((n) => n + 1);
            }}
          >
            Reintentar
          </button>
        </div>
      )}
      {vista === "dia" && <section
        className="metrics"
        aria-label="Resumen de la agenda"
        aria-busy={!ready}
      >
        {[
          {
            label: "Franjas del día",
            value: franjas.length,
            caption: "Horarios de atención",
            icon: "calendar",
          },
          {
            label: "Disponibles",
            value: franjas.filter((f) => reservable(f) && !cierreDelHorario(f.inicio, f.fin, excepciones)).length,
            caption: "Horarios que podés reservar",
            icon: "clock",
          },
          {
            label: "Turnos reservados",
            value: turnos.filter(activo).length,
            caption: "Reservados y confirmados",
            icon: "people",
          },
        ].map((m) => (
          <article className="metric card" key={m.label}>
            <div>
              <span>{m.label}</span>
              <strong>{ready ? m.value : "—"}</strong>
              <p>{m.caption}</p>
            </div>
            <span className="metric-icon">
              <Icon name={m.icon} size={25} />
            </span>
          </article>
        ))}
      </section>}
      {vista === "dia" && <div className={`agenda-layout ${!gestionar ? "read-only" : ""}`}>
        <section aria-labelledby="agenda-title">
          <div className="agenda-heading">
            <h2 id="agenda-title">Horarios y turnos</h2>
            <span className="muted">
              {ready ? `${franjas.length} franjas` : "Cargando agenda…"}
            </span>
          </div>
          <div
            className="filters"
            role="group"
            aria-label="Filtrar agenda por estado"
          >
            {filters.map((f) => (
              <button
                key={f.id}
                aria-pressed={filtro === f.id}
                className={filtro === f.id ? "filter active" : "filter"}
                onClick={() => setFiltro(f.id)}
              >
                {f.label}
              </button>
            ))}
          </div>
          <LeyendaAgenda />
          {ready && excepciones.some((e) => e.tipo === "CIERRE") && <div className="alert closure-banner" role="status">Atención suspendida total o parcialmente por el consultorio. Los turnos se conservan. {verContactos && <a href="/reprogramaciones">Ver pacientes para reprogramar</a>}</div>}
          {!ready && !errorAgenda && (
            <div className="card loading" role="status">
              Cargando horarios y turnos…
            </div>
          )}
          {ready && (
            <Agenda
              franjas={franjas}
              turnos={turnos}
              excepciones={excepciones}
              filtro={filtro}
              selected={selected?.id}
              gestionar={gestionar}
              cerrar={cerrar}
              busy={busy}
              select={setSelected}
              action={(turno, tipo) => setDialog({ turno, tipo })}
            />
          )}
        </section>
        {gestionar && (
          <BookingPanel
            api={api}
            gestionarPacientes={gestionarPacientes}
            franjas={ready ? franjas.filter((f) => !cierreDelHorario(f.inicio, f.fin, excepciones)) : []}
            selected={selected}
            select={setSelected}
            profesionalId={profesionalId}
            irAFranja={irAFranja}
            busy={busy}
            ready={ready}
            reservar={(paciente: Paciente, motivo: string) =>
              selected
                ? guardar("/api/turnos", {
                    pacienteId: paciente.id,
                    franjaId: selected.id,
                    motivoConsulta: motivo.trim(),
                  })
                : Promise.resolve(false)
            }
          />
        )}
      </div>}
    </>
  );
}
