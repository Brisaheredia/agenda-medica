package ar.com.agendamedica.domain.entity;

import ar.com.agendamedica.domain.enums.EstadoFranja;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "franjas", uniqueConstraints = @UniqueConstraint(name = "uk_franja_profesional_inicio", columnNames = {"profesional_id","inicio"}), indexes = @Index(name = "idx_franja_profesional_inicio_estado", columnList = "profesional_id,inicio,estado"))
public class Franja {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "profesional_id", nullable = false) private Profesional profesional;
    @Column(nullable = false) private LocalDateTime inicio;
    @Column(nullable = false) private LocalDateTime fin;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 15) private EstadoFranja estado = EstadoFranja.LIBRE;
    @Column(nullable = false, length = 30) private String origen = "PLANTILLA";
    @Version private Long version;

    public Long getId(){return id;} public void setId(Long id){this.id=id;}
    public Profesional getProfesional(){return profesional;} public void setProfesional(Profesional profesional){this.profesional=profesional;}
    public LocalDateTime getInicio(){return inicio;} public void setInicio(LocalDateTime inicio){this.inicio=inicio;}
    public LocalDateTime getFin(){return fin;} public void setFin(LocalDateTime fin){this.fin=fin;}
    public EstadoFranja getEstado(){return estado;} public void setEstado(EstadoFranja estado){this.estado=estado;}
    public String getOrigen(){return origen;} public void setOrigen(String origen){this.origen=origen;}
    public Long getVersion(){return version;}
}
