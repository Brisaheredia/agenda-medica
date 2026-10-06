package ar.com.agendamedica.dto;

public record GenerarFranjasResponse(
        int creadas,
        int existentes,
        int omitidasPorCierre
) {}
