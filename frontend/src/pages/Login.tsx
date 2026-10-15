import { Brand } from "../components/Brand";

type Props = {
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  busy: boolean;
  mensaje: { tipo: "error" | "success"; texto: string } | null;
  ingresar: (event: React.FormEvent<HTMLFormElement>) => void;
};

export function LoginPage({
  email,
  setEmail,
  password,
  setPassword,
  busy,
  mensaje,
  ingresar,
}: Props) {
  return (
    <main className="login-shell">
      <section className="login-card card">
        <Brand />
        <p className="eyebrow">CONSULTORIO DR. SALVADOR AMADO</p>
        <h1>Tu agenda, en orden.</h1>
        <p className="muted">Ingresá para gestionar pacientes y turnos.</p>
        <form className="stack" onSubmit={ingresar}>
          <fieldset disabled={busy}>
            <label>
              Email
              <input
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <label>
              Contraseña
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            <button className="primary full">
              {busy ? "Ingresando…" : "Ingresar"}
            </button>
          </fieldset>
        </form>
        {mensaje && (
          <p className={`alert ${mensaje.tipo}`} role="alert">
            {mensaje.texto}
          </p>
        )}
        <p className="login-footer">Agenda Médica · Gestión del consultorio</p>
      </section>
    </main>
  );
}
