// carro.js — Clase Carro: cada vehículo estacionado (o acelerando) en
// uno de los dos carriles.

import { CARRO } from "./config.js";

let contadorIdCarro = 0;

export class Carro {
  /**
   * @param {object} datos
   * @param {number} datos.x - posición X de la esquina izquierda.
   * @param {number} datos.y - posición Y del centro del carro.
   * @param {"A"|"B"} datos.carril - carril lejano (A) o cercano (B).
   * @param {number} datos.umbral - atención necesaria para abrir ventanilla.
   * @param {number} datos.billetera - plata disponible en este carro.
   * @param {string} datos.color - color de carrocería.
   * @param {boolean} [datos.esTaxi] - si es el taxi amarillo con letrero.
   * @param {boolean} [datos.esTerco] - si nunca abre la ventanilla.
   */
  constructor({ x, y, carril, umbral, billetera, color, esTaxi = false, esTerco = false }) {
    this.id = contadorIdCarro++;
    this.x = x;
    this.y = y;
    this.carril = carril;
    this.ancho = CARRO.ancho;
    this.alto = CARRO.alto;
    this.umbral = umbral;
    this.billetera = billetera;
    this.billeteraInicial = billetera;
    this.color = color;
    this.esTaxi = esTaxi;
    this.esTerco = esTerco;

    this.velocidad = 0; // px/s, solo avanza en verde
    this.ventanaAbierta = false;
    this.cerrado = false; // true cuando la billetera llega a 0
  }

  /** Avanza la posición del carro según el estado del semáforo. */
  actualizar(dt, semaforo) {
    if (semaforo.estaEnVerde()) {
      this.velocidad = Math.min(
        CARRO.velocidadMaxima,
        this.velocidad + CARRO.aceleracion * dt
      );
    } else {
      this.velocidad = 0;
    }
    this.x += this.velocidad * dt;
  }

  /** La ventanilla se abre y se cierra sola según la atención actual. */
  evaluarVentana(atencion) {
    if (this.cerrado) {
      this.ventanaAbierta = false;
      return;
    }
    this.ventanaAbierta = atencion > this.umbral;
  }

  /** Cobra hasta `monto` de la billetera de este carro. Devuelve lo cobrado. */
  cobrar(monto) {
    const cobrado = Math.min(monto, this.billetera);
    this.billetera -= cobrado;
    if (this.billetera <= 0) {
      this.billetera = 0;
      this.cerrado = true;
      this.ventanaAbierta = false;
    }
    return cobrado;
  }

  /** Rectángulo de colisión (esquina superior izquierda + tamaño). */
  rectangulo() {
    return {
      x: this.x,
      y: this.y - this.alto / 2,
      ancho: this.ancho,
      alto: this.alto,
    };
  }

  /** Punto donde sale el brazo con la moneda cuando la ventanilla está abierta. */
  posicionVentanilla() {
    const centroX = this.x + this.ancho / 2;
    if (this.carril === "A") {
      // El carril lejano da la espalda al andén superior: el brazo
      // sale hacia abajo, que es donde camina el jugador.
      return { x: centroX, y: this.y + this.alto / 2 };
    }
    return { x: centroX, y: this.y - this.alto / 2 };
  }

  /** ¿Sigue visible dentro (o cerca) del lienzo? */
  fueraDePantalla(anchoLienzo) {
    return this.x > anchoLienzo + this.ancho;
  }
}
