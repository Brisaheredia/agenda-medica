export function LeyendaAgenda() {
  return (
    <div className="availability-legend" aria-label="Colores de la agenda">
      <span><i className="availability-dot consultorio" />Cancelación o cierre del consultorio</span>
      <span><i className="availability-dot paciente" />Cancelación del paciente</span>
      <span><i className="availability-dot available" />Horarios disponibles</span>
      <span><i className="availability-dot ocupado" />Turnos ocupados</span>
      <span><i className="availability-dot neutro" />Sin horarios</span>
    </div>
  );
}
