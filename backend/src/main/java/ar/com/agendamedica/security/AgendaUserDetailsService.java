package ar.com.agendamedica.security;

import ar.com.agendamedica.domain.entity.Usuario;
import ar.com.agendamedica.repository.UsuarioRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AgendaUserDetailsService implements UserDetailsService {
    private final UsuarioRepository usuarioRepository;

    public AgendaUserDetailsService(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Usuario usuario = usuarioRepository.findByEmailIgnoreCase(email)
                .filter(Usuario::isActivo)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado o inactivo"));

        return new User(
                usuario.getEmail(),
                usuario.getPasswordHash(),
                List.of(new SimpleGrantedAuthority("ROLE_" + usuario.getRol().name()))
        );
    }
}
