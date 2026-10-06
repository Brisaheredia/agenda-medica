package ar.com.agendamedica.domain.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "pacientes", indexes = {
        @Index(name = "idx_paciente_dni", columnList = "dni"),
        @Index(name = "idx_paciente_apellido", columnList = "apellido")
})
public class Paciente {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false, unique = true, length = 20) private String dni;
    @Column(nullable = false, length = 100) private String nombre;
    @Column(nullable = false, length = 100) private String apellido;
    @Column(length = 50) private String telefono;
    @Column(length = 150) private String email;
    @Column(nullable = false) private boolean activo = true;
    @Column(name = "created_at", nullable = false, updatable = false) private LocalDateTime createdAt;
    @Column(name = "updated_at", nullable = false) private LocalDateTime updatedAt;

    @PrePersist void prePersist(){ var now=LocalDateTime.now(); createdAt=now; updatedAt=now; }
    @PreUpdate void preUpdate(){ updatedAt=LocalDateTime.now(); }

    public Long getId(){return id;} public void setId(Long id){this.id=id;}
    public String getDni(){return dni;} public void setDni(String dni){this.dni=dni;}
    public String getNombre(){return nombre;} public void setNombre(String nombre){this.nombre=nombre;}
    public String getApellido(){return apellido;} public void setApellido(String apellido){this.apellido=apellido;}
    public String getTelefono(){return telefono;} public void setTelefono(String telefono){this.telefono=telefono;}
    public String getEmail(){return email;} public void setEmail(String email){this.email=email;}
    public boolean isActivo(){return activo;} public void setActivo(boolean activo){this.activo=activo;}
    public LocalDateTime getCreatedAt(){return createdAt;} public LocalDateTime getUpdatedAt(){return updatedAt;}
}
