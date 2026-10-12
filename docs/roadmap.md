# Hoja de ruta: Froggy Fight

## Objetivo visual y estado

El objetivo es pulir Froggy Fight como plataformas 3D low poly con lectura y acabado de era N64, manteniendo el juego tridimensional, su identidad de Frogbert, Pato Lemus y TALACORP, y el ascenso por un entorno vertical. La referencia original compartida por el usuario mostraba un pato blanco con traje azul oscuro a rayas señalando a una rana pequeña con mochila rojo-marrón, sobre un bosque vertical de verdes oscuros con lámparas ámbar y HUD retro con tratamiento CRT. Ese contraste de personaje y escala, la luz cálida y la profundidad del bosque sirven como dirección visual. La imagen original no está dentro del repositorio; no se presenta aquí como archivo local ni se afirma una reconstrucción exacta.

La imagen [concepto v2](evidence/art/frogbert-concepto-v2-pato-lemus.png) fue generada aparte para explorar esa dirección: luz ámbar, ambiente teal, tronco facetado, faroles y banderas con cara de Pato Lemus. Es arte conceptual, no captura del runtime ni reproducción exacta de la referencia del usuario. El concepto [v1](evidence/art/frogbert-concepto-v1.png) y sus prompts también se conservan. El asset WebP de bandera sí está integrado en los meshes de intro y nivel.

La entrega actual es un primer pase de pulido sobre la fuente existente, no una vertical slice final. El build compila y la ronda final de Playwright encontró 0 errores de consola/red en escritorio y dos tamaños móviles. No se completó el nivel ni se verificó el jefe. Los datos y capturas están en [informe de evidencia](evidence/REPORT.md).

## Prioridades

### P0 — Hacer legibles las banderas y la ruta desde la cámara inicial

**Estado:** pendiente. El rostro de Pato Lemus está cargado en seis meshes de intro y cuatro del nivel, pero las banderas del nivel quedan fuera o cortadas en el encuadre inicial y la cara no se lee.

- Reubicar o reencuadrar las banderas sin tapar plataformas, Frogbert ni objetivos de salto.
- Comprobar primera escena en 1440×900, 390×844 portrait y 844×390 landscape.
- Revisar cámara, silueta y jerarquía visual: siguiente plataforma, peligros y objetos coleccionables deben distinguirse en movimiento.
- Criterio: rostro completo y reconocible en la composición de inicio; escena de juego aún claramente 3D y HUD despejado.

### P1 — Acercar modelos 3D y cinemática al objetivo artístico

**Estado:** pendiente. El concepto orienta estilo; no sustituye modelos jugables.

- Revisar proporciones, materiales y silueta 3D de Frogbert y Pato Lemus con la geometría existente.
- Definir expresiones y animaciones que sobrevivan a cámara móvil y distancia; mantener colisiones/física separadas de la presentación.
- Refinar continuidad de la cinemática inicial: encuadres, ritmo, transición al control del jugador y legibilidad del diálogo.
- Alinear bosque, tronco, plataformas y detalles industriales con el objetivo low poly/N64. La referencia original es una guía, no una especificación para copiar cada píxel.
- Criterio: el jugador reconoce personajes y recorrido en juego activo; el arte generado sigue identificado como concepto o textura, nunca como geometría jugable.

### P1 — Verificar el loop y el nivel completo

**Estado:** no verificado de punta a punta. El baseline mostró movimiento y salto cargado; el intento documentado de lengua no confirmó una captura de insecto.

- Recorrer desde inicio hasta cima: saltos y aterrizajes, anillos/lengua, insectos, hojas, plataformas, checkpoints, peligros, caídas y reaparición.
- Comprobar que cada tramo enseña y luego combina una mecánica, que el siguiente destino se entiende y que una caída no deja al jugador en estado blando.
- Llegar al jefe TALACORP Bug-Zapper 3000 y verificar sus fases, señales, ventanas de respuesta, daño, derrota y recuperación/checkpoint.
- Criterio: grabación reproducible de una partida completa, al menos un fallo con recuperación y un resultado de jefe. Mantener como desconocido hasta conseguir esa evidencia.

### P1 — Afinar cámara y controles

**Estado:** acciones iniciales verificadas; recorrido y manejo prolongado no verificados.

- Probar seguimiento, giro Q/R y lectura del siguiente salto durante ascenso y combate; ajustar obstrucciones y cambios bruscos de cámara.
- Repetir salto cargado con tiempos distintos y verificar altura, aterrizaje, cancelación y respuesta tras soltar input.
- En teléfono real, revisar controles táctiles, zonas seguras, orientación, botones de 44 px o más, continuidad al cambiar de pestaña y recuperación tras blur.
- Criterio: movimiento y salto previsibles en una sección completa con teclado y touch; evidencia de landing, cámara y caída/respawn, no sólo de barra cargando.

### P2 — Medir rendimiento y cerrar paquete

**Estado:** build local listo; Vite advierte bundle JavaScript de 641 kB sobre el umbral de 500 kB. No hay medición de FPS o termales en hardware objetivo.

- Perfilar una ruta fija y un encuentro en desktop y teléfono representativo: FPS/frame time, picos, memoria y carga de escena.
- Revisar tamaño/duplicación de assets y carga. Considerar code splitting sólo si mediciones y carga inicial lo justifican.
- Confirmar `npm run build`, contenido del paquete y launch desde `dist`; conservar el build original fuera del checkout de fuente.
- Criterio: budgets de rendimiento acordados, medidas repetibles en dispositivos y artefacto final identificable. El build actual por sí solo no satisface este gate.

## Gate para considerar una vertical slice

La slice sólo avanza cuando una partida representativa demuestra inicio, enseñanza de movimiento/salto/lengua, una decisión, un peligro, fallo y recuperación, progreso hasta un encuentro representativo, jefe o sustituto de producción claramente acotado, y cierre; con UI, cinemática y arte en calidad coherente y rendimiento medido en un dispositivo objetivo. Hoy la composición de banderas, recorrido completo, jefe y rendimiento de dispositivo siguen pendientes.

## Registro de referencia y procedencia

- [Conceptos y prompts](evidence/art/): v1/v2 y prompts disponibles. Los conceptos son generación IA y no están integrados como fondos o screenshots.
- [Procedencia del asset de bandera](evidence/art/pato-lemus-bandera-provenance.md): PNG original, conversión WebP y hash; los prompts exactos están en `prompts-banderas.txt`.
- La imagen de referencia visual del usuario no se incorpora porque no está disponible como archivo en este checkout. No se atribuye autoría ni licencia a una fuente externa no verificada.
