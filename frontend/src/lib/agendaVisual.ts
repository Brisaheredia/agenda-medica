import type { ExcepcionAgenda, Franja, Turno } from "../types";
import { moverDia, reservable, instanteAgenda } from "../types";

export function franjasParaMostrar(franjas: Franja[], turnos: Turno[]) {
  const franjasConTurno = new Set(
    turnos.filter((turno) => turno.estado !== "CANCELADO").map((turno) => turno.franjaId),
  );
  return franjas.filter((franja) =>
    franja.estado !== "LIBRE" || franjasConTurno.has(franja.id)
    || instanteAgenda(franja.fin).getTime() - instanteAgenda(franja.inicio).getTime() === 40 * 60_000,
  );
}

export function cierreDelHorario(inicio: string, fin: string, excepciones: ExcepcionAgenda[]) {
  return excepciones.find((excepcion) => {
    if (excepcion.tipo !== "CIERRE") return false;
    const desde = `${excepcion.fecha}T${excepcion.horaInicio ?? "00:00:00"}`;
    const hasta = excepcion.horaFin ? `${excepcion.fecha}T${excepcion.horaFin}` : `${moverDia(excepcion.fecha, 1)}T00:00:00`;
    return instanteAgenda(inicio) < instanteAgenda(hasta) && instanteAgenda(fin) > instanteAgenda(desde);
  });
}

export function estadoVisual(franja?: Franja, turno?: Turno, excepciones: ExcepcionAgenda[] = []) {
  if (turno?.estado === "CANCELADO") {
    if (turno.origenCancelacion === "CONSULTORIO") return { clase: "consultorio", etiqueta: "Cancelado por el consultorio" };
    if (turno.origenCancelacion === "PACIENTE") return { clase: "paciente", etiqueta: "Cancelado por el paciente" };
    return { clase: "neutro", etiqueta: "Cancelado · origen sin registrar" };
  }
  if (turno?.estado === "ATENDIDO") return { clase: "ocupado", etiqueta: "Atendido" };
  if (turno?.estado === "AUSENTE") return { clase: "ocupado", etiqueta: "Ausente" };
  const inicio = turno?.inicio ?? franja?.inicio;
  const fin = turno?.fin ?? franja?.fin;
  if (inicio && fin && cierreDelHorario(inicio, fin, excepciones)) {
    return { clase: "consultorio", etiqueta: turno ? "Pendiente de reprogramar" : "Cerrado por el consultorio" };
  }
  if (franja?.estado === "BLOQUEADA") return { clase: "consultorio", etiqueta: "Cerrado por el consultorio" };
  if (turno || franja?.estado === "OCUPADA") return { clase: "ocupado", etiqueta: "Turno ocupado" };
  if (franja && reservable(franja)) return { clase: "libre", etiqueta: "Horario disponible" };
  return { clase: "neutro", etiqueta: franja && instanteAgenda(franja.inicio).getTime() > Date.now()
    ? "Horario no disponible" : "Horario pasado" };
}
