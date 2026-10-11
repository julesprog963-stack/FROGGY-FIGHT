# 🐸 FROGGY-FIGHT - Defensa del Bosque

Plataformas 3D en **Three.js** con estética de **Nintendo 64** al estilo *Conker's Bad Fur Day*.

> *"Eres pequeño, el mundo se inclina contra ti, y cada bicho que comes te da otra oportunidad de llegar a casa."*

---

## 🕹️ Mecánicas del Juego
* **Salto con Carga (`Espacio`):** Mantén presionado para cargar altura con animación de *squash & stretch*.
* **Lengua con Doble Función (`E` o `Clic Izquierdo`):**
  * **Balanceo (Látigo):** Engánchate a los anillos dorados suspendidos para balancearte como péndulo.
  * **Comer Bichos:** Caza moscas, escarabajos y avispas para ganar vidas (+1 vida cada 20 bichos).
* **Hojas Inestables (Tilting Leaves):** Tiemblan y cambian de color antes de inclinarse drásticamente.
* **Jefe Final en la Cima:** El robot *TALACORP Bug-Zapper 3000* en una batalla de 3 fases con pisotón de rana (*butt-stomp*).
* **Audio y FX:** Sonido procedural retro WebAudio (bajo slap de selva que pasa a industrial) y partículas N64.

---

## 🚀 Instalación y Ejecución Local
```bash
npm install
npm run dev
```

Abre en tu navegador `http://localhost:5173/`.

## 📦 Build de Producción
```bash
npm run build
```
Genera la carpeta optimizada `/dist` lista para Netlify, Vercel o GitHub Pages.
