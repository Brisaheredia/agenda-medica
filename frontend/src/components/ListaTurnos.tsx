import type { ExcepcionAgenda, Filtro, Franja, Turno } from "../types";
import { activo, hora, reservable, instanteAgenda } from "../types";
import { cierreDelHorario, estadoVisual } from "../lib/agendaVisual";
import { Icon } from "./Icon";
export function Agenda({
  franjas,
  turnos,
  excepciones,
  filtro,
  selected,
  gestionar,
  cerrar,
  busy,
  select,
  action,
}: {
  franjas: Franja[];
  turnos: Turno[];
  excepciones: ExcepcionAgenda[];
  filtro: Filtro;
  selected: number | undefined;
  gestionar: boolean;
  cerrar: boolean;
  busy: boolean;
  select: (f: Franja) => void;
  action: (
    t: Turno,
    tipo: "cancelar" | "reprogramar" | "atencion" | "ausencia",
  ) => void;
}) {
  const filas: {
    key: string;
    inicio: string;
    fin: string;
    estado: string;
    franja?: Franja;
    turno?: Turno;
  }[] = franjas.map((f) => {
    const turno = turnos.find(
      (t) => t.franjaId === f.id && t.estado !== "CANCELADO",
    );
    return {
      key: `f-${f.id}`,
      inicio: f.inicio,
      fin: f.fin,
      estado: turno?.estado ?? f.estado,
      franja: f,
      turno,
    };
  });
  turnos
    .filter(
      (t) =>
        t.estado === "CANCELADO" || !franjas.some((f) => f.id === t.franjaId),
    )
    .forEach((t) =>
      filas.push({
        key: `t-${t.id}`,
        inicio: t.inicio,
        fin: t.fin,
        estado: t.estado,
        turno: t,
      }),
    );
  const visibles = filas
    .sort((a, b) => a.inicio.localeCompare(b.inicio))
    .filter(
      (f) =>
        filtro === "TODOS" ||
        (filtro === "RESERVADO"
          ? f.estado === "RESERVADO" || f.estado === "CONFIRMADO"
          : f.estado === filtro),
    );
  return (
    <div className="timeline">
      {!visibles.length && (
        <div className="empty-state">
          <Icon name="calendar" size={36} />
          <h3>
            {filas.length
              ? "No hay resultados para este filtro"
              : "No hay franjas para esta fecha"}
          </h3>
          <p>
            {filas.length
              ? "Elegí otro estado para ver la agenda."
              : "Las franjas aparecerán cuando se configure y genere la disponibilidad."}
          </p>
        </div>
      )}
      {visibles.map(({ key, inicio, fin, estado, franja, turno }) => {
        const visual = estadoVisual(franja, turno, excepciones);
        return (
        <article
          key={key}
          className={`appointment status-${visual.clase} ${franja && selected === franja.id && !turno ? "is-selected" : ""}`}
        >
          <div className="time-box">
            <strong>{hora(inicio)}</strong>
            <span>{hora(fin)}</span>
          </div>
          <div className="appointment-body">
            <div className="appointment-title">
              <h3>
                {turno?.paciente ??
                  (visual.clase === "consultorio"
                    ? "Horario cerrado por el consultorio"
                    : estado === "LIBRE"
                    ? "Franja libre disponible"
                    : estado === "BLOQUEADA"
                      ? "Horario bloqueado"
                      : "Horario ocupado")}
              </h3>
              <span className={`badge status-${visual.clase}`}>
                {visual.etiqueta}
              </span>
            </div>
            <p>
              {turno?.motivoConsulta ||
                (visual.clase === "consultorio"
                  ? "No disponible para asignar turnos."
                  : estado === "LIBRE"
                  ? franja && reservable(franja)
                    ? "Seleccioná este horario para asignar un turno."
                    : visual.etiqueta
                  : estado === "BLOQUEADA"
                    ? "No disponible para asignar turnos."
                    : "Sin motivo informado.")}
            </p>
            {turno?.motivoCancelacion && <p>Motivo de cancelación: {turno.motivoCancelacion}</p>}
            {turno?.estado === "CANCELADO" && turno.origenCancelacion === "CONSULTORIO" && gestionar && <button className="text-button" disabled={busy} onClick={() => action(turno, "reprogramar")}>Reprogramar</button>}
            {turno && activo(turno) && (
              <div className="appointment-actions">
                {gestionar && (
                  <>
                    <button
                      className="text-button"
                      disabled={busy}
                      onClick={() => action(turno, "reprogramar")}
                    >
                      Reprogramar
                    </button>
                    <button
                      className="text-button danger-text"
                      disabled={busy}
                      onClick={() => action(turno, "cancelar")}
                    >
                      Cancelar turno
                    </button>
                  </>
                )}
                {cerrar && instanteAgenda(inicio).getTime() <= Date.now() && (
                  <>
                    <button
                      className="text-button"
                      disabled={busy}
                      onClick={() => action(turno, "atencion")}
                    >
                      Marcar atendido
                    </button>
                    <button
                      className="text-button"
                      disabled={busy}
                      onClick={() => action(turno, "ausencia")}
                    >
                      Marcar ausente
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
          {gestionar && !turno && franja && reservable(franja) && !cierreDelHorario(inicio, fin, excepciones) && (
            <button
              className={
                selected === franja.id ? "primary small" : "secondary small"
              }
              disabled={busy}
              onClick={() => select(franja)}
            >
              <Icon
                name={selected === franja.id ? "check" : "plus"}
                size={16}
              />
              {selected === franja.id ? "Seleccionado" : "Asignar"}
            </button>
          )}
        </article>
      ); })}
    </div>
  );
}
