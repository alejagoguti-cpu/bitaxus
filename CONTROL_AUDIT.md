# Auditoría de controles activos

La auditoría se realizó sobre la copia pública de Bitaxus después de la navegación autenticada disponible en GitHub Pages. No se ejecutaron operaciones de escritura, exportaciones ni conciliaciones.

| Módulo | Ruta pública validada | Controles observados | Estado |
|---|---|---|---|
| Inicio | `/bitaxus/` | Sidebar, periodo, notificaciones, perfil, Programar recaudo, Programar pago, Consultar en Global, filas de detalle y enlaces de actividad | Cargado |
| Recaudos | `/bitaxus/receipts` | CTA, tabs, búsqueda, filtros, detalle de filas, scroll horizontal y paginación | Cargado |
| Pagos y dispersiones | `/bitaxus/payments` | CTA, tabs, búsqueda, filtros de fecha/estado/tipo/concepto, detalle, scroll y paginación | Cargado |
| Contrapartes | `/bitaxus/counterparties` | CTA, tabs, búsqueda, filtros, detalle, scroll y paginación | Cargado |
| Bitaxus Global | `/bitaxus/global` | Operación, selectores de moneda, intercambio, favoritos, cotización, continuar, tabs, búsqueda, filtros, exportación y confirmar | Cargado |
| Reportes | `/bitaxus/reports` | Generar, periodo, tipo, limpiar, búsqueda, gráficos con ejes y tabla | Cargado |
| Conciliación | `/bitaxus/reconciliation` | Limpiar, guardar/aplicar/eliminar filtros, fechas, estado, cuenta, búsqueda, comentario, selección y Conciliar | Cargado |
| Configuración | `/bitaxus/settings` | Editar perfil/empresa, cambiar contraseña, cerrar sesión y preferencias | Cargado |

La prueba contractual `ActiveControlsAudit.test.ts` cubre ausencia de handlers explícitamente vacíos, ausencia de enlaces `#`/vacíos, rutas compartidas de Pagos/Dispersión y exclusión de formularios heredados no montados. La suite completa alcanzó 120 pruebas después de esta ampliación.
