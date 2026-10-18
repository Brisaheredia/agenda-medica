package ar.com.agendamedica.config;

import ar.com.agendamedica.domain.enums.RolUsuario;
import org.springframework.boot.context.properties.ConfigurationProperties;
import java.util.List;

@ConfigurationProperties(prefix = "app.dev.usuarios")
public record UsuariosDesarrolloProperties(List<Cuenta> cuentas) {
    public UsuariosDesarrolloProperties {
        cuentas = cuentas == null ? List.of() : List.copyOf(cuentas);
    }

    public record Cuenta(String email, String password, RolUsuario rol) {
        @Override
        public String toString() {
            return "Cuenta[email=" + email + ", rol=" + rol + ", password=[PROTEGIDA]]";
        }
    }
}
