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
