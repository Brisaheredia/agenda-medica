export const ZONA_AGENDA = "America/Argentina/Buenos_Aires";
export const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

// La API expresa horarios civiles del consultorio sin offset. Buenos Aires usa UTC-3.
export function instanteAgenda(valor: string) {
  const tieneZona = /(?:Z|[+-]\d{2}:\d{2})$/i.test(valor);
  return new Date(tieneZona ? valor : `${valor.includes("T") ? valor : `${valor}T00:00:00`}-03:00`);
}

export function hoy(instante = new Date()) {
  const partes = new Intl.DateTimeFormat("es-AR", {
    timeZone: ZONA_AGENDA, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(instante);
  const valor = (tipo: string) => partes.find((parte) => parte.type === tipo)!.value;
  return `${valor("year")}-${valor("month")}-${valor("day")}`;
}

// Las fechas de calendario se operan como fechas civiles, sin convertirlas a otra zona.
export function moverDia(fecha: string, dias: number) {
  const dia = new Date(`${fecha}T12:00:00Z`);
  dia.setUTCDate(dia.getUTCDate() + dias);
  return dia.toISOString().slice(0, 10);
}

export function lunesDe(fecha: string) {
  const dia = new Date(`${fecha}T12:00:00Z`).getUTCDay();
  return moverDia(fecha, -((dia + 6) % 7));
}

export function finDeMes(mes: string) {
  const dia = new Date(`${mes}-01T12:00:00Z`);
  dia.setUTCMonth(dia.getUTCMonth() + 1);
  dia.setUTCDate(0);
  return dia.toISOString().slice(0, 10);
}

export function rangoDelMes(mes: string, fechaHoy: string, horizonteDias: number) {
  const limite = moverDia(fechaHoy, horizonteDias);
  const fin = finDeMes(mes);
  return {
    desde: `${mes}-01` < fechaHoy ? fechaHoy : `${mes}-01`,
    hasta: fin > limite ? limite : fin,
  };
}

export const hora = (valor: string) => new Intl.DateTimeFormat("es-AR", {
  timeZone: ZONA_AGENDA, hour: "2-digit", minute: "2-digit", hourCycle: "h23",
}).format(instanteAgenda(valor));

export const fechaLarga = (valor: string) => new Intl.DateTimeFormat("es-AR", {
  timeZone: "UTC", weekday: "long", day: "numeric", month: "long", year: "numeric",
}).format(new Date(`${valor}T12:00:00Z`));

export const fechaCorta = (valor: string) => new Intl.DateTimeFormat("es-AR", {
  timeZone: "UTC", weekday: "short", day: "numeric", month: "short",
}).format(new Date(`${valor}T12:00:00Z`));

export const fechaHora = (valor: string) => new Intl.DateTimeFormat("es-AR", {
  timeZone: ZONA_AGENDA, dateStyle: "medium", timeStyle: "short",
}).format(instanteAgenda(valor));
