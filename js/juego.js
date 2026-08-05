// juego.js — Bucle principal y orquestación de "¡Pilas Que Arranca!".
//
// Punto de entrada del juego (referenciado desde index.html como
// módulo ES6). Une todos los demás módulos: ritmo, semáforo, carros,
// jugador, competidor, dibujo y audio.

import {
  CLAVE_RECORD,
  CARRO,
  ATENCION,
  RIESGO,
  COMPETIDOR,
  CANTIDAD_CARROS,
  COLORES_CARROS,
  PALETA,
  DT_MAXIMO,
  Y_CENTRO_CARRIL_A,
  Y_CENTRO_CARRIL_B,
} from "./config.js";
import { Ritmo } from "./ritmo.js";
import { Semaforo } from "./semaforo.js";
import { Carro } from "./carro.js";
import { Jugador } from "./jugador.js";
import { Competidor } from "./competidor.js";
import {
  dibujarFondo,
  dibujarCarro,
  dibujarJugador,
  dibujarCompetidor,
  dibujarFlashColision,
  dibujarHudSuperior,
  dibujarHudInferior,
  dibujarPantallaMenu,
  dibujarPantallaPausa,
  dibujarPantallaGameOver,
} from "./dibujo.js";
import {
  inicializarAudio,
  sonidoClickMetronomo,
  sonidoMoneda,
  sonidoBocina,
  sonidoGolpe,
  sonidoAcierto,
} from "./audio.js";

// ---------------------------------------------------------------------
// Estados del juego
// ---------------------------------------------------------------------
const ESTADO_JUEGO = {
  MENU: "MENU",
  JUGANDO: "JUGANDO",
  PAUSA: "PAUSA",
  GAME_OVER: "GAME_OVER",
};

// ---------------------------------------------------------------------
// Lienzo
// ---------------------------------------------------------------------
const lienzo = document.getElementById("lienzo");
const ctx = lienzo.getContext("2d");

// ---------------------------------------------------------------------
// Estado global de la partida
// ---------------------------------------------------------------------
let estado = ESTADO_JUEGO.MENU;

const jugador = new Jugador();
const competidor = new Competidor();
const semaforo = new Semaforo();
const ritmo = new Ritmo();

let carros = [];
let atencion = 0;
let multiplicador = 1;
let stacksRiesgo = 0;
let tiempoTranscurrido = 0; // tiempo de partida en segundos, para el HUD
let tiempoGlobal = 0; // reloj que corre siempre, para animaciones de fondo/menú
let colorAro = "#666";
let flashColision = 0;
let temporizadorSonidoMoneda = 0;

let record = Number(localStorage.getItem(CLAVE_RECORD)) || 0;
let gameOverEsRecordNuevo = false;

const teclas = new Set();
let audioInicializado = false;

// ---------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------

function randomEntre(min, max) {
  return min + Math.random() * (max - min);
}

function mezclarArreglo(arreglo) {
  const copia = [...arreglo];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

function rectangulosSolapan(a, b) {
  return (
    a.x < b.x + b.ancho &&
    a.x + a.ancho > b.x &&
    a.y < b.y + b.alto &&
    a.y + a.alto > b.y
  );
}

// ---------------------------------------------------------------------
// Generación de carros por ciclo
// ---------------------------------------------------------------------

function generarFilaCarros(ciclo) {
  const cantidadPorCarril = Math.min(
    CANTIDAD_CARROS.maximo,
    CANTIDAD_CARROS.inicial + Math.floor((ciclo - 1) / CANTIDAD_CARROS.ciclosPorIncremento)
  );

  const nuevosCarros = [];

  for (const carril of ["A", "B"]) {
    const yCentro = carril === "A" ? Y_CENTRO_CARRIL_A : Y_CENTRO_CARRIL_B;
    const rangoBilletera = carril === "A" ? CARRO.billeteraCarrilA : CARRO.billeteraCarrilB;
    const umbralesBarajados = mezclarArreglo(CARRO.umbrales);

    for (let i = 0; i < cantidadPorCarril; i++) {
      const x = 40 + i * (CARRO.ancho + CARRO.separacionEntreCarros);
      const umbral = umbralesBarajados[i % umbralesBarajados.length];
      const billetera = Math.round(randomEntre(rangoBilletera.min, rangoBilletera.max));
      const color = COLORES_CARROS[Math.floor(Math.random() * COLORES_CARROS.length)];
      nuevosCarros.push(new Carro({ x, y: yCentro, carril, umbral, billetera, color }));
    }
  }

  // Exactamente un carro terco por ciclo (umbral 999, nunca abre).
  const indiceTerco = Math.floor(Math.random() * nuevosCarros.length);
  nuevosCarros[indiceTerco].umbral = CARRO.umbralCarroTerco;
  nuevosCarros[indiceTerco].esTerco = true;

  // Al menos un taxi amarillo con letrero por ciclo.
  let indiceTaxi = Math.floor(Math.random() * nuevosCarros.length);
  if (nuevosCarros.length > 1) {
    while (indiceTaxi === indiceTerco) {
      indiceTaxi = Math.floor(Math.random() * nuevosCarros.length);
    }
  }
  nuevosCarros[indiceTaxi].esTaxi = true;
  nuevosCarros[indiceTaxi].color = PALETA.amarilloTaxi;

  return nuevosCarros;
}

// ---------------------------------------------------------------------
// Ciclo de vida de la partida
// ---------------------------------------------------------------------

function iniciarPartida() {
  jugador.reiniciarPartida();
  competidor.activo = false;
  semaforo.reiniciar();
  ritmo.reiniciar();

  atencion = 0;
  multiplicador = 1;
  stacksRiesgo = 0;
  tiempoTranscurrido = 0;
  colorAro = "#666";
  flashColision = 0;

  carros = generarFilaCarros(semaforo.ciclo);

  estado = ESTADO_JUEGO.JUGANDO;
}

function alEmpezarNuevoCiclo() {
  carros = generarFilaCarros(semaforo.ciclo);
  atencion = 0;
  stacksRiesgo = 0;

  if (semaforo.ciclo >= COMPETIDOR.cicloDeEntrada) {
    if (!competidor.activo) {
      competidor.activar();
    } else {
      competidor.reposicionar();
    }
  }
}

function perderVida() {
  jugador.perderVida();
  atencion = 0;
  flashColision = 1;
  sonidoGolpe();

  if (jugador.vidas <= 0) {
    finalizarPartida();
  }
}

function finalizarPartida() {
  estado = ESTADO_JUEGO.GAME_OVER;
  const plataFinal = Math.floor(jugador.plata);
  gameOverEsRecordNuevo = plataFinal > record;
  if (gameOverEsRecordNuevo) {
    record = plataFinal;
    localStorage.setItem(CLAVE_RECORD, String(record));
  }
}

// ---------------------------------------------------------------------
// Actualización por frame
// ---------------------------------------------------------------------

function actualizarJuego(dt) {
  tiempoTranscurrido += dt;

  // --- Ritmo (metrónomo, corre siempre durante la partida) ---
  const huboBeatNuevo = ritmo.actualizar(dt);
  if (huboBeatNuevo) {
    sonidoClickMetronomo();
  }

  // --- Semáforo ---
  const evento = semaforo.actualizar(dt);
  if (evento === "AMARILLO") {
    sonidoBocina();
  } else if (evento === "NUEVO_CICLO") {
    alEmpezarNuevoCiclo();
  }

  // --- Jugador ---
  jugador.actualizar(dt, teclas);

  // --- Atención: decaimiento pasivo (más rápido si camina) ---
  const decaimiento = jugador.quieto ? ATENCION.decaimientoQuieto : ATENCION.decaimientoCaminando;
  atencion = Math.max(0, Math.min(ATENCION.maximo, atencion + decaimiento * dt));

  // --- Multiplicador ---
  multiplicador = 1 + Math.floor(atencion / 25) + stacksRiesgo;

  // --- Carros: movimiento y ventanillas ---
  for (const carro of carros) {
    carro.actualizar(dt, semaforo);
    carro.evaluarVentana(atencion);
  }

  // --- Cobro automático de plata ---
  let seCobroAlgo = false;
  for (const carro of carros) {
    if (!carro.ventanaAbierta) continue;
    const punto = carro.posicionVentanilla();
    const distancia = Math.hypot(jugador.x - punto.x, jugador.y - punto.y);
    if (distancia <= CARRO.distanciaCobro) {
      const tasa = CARRO.tasaCobro * multiplicador * dt;
      const cobrado = carro.cobrar(tasa);
      if (cobrado > 0) {
        jugador.ganarPlata(cobrado);
        seCobroAlgo = true;
      }
    }
  }
  if (seCobroAlgo) {
    temporizadorSonidoMoneda -= dt;
    if (temporizadorSonidoMoneda <= 0) {
      sonidoMoneda();
      temporizadorSonidoMoneda = 0.15;
    }
  } else {
    temporizadorSonidoMoneda = 0;
  }

  // --- Competidor ---
  competidor.actualizar(dt, carros);

  // --- Colisión con carros en movimiento durante el verde ---
  if (semaforo.estaEnVerde() && !jugador.enZonaSegura()) {
    const rectJugador = jugador.rectangulo();
    for (const carro of carros) {
      if (carro.velocidad <= 0) continue;
      if (rectangulosSolapan(rectJugador, carro.rectangulo())) {
        perderVida();
        break;
      }
    }
  }

  // --- Decaimiento del destello de colisión ---
  if (flashColision > 0) {
    flashColision = Math.max(0, flashColision - dt * 2.2);
  }
}

// ---------------------------------------------------------------------
// Manejo de teclas
// ---------------------------------------------------------------------

const MAPA_MOVIMIENTO = {
  arrowleft: "izquierda",
  a: "izquierda",
  arrowright: "derecha",
  d: "derecha",
  arrowup: "arriba",
  w: "arriba",
  arrowdown: "abajo",
  s: "abajo",
};

function asegurarAudioInicializado() {
  if (!audioInicializado) {
    inicializarAudio();
    audioInicializado = true;
  }
}

function manejarAcierto() {
  if (!jugador.quieto) return; // solo cuenta si el jugador está completamente quieto
  const resultado = ritmo.intentarAcierto();
  if (!resultado) return; // este beat ya fue puntuado

  if (resultado === "perfecto") {
    atencion = Math.min(ATENCION.maximo, atencion + ATENCION.gananciaPerfecto);
    colorAro = PALETA.verde;
  } else if (resultado === "bien") {
    atencion = Math.min(ATENCION.maximo, atencion + ATENCION.gananciaBien);
    colorAro = PALETA.amarilloTaxi;
  } else {
    atencion = Math.max(0, atencion + ATENCION.penalidadFallo);
    colorAro = PALETA.rojo;
  }

  sonidoAcierto(resultado);

  // Bono de riesgo: aciertos (perfecto o bien) durante el amarillo.
  if (resultado !== "fallo" && semaforo.estaEnAmarillo()) {
    stacksRiesgo = Math.min(RIESGO.stacksMaximos, stacksRiesgo + 1);
  }
}

window.addEventListener("keydown", (evento) => {
  asegurarAudioInicializado();
  const tecla = evento.key.toLowerCase();

  if (MAPA_MOVIMIENTO[tecla]) {
    teclas.add(MAPA_MOVIMIENTO[tecla]);
    evento.preventDefault();
    return;
  }

  if (evento.code === "Space" || tecla === " ") {
    evento.preventDefault();
    if (estado === ESTADO_JUEGO.JUGANDO && !evento.repeat) {
      manejarAcierto();
    }
    return;
  }

  if (tecla === "p" && !evento.repeat) {
    if (estado === ESTADO_JUEGO.JUGANDO) {
      estado = ESTADO_JUEGO.PAUSA;
    } else if (estado === ESTADO_JUEGO.PAUSA) {
      estado = ESTADO_JUEGO.JUGANDO;
    }
    return;
  }

  if (tecla === "r" && !evento.repeat) {
    if (estado === ESTADO_JUEGO.GAME_OVER) {
      iniciarPartida();
    }
    return;
  }

  if (tecla === "enter" && !evento.repeat) {
    if (estado === ESTADO_JUEGO.MENU) {
      iniciarPartida();
    }
    return;
  }
});

window.addEventListener("keyup", (evento) => {
  const tecla = evento.key.toLowerCase();
  if (MAPA_MOVIMIENTO[tecla]) {
    teclas.delete(MAPA_MOVIMIENTO[tecla]);
  }
});

lienzo.addEventListener("click", () => {
  asegurarAudioInicializado();
});

// ---------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------

function dibujarTodo() {
  dibujarFondo(ctx, tiempoGlobal);

  for (const carro of carros) {
    dibujarCarro(ctx, carro);
  }

  dibujarJugador(ctx, jugador, tiempoGlobal);
  dibujarCompetidor(ctx, competidor);

  dibujarFlashColision(ctx, flashColision);

  dibujarHudSuperior(ctx, {
    atencion,
    carrosVivos: carros,
    vidas: jugador.vidas,
    plata: jugador.plata,
    tiempoTranscurrido,
    estadoSemaforo: semaforo.estado,
    ciclo: semaforo.ciclo,
  });

  dibujarHudInferior(ctx, {
    progresoCiclo: ritmo.progresoCiclo(),
    colorAro,
    multiplicador,
    stacksRiesgo,
    tiempoTotal: tiempoGlobal,
  });

  if (estado === ESTADO_JUEGO.MENU) {
    dibujarPantallaMenu(ctx, record, tiempoGlobal);
  } else if (estado === ESTADO_JUEGO.PAUSA) {
    dibujarPantallaPausa(ctx);
  } else if (estado === ESTADO_JUEGO.GAME_OVER) {
    dibujarPantallaGameOver(ctx, {
      plataTotal: jugador.plata,
      ciclos: semaforo.ciclo,
      record,
      esRecordNuevo: gameOverEsRecordNuevo,
    });
  }
}

// ---------------------------------------------------------------------
// Bucle principal (requestAnimationFrame + delta time real)
// ---------------------------------------------------------------------

let tiempoAnterior = null;

function bucle(marcaTiempo) {
  if (tiempoAnterior === null) tiempoAnterior = marcaTiempo;
  let dt = (marcaTiempo - tiempoAnterior) / 1000;
  tiempoAnterior = marcaTiempo;

  // Se limita el dt para evitar saltos si la pestaña pierde el foco.
  dt = Math.min(DT_MAXIMO, Math.max(0, dt));

  tiempoGlobal += dt;

  if (estado === ESTADO_JUEGO.JUGANDO) {
    actualizarJuego(dt);
  }

  dibujarTodo();

  requestAnimationFrame(bucle);
}

requestAnimationFrame(bucle);
