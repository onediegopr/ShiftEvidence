# Hito Storage-Completion-2A: New Storage Readiness Completion Logic

## 1. Problema Legacy
Anteriormente, el Completion Center (que evalúa el porcentaje y la confianza de completitud de un assessment) seguía evaluando el módulo de storage basándose únicamente en el modelo de datos legacy `StorageReadinessInput`. Sin embargo, el sistema ya utiliza un módulo de storage moderno con modelos estructurados como `AssessmentStorageDestinationReadiness`, `AssessmentStorageEvidence`, análisis de IA context-intelligence y la evaluación determinista del motor de Ceph suitability. Esto generaba que la UI no reflejara de manera coherente el progreso real cuando el usuario configuraba el nuevo panel de storage.

## 2. Decisión de No Eliminar `StorageReadinessInput`
Para evitar romper datos de assessments históricos y asegurar la compatibilidad hacia atrás en la base de datos (sin alterar el esquema Prisma ni realizar migraciones físicas de DB), se decidió **mantener el modelo legacy intacto** y utilizarlo como fallback seguro cuando no existan registros del nuevo modelo de storage.

## 3. Nueva Fuente Principal
El sistema ahora detecta si el assessment contiene registros o evidencias asociadas a la nueva estructura de storage:
- `AssessmentStorageDestinationReadiness`
- `AssessmentStorageContext`
- `AssessmentStorageEvidence`
- `AssessmentStorageAnalysis`

Si alguno de estos registros existe, el Completion Center procesa la completitud utilizando la nueva definición de storage. En caso contrario, se activa el legacy fallback de manera transparente.

## 4. Señales Utilizadas y Pesos del Sub-Scoring
Cuando se utiliza la nueva fuente, se calcula un sub-score (0-100%) para la completitud de storage basado en los siguientes pesos:

| Señal | Peso | Regla de Evaluación |
|---|---|---|
| **Destination Readiness Core Fields** | 35% | Otorga crédito proporcional basado en la cantidad de campos rellenados en `AssessmentStorageDestinationReadiness` (crédito total con 4 o más campos). |
| **Storage Evidence Uploaded** | 25% | Otorga el 25% si se ha subido al menos un archivo de evidencia de storage activo. |
| **Evidence Specificity** | 20% | Otorga el 20% si el tipo de evidencia corresponde a `ceph_status`, `ceph_df`, `ceph_osd_tree` o `pbs_backup_info`, o si el nombre del archivo contiene palabras clave como `ceph`, `proxmox` o `pbs`. |
| **AI Storage Analysis Executed** | 10% | Otorga el 10% si se ha ejecutado el análisis de IA context-intelligence (estado `completed` o `stale` con timestamp de generación). |
| **Ceph Suitability Evaluated** | 10% | Otorga el 10% si el motor determinista de Ceph suitability ya evaluó el entorno (o bien, se autoconcede si Ceph no es relevante para el destino preferido del usuario). |

El puntaje acumulado se mapea a los estados del catálogo de módulos del Completion Center:
- `>= 70%`: `complete`
- `>= 35%`: `partial`
- `> 0%`: `in_progress`
- `0%`: `not_started`

## 5. UI Impact
- **Consistencia de Dots e Indicadores**: El dot de progreso de la tab "Storage" en el dashboard del cliente y los resúmenes del Completion Center ahora se actualizan en base al progreso real de las configuraciones y subida de archivos específicos.
- **Limitation Texts dinámicos**: Se proveen textos explicativos coherentes con el estado de subida y análisis de storage.

## 6. Coherencia en Casos Mixtos y Fallbacks
- Si ambos modelos (nuevo y legacy) coinciden en el mismo registro de base de datos, el nuevo modelo tiene **prioridad total**.
- Si solo existe el modelo legacy, se evalúan las reglas anteriores garantizando el correcto funcionamiento de datos previos.
- No hay leaks de datos entre assessments gracias al aislamiento de payloads unitarios.

## 7. Tests Cobertura
Se agregaron 7 pruebas unitarias detalladas en `tests/unit/assessmentCompletion.test.ts` que cubren:
1. **Sin storage**: Not started.
2. **Legacy fallback**: Evaluado correctamente si no hay nuevo modelo.
3. **Mínimo nuevo modelo**: Estado `partial` con contribución positiva.
4. **Nuevo + storage evidence**: Estado `complete` al superar el threshold.
5. **Nuevo + Ceph evidence**: Incremento de contribución por especificidad de archivo.
6. **Nuevo + Ceph suitability**: Estado de evaluación ejecutada.
7. **Legacy y nuevo existen**: El nuevo modelo toma precedencia.

## 8. Riesgos Pendientes e Hitos Siguientes
- El cleanup físico de la base de datos para remover `StorageReadinessInput` queda diferido para fases posteriores al lanzamiento público de la versión final.
- Los resúmenes de evidencia en PDFs e interfaces administrativas heredadas seguirán mapeando de forma segura ambos modelos.
