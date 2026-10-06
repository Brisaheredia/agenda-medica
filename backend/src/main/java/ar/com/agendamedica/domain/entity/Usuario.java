package ar.com.agendamedica.domain.entity;

import ar.com.agendamedica.domain.enums.RolUsuario;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "usuarios", uniqueConstraints = @UniqueConstraint(name = "uk_usuario_email", columnNames = "email"))
public class Usuario {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, length = 150) private String email;
    @Column(name = "password_hash", nullable = false, length = 255) private String passwordHash;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) private RolUsuario rol;
    @Column(nullable = false) private boolean activo = true;
    @Column(name = "created_at", nullable = false, updatable = false) private LocalDateTime createdAt;
    @Column(name = "updated_at", nullable = false) private LocalDateTime updatedAt;

    @PrePersist void prePersist(){ var now=LocalDateTime.now(); createdAt=now; updatedAt=now; }
    @PreUpdate void preUpdate(){ updatedAt=LocalDateTime.now(); }

    public Long getId(){return id;} public void setId(Long id){this.id=id;}
    public String getEmail(){return email;} public void setEmail(String email){this.email=email;}
    public String getPasswordHash(){return passwordHash;} public void setPasswordHash(String passwordHash){this.passwordHash=passwordHash;}
    public RolUsuario getRol(){return rol;} public void setRol(RolUsuario rol){this.rol=rol;}
    public boolean isActivo(){return activo;} public void setActivo(boolean activo){this.activo=activo;}
    public LocalDateTime getCreatedAt(){return createdAt;} public LocalDateTime getUpdatedAt(){return updatedAt;}
}
