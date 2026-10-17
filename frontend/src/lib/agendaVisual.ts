import type { ExcepcionAgenda, Franja, Turno } from "../types";
import { moverDia, reservable } from "../types";

export function cierreDelHorario(inicio: string, fin: string, excepciones: ExcepcionAgenda[]) {
  return excepciones.find((excepcion) => {
    if (excepcion.tipo !== "CIERRE") return false;
    const desde = `${excepcion.fecha}T${excepcion.horaInicio ?? "00:00:00"}`;
    const hasta = excepcion.horaFin ? `${excepcion.fecha}T${excepcion.horaFin}` : `${moverDia(excepcion.fecha, 1)}T00:00:00`;
    return new Date(inicio) < new Date(hasta) && new Date(fin) > new Date(desde);
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
  return { clase: "neutro", etiqueta: franja && new Date(franja.inicio).getTime() > Date.now()
    ? "Franja antigua · no reservable" : "Horario pasado" };
}
