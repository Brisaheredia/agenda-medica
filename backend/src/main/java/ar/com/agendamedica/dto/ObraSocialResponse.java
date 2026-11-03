package ar.com.agendamedica.dto;

import ar.com.agendamedica.domain.entity.ObraSocial;

public record ObraSocialResponse(Long id, String nombre) {
    public static ObraSocialResponse from(ObraSocial obraSocial) {
        return new ObraSocialResponse(obraSocial.getId(), obraSocial.getNombre());
    }
}
