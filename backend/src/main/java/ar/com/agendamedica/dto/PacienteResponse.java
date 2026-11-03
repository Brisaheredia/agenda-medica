package ar.com.agendamedica.dto;

import ar.com.agendamedica.domain.entity.Paciente;

public record PacienteResponse(
        Long id,
        String dni,
        String nombre,
        String apellido,
        String telefono,
        String email,
        boolean activo,
        Long obraSocialId,
        String obraSocialNombre
) {
    public static PacienteResponse from(Paciente paciente) {
        return new PacienteResponse(
                paciente.getId(),
                paciente.getDni(),
                paciente.getNombre(),
                paciente.getApellido(),
                paciente.getTelefono(),
                paciente.getEmail(),
                paciente.isActivo(),
                paciente.getObraSocial() == null ? null : paciente.getObraSocial().getId(),
                paciente.getObraSocial() == null ? null : paciente.getObraSocial().getNombre()
        );
    }
}
