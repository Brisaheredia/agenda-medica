import { useEffect, useState } from "react";
import { detalleError } from "../api";
import { hoy, moverDia } from "../types";
import { CalendarioSemanalDisponibilidad } from "../components/CalendarioSemanalDisponibilidad";
import { Icon } from "../components/Icon";

type Props = {
  profesionalId: number | undefined;
  esAdmin: boolean;
  busy: boolean;
  api: <T>(path: string, options?: RequestInit) => Promise<T>;
};

type ConfiguracionAgenda = {
  duracionEstandarMin: number;
  horizonteReservaDias: number;
};

const diasSemana = [
  ["MONDAY", "Lunes"],
  ["TUESDAY", "Martes"],
  ["WEDNESDAY", "Miércoles"],
  ["THURSDAY", "Jueves"],
  ["FRIDAY", "Viernes"],
  ["SATURDAY", "Sábado"],
  ["SUNDAY", "Domingo"],
];
const diasLaborables = diasSemana.slice(0, 5).map(([dia]) => dia);

export function DisponibilidadPage({
  profesionalId,
  esAdmin,
  busy,
  api,
}: Props) {
  const [diasSeleccionados, setDiasSeleccionados] = useState(diasLaborables);
  const [horaInicio, setHoraInicio] = useState("08:00");
  const [horaFin, setHoraFin] = useState("20:00");
  const [duracionMin, setDuracionMin] = useState<number | null>(null);
  const [configuracion, setConfiguracion] = useState<ConfiguracionAgenda | null>(null);
  const [horizonteDias, setHorizonteDias] = useState(90);
  const [guardandoConfiguracion, setGuardandoConfiguracion] = useState(false);
  const [vigenciaDesde, setVigenciaDesde] = useState(hoy());
  const [vigenciaHasta, setVigenciaHasta] = useState("");
  const [desde, setDesde] = useState(hoy());
  const [hasta, setHasta] = useState(moverDia(hoy(), 30));
  const [guardandoPlantilla, setGuardandoPlantilla] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [revisionCalendario, setRevisionCalendario] = useState(0);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const operando = busy || guardandoConfiguracion || guardandoPlantilla || generando;
  useEffect(() => {
    const controller = new AbortController();
    api<ConfiguracionAgenda>(
      "/api/configuracion/agenda",
      { signal: controller.signal },
    )
      .then((config) => {
        setConfiguracion(config);
        setDuracionMin(config.duracionEstandarMin);
        setHorizonteDias(config.horizonteReservaDias);
        setHasta(moverDia(hoy(), Math.min(30, config.horizonteReservaDias)));
      })
      .catch((e) => {
        if (e instanceof Error && e.name !== "AbortError")
          setError(detalleError(e));
      });
    return () => controller.abort();
  }, [api]);

  async function guardarConfiguracion(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!esAdmin || operando || duracionMin === null) return;
    setGuardandoConfiguracion(true);
    setError("");
    setMensaje("");
    try {
      const guardada = await api<ConfiguracionAgenda>("/api/configuracion/agenda", {
        method: "PUT",
        body: JSON.stringify({
          duracionEstandarMin: duracionMin,
          horizonteReservaDias: horizonteDias,
        }),
      });
      setConfiguracion(guardada);
      setDuracionMin(guardada.duracionEstandarMin);
      setHorizonteDias(guardada.horizonteReservaDias);
      setMensaje("Configuración de agenda guardada.");
    } catch (e) {
      setError(detalleError(e));
    } finally {
      setGuardandoConfiguracion(false);
    }
  }
  async function guardarPlantilla(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!esAdmin || !profesionalId || operando || !configuracion || !diasSeleccionados.length) return;
    if (horaFin <= horaInicio) {
      setError("El horario de fin debe ser posterior al de inicio.");
      return;
    }
    setGuardandoPlantilla(true);
    setMensaje("");
    setError("");
    const guardados: string[] = [];
    const elegidos = diasSemana.filter(([dia]) => diasSeleccionados.includes(dia));
    try {
      for (const [diaSemana] of elegidos) {
        await api("/api/agenda/plantillas", {
          method: "POST",
          body: JSON.stringify({
            profesionalId,
            diaSemana,
            horaInicio,
            horaFin,
            duracionMin: configuracion.duracionEstandarMin,
            vigenciaDesde,
            vigenciaHasta: vigenciaHasta || null,
          }),
        });
        guardados.push(diaSemana);
      }
      setMensaje(
        `Horario guardado para ${elegidos.map(([, nombre]) => nombre.toLocaleLowerCase("es-AR")).join(", ")}, de ${horaInicio} a ${horaFin}. Ahora elegí las fechas y habilitá los horarios para reservar.`,
      );
    } catch (e) {
      setDiasSeleccionados((dias) => dias.filter((dia) => !guardados.includes(dia)));
      const resumen = guardados.length
        ? `Se guardaron ${guardados.length} días. Quedaron seleccionados solamente los pendientes para volver a intentar. `
        : "No se guardó ningún día. ";
      setError(resumen + detalleError(e));
    } finally {
      setGuardandoPlantilla(false);
    }
  }

  async function generarFranjas(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!esAdmin || !profesionalId || operando || !configuracion) return;
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
      setRevisionCalendario((revision) => revision + 1);
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

      <CalendarioSemanalDisponibilidad
        profesionalId={profesionalId}
        api={api}
        revision={revisionCalendario}
      />

      <form
        className="card agenda-settings-form"
        onSubmit={guardarConfiguracion}
      >
        <div className="panel-heading">
          <div>
            <h2>Configuración de agenda</h2>
            <p>
              Valores iniciales para nuevas plantillas y el período máximo de
              reserva.
            </p>
          </div>
          <Icon name="clock" />
        </div>
        <fieldset disabled={!esAdmin || operando || !configuracion}>
          <div className="availability-fields">
            <label>
              Duración estándar de turno (minutos)
              <input
                type="number"
                min="5"
                max="240"
                step="5"
                required
                value={duracionMin ?? ""}
                onChange={(e) => setDuracionMin(e.target.value ? Number(e.target.value) : null)}
              />
            </label>
            <label>
              Anticipación máxima para reservar (días)
              <input
                type="number"
                min="1"
                max="365"
                required
                value={horizonteDias}
                onChange={(e) => setHorizonteDias(Number(e.target.value))}
              />
            </label>
          </div>
          <button
            className="primary"
            disabled={!esAdmin || operando || !configuracion}
          >
            {guardandoConfiguracion ? "Guardando…" : "Guardar configuración"}
          </button>
        </fieldset>
      </form>

      <div className="availability-forms">
        <form className="card availability-form" onSubmit={guardarPlantilla}>
          <div className="panel-heading">
            <div>
              <h2>1. Días y horario de atención</h2>
              <p>Elegí los días que comparten el mismo horario y guardalos juntos.</p>
            </div>
            <Icon name="clock" />
          </div>
          <fieldset
            disabled={!esAdmin || operando || !profesionalId || !configuracion}
          >
            <div className="availability-day-selection" role="group" aria-labelledby="attention-days-label">
              <span id="attention-days-label" className="availability-field-label">Días de atención</span>
              <div className="availability-day-presets">
                <button type="button" className="secondary small" onClick={() => setDiasSeleccionados([...diasLaborables])}>
                  Lunes a viernes
                </button>
                <button type="button" className="text-button" onClick={() => setDiasSeleccionados(diasSemana.map(([dia]) => dia))}>
                  Toda la semana
                </button>
                <button type="button" className="text-button" onClick={() => setDiasSeleccionados([])}>
                  Limpiar
                </button>
              </div>
              <div className="availability-day-options">
                {diasSemana.map(([dia, nombre]) => (
                  <label key={dia} className="availability-day-option">
                    <input
                      type="checkbox"
                      checked={diasSeleccionados.includes(dia)}
                      onChange={(event) => setDiasSeleccionados((dias) =>
                        event.target.checked ? [...dias, dia] : dias.filter((elegido) => elegido !== dia),
                      )}
                    />
                    {nombre}
                  </label>
                ))}
              </div>
              {!diasSeleccionados.length && <p className="muted">Seleccioná al menos un día para guardar el horario.</p>}
            </div>
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
            </div>
            <p className="booking-note">
              {configuracion
                ? `Cada turno durará ${configuracion.duracionEstandarMin} minutos, según la configuración guardada. Para cambiar la duración, guardá primero la configuración de agenda.`
                : "Cargando la duración de los turnos…"}
            </p>
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
            <button className="primary" disabled={!profesionalId || !diasSeleccionados.length}>
              {guardandoPlantilla ? "Guardando…" : `Guardar horario para ${diasSeleccionados.length} ${diasSeleccionados.length === 1 ? "día" : "días"}`}
            </button>
          </fieldset>
        </form>

        <form className="card availability-form" onSubmit={generarFranjas}>
          <div className="panel-heading">
            <div>
              <h2>2. Habilitar horarios para reservar</h2>
              <p>
                Después de guardar los días y horarios, elegí en qué fechas se podrán reservar turnos.
              </p>
            </div>
            <Icon name="calendar" />
          </div>
          <fieldset disabled={!esAdmin || operando || !profesionalId || !configuracion}>
            <div className="availability-fields">
              <label>
                Desde
                <input
                  type="date"
                  max={moverDia(hoy(), configuracion?.horizonteReservaDias ?? 0)}
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
                  max={moverDia(hoy(), configuracion?.horizonteReservaDias ?? 0)}
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
              {generando ? "Habilitando…" : "Habilitar horarios"}
            </button>
          </fieldset>
        </form>
      </div>
    </section>
  );
}
