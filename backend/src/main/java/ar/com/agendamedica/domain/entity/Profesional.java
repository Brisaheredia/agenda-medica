package ar.com.agendamedica.domain.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "profesionales", uniqueConstraints = @UniqueConstraint(name = "uk_profesional_matricula", columnNames = "matricula"))
public class Profesional {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false, length = 100) private String nombre;
    @Column(nullable = false, length = 100) private String apellido;
    @Column(nullable = false, length = 50) private String matricula;
    @Column(nullable = false) private boolean activo = true;
    @Column(name = "created_at", nullable = false, updatable = false) private LocalDateTime createdAt;
    @Column(name = "updated_at", nullable = false) private LocalDateTime updatedAt;

    @PrePersist void prePersist(){ var now=LocalDateTime.now(); createdAt=now; updatedAt=now; }
    @PreUpdate void preUpdate(){ updatedAt=LocalDateTime.now(); }

    public Long getId(){return id;} public void setId(Long id){this.id=id;}
    public String getNombre(){return nombre;} public void setNombre(String nombre){this.nombre=nombre;}
    public String getApellido(){return apellido;} public void setApellido(String apellido){this.apellido=apellido;}
    public String getMatricula(){return matricula;} public void setMatricula(String matricula){this.matricula=matricula;}
    public boolean isActivo(){return activo;} public void setActivo(boolean activo){this.activo=activo;}
    public LocalDateTime getCreatedAt(){return createdAt;} public LocalDateTime getUpdatedAt(){return updatedAt;}
}
