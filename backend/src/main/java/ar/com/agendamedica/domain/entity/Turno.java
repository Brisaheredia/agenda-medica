package ar.com.agendamedica.domain.entity;

import ar.com.agendamedica.domain.enums.EstadoTurno;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "turnos", indexes = {
        @Index(name = "idx_turno_profesional_inicio", columnList = "profesional_id,inicio"),
        @Index(name = "idx_turno_paciente", columnList = "paciente_id"),
        @Index(name = "idx_turno_estado", columnList = "estado")
})
public class Turno {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "paciente_id", nullable = false) private Paciente paciente;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "profesional_id", nullable = false) private Profesional profesional;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "franja_id", nullable = false) private Franja franja;
    @Column(nullable = false) private LocalDateTime inicio;
    @Column(nullable = false) private LocalDateTime fin;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) private EstadoTurno estado = EstadoTurno.RESERVADO;
    @Column(name = "motivo_consulta", length = 500) private String motivoConsulta;
    @Column(name = "created_at", nullable = false, updatable = false) private LocalDateTime createdAt;
    @Column(name = "updated_at", nullable = false) private LocalDateTime updatedAt;

    @PrePersist void prePersist(){ var now=LocalDateTime.now(); createdAt=now; updatedAt=now; }
    @PreUpdate void preUpdate(){ updatedAt=LocalDateTime.now(); }

    public Long getId(){return id;} public void setId(Long id){this.id=id;}
    public Paciente getPaciente(){return paciente;} public void setPaciente(Paciente paciente){this.paciente=paciente;}
    public Profesional getProfesional(){return profesional;} public void setProfesional(Profesional profesional){this.profesional=profesional;}
    public Franja getFranja(){return franja;} public void setFranja(Franja franja){this.franja=franja;}
    public LocalDateTime getInicio(){return inicio;} public void setInicio(LocalDateTime inicio){this.inicio=inicio;}
    public LocalDateTime getFin(){return fin;} public void setFin(LocalDateTime fin){this.fin=fin;}
    public EstadoTurno getEstado(){return estado;} public void setEstado(EstadoTurno estado){this.estado=estado;}
    public String getMotivoConsulta(){return motivoConsulta;} public void setMotivoConsulta(String motivoConsulta){this.motivoConsulta=motivoConsulta;}
    public LocalDateTime getCreatedAt(){return createdAt;} public LocalDateTime getUpdatedAt(){return updatedAt;}
}
