# Procedencia del arte para la bandera de Pato Lemus

## Solicitud registrada

La indicación del usuario fue que las banderas llevaran la cara de Pato Lemus en vez de la rana. El agente coordinador guardó los prompts exactos de la edición conceptual y de la textura runtime en [prompts-banderas.txt](prompts-banderas.txt). El PNG de origen se copió sin alteraciones para conservar la referencia original.

El PNG no contiene metadatos de prompt. `prompt-concepto-v1.txt` pertenece a otro concepto; la procedencia de este arte está en `prompts-banderas.txt`.

## Original

- Archivo: `pato-lemus-bandera-original.png`.
- Origen: `/home/itadmin/.codex/generated_images/01a13134-db20-74a0-82dc-5b947a90fdf8/exec-72b3110c-483f-4d46-aebe-246d39308a35.png`.
- Tamaño: 1254 × 1254 px, RGB, 3,035,281 bytes.
- SHA-256: `5e924467b6d8d1eea3cd27065b908b7f11aab7bdc140e2da0ddcfb13a56a1e54`.
- La copia de evidencia es byte por byte idéntica al original.

## Preparación para el proyecto

`/home/itadmin/Escritorio/FROGGY-FIGHT/src/assets/pato-lemus-banner.webp` se generó desde el PNG original con Pillow 10.2.0: redimensionado directo de 1254 × 1254 a 512 × 512 px con `Image.Resampling.LANCZOS`, y codificación WebP con `quality=90` y `method=6`. No se retocó ni redibujó el arte. El resultado pesa 115,074 bytes y su SHA-256 es `ee953d3702e7e0dd5658563e1244c7533128fd194c686e853b68dc5d24d4682e`.

El WebP está integrado en los banners de la intro y del nivel en el checkout editable. La validación final detectó la textura cargada en seis meshes de intro y cuatro del nivel. En el encuadre inicial del gameplay, las banderas del nivel quedan fuera o cortadas y la cara no se lee; esa composición sigue pendiente.
