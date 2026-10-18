import { instanteAgenda } from "./lib/fechas";
export { hoy, moverDia, hora, fechaLarga, fechaCorta, fechaHora, lunesDe, instanteAgenda } from "./lib/fechas";

export type Rol = "ADMIN" | "RECEPCION" | "MEDICO" | "OBRAS_SOCIALES";
export type Sesion = { token: string; email: string; rol: Rol };
export type Profesional = {
  id: number;
  nombre: string;
  apellido: string;
  activo: boolean;
};
export type Paciente = {
  id: number;
  dni: string;
  nombre: string;
  apellido: string;
  telefono?: string;
  email?: string;
  activo: boolean;
};
export type NuevoPaciente = {
  dni: string;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
};
export type Franja = {
  id: number;
  profesionalId: number;
  inicio: string;
  fin: string;
  estado: "LIBRE" | "OCUPADA" | "BLOQUEADA";
  origen: string;
};
export type Turno = {
  id: number;
  pacienteId: number;
  paciente: string;
  profesionalId: number;
  franjaId: number;
  inicio: string;
  fin: string;
  estado: "RESERVADO" | "CONFIRMADO" | "CANCELADO" | "ATENDIDO" | "AUSENTE";
  motivoConsulta?: string;
  origenCancelacion?: "PACIENTE" | "CONSULTORIO" | null;
  motivoCancelacion?: string | null;
  reprogramadoPorConsultorio?: boolean;
};
export type ExcepcionAgenda = {
  id: number;
  profesionalId: number;
  fecha: string;
  horaInicio: string | null;
  horaFin: string | null;
  tipo: "CIERRE" | "APERTURA";
  motivo: string | null;
};
export type TurnoAfectado = {
  turno: Turno;
  dni: string;
  telefono: string | null;
  email: string | null;
  motivo: string | null;
};
export type Filtro =
  | "TODOS"
  | "LIBRE"
  | "RESERVADO"
  | "ATENDIDO"
  | "AUSENTE"
  | "BLOQUEADA"
  | "CANCELADO";
export const activo = (turno: Turno) =>
  turno.estado === "RESERVADO" || turno.estado === "CONFIRMADO";
export const reservable = (franja: Franja) =>
  franja.estado === "LIBRE" && instanteAgenda(franja.inicio).getTime() > Date.now()
  && instanteAgenda(franja.fin).getTime() - instanteAgenda(franja.inicio).getTime() === 40 * 60_000;
export const etiquetas: Record<string, string> = {
  LIBRE: "Disponible",
  OCUPADA: "Ocupado",
  BLOQUEADA: "Bloqueado",
  RESERVADO: "Reservado",
  CONFIRMADO: "Confirmado",
  ATENDIDO: "Atendido",
  AUSENTE: "Ausente",
  CANCELADO: "Cancelado",
};
