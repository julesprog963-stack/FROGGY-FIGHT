# CODEX_HANDOFF — FROGGY-FIGHT pulido inicial

Fecha: 2026-10-12. Checkout editable basado en `main` commit `41abecf7f097c2ab5861e61bcc7346c27bb399f5`. La carpeta de build original `/home/itadmin/Escritorio/FROGGY-FIGHT-BUILD` se conserva intacta. Los cambios de esta primera pasada están en el working tree; no se publicaron ni se modificó el repo remoto. `npm ci` se ejecutó con el lockfile existente y no se cambiaron `package.json` ni `package-lock.json`.

## Estado entregado

- Build: `npm run build` termina con éxito (24 módulos). Vite advierte que el bundle JS de 641 kB supera el umbral de 500 kB. `dist` ocupa aproximadamente 2.5 MB.
- Paquete estático: `/home/itadmin/Escritorio/FROGGY-FIGHT-PULIDO`, copiado desde el `dist` final a un directorio nuevo.
- Preview: `http://127.0.0.1:4173/`, servido desde el build final.
- Evidencia: `/home/itadmin/Escritorio/FROGGY-FIGHT-EVIDENCIA/after/final/`; reporte `qa-report.json`, script `qa-smoke.js`, capturas desktop/mobile y clip WebM.
- QA final: Playwright Chromium, HTTP 200, cero errores de consola/red; escritorio 1440×900, móvil 390×844 y landscape 844×390; canvas ajustado al viewport, sin scroll horizontal ni solapes de HUD medidos.
- Interacciones comprobadas: WASD, carga/liberación de salto, Q/R para cámara, E para lengua, botones de utilidad sin activación accidental de lengua, liberación de input al evento blur y controles táctiles con eventos CDP físicos. Móvil muestra controles y barra de carga; esto no constituye verificación de una partida completa.

## Cambios de primera pasada

- `src/banner.js`, `src/assets/pato-lemus-banner.webp`, `src/cinematic.js`, `src/level.js` y `src/textures.js`: textura de Pato Lemus conectada a banners de intro y mundo. La textura está cargada en 6 meshes de intro y 4 del nivel.
- `src/forest-art.js`, `src/main.js`, `src/level.js`: materiales, luces y tratamiento visual del bosque/tronco.
- `src/input.js`, `src/hud.js`, `src/style.css`, `index.html`: movimiento/acciones táctiles, liberación de input al blur, comportamiento de click en utilidades, HUD adaptable y copy Q/R.
- `index.html`: favicon local.

## Limitaciones confirmadas

La cara de Pato Lemus en las banderas del nivel no se lee desde el encuadre inicial: las banderas quedan fuera o cortadas. Queda pendiente ajustar la composición de cámara/posición antes de dar por terminado el requisito visual. No se verificó la ruta completa, la cima ni el jefe. En el baseline no se confirmó captura de insecto con la lengua. En móvil se comprobó movimiento y carga del salto, pero el recorrido posterior no confirma aterrizaje controlado. No se debe presentar esta validación como una certificación completa de jugabilidad.

## Mapa para continuación

- `src/main.js`: cámara, renderer, niebla, iluminación y construcción de escena.
- `src/player.js`: modelo/materiales, salto cargado y lengua.
- `src/level.js`: tronco, plataformas, ruta, bandera y zonas de nivel.
- `src/banner.js`, `src/forest-art.js`, `src/textures.js`, `src/cinematic.js`: asset y uso de arte/materiales.
- `src/camera.js`, `src/input.js`: seguimiento, rotación, teclado y táctil.
- `src/hud.js`, `src/style.css`, `index.html`: interfaz y layout responsive.

## Próximos pasos recomendados

1. Ajustar una vez la composición de banderas y confirmar que las caras se leen en el encuadre inicial.
2. Hacer una sesión de juego representativa hasta checkpoints/cima/jefe y resolver problemas de salto, aterrizaje, lengua y recuperación con evidencia.
3. Evaluar code splitting para reducir el warning de bundle si el tamaño sigue creciendo.
4. Actualizar el handoff tras esos resultados; mantener separado el build original.
