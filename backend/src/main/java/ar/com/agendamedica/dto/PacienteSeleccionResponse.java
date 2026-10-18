package ar.com.agendamedica.dto;

/** Datos mínimos para seleccionar un paciente existente al reservar. */
public record PacienteSeleccionResponse(Long id, String dni, String nombre, String apellido, boolean activo) {
    public static PacienteSeleccionResponse from(PacienteResponse paciente) {
        return new PacienteSeleccionResponse(paciente.id(), paciente.dni(), paciente.nombre(), paciente.apellido(), paciente.activo());
    }
}
