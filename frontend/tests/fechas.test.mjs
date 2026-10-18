import assert from "node:assert/strict";
import { after, test } from "node:test";
import { createServer } from "vite";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const server = await createServer({ server: { middlewareMode: true, ws: false, hmr: false }, appType: "custom" });
after(() => server.close());
const fechas = await server.ssrLoadModule("/src/lib/fechas.ts");
const { reservable } = await server.ssrLoadModule("/src/types.ts");
const { FechaInput } = await server.ssrLoadModule("/src/components/FechaInput.tsx");
const { GeneracionMensual } = await server.ssrLoadModule("/src/components/GeneracionMensual.tsx");

test("Hoy corresponde a Buenos Aires cuando UTC ya cambió de día", () => {
  assert.equal(fechas.hoy(new Date("2026-10-18T01:30:00Z")), "2026-10-17");
  assert.equal(fechas.hoy(new Date("2026-10-18T02:59:59Z")), "2026-10-17");
  assert.equal(fechas.hoy(new Date("2026-10-18T03:00:00Z")), "2026-10-18");
});

test("Horarios de API sin offset se interpretan como Buenos Aires", () => {
  assert.equal(fechas.instanteAgenda("2026-10-17T23:40:00").toISOString(), "2026-10-18T02:40:00.000Z");
  assert.equal(fechas.hora("2026-10-17T23:40:00"), "23:40");
  assert.equal(fechas.hora("2026-10-18T02:40:00Z"), "23:40");
  assert.equal(fechas.hora("2026-10-18T00:00:00-03:00"), "00:00");
  assert.equal(fechas.instanteAgenda("2026-10-17T23:40:00-03:00").toISOString(), "2026-10-18T02:40:00.000Z");
});

test("Navegar por fechas civiles conserva días y meses en español", () => {
  assert.equal(fechas.moverDia("2026-12-31", 1), "2027-01-01");
  assert.equal(fechas.moverDia("2028-03-01", -1), "2028-02-29");
  assert.equal(fechas.lunesDe("2026-10-18"), "2026-10-12");
  assert.equal(fechas.fechaLarga("2026-10-17"), "sábado, 17 de octubre de 2026");
  assert.equal(fechas.finDeMes("2028-02"), "2028-02-29");
});

test("Las reservas se comparan con el instante real cerca de medianoche", () => {
  const original = Date.now;
  Date.now = () => new Date("2026-10-18T02:00:00Z").getTime();
  try {
    assert.equal(reservable({ estado: "LIBRE", inicio: "2026-10-17T23:20:00", fin: "2026-10-18T00:00:00" }), true);
    assert.equal(reservable({ estado: "LIBRE", inicio: "2026-10-17T22:40:00", fin: "2026-10-17T23:20:00" }), false);
  } finally { Date.now = original; }
});

test("La generación respeta el último día del horizonte aunque el mes no termine", () => {
  assert.deepEqual(fechas.rangoDelMes("2026-10", "2026-10-17", 45), { desde: "2026-10-17", hasta: "2026-10-31" });
  assert.deepEqual(fechas.rangoDelMes("2026-12", "2026-10-17", 45), { desde: "2026-12-01", hasta: "2026-12-01" });
});

test("Los selectores no dependen del idioma de los calendarios nativos", () => {
  const fecha = renderToStaticMarkup(createElement(FechaInput, { value: "2026-10-17", onChange: () => {}, required: true }));
  assert.ok(fecha.includes("Octubre"));
  assert.ok(fecha.includes('aria-label="Fecha: día"'));
  assert.ok(fecha.includes('aria-label="Fecha: año"'));
  assert.ok(!fecha.includes('type="date"'));
  const mes = renderToStaticMarkup(createElement(GeneracionMensual, { horizonteDias: 45, habilitada: true,
    onBusyChange: () => {}, onConfirmado: () => {}, api: async () => [] }));
  assert.ok(!mes.includes('type="month"'));
  assert.ok(fechas.meses.some((nombre) => mes.includes(`${nombre} de `)));
});
