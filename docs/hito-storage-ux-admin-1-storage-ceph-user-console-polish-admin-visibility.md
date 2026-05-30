# HITO: STORAGE-UX-ADMIN-1 — Storage/Ceph User Console Polish + Admin Visibility

Este documento detalla la implementación y cierre del hito único de pulido visual y visibilidad administrativa del módulo Storage/Ceph.

## 1. Objetivos del Hito

El objetivo principal de este hito es mejorar la consistencia visual y de estado del módulo Storage en la consola de usuario, además de proveer una visibilidad robusta e integrada de la capa de Storage/Ceph en la consola de administración, empleando un enfoque híbrido sin alterar motores internos, esquemas de bases de datos ni lógicas de licenciamiento.

---

## 2. Cambios Implementados

### 2.1. Pulido Visual de Pestaña Storage (Consola de Usuario)
Se corrigieron los indicadores visuales del estado de progreso de la pestaña Storage en [src/app/dashboard/assessments/[id]/page.tsx](file:///C:/Users/diego/OneDrive/PERSONAL/INFRASHIFT/infrashift/src/app/dashboard/assessments/[id]/page.tsx). Los colores ahora diferencian correctamente los estados operativos, problemáticos y neutrales:
- **Verde (`#10b981`)**: `submitted`, `ready_for_analysis`, `analyzed` (Estados listos o procesados).
- **Amarillo (`#f59e0b`)**: `draft`, `analysis_pending`, `stale` (Estados intermedios, pendientes de re-evaluación o desactualizados).
- **Rojo (`#ef4444`)**: `failed` (Análisis de IA fallido o con error).
- **Gris Claro / Neutral (`#475569`)**: `skipped`, `not_started` (Módulo omitido o sin comenzar, evitando confundirlos con estados de error o problemáticos).

### 2.2. Ayudas y Tooltips Técnicos de Evidencia (Consola de Usuario)
En [src/components/assessments/StorageDestinationReadinessPanel.tsx](file:///C:/Users/diego/OneDrive/PERSONAL/INFRASHIFT/infrashift/src/components/assessments/StorageDestinationReadinessPanel.tsx), se añadieron ayudas explicativas en inglés reactivas a la selección en los dropdowns de clasificación tanto para el formulario de subida de archivos de evidencia de storage como para los formularios de edición/actualización de evidencias ya subidas. Las clasificaciones cubiertas son:
- `ceph_osd_tree`: CLI output showing the map of OSDs, their weight, status (up/down), and CRUSH map hierarchy.
- `ceph_df`: Displays Ceph cluster space usage, showing raw disk capacity, pool allocation, and available bytes.
- `hardware_bom`: List of server specs, physical drives, CPU details, RAM configurations, and controllers.
- `network_diagram`: Diagram or details outlining storage network topology, switches, speed, and redundant paths.
- `pbs_backup_info`: Proxmox Backup Server topology, datastore size, retention, and verification plans.
- `vsan_summary`: vSAN Summary: Disk groups, cache/capacity configurations, storage policies, and health status of the source VMware vSAN.

### 2.3. Soporte de Backend en AdminConsoleService
En [src/server/admin/adminConsoleService.ts](file:///C:/Users/diego/OneDrive/PERSONAL/INFRASHIFT/infrashift/src/server/admin/adminConsoleService.ts), se incorporó la resolución aislada del módulo `"storage_ceph"` mediante el cargador no bloqueante `resolveAdminSection`.
Se implementaron consultas Prisma agregadas para calcular en tiempo real:
- **Storage Activo**: Cantidad de evaluaciones con `storageReadinessEnabled === true` y no archivadas.
- **Ceph Solicitado**: Cantidad de evaluaciones con preferencia de destino `ceph` o modo `ceph_candidate`.
- **Falta Evidencia**: Evaluaciones activas en storage que no registran archivos de evidencia subidos.
- **Evidencias por Clasificación**: Agrupación y cuenta por tipo de clasificación técnica.
- **Auditoría de IA de Storage**: Cantidad de análisis agrupados por estado (failures, budget blocked, plan restricted, etc.).
- **Resultado Ceph**: Distribución de estados suitability calculados por el motor Ceph (`ceph_applies`, `ceph_does_not_apply`, etc.).

Adicionalmente, se ampliaron las consultas de evaluaciones recientes en `loadRecentAssessments` para recuperar los campos de la relación `storageDestinationReadiness`, `storageAnalysis`, `storageContext` y `storageEvidence` de manera segura.

### 2.4. Integración y Tab en Consola de Administración (Admin Console)
En [src/app/dashboard/admin/page.tsx](file:///C:/Users/diego/OneDrive/PERSONAL/INFRASHIFT/infrashift/src/app/dashboard/admin/page.tsx), se modificó la interfaz administrativa interna en idioma español:
1. **KPIs en Pestaña Resumen**: Se agregaron 3 tarjetas de métricas agregadas al dashboard principal para monitoreo rápido:
   - *Storage Activo* (Evaluaciones con el módulo habilitado).
   - *Ceph Solicitado* (Preferencia o candidato Ceph).
   - *Fallos IA Storage* (Cantidad de análisis de IA fallidos, bloqueados por presupuesto o por plan).
2. **Pestaña Completa "Storage/Ceph"**: Se añadió la navegación e interfaz de la sección `storage-ceph`. Esta contiene:
   - Indicadores agregados rápidos.
   - Distribución de estados de flujo, suitability del motor Ceph, archivos de evidencia clasificados y estado de ejecución IA de Storage.
   - Una tabla detallada de todas las evaluaciones activas en storage detallando sus puntajes de readiness, confianza y cantidad de archivos.
3. **Estado Visible en Tabla de Evaluaciones**: Se añadió la columna "Storage/Ceph" en la tabla de la pestaña "Evaluaciones recientes", la cual muestra el estado de flujo coloreado según severidad (`good`, `warning`, `neutral`, `danger`) y las especificaciones técnicas asociadas.

---

## 3. Preservación y Salvaguardas
Para garantizar el bajo riesgo de las modificaciones, se cumplieron estrictamente las siguientes reglas:
- **Sin migraciones ni cambios en DB schema**: No se borró el modelo legacy `StorageReadinessInput` ni se alteró ningún tipo de dato.
- **Sin mutaciones directas de DB desde Admin**: Todas las vistas administrativas son de consulta/lectura.
- **Preservación de Motores**: El motor determinístico de Ceph, el motor de análisis de IA, el Completion Center y el módulo de descarga de PDFs permanecen intactos.
- **Idioma del Sistema**: La consola de administración es interna y se implementó en español con fallbacks de traducción robustos, mientras que los tooltips y componentes del cliente de cara al usuario final permanecen en inglés.

---

## 4. Pruebas y Validación
- Validación de types limpia (`tsc --noEmit`).
- Validación de linter limpia (`npm run lint`).
- Validación de tests unitarios/integración con Vitest pasados de forma exitosa.
