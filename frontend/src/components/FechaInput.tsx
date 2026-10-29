import { useEffect, useRef, useState } from "react";
import { esDiaDeAtencion, finDeMes, meses } from "../lib/fechas";

type Props = {
  value: string;
  onChange: (fecha: string) => void;
  min?: string;
  max?: string;
  required?: boolean;
  disabled?: boolean;
  soloDiasHabiles?: boolean;
  "aria-label"?: string;
};

function partesDe(fecha: string) {
  const [anio = "", mes = "", dia = ""] = fecha.split("-");
  return { anio, mes, dia };
}

/** Selector de fecha civil en español, independiente del idioma del navegador. */
export function FechaInput({ value, onChange, min, max, required, disabled, soloDiasHabiles = false, "aria-label": nombre = "Fecha" }: Props) {
  const [partes, setPartes] = useState(() => partesDe(value));
  const diaInput = useRef<HTMLSelectElement>(null);
  useEffect(() => setPartes(partesDe(value)), [value]);
  const mesCompleto = /^\d{4}$/.test(partes.anio) && Number(partes.anio) > 0 && partes.mes;
  const cantidadDias = mesCompleto ? Number(finDeMes(`${partes.anio}-${partes.mes}`).slice(8)) : 31;
  const fecha = mesCompleto && partes.dia ? `${partes.anio}-${partes.mes}-${partes.dia}` : "";
  const fueraDeRango = !!fecha && ((!!min && fecha < min) || (!!max && fecha > max));

  useEffect(() => {
    const incompleta = (partes.dia || partes.mes || partes.anio) && !fecha;
    diaInput.current?.setCustomValidity(incompleta ? "Completá día, mes y año de cuatro dígitos."
      : fueraDeRango ? "La fecha está fuera del período permitido." : "");
  }, [fueraDeRango, fecha, partes]);

  function cambiar(campo: keyof typeof partes, valor: string) {
    const siguientes = { ...partes, [campo]: valor };
    if (/^\d{4}$/.test(siguientes.anio) && Number(siguientes.anio) > 0 && siguientes.mes && siguientes.dia) {
      const ultimo = Number(finDeMes(`${siguientes.anio}-${siguientes.mes}`).slice(8));
      siguientes.dia = String(Math.min(Number(siguientes.dia), ultimo)).padStart(2, "0");
      // Si cambia el mes o el año y el día pasa a ser fin de semana,
      // elegimos el siguiente hábil del mes (o el anterior si no queda otro).
      if (soloDiasHabiles && campo !== "dia") {
        let numero = Number(siguientes.dia);
        while (numero <= ultimo && !esDiaDeAtencion(`${siguientes.anio}-${siguientes.mes}-${String(numero).padStart(2, "0")}`)) numero++;
        if (numero > ultimo) {
          numero = Number(siguientes.dia) - 1;
          while (numero > 0 && !esDiaDeAtencion(`${siguientes.anio}-${siguientes.mes}-${String(numero).padStart(2, "0")}`)) numero--;
        }
        siguientes.dia = String(numero).padStart(2, "0");
      }
      const elegida = `${siguientes.anio}-${siguientes.mes}-${siguientes.dia}`;
      if ((!min || elegida >= min) && (!max || elegida <= max) &&
        (!soloDiasHabiles || esDiaDeAtencion(elegida))) onChange(elegida);
    } else if (!siguientes.anio && !siguientes.mes && !siguientes.dia) {
      onChange("");
    }
    setPartes(siguientes);
  }

  return <div className="date-input" role="group" aria-label={nombre} lang="es-AR">
    <select ref={diaInput} aria-label={`${nombre}: día`} required={required || !!partes.mes || !!partes.anio}
      disabled={disabled} value={partes.dia} onChange={(e) => cambiar("dia", e.target.value)}>
      <option value="">Día</option>
      {Array.from({ length: cantidadDias }, (_, indice) => {
        const dia = String(indice + 1).padStart(2, "0");
        return <option key={dia} value={dia}
          disabled={!!soloDiasHabiles && !!mesCompleto && !esDiaDeAtencion(`${partes.anio}-${partes.mes}-${dia}`)}>{indice + 1}</option>;
      })}
    </select>
    <select aria-label={`${nombre}: mes`} required={required || !!partes.dia || !!partes.anio}
      disabled={disabled} value={partes.mes} onChange={(e) => cambiar("mes", e.target.value)}>
      <option value="">Mes</option>
      {meses.map((mes, indice) => <option key={mes} value={String(indice + 1).padStart(2, "0")}>{mes}</option>)}
    </select>
    <input type="number" inputMode="numeric" aria-label={`${nombre}: año`} placeholder="Año" min={min ? Number(min.slice(0, 4)) : 1}
      max={max ? Number(max.slice(0, 4)) : 9999} required={required || !!partes.dia || !!partes.mes}
      disabled={disabled} value={partes.anio} onChange={(e) => cambiar("anio", e.target.value)} />
    {!required && (partes.dia || partes.mes || partes.anio) && <button type="button" className="text-button date-clear"
      aria-label={`Limpiar ${nombre.toLocaleLowerCase("es-AR")}`} disabled={disabled}
      onClick={() => { setPartes(partesDe("")); onChange(""); }}>Limpiar</button>}
  </div>;
}
