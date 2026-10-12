# Informe de evidencia

## Alcance y resultado

Se conservan cinco clips de baseline previos a los cambios y un clip final de escritorio. La ronda final automatizada de Playwright Chromium registró `pass: true`, HTTP 200, cero errores de consola y cero errores HTTP. Viewports: desktop 1440×900, portrait 390×844 y landscape 844×390. Documento y canvas coinciden con cada viewport; no se detectó scroll horizontal ni solapes en los overlays medidos.

Se comprobaron movimiento de teclado, carga de salto, cámara Q/R, acción de lengua E, filtrado de botones de utilidad y liberación de movimiento con blur sintético. Los controles móviles visibles respondieron a movimiento y carga de salto con eventos de touch enviados por CDP. Esto no acredita un recorrido completo en teléfono; el movimiento posterior llegó a una caída.

La textura de Pato Lemus se detectó cargada en 6 meshes de intro y 4 del nivel. La cara de las banderas del nivel no es legible en el encuadre inicial porque las banderas quedan fuera o cortadas. No se verificó completar la ruta, llegar a la cima ni vencer al jefe. El baseline no confirmó una captura de insecto con la lengua.

## Videos

| Etapa | Clip | Contenido y límite |
|---|---|---|
| Baseline | [01-menu-to-play](baseline/clips/01-menu-to-play.webm) | Menú, inicio y entrada al juego; 12.44 s. |
| Baseline | [02-move-and-jump](baseline/clips/02-move-and-jump.webm) | Movimiento y salto cargado; captura a 5 m; 16.40 s. |
| Baseline | [03-tongue-interaction](baseline/clips/03-tongue-interaction.webm) | Intentos de lengua sin captura confirmada; 20.44 s. |
| Baseline | [04-mobile-portrait](baseline/clips/04-mobile-portrait.webm) | Emulación portrait pre-controles táctiles; 11.64 s. |
| Baseline | [05-climb-attempt](baseline/clips/05-climb-attempt.webm) | Ascenso breve sin llegar a cima; 16.36 s. |
| Final | [desktop-after](final/clips/desktop-after.webm) | Clip de gameplay tras pulido inicial. |

## Capturas

Las capturas de baseline seleccionadas están en [baseline/screenshots](baseline/screenshots/). La ronda final incluye [escritorio](final/screenshots/desktop-after.png), [intro](final/screenshots/desktop-intro.png), [salto cargado](final/screenshots/desktop-charge.png), [portrait](final/screenshots/mobile-portrait-after.png) y [landscape](final/screenshots/mobile-landscape-after.png), además de sus menús y estados asociados.

El detalle medido por la automatización está en [qa-report.json](final/qa-report.json). La copia versionada del script está en [scripts/qa-smoke.js](scripts/qa-smoke.js); se parametrizaron URL, destino, módulo de Playwright y binario Chromium. No se copia `video-tmp` ni se versionan copias de la primera ronda.

## Reproducción del smoke final

Desde la raíz del repo, con dependencias del juego instaladas y `npm run build` ya ejecutado:

```bash
npm run preview -- --host 127.0.0.1 --port 4173
```

En otra terminal, instala Playwright y Chromium en el entorno local si aún no están disponibles, y ejecuta:

```bash
QA_BASE_URL=http://127.0.0.1:4173/ \
QA_OUT=docs/evidence/final/run \
node docs/evidence/scripts/qa-smoke.js
```

`PLAYWRIGHT_MODULE` y `CHROMIUM_PATH` permiten seleccionar rutas no estándar. La ejecución requiere navegador Chromium y puede crear capturas y WebM en `QA_OUT`. El script reproduce acciones automatizadas; no reemplaza observación con jugadores ni pruebas en dispositivos físicos.

El reporte JSON conserva las rutas absolutas de la máquina que capturó para mantener la trazabilidad original; los enlaces y materiales versionados usan rutas relativas desde este directorio.
