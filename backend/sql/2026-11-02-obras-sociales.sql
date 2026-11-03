-- Ejecutar UNA sola vez en la base MySQL existente (si ddl-auto=update no lo agregó).
-- Respaldar antes de aplicar. No borra pacientes ni turnos.
CREATE TABLE IF NOT EXISTS obras_sociales (
  id BIGINT NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(120) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_obras_sociales_nombre (nombre)
) ENGINE=InnoDB;

ALTER TABLE pacientes
  ADD COLUMN obra_social_id BIGINT NULL,
  ADD INDEX idx_paciente_obra_social (obra_social_id),
  ADD CONSTRAINT fk_paciente_obra_social
    FOREIGN KEY (obra_social_id) REFERENCES obras_sociales(id);
