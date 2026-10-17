# Cambios documentados

Registro de cambios relevantes inspeccionados, no historial exhaustivo de cada commit ni acta de liberación productiva.

## 17 de octubre de 2026

| Commit | Cambio y efecto |
|---|---|
| `96fc37a` | Frontend(fix): muestra fecha seleccionada y días adyacentes; Hoy sólo para fecha actual y retorno explícito a hoy. |
| `6999346` | Frontend(feat): selección de varios días, atajo lunes–viernes, horario propuesto 08:00–20:00, duración semanal desde configuración guardada y recarga del calendario. Corrige profesionalId omitido en consulta. |
| `c93ccc0` | backend(fix): duración inicial de ConfiguracionAgenda a 40 minutos; no migra configuración persistida ni seed. |

Se incorpora documentación versionada con README general, frontend/backend, manual, instalación, requisitos, arquitectura/datos/API, pruebas, trazabilidad, operación y mantenimiento. Base de código revisada: `96fc37a`. Se reorganizan los documentos de etapas anteriores en `docs/historico` y se incluye la especificación original como referencia. Los ejemplos generales usan API 8080/MySQL 3306, configurables por entorno. Los diagramas de arquitectura, reserva, entidades y estados se mantienen en Mermaid.

## Limpieza de documentación obsoleta

Después de la reorganización se elimina la carpeta `docs/historico`, incluidos los documentos de primera etapa y etapa final del frontend. Se actualizan índices, enlaces y reglas de mantenimiento para conservar sólo documentación vigente en el árbol de trabajo. Las versiones anteriores siguen disponibles en Git. La especificación original se mantiene únicamente como fuente de requisitos.
