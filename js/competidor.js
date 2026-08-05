// competidor.js — NPC rival: otro malabarista que compite por la plata.
//
// A partir del ciclo 4 entra por el borde derecho, se dirige al carro
// con más plata en la billetera y le drena plata directamente, sin
// pasar por el ritmo ni la atención. Es pura presión de tiempo: no se
// le puede atacar, solo se le puede "ganar" llegando primero a los
// carros ricos.

import { ANCHO_LIENZO, COMPETIDOR, Y_CENTRO_CARRIL_A, Y_CENTRO_CARRIL_B } from "./config.js";

export class Competidor {
  constructor() {
    this.activo = false;
    this.x = ANCHO_LIENZO + 40;
    this.y = Y_CENTRO_CARRIL_A;
    this.ancho = 24;
    this.alto = 24;
    this.objetivo = null;
  }

  activar() {
    this.activo = true;
    this.x = ANCHO_LIENZO + 40;
    this.y = Y_CENTRO_CARRIL_B;
  }

  /** Se reubica al arrancar cada ciclo nuevo, listo para buscar objetivo. */
  reposicionar() {
    if (!this.activo) return;
    this.x = ANCHO_LIENZO + 40;
    this.y = Y_CENTRO_CARRIL_B;
    this.objetivo = null;
  }

  _elegirObjetivo(carros) {
    const candidatos = carros.filter((c) => !c.cerrado && c.billetera > 0);
    if (candidatos.length === 0) return null;
    return candidatos.reduce((mejor, actual) =>
      actual.billetera > mejor.billetera ? actual : mejor
    );
  }

  actualizar(dt, carros) {
    if (!this.activo) return;

    // Si el objetivo ya no existe, quedó sin plata, o aún no hay uno, buscamos otro.
    if (!this.objetivo || this.objetivo.cerrado || this.objetivo.billetera <= 0) {
      this.objetivo = this._elegirObjetivo(carros);
    }

    if (!this.objetivo) return;

    const destino = this.objetivo.posicionVentanilla();
    const dx = destino.x - this.x;
    const dy = destino.y - this.y;
    const distancia = Math.hypot(dx, dy);

    if (distancia > 4) {
      const vx = (dx / distancia) * COMPETIDOR.velocidad;
      const vy = (dy / distancia) * COMPETIDOR.velocidad;
      this.x += vx * dt;
      this.y += vy * dt;
    } else {
      // Llegó: drena la billetera del carro.
      this.objetivo.cobrar(COMPETIDOR.drenajePorSegundo * dt);
    }
  }

  rectangulo() {
    return {
      x: this.x - this.ancho / 2,
      y: this.y - this.alto / 2,
      ancho: this.ancho,
      alto: this.alto,
    };
  }
}
