package ar.com.agendamedica.dto;

import ar.com.agendamedica.domain.entity.Profesional;

public record ProfesionalResponse(
        Long id,
        String nombre,
        String apellido,
        String matricula,
        boolean activo
) {
    public static ProfesionalResponse from(Profesional profesional) {
        return new ProfesionalResponse(
                profesional.getId(),
                profesional.getNombre(),
                profesional.getApellido(),
                profesional.getMatricula(),
                profesional.isActivo()
        );
    }
}
