import { useState } from "react";
import { detalleError } from "../api";
import { hoy, moverDia } from "../types";
import { Icon } from "../components/Icon";

type Props = {
  profesionalId: number | undefined;
  esAdmin: boolean;
  busy: boolean;
  api: <T>(path: string, options?: RequestInit) => Promise<T>;
};

const dias = [
  ["MONDAY", "Lunes"],
  ["TUESDAY", "Martes"],
  ["WEDNESDAY", "Miércoles"],
  ["THURSDAY", "Jueves"],
  ["FRIDAY", "Viernes"],
  ["SATURDAY", "Sábado"],
  ["SUNDAY", "Domingo"],
];

export function DisponibilidadPage({
  profesionalId,
  esAdmin,
  busy,
  api,
}: Props) {
  const [diaSemana, setDiaSemana] = useState("MONDAY");
  const [horaInicio, setHoraInicio] = useState("09:00");
  const [horaFin, setHoraFin] = useState("17:00");
  const [duracionMin, setDuracionMin] = useState(30);
  const [vigenciaDesde, setVigenciaDesde] = useState(hoy());
  const [vigenciaHasta, setVigenciaHasta] = useState("");
  const [desde, setDesde] = useState(hoy());
  const [hasta, setHasta] = useState(moverDia(hoy(), 30));
  const [guardandoPlantilla, setGuardandoPlantilla] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  async function guardarPlantilla(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profesionalId || busy || guardandoPlantilla) return;
    setGuardandoPlantilla(true);
    setMensaje("");
    setError("");
    try {
      await api("/api/agenda/plantillas", {
        method: "POST",
        body: JSON.stringify({
          profesionalId,
          diaSemana,
          horaInicio,
          horaFin,
          duracionMin,
          vigenciaDesde,
          vigenciaHasta: vigenciaHasta || null,
        }),
      });
      setMensaje(
        "Plantilla semanal guardada. Ahora podés generar sus franjas para un rango de fechas.",
      );
    } catch (e) {
      setError(detalleError(e));
    } finally {
      setGuardandoPlantilla(false);
    }
  }

  async function generarFranjas(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profesionalId || busy || generando) return;
    setGenerando(true);
    setMensaje("");
    setError("");
    try {
      const resultado = await api<{
        creadas: number;
        existentes: number;
        omitidasPorCierre: number;
      }>("/api/agenda/generar-franjas", {
        method: "POST",
        body: JSON.stringify({ profesionalId, desde, hasta }),
      });
      setMensaje(
        `Franjas generadas: ${resultado.creadas} nuevas, ${resultado.existentes} ya existentes y ${resultado.omitidasPorCierre} omitidas por cierres.`,
      );
    } catch (e) {
      setError(detalleError(e));
    } finally {
      setGenerando(false);
    }
  }

  return (
    <section aria-labelledby="availability-title">
      <div className="page-heading">
        <div>
          <p className="eyebrow">CONFIGURACIÓN DEL CONSULTORIO</p>
          <h1 id="availability-title">Disponibilidad</h1>
          <p className="muted">
            Definí horarios semanales y generá las franjas que se podrán
            reservar.
          </p>
        </div>
        <a className="secondary small" href={`/${window.location.search}`}>
          Volver a la agenda
        </a>
      </div>

      {!esAdmin && (
        <div className="alert error" role="alert">
          El backend permite administrar la disponibilidad únicamente a usuarios
          con rol ADMIN.
        </div>
      )}
      {error && (
        <div className="alert error" role="alert">
          {error}
        </div>
      )}
      {mensaje && (
        <div className="alert success" role="status">
          {mensaje}
        </div>
      )}

      <div className="availability-forms">
        <form className="card availability-form" onSubmit={guardarPlantilla}>
          <div className="panel-heading">
            <div>
              <h2>Plantilla semanal</h2>
              <p>Establecé un horario recurrente para un día de la semana.</p>
            </div>
            <Icon name="clock" />
          </div>
          <fieldset
            disabled={!esAdmin || busy || guardandoPlantilla || !profesionalId}
          >
            <label>
              Día de atención
              <select
                value={diaSemana}
                onChange={(e) => setDiaSemana(e.target.value)}
              >
                {dias.map(([valor, etiqueta]) => (
                  <option key={valor} value={valor}>
                    {etiqueta}
                  </option>
                ))}
              </select>
            </label>
            <div className="availability-fields">
              <label>
                Desde
                <input
                  type="time"
                  required
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)}
                />
              </label>
              <label>
                Hasta
                <input
                  type="time"
                  required
                  value={horaFin}
                  onChange={(e) => setHoraFin(e.target.value)}
                />
              </label>
              <label>
                Duración de cada turno (minutos)
                <input
                  type="number"
                  min="5"
                  step="5"
                  required
                  value={duracionMin}
                  onChange={(e) => setDuracionMin(Number(e.target.value))}
                />
              </label>
            </div>
            <div className="availability-fields">
              <label>
                Vigente desde
                <input
                  type="date"
                  required
                  value={vigenciaDesde}
                  onChange={(e) => setVigenciaDesde(e.target.value)}
                />
              </label>
              <label>
                Vigente hasta <span className="optional">(opcional)</span>
                <input
                  type="date"
                  min={vigenciaDesde}
                  value={vigenciaHasta}
                  onChange={(e) => setVigenciaHasta(e.target.value)}
                />
              </label>
            </div>
            <button className="primary" disabled={!profesionalId}>
              {guardandoPlantilla ? "Guardando…" : "Guardar plantilla"}
            </button>
          </fieldset>
        </form>

        <form className="card availability-form" onSubmit={generarFranjas}>
          <div className="panel-heading">
            <div>
              <h2>Generar franjas</h2>
              <p>
                Aplicá las plantillas guardadas a un período del calendario.
              </p>
            </div>
            <Icon name="calendar" />
          </div>
          <fieldset disabled={!esAdmin || busy || generando || !profesionalId}>
            <div className="availability-fields">
              <label>
                Desde
                <input
                  type="date"
                  required
                  value={desde}
                  onChange={(e) => setDesde(e.target.value)}
                />
              </label>
              <label>
                Hasta
                <input
                  type="date"
                  min={desde}
                  required
                  value={hasta}
                  onChange={(e) => setHasta(e.target.value)}
                />
              </label>
            </div>
            <p className="booking-note">
              Las franjas existentes se conservan. Los cierres configurados en
              la agenda se respetan al generar el calendario.
            </p>
            <button className="primary" disabled={!profesionalId}>
              {generando ? "Generando…" : "Generar disponibilidad"}
            </button>
          </fieldset>
        </form>
      </div>
    </section>
  );
}
