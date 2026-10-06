package ar.com.agendamedica.domain.entity;

import jakarta.persistence.*;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "plantillas_disponibilidad", indexes = @Index(name = "idx_plantilla_profesional_vigencia", columnList = "profesional_id,vigencia_desde,vigencia_hasta"))
public class PlantillaDisponibilidad {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "profesional_id", nullable = false) private Profesional profesional;
    @Enumerated(EnumType.STRING) @Column(name = "dia_semana", nullable = false, length = 15) private DayOfWeek diaSemana;
    @Column(name = "hora_inicio", nullable = false) private LocalTime horaInicio;
    @Column(name = "hora_fin", nullable = false) private LocalTime horaFin;
    @Column(name = "duracion_min", nullable = false) private Integer duracionMin;
    @Column(name = "vigencia_desde", nullable = false) private LocalDate vigenciaDesde;
    @Column(name = "vigencia_hasta") private LocalDate vigenciaHasta;

    public Long getId(){return id;} public void setId(Long id){this.id=id;}
    public Profesional getProfesional(){return profesional;} public void setProfesional(Profesional profesional){this.profesional=profesional;}
    public DayOfWeek getDiaSemana(){return diaSemana;} public void setDiaSemana(DayOfWeek diaSemana){this.diaSemana=diaSemana;}
    public LocalTime getHoraInicio(){return horaInicio;} public void setHoraInicio(LocalTime horaInicio){this.horaInicio=horaInicio;}
    public LocalTime getHoraFin(){return horaFin;} public void setHoraFin(LocalTime horaFin){this.horaFin=horaFin;}
    public Integer getDuracionMin(){return duracionMin;} public void setDuracionMin(Integer duracionMin){this.duracionMin=duracionMin;}
    public LocalDate getVigenciaDesde(){return vigenciaDesde;} public void setVigenciaDesde(LocalDate vigenciaDesde){this.vigenciaDesde=vigenciaDesde;}
    public LocalDate getVigenciaHasta(){return vigenciaHasta;} public void setVigenciaHasta(LocalDate vigenciaHasta){this.vigenciaHasta=vigenciaHasta;}
}
