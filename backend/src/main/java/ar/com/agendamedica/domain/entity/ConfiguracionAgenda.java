package ar.com.agendamedica.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "configuracion_agenda")
public class ConfiguracionAgenda {
    public static final long ID_UNICA = 1L;

    @Id
    private Long id = ID_UNICA;

    @Column(name = "duracion_estandar_min", nullable = false)
    private Integer duracionEstandarMin = 30;

    @Column(name = "horizonte_reserva_dias", nullable = false)
    private Integer horizonteReservaDias = 90;

    public Long getId() { return id; }
    public Integer getDuracionEstandarMin() { return duracionEstandarMin; }
    public void setDuracionEstandarMin(Integer value) { this.duracionEstandarMin = value; }
    public Integer getHorizonteReservaDias() { return horizonteReservaDias; }
    public void setHorizonteReservaDias(Integer value) { this.horizonteReservaDias = value; }
}
