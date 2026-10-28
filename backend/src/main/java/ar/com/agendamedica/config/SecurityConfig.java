package ar.com.agendamedica.config;

import ar.com.agendamedica.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;
import jakarta.servlet.DispatcherType;

@Configuration
public class SecurityConfig {

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            JwtAuthenticationFilter jwtAuthenticationFilter) throws Exception {

        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(errors -> errors
                        .authenticationEntryPoint((request, response, exception) -> {
                            response.setStatus(401);
                            response.setContentType("application/json;charset=UTF-8");
                            response.getWriter().write("{\"message\":\"Ingresá nuevamente para continuar.\"}");
                        })
                        .accessDeniedHandler((request, response, exception) -> {
                            response.setStatus(403);
                            response.setContentType("application/json;charset=UTF-8");
                            response.getWriter().write("{\"message\":\"No tenés permisos para realizar esta operación.\"}");
                        }))
                .authorizeHttpRequests(auth -> auth
                        .dispatcherTypeMatchers(DispatcherType.ERROR).permitAll()
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers(
                                "/api/auth/login",
                                "/swagger-ui.html",
                                "/swagger-ui/**",
                                "/v3/api-docs/**"
                        ).permitAll()

                        .requestMatchers("/api/auditoria/**", "/api/usuarios/**")
                        .hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/configuracion/agenda")
                        .hasRole("ADMIN")

                        .requestMatchers(HttpMethod.POST,
                                "/api/agenda/plantillas",
                                "/api/agenda/generar-franjas",
                                "/api/agenda/excepciones",
                                "/api/agenda/bloqueos",
                                "/api/agenda/bloqueos/previsualizacion")
                        .hasAnyRole("ADMIN", "MEDICO")

                        .requestMatchers(HttpMethod.POST,
                                "/api/turnos/*/atencion",
                                "/api/turnos/*/ausencia")
                        .hasAnyRole("ADMIN", "MEDICO", "RECEPCION")

                        .requestMatchers(HttpMethod.POST,
                                "/api/turnos",
                                "/api/turnos/*/cancelacion",
                                "/api/turnos/*/reprogramacion")
                        .hasAnyRole("ADMIN", "RECEPCION", "OBRAS_SOCIALES")

                        .requestMatchers(HttpMethod.POST, "/api/pacientes")
                        .hasAnyRole("ADMIN", "RECEPCION")
                        .requestMatchers(HttpMethod.PUT, "/api/pacientes/**")
                        .hasAnyRole("ADMIN", "RECEPCION")
                        .requestMatchers(HttpMethod.DELETE, "/api/pacientes/**")
                        .hasAnyRole("ADMIN", "RECEPCION")

                        .requestMatchers(HttpMethod.GET, "/api/pacientes/seleccion")
                        .hasAnyRole("ADMIN", "MEDICO", "RECEPCION", "OBRAS_SOCIALES")
                        .requestMatchers(HttpMethod.GET,
                                "/api/pacientes", "/api/pacientes/*",
                                "/api/agenda/reprogramaciones-pendientes")
                        .hasAnyRole("ADMIN", "MEDICO", "RECEPCION")
                        .requestMatchers(HttpMethod.GET,
                                "/api/profesionales", "/api/configuracion/agenda",
                                "/api/turnos", "/api/turnos/*",
                                "/api/agenda", "/api/agenda/disponibles",
                                "/api/agenda/excepciones", "/api/agenda/rango")
                        .hasAnyRole("ADMIN", "MEDICO", "RECEPCION", "OBRAS_SOCIALES")
                        .anyRequest().denyAll()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        // Desarrollo local: Vite puede levantar en localhost, 127.0.0.1
        // o incluso cambiar de puerto si 5173 ya está ocupado.
        // Como la API usa JWT por header y no cookies de sesión,
        // permitimos cualquier origen durante desarrollo.
        config.setAllowedOriginPatterns(List.of("*"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setExposedHeaders(List.of("Authorization"));
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
