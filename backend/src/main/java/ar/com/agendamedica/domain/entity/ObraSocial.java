package ar.com.agendamedica.domain.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "obras_sociales")
public class ObraSocial {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 120)
    private String nombre;

    public Long getId() { return id; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
}
