package ar.com.agendamedica.domain.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "auditoria", indexes = @Index(name = "idx_auditoria_entidad_fecha", columnList = "entidad,entidad_id,fecha"))
public class Auditoria {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "usuario_id") private Usuario usuario;
    @Column(nullable = false, length = 80) private String accion;
    @Column(nullable = false, length = 80) private String entidad;
    @Column(name = "entidad_id") private Long entidadId;
    @Column(nullable = false) private LocalDateTime fecha;
    @Column(length = 2000) private String metadata;

    @PrePersist void prePersist(){ if(fecha==null) fecha=LocalDateTime.now(); }
    public Long getId(){return id;} public void setId(Long id){this.id=id;}
    public Usuario getUsuario(){return usuario;} public void setUsuario(Usuario usuario){this.usuario=usuario;}
    public String getAccion(){return accion;} public void setAccion(String accion){this.accion=accion;}
    public String getEntidad(){return entidad;} public void setEntidad(String entidad){this.entidad=entidad;}
    public Long getEntidadId(){return entidadId;} public void setEntidadId(Long entidadId){this.entidadId=entidadId;}
    public LocalDateTime getFecha(){return fecha;} public void setFecha(LocalDateTime fecha){this.fecha=fecha;}
    public String getMetadata(){return metadata;} public void setMetadata(String metadata){this.metadata=metadata;}
}
