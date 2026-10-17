package ar.com.agendamedica.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "configuracion_agenda")
public class ConfiguracionAgenda {
    public static final long ID_UNICA = 1L;
    public static final int DURACION_TURNO_MIN = 40;

    @Id
    private Long id = ID_UNICA;

    @Column(name = "duracion_estandar_min", nullable = false)
    private Integer duracionEstandarMin = 40;

    @Column(name = "horizonte_reserva_dias", nullable = false)
    private Integer horizonteReservaDias = 90;

    public Long getId() { return id; }
    public Integer getDuracionEstandarMin() { return DURACION_TURNO_MIN; }
    public void setDuracionEstandarMin(Integer value) {
        if (value == null || value != DURACION_TURNO_MIN) throw new IllegalArgumentException("Los turnos duran 40 minutos");
        this.duracionEstandarMin = DURACION_TURNO_MIN;
    }
    @jakarta.persistence.PrePersist
    @jakarta.persistence.PreUpdate
    void fijarDuracion() { duracionEstandarMin = DURACION_TURNO_MIN; }
    public Integer getHorizonteReservaDias() { return horizonteReservaDias; }
    public void setHorizonteReservaDias(Integer value) { this.horizonteReservaDias = value; }
}
