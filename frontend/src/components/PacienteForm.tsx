import type { NuevoPaciente } from "../types";

type CampoPaciente = keyof NuevoPaciente;

type Props = {
  value: NuevoPaciente;
  busy: boolean;
  submitLabel: string;
  error?: string;
  intro?: string;
  onChange: (campo: CampoPaciente, value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onCancel?: () => void;
};

const campos: {
  id: CampoPaciente;
  etiqueta: string;
  tipo: string;
  maxLength: number;
  requerido?: boolean;
}[] = [
  { id: "dni", etiqueta: "DNI", tipo: "text", maxLength: 20, requerido: true },
  {
    id: "nombre",
    etiqueta: "Nombre",
    tipo: "text",
    maxLength: 100,
    requerido: true,
  },
  {
    id: "apellido",
    etiqueta: "Apellido",
    tipo: "text",
    maxLength: 100,
    requerido: true,
  },
  { id: "telefono", etiqueta: "Teléfono", tipo: "tel", maxLength: 50 },
  { id: "email", etiqueta: "Email", tipo: "email", maxLength: 150 },
];

export function PacienteForm({
  value,
  busy,
  submitLabel,
  error,
  intro,
  onChange,
  onSubmit,
  onCancel,
}: Props) {
  return (
    <form className="stack" onSubmit={onSubmit}>
      {intro && <p className="muted">{intro}</p>}
      <fieldset disabled={busy}>
        <div className="form-grid">
          {campos.map((campo) => (
            <label key={campo.id}>
              {campo.etiqueta}
              <input
                type={campo.tipo}
                required={campo.requerido}
                maxLength={campo.maxLength}
                value={value[campo.id]}
                onChange={(event) => onChange(campo.id, event.target.value)}
              />
            </label>
          ))}
        </div>
        {error && (
          <p className="alert error" role="alert">
            {error}
          </p>
        )}
        <div className="dialog-actions">
          {onCancel && (
            <button type="button" className="secondary" onClick={onCancel}>
              Cancelar
            </button>
          )}
          <button className={`primary ${onCancel ? "" : "full"}`}>
            {submitLabel}
          </button>
        </div>
      </fieldset>
    </form>
  );
}
