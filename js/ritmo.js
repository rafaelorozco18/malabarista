// ritmo.js — Metrónomo del juego y evaluación de aciertos.
//
// El ritmo es independiente del semáforo: suena constantemente desde
// que arranca la partida, cada RITMO.intervaloBeatMs. El jugador debe
// presionar ESPACIO (estando quieto) lo más cerca posible de cada beat.

import { RITMO } from "./config.js";

/**
 * Calcula a qué beat pertenece un instante dado y qué tan lejos está
 * (en milisegundos) del centro exacto de ese beat.
 */
function calcularEstadoBeat(tiempoTranscurridoMs, intervaloMs) {
  const indiceBeat = Math.round(tiempoTranscurridoMs / intervaloMs);
  const tiempoDelBeat = indiceBeat * intervaloMs;
  const delta = Math.abs(tiempoTranscurridoMs - tiempoDelBeat);
  return { indiceBeat, delta };
}

export class Ritmo {
  constructor() {
    this.tiempoTranscurridoMs = 0;
    this.ultimoBeatPuntuado = -1;
  }

  reiniciar() {
    this.tiempoTranscurridoMs = 0;
    this.ultimoBeatPuntuado = -1;
  }

  /**
   * Avanza el reloj del metrónomo. Devuelve true si en este frame se
   * cruzó el umbral de un beat nuevo (útil para disparar el click).
   */
  actualizar(dt) {
    const beatAnterior = this.indiceBeatActual();
    this.tiempoTranscurridoMs += dt * 1000;
    const beatNuevo = this.indiceBeatActual();
    return beatNuevo > beatAnterior;
  }

  indiceBeatActual() {
    return Math.floor(this.tiempoTranscurridoMs / RITMO.intervaloBeatMs);
  }

  /**
   * Progreso 0..1 dentro del ciclo actual del beat. 0 = justo después
   * del beat anterior, 1 = justo en el beat siguiente. Se usa para
   * animar el círculo que se contrae hacia el aro del HUD.
   */
  progresoCiclo() {
    const t = this.tiempoTranscurridoMs % RITMO.intervaloBeatMs;
    return t / RITMO.intervaloBeatMs;
  }

  /**
   * El jugador intentó un acierto (ESPACIO estando quieto).
   * Devuelve "perfecto", "bien" o "fallo", o null si este beat ya
   * había sido puntuado antes (no cuenta doble).
   */
  intentarAcierto() {
    const { indiceBeat, delta } = calcularEstadoBeat(
      this.tiempoTranscurridoMs,
      RITMO.intervaloBeatMs
    );

    if (indiceBeat === this.ultimoBeatPuntuado) {
      return null;
    }
    this.ultimoBeatPuntuado = indiceBeat;

    if (delta <= RITMO.ventanaPerfectoMs) return "perfecto";
    if (delta <= RITMO.ventanaBienMs) return "bien";
    return "fallo";
  }
}
