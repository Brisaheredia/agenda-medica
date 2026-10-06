package ar.com.agendamedica.domain.entity;

import ar.com.agendamedica.domain.enums.TipoEventoTurno;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "turno_eventos", indexes = @Index(name = "idx_turno_evento_turno_fecha", columnList = "turno_id,fecha"))
public class TurnoEvento {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "turno_id", nullable = false) private Turno turno;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 30) private TipoEventoTurno tipo;
    @Column(nullable = false) private LocalDateTime fecha;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "usuario_id") private Usuario usuario;
    @Column(name = "franja_anterior_id") private Long franjaAnteriorId;
    @Column(name = "franja_nueva_id") private Long franjaNuevaId;
    @Column(length = 1000) private String detalle;

    @PrePersist void prePersist(){ if(fecha==null) fecha=LocalDateTime.now(); }
    public Long getId(){return id;} public void setId(Long id){this.id=id;}
    public Turno getTurno(){return turno;} public void setTurno(Turno turno){this.turno=turno;}
    public TipoEventoTurno getTipo(){return tipo;} public void setTipo(TipoEventoTurno tipo){this.tipo=tipo;}
    public LocalDateTime getFecha(){return fecha;} public void setFecha(LocalDateTime fecha){this.fecha=fecha;}
    public Usuario getUsuario(){return usuario;} public void setUsuario(Usuario usuario){this.usuario=usuario;}
    public Long getFranjaAnteriorId(){return franjaAnteriorId;} public void setFranjaAnteriorId(Long v){this.franjaAnteriorId=v;}
    public Long getFranjaNuevaId(){return franjaNuevaId;} public void setFranjaNuevaId(Long v){this.franjaNuevaId=v;}
    public String getDetalle(){return detalle;} public void setDetalle(String detalle){this.detalle=detalle;}
}
