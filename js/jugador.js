// jugador.js — Clase Jugador: el malabarista que controla la persona
// que juega.

import { JUGADOR, ZONAS, ANCHO_LIENZO } from "./config.js";

export class Jugador {
  constructor() {
    this.ancho = JUGADOR.ancho;
    this.alto = JUGADOR.alto;
    this.vidas = JUGADOR.vidasIniciales;
    this.plata = 0;
    this.quieto = true;
    this._colocarEnSpawn();
  }

  _colocarEnSpawn() {
    this.x = JUGADOR.spawnX;
    this.y = JUGADOR.spawnY;
  }

  reiniciarPartida() {
    this.vidas = JUGADOR.vidasIniciales;
    this.plata = 0;
    this.quieto = true;
    this._colocarEnSpawn();
  }

  /** Mueve al jugador según las teclas activas. `teclas` es un Set de strings. */
  actualizar(dt, teclas) {
    let dx = 0;
    let dy = 0;

    if (teclas.has("izquierda")) dx -= 1;
    if (teclas.has("derecha")) dx += 1;
    if (teclas.has("arriba")) dy -= 1;
    if (teclas.has("abajo")) dy += 1;

    this.quieto = dx === 0 && dy === 0;

    if (!this.quieto) {
      // Normalizamos para que la diagonal no sea más rápida.
      const longitud = Math.hypot(dx, dy) || 1;
      const vx = (dx / longitud) * JUGADOR.velocidad;
      const vy = (dy / longitud) * JUGADOR.velocidad;
      this.x += vx * dt;
      this.y += vy * dt;
    }

    // Límites del área jugable: entre el andén superior y el andén inferior,
    // sin salirse del ancho del lienzo.
    const yMin = ZONAS.andenSuperior.y0 + this.alto / 2;
    const yMax = ZONAS.andenInferior.y1 - this.alto / 2;
    this.x = Math.max(this.ancho / 2, Math.min(ANCHO_LIENZO - this.ancho / 2, this.x));
    this.y = Math.max(yMin, Math.min(yMax, this.y));
  }

  rectangulo() {
    return {
      x: this.x - this.ancho / 2,
      y: this.y - this.alto / 2,
      ancho: this.ancho,
      alto: this.alto,
    };
  }

  /** Devuelve el nombre de la zona (clave de ZONAS) donde está el centro del jugador. */
  zonaActual() {
    for (const [nombre, zona] of Object.entries(ZONAS)) {
      if (this.y >= zona.y0 && this.y < zona.y1) return nombre;
    }
    return null;
  }

  enZonaSegura() {
    const nombre = this.zonaActual();
    if (!nombre) return false;
    return ZONAS[nombre].segura === true;
  }

  perderVida() {
    this.vidas = Math.max(0, this.vidas - 1);
    this._colocarEnSpawn();
  }

  ganarPlata(monto) {
    this.plata += monto;
  }
}
