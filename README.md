# ¡Pilas Que Arranca!

Un arcade web sobre el malabarista de semáforo: esa persona que, en la
luz roja de cualquier intersección de Bogotá, hace malabares con
pelotas o bolos para ganarse la atención (y la plata) de los
conductores antes de que el semáforo cambie a verde.

El juego traduce ese oficio a una mecánica simple pero tensa: en cada
ciclo de semáforo tienes una sola bolsa de tiempo para repartir entre
**malabarear al ritmo** (subir tu nivel de atención, que es lo que
abre las ventanillas de los carros) y **caminar a cobrar** (acercarte
a las ventanillas ya abiertas para que la plata empiece a fluir). No
puedes hacer las dos cosas a la vez: si te mueves, el ritmo no cuenta.
Esa es toda la tensión del juego.

## Requisitos

- **Python 3** (probado con 3.8+). Nada más.
- Ningún paquete adicional, ningún `pip install`, ningún framework de
  JavaScript. El backend usa solo la librería estándar de Python
  (`http.server`, `socketserver`, `webbrowser`, `threading`) y el
  frontend es HTML5 Canvas 2D + JavaScript vanilla con módulos ES6.
- Funciona completamente offline: no hay CDNs, ni imágenes, ni
  archivos de audio. Todo se dibuja con primitivas de Canvas 2D y todo
  el sonido se genera en vivo con osciladores de la Web Audio API.

## Cómo ejecutarlo

Desde la carpeta del proyecto:

```bash
python3 servidor.py
```

Esto levanta un servidor en `http://localhost:8000` (o el primer
puerto libre entre 8000 y 8010 si ese está ocupado) y abre el
navegador automáticamente. Para detenerlo, `Ctrl+C` en la terminal.

## ¿Por qué se necesita un servidor local?

El juego está escrito en **módulos ES6** de JavaScript: `js/juego.js`
importa a `js/dibujo.js`, `js/dibujo.js` importa a `js/config.js`, y
así sucesivamente con `import` / `export`.

Los navegadores aplican la política de **CORS** (Cross-Origin Resource
Sharing) también al cargar módulos ES6. Si abres `index.html`
haciendo doble clic (protocolo `file://`), cada archivo se trata como
si viniera de un origen distinto y sin origen válido (origen
`"null"`), así que el navegador **bloquea los `import`** con un error
como:

```
Access to script at 'file:///.../js/juego.js' from origin 'null'
has been blocked by CORS policy
```

Al servir los archivos por HTTP, todos comparten el mismo origen real
(`http://localhost:8000`) y el navegador sí permite que los módulos se
importen entre sí. Por eso `servidor.py` existe: no es un capricho,
es un requisito técnico de usar módulos ES6 sin empaquetador.

Nota adicional: el servidor también se asegura de servir los archivos
`.js` con el tipo MIME `text/javascript`. Si se sirvieran con un tipo
genérico como `text/plain`, el navegador tampoco los ejecutaría como
módulos, aunque ya estuvieran en HTTP.

## Arquitectura

```
pilas-que-arranca/
├── servidor.py        # servidor HTTP local (solo librería estándar)
├── index.html          # punto de entrada, carga js/juego.js como módulo
├── css/estilo.css       # estilos de la página (el juego se dibuja en canvas)
└── js/
    ├── config.js        # constantes, paleta de colores, zonas del mapa
    ├── ritmo.js          # metrónomo: beats cada 500ms, ventanas de acierto
    ├── semaforo.js       # máquina de estados ROJO → AMARILLO → VERDE
    ├── carro.js          # clase Carro: umbral, billetera, ventanilla
    ├── jugador.js        # clase Jugador: movimiento, zonas, vidas
    ├── competidor.js     # NPC rival que entra desde el ciclo 4
    ├── dibujo.js         # todas las funciones de render (Canvas 2D puro)
    ├── audio.js          # sonidos generados con osciladores Web Audio API
    └── juego.js          # bucle principal, estados del juego, input
```

Cada módulo tiene una responsabilidad única y se comunica con los
demás mediante `import`/`export` explícitos — nada de variables
globales escondidas ni un archivo gigante con todo mezclado.

- **config.js** es la fuente de verdad de todos los números de
  balance (duraciones, velocidades, umbrales, paleta de colores). Si
  quieres ajustar la dificultad, es el único archivo que hace falta
  tocar.
- **ritmo.js** lleva su propio reloj interno (milisegundos desde que
  arrancó la partida) y decide si una pulsación de ESPACIO cae en la
  ventana de "perfecto", "bien" o "fallo", garantizando que cada beat
  solo se pueda puntuar una vez.
- **semaforo.js** es una máquina de estados explícita: cada llamado a
  `actualizar(dt)` devuelve un evento (`"AMARILLO"`, `"VERDE"`,
  `"NUEVO_CICLO"` o `null`) que `juego.js` usa para disparar sonidos y
  regenerar la fila de carros.
- **carro.js** encapsula el comportamiento de cada vehículo: cuándo
  abre su ventanilla (según la atención global) y cómo se vacía su
  billetera al cobrar.
- **dibujo.js** no tiene lógica de juego, solo funciones puras de
  render que reciben datos y dibujan con `fillRect`, `arc`,
  `roundRect`, etc.
- **juego.js** es el orquestador: mantiene el estado global de la
  partida, procesa el input del teclado, corre el bucle principal con
  `requestAnimationFrame` y delta time real, y llama a los demás
  módulos en el orden correcto cada frame.

## La máquina de estados del semáforo

```
   ┌────────────────────────────────────────────┐
   │                                              │
   ▼                                              │
 ROJO (30s, baja 1s por ciclo, piso 20s)          │
   │ carros quietos                               │
   ▼                                              │
 AMARILLO (4s)                                    │
   │ carros quietos                               │
   │ acertar el ritmo aquí suma stacks de riesgo   │
   ▼                                              │
 VERDE (7s)                                       │
   │ carros aceleran (+260 px/s², tope 520 px/s)   │
   │ y salen por la derecha                        │
   └──────────────────► NUEVO CICLO ──────────────┘
       (fila de carros nueva, atención a 0,
        stacks de riesgo a 0, ciclo +1)
```

Cada ciclo completo (rojo → amarillo → verde) es una "ronda" del
juego: la atención siempre arranca en 0 y hay que reconstruirla desde
cero, lo cual obliga a decidir de nuevo cuánto tiempo malabarear antes
de salir a cobrar.

## Controles

| Tecla            | Acción                                             |
|------------------|-----------------------------------------------------|
| `WASD` / Flechas | Mover al malabarista                                |
| `ESPACIO`        | Malabarear al ritmo (solo cuenta si estás quieto)   |
| `P`              | Pausar / reanudar                                   |
| `R`              | Reiniciar (desde la pantalla de Game Over)           |
| `ENTER`          | Empezar partida (desde el menú)                      |

El récord de plata se guarda en `localStorage` y se muestra tanto en
el menú como en la pantalla de Game Over.
