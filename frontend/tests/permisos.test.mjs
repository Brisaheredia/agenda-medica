import assert from "node:assert/strict";
import { after, test } from "node:test";
import { createServer } from "vite";

const server = await createServer({ server: { middlewareMode: true, ws: false, hmr: false }, appType: "custom" });
after(() => server.close());
const { permisosDe } = await server.ssrLoadModule("/src/permisos.ts");
const { default: App } = await server.ssrLoadModule("/src/App.tsx");
const { BookingPanel } = await server.ssrLoadModule("/src/components/BookingPanel.tsx");
const { TurnoDialog } = await server.ssrLoadModule("/src/components/TurnoDialog.tsx");
const { Agenda } = await server.ssrLoadModule("/src/components/ListaTurnos.tsx");
const { BadgeReprogramacion } = await server.ssrLoadModule("/src/components/BadgeReprogramacion.tsx");
const { AppLayout } = await server.ssrLoadModule("/src/components/AppLayout.tsx");
const { franjasParaMostrar } = await server.ssrLoadModule("/src/lib/agendaVisual.ts");
const { createElement } = await import("react");
const { renderToStaticMarkup } = await import("react-dom/server");
const api = async () => [];
const noop = () => {};

function pantalla(rol, pathname) {
  globalThis.localStorage = { getItem: () => JSON.stringify({ token: "token-de-prueba", email: "prueba@example.test", rol }) };
  globalThis.window = { location: { pathname, search: "", origin: "http://localhost" } };
  return renderToStaticMarkup(createElement(App));
}

for (const rol of ["ADMIN", "MEDICO", "RECEPCION", "OBRAS_SOCIALES"]) {
  test(`Menús, rutas y acciones de ${rol}`, () => {
    const permisos = permisosDe(rol);
    const agenda = pantalla(rol, "/");
    assert.equal(agenda.includes('href="/usuarios"'), permisos.administrar);
    assert.equal(agenda.includes('href="/auditoria"'), permisos.administrar);
    assert.equal(agenda.includes('href="/bloqueos"'), permisos.gestionarHorarios);
    assert.equal(agenda.includes('href="/pacientes"'), permisos.verContactos);
    assert.equal(agenda.includes('href="/reprogramaciones"'), permisos.verContactos);
    assert.equal(agenda.includes("Asignar turno"), permisos.gestionarTurnos);
    const disponibilidad = pantalla(rol, "/disponibilidad");
    assert.equal(disponibilidad.includes("Guardar configuración"), permisos.administrar);
    assert.equal(disponibilidad.includes("Guardar horario para"), permisos.gestionarHorarios);
    assert.ok(!disponibilidad.includes("40 minutos"));
    const usuarios = pantalla(rol, "/usuarios");
    assert.equal(usuarios.includes("Nuevo usuario"), permisos.administrar);
    assert.equal(usuarios.includes("Acceso restringido"), !permisos.administrar);
    const bloqueos = pantalla(rol, "/bloqueos");
    assert.equal(bloqueos.includes("Crear bloqueo"), permisos.gestionarHorarios);
    const reserva = renderToStaticMarkup(createElement(BookingPanel, { api, franjas: [], selected: null,
      select: noop, busy: false, ready: true, irAFranja: noop, reservar: api, gestionarPacientes: permisos.gestionarPacientes }));
    assert.equal(reserva.includes("Nuevo paciente"), permisos.gestionarPacientes);
    assert.equal(reserva.includes("Motivo de consulta"), permisos.gestionarPacientes);
    const dialogo = renderToStaticMarkup(createElement(TurnoDialog, { api, busy: false, tipo: "cancelar",
      turno: { id: 1, paciente: "Prueba", inicio: "2099-01-05T08:00:00" }, close: noop, submit: api,
      cancelarPorConsultorio: permisos.cancelarPorConsultorio }));
    assert.equal(dialogo.includes('value="CONSULTORIO"'), permisos.cancelarPorConsultorio);
    const lista = renderToStaticMarkup(createElement(Agenda, { franjas: [], excepciones: [], filtro: "TODOS",
      turnos: [{ id: 1, paciente: "Prueba", inicio: "2000-01-05T08:00:00", fin: "2000-01-05T08:40:00", estado: "RESERVADO" }],
      selected: undefined, gestionar: permisos.gestionarTurnos, cerrar: permisos.registrarResultados,
      busy: false, select: noop, action: noop }));
    assert.equal(lista.includes("Reprogramar"), permisos.gestionarTurnos);
    assert.equal(lista.includes("Cancelar turno"), permisos.gestionarTurnos);
    assert.equal(lista.includes("Marcar atendido"), permisos.registrarResultados);
    assert.equal(lista.includes("Marcar ausente"), permisos.registrarResultados);
  });
}

test("La matriz conserva la separación entre turnos, horarios y resultados", () => {
  assert.equal(permisosDe("MEDICO").gestionarTurnos, false);
  assert.equal(permisosDe("RECEPCION").registrarResultados, true);
  assert.equal(permisosDe("OBRAS_SOCIALES").registrarResultados, false);
  assert.equal(permisosDe(undefined).administrar, false);
});

test("El aviso de Reprogramaciones muestra pendientes y desaparece al resolverlos", () => {
  const renderMenu = (pendientes) => renderToStaticMarkup(createElement(AppLayout, {
    menu: [{ icon: "calendar", label: "Reprogramaciones", href: "/reprogramaciones", pendientes }],
    profesional: null, sesion: { email: "recepcion@example.test", rol: "RECEPCION", token: "prueba" },
    busy: false, salir: noop, navigate: noop, children: null,
  }));
  const conPendientes = renderMenu(2);
  assert.ok(conPendientes.includes('class="nav-pending"'));
  assert.ok(conPendientes.includes('aria-label="2 turnos pendientes de reprogramar"'));
  assert.ok(renderMenu(1).includes('aria-label="1 turno pendiente de reprogramar"'));
  assert.ok(!renderMenu(0).includes('class="nav-pending"'));
  assert.ok(!renderMenu(undefined).includes('class="nav-pending"'));
});

test("El badge distingue reprogramación del consultorio y movimiento solicitado por el paciente", () => {
  const base = { id: 1, franjaId: 1, paciente: "Paciente", estado: "RESERVADO",
    inicio: "2099-01-05T08:00:00", fin: "2099-01-05T08:40:00" };
  const etiqueta = "Reprogramado por el consultorio";
  const marcado = { ...base, reprogramadoPorConsultorio: true };
  assert.ok(renderToStaticMarkup(createElement(BadgeReprogramacion, { turno: marcado })).includes(etiqueta));
  for (const turno of [base, { ...base, reprogramadoPorConsultorio: false }, { ...base, origenCancelacion: "CONSULTORIO" }]) {
    assert.equal(renderToStaticMarkup(createElement(BadgeReprogramacion, { turno })), "");
  }
  const lista = (turno) => renderToStaticMarkup(createElement(Agenda, { franjas: [], turnos: [turno], excepciones: [],
    filtro: "TODOS", selected: undefined, gestionar: true, cerrar: false, busy: false, select: noop, action: noop }));
  assert.ok(lista(marcado).includes(etiqueta));
  assert.ok(!lista(base).includes(etiqueta));
});

test("Disponibilidad prioriza días y horarios y ubica configuración en la columna derecha", () => {
  const html = pantalla("ADMIN", "/disponibilidad");
  const dias = html.indexOf("1. Días y horario de atención");
  const columnaDerecha = html.indexOf('class="availability-right"');
  const configuracion = html.indexOf("Configuración de agenda");
  const calendario = html.indexOf("Agenda semanal");
  assert.ok(dias < columnaDerecha && columnaDerecha < configuracion && configuracion < calendario);
  assert.match(html, /value="45"/);
  assert.ok(!html.includes("Todos los turnos duran"));
  assert.ok(!html.includes("Cada turno dura"));
});

test("La agenda oculta horarios viejos vacíos y conserva pacientes e historial", () => {
  const franja = (id, minutos, estado = "LIBRE") => ({ id, profesionalId: 1, estado,
    inicio: "2099-01-05T08:00:00", fin: `2099-01-05T08:${minutos}:00`, origen: "PLANTILLA" });
  const franjas = [franja(1, 30), franja(2, 40), franja(3, 30), franja(4, 30), franja(5, 30, "BLOQUEADA")];
  const turnos = [
    { id: 1, franjaId: 3, paciente: "Paciente con reserva", estado: "RESERVADO", inicio: franjas[2].inicio, fin: franjas[2].fin },
    { id: 2, franjaId: 4, paciente: "Paciente que canceló", estado: "CANCELADO", origenCancelacion: "PACIENTE", inicio: franjas[3].inicio, fin: franjas[3].fin },
  ];
  const visibles = franjasParaMostrar(franjas, turnos);
  assert.deepEqual(visibles.map((f) => f.id), [2, 3, 5]);
  const html = renderToStaticMarkup(createElement(Agenda, { franjas: visibles, turnos, excepciones: [],
    filtro: "TODOS", selected: undefined, gestionar: true, cerrar: false, busy: false, select: noop, action: noop }));
  assert.ok(html.includes("Paciente con reserva"));
  assert.ok(html.includes("Paciente que canceló"));
  assert.ok(html.includes("Horario disponible"));
  assert.ok(html.includes("Cerrado por el consultorio"));
  assert.ok(!html.includes("Franja antigua"));
  assert.ok(!html.includes("no reservable"));
  assert.equal(franjas.length, 5);
  assert.equal(turnos.length, 2);
});
