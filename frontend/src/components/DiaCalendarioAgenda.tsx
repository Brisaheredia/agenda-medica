import type { DiaAgendaRango, Franja, Turno } from "../types";
import { fechaLarga, hora, hoy } from "../types";
import { estadoVisual, franjasParaMostrar } from "../lib/agendaVisual";
import { BadgeReprogramacion } from "./BadgeReprogramacion";

type FilaAgenda = { franja?: Franja; turno?: Turno };

const diasSemana = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

function filasDelDia(dia?: DiaAgendaRango): FilaAgenda[] {
  if (!dia) return [];
  const franjas = franjasParaMostrar(dia.franjas, dia.turnos);
  const porFranja = new Map(
    dia.turnos.filter((turno) => turno.estado !== "CANCELADO")
      .map((turno) => [turno.franjaId, turno]),
  );
  const idsFranja = new Set(franjas.map((franja) => franja.id));
  const filas: FilaAgenda[] = franjas.map((franja) => ({
    franja,
    turno: porFranja.get(franja.id),
  }));
  for (const turno of dia.turnos) {
    if (turno.estado === "CANCELADO" || !idsFranja.has(turno.franjaId)) {
      filas.push({ turno });
    }
  }
  return filas.sort((a, b) =>
    (a.turno?.inicio ?? a.franja?.inicio ?? "")
      .localeCompare(b.turno?.inicio ?? b.franja?.inicio ?? ""),
  );
}

export function DiaCalendarioAgenda({
  fecha,
  dia,
  irAlDia,
  verContactos = true,
  cargando = false,
}: {
  fecha: string;
  dia?: DiaAgendaRango;
  irAlDia?: (fecha: string) => void;
  verContactos?: boolean;
  cargando?: boolean;
}) {
  const excepciones = dia?.excepciones ?? [];
  const filas = filasDelDia(dia);
  const cierres = excepciones.filter((excepcion) => excepcion.tipo === "CIERRE");
  const estados = filas.map(({ franja, turno }) =>
    estadoVisual(franja, turno, excepciones).clase,
  );
  const colorDia = cierres.length || estados.includes("consultorio") ? "consultorio"
    : estados.includes("libre") ? "libre"
      : estados.includes("paciente") ? "paciente"
        : estados.includes("ocupado") ? "ocupado" : "neutro";
  const numeroDia = new Date(`${fecha}T12:00:00Z`).getUTCDay();

  return (
    <section
      className={`availability-day day-${colorDia} ${numeroDia === 0 ? "is-sunday" : ""} ${fecha === hoy() ? "is-today" : ""}`}
    >
      <button
        className="agenda-week-day"
        onClick={() => irAlDia?.(fecha)}
        disabled={!irAlDia}
        aria-label={`Abrir agenda del ${fechaLarga(fecha)}`}
        title={irAlDia ? "Abrir agenda del día" : undefined}
      >
        <span>{diasSemana[numeroDia]}</span>
        <strong>{Number(fecha.slice(8, 10))}</strong>
      </button>
      {!cargando && cierres.map((cierre) => (
        <p className="closure-note" key={cierre.id}>
          {cierre.horaInicio
            ? `Cierre ${cierre.horaInicio.slice(0, 5)}–${cierre.horaFin?.slice(0, 5) ?? "fin del día"}`
            : "Día cerrado"}
          {cierre.motivo && <span>{cierre.motivo}</span>}
        </p>
      ))}
      {!cargando && verContactos && colorDia === "consultorio" && (
        <a className="reprogram-link" href="/reprogramaciones">Ver reprogramaciones</a>
      )}
      {cargando ? (
        <p className="availability-empty">Cargando…</p>
      ) : !filas.length ? (
        <p className="availability-empty">Sin horarios</p>
      ) : (
        <ul>
          {filas.map(({ franja, turno }, indice) => {
            const visual = estadoVisual(franja, turno, excepciones);
            const inicio = turno?.inicio ?? franja?.inicio ?? "";
            const fin = turno?.fin ?? franja?.fin;
            return (
              <li
                className={`agenda-week-slot status-${visual.clase}`}
                key={turno ? `t-${turno.id}` : `f-${franja?.id}-${indice}`}
              >
                <strong>{hora(inicio)}{fin ? `–${hora(fin)}` : ""}</strong>
                <span>{turno?.paciente ?? visual.etiqueta}</span>
                {turno && <small>{visual.etiqueta}</small>}
                {turno && <BadgeReprogramacion turno={turno} />}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
