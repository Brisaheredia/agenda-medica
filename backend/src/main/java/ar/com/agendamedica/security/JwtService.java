package ar.com.agendamedica.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.HexFormat;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

@Service
public class JwtService {
    private final SecretKey key;
    private final long expirationMinutes;

    public JwtService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration-minutes}") long expirationMinutes) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMinutes = expirationMinutes;
    }

    public String generarToken(String email, String rol, String passwordHash) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(email)
                .claim("rol", rol)
                .claim("credencial", huella(passwordHash))
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(expirationMinutes * 60)))
                .signWith(key)
                .compact();
    }

    public String extraerEmail(String token) {
        return claims(token).getSubject();
    }

    public boolean esValido(String token, UserDetails userDetails) {
        Claims claims = claims(token);
        return claims.getSubject().equalsIgnoreCase(userDetails.getUsername())
                && huella(userDetails.getPassword()).equals(claims.get("credencial", String.class))
                && userDetails.getAuthorities().stream().anyMatch(authority ->
                    authority.getAuthority().equals("ROLE_" + claims.get("rol", String.class)))
                && claims.getExpiration().after(new Date());
    }

    public long getExpirationMinutes() {
        return expirationMinutes;
    }

    private Claims claims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private String huella(String passwordHash) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(passwordHash.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 no disponible", exception);
        }
    }
}
