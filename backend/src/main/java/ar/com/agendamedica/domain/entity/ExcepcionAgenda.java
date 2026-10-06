package ar.com.agendamedica.domain.entity;

import ar.com.agendamedica.domain.enums.TipoExcepcionAgenda;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "excepciones_agenda", indexes = @Index(name = "idx_excepcion_profesional_fecha", columnList = "profesional_id,fecha"))
public class ExcepcionAgenda {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "profesional_id", nullable = false) private Profesional profesional;
    @Column(nullable = false) private LocalDate fecha;
    @Column(name = "hora_inicio") private LocalTime horaInicio;
    @Column(name = "hora_fin") private LocalTime horaFin;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 15) private TipoExcepcionAgenda tipo;
    @Column(length = 255) private String motivo;

    public Long getId(){return id;} public void setId(Long id){this.id=id;}
    public Profesional getProfesional(){return profesional;} public void setProfesional(Profesional profesional){this.profesional=profesional;}
    public LocalDate getFecha(){return fecha;} public void setFecha(LocalDate fecha){this.fecha=fecha;}
    public LocalTime getHoraInicio(){return horaInicio;} public void setHoraInicio(LocalTime horaInicio){this.horaInicio=horaInicio;}
    public LocalTime getHoraFin(){return horaFin;} public void setHoraFin(LocalTime horaFin){this.horaFin=horaFin;}
    public TipoExcepcionAgenda getTipo(){return tipo;} public void setTipo(TipoExcepcionAgenda tipo){this.tipo=tipo;}
    public String getMotivo(){return motivo;} public void setMotivo(String motivo){this.motivo=motivo;}
}
