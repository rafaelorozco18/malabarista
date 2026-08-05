// config.js — Constantes, paleta de colores y zonas del mapa.
// Todo lo que es un "número mágico" del diseño del juego vive aquí,
// para que ajustar el balance no implique bucear en la lógica.

export const ANCHO_LIENZO = 960;
export const ALTO_LIENZO = 600;

// ---------------------------------------------------------------------
// Paleta de colores (usar tal cual la definió el diseño)
// ---------------------------------------------------------------------
export const PALETA = {
  asfalto: "#3a3d42",
  lineasVia: "#d8d4c8",
  anden: "#a8aab0",
  separador: "#6b7a52",
  cebra: "#e8e6de",
  ladrillo: "#8c4a32",
  amarilloTaxi: "#f2b705",
  rojo: "#e63946",
  verde: "#43aa4c",
  fondoHUD: "#14161a",
  textoHUD: "#f5f3ee",
};

// Colores variados para la carrocería de los carros (además del taxi).
export const COLORES_CARROS = [
  "#3f6fb0", // azul
  "#f2b705", // amarillo taxi
  "#e63946", // rojo
  "#43aa4c", // verde
  "#e8e6de", // blanco
  "#8a8f98", // gris
];

// ---------------------------------------------------------------------
// Zonas del mapa (bandas horizontales, ver tabla de la especificación)
// ---------------------------------------------------------------------
export const ZONAS = {
  hudSuperior: { y0: 0, y1: 64, segura: null },
  andenSuperior: { y0: 64, y1: 116, segura: true },
  carrilA: { y0: 116, y1: 246, segura: false },
  separador: { y0: 246, y1: 296, segura: true },
  carrilB: { y0: 296, y1: 426, segura: false },
  cebra: { y0: 426, y1: 486, segura: true },
  andenInferior: { y0: 486, y1: 540, segura: true },
  hudInferior: { y0: 540, y1: 600, segura: null },
};

// Y central de cada carril, útil para ubicar los carros.
export const Y_CENTRO_CARRIL_A =
  (ZONAS.carrilA.y0 + ZONAS.carrilA.y1) / 2;
export const Y_CENTRO_CARRIL_B =
  (ZONAS.carrilB.y0 + ZONAS.carrilB.y1) / 2;

// ---------------------------------------------------------------------
// Jugador
// ---------------------------------------------------------------------
export const JUGADOR = {
  ancho: 26,
  alto: 26,
  velocidad: 200, // px/s
  vidasIniciales: 3,
  spawnX: 120,
  spawnY: (ZONAS.cebra.y0 + ZONAS.cebra.y1) / 2,
};

// ---------------------------------------------------------------------
// Carros
// ---------------------------------------------------------------------
export const CARRO = {
  ancho: 120,
  alto: 62,
  separacionEntreCarros: 30,
  aceleracion: 260, // px/s^2 durante el verde
  velocidadMaxima: 520, // px/s
  umbrales: [25, 40, 55, 70, 85],
  umbralCarroTerco: 999,
  billeteraCarrilA: { min: 3000, max: 7000 },
  billeteraCarrilB: { min: 1500, max: 4000 },
  distanciaCobro: 45, // px
  tasaCobro: 320, // plata/segundo, multiplicada por el multiplicador
};

// ---------------------------------------------------------------------
// Semáforo (duraciones en segundos)
// ---------------------------------------------------------------------
export const SEMAFORO = {
  duracionRojoInicial: 30,
  duracionRojoDecremento: 1,
  duracionRojoPiso: 20,
  duracionAmarillo: 4,
  duracionVerde: 7,
};

// ---------------------------------------------------------------------
// Ritmo / metrónomo
// ---------------------------------------------------------------------
export const RITMO = {
  intervaloBeatMs: 500,
  ventanaPerfectoMs: 60,
  ventanaBienMs: 140,
};

// ---------------------------------------------------------------------
// Atención
// ---------------------------------------------------------------------
export const ATENCION = {
  maximo: 100,
  gananciaPerfecto: 12,
  gananciaBien: 7,
  penalidadFallo: -6,
  decaimientoQuieto: -7, // por segundo
  decaimientoCaminando: -20, // por segundo
};

// ---------------------------------------------------------------------
// Multiplicador y riesgo
// ---------------------------------------------------------------------
export const RIESGO = {
  stacksMaximos: 3,
};

// ---------------------------------------------------------------------
// Competidor
// ---------------------------------------------------------------------
export const COMPETIDOR = {
  cicloDeEntrada: 4,
  drenajePorSegundo: 500,
  velocidad: 180,
};

// ---------------------------------------------------------------------
// Carros por ciclo
// ---------------------------------------------------------------------
export const CANTIDAD_CARROS = {
  inicial: 3,
  maximo: 6,
  ciclosPorIncremento: 2,
};

// dt máximo permitido por frame, para evitar saltos si la pestaña
// pierde el foco (la especificación pide limitarlo a 0.05s).
export const DT_MAXIMO = 0.05;

// Clave de localStorage para el récord de plata.
export const CLAVE_RECORD = "pilas_record";
