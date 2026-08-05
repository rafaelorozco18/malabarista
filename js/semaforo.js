// semaforo.js — Máquina de estados del semáforo.
//
//   ROJO (30s, baja 1s por ciclo, piso 20s)
//     -> AMARILLO (4s)
//       -> VERDE (7s)
//         -> [nuevo ciclo] -> ROJO
//
// En ROJO y AMARILLO los carros están quietos. En VERDE aceleran y
// salen por la derecha. Al terminar el VERDE arranca un ciclo nuevo.

import { SEMAFORO } from "./config.js";

export const ESTADOS_SEMAFORO = {
  ROJO: "ROJO",
  AMARILLO: "AMARILLO",
  VERDE: "VERDE",
};

export class Semaforo {
  constructor() {
    this.ciclo = 1;
    this.estado = ESTADOS_SEMAFORO.ROJO;
    this.tiempoRestante = this.duracionRojoActual();
  }

  reiniciar() {
    this.ciclo = 1;
    this.estado = ESTADOS_SEMAFORO.ROJO;
    this.tiempoRestante = this.duracionRojoActual();
  }

  duracionRojoActual() {
    const duracion =
      SEMAFORO.duracionRojoInicial -
      (this.ciclo - 1) * SEMAFORO.duracionRojoDecremento;
    return Math.max(SEMAFORO.duracionRojoPiso, duracion);
  }

  /**
   * Avanza el reloj del semáforo. Si el tiempo restante se agota,
   * cambia de estado y devuelve un evento en forma de string:
   * "AMARILLO", "VERDE" o "NUEVO_CICLO". Devuelve null si no pasó nada.
   */
  actualizar(dt) {
    this.tiempoRestante -= dt;
    if (this.tiempoRestante > 0) {
      return null;
    }
    return this._avanzarEstado();
  }

  _avanzarEstado() {
    if (this.estado === ESTADOS_SEMAFORO.ROJO) {
      this.estado = ESTADOS_SEMAFORO.AMARILLO;
      this.tiempoRestante = SEMAFORO.duracionAmarillo;
      return "AMARILLO";
    }
    if (this.estado === ESTADOS_SEMAFORO.AMARILLO) {
      this.estado = ESTADOS_SEMAFORO.VERDE;
      this.tiempoRestante = SEMAFORO.duracionVerde;
      return "VERDE";
    }
    // estado === VERDE -> arranca un ciclo nuevo
    this.ciclo += 1;
    this.estado = ESTADOS_SEMAFORO.ROJO;
    this.tiempoRestante = this.duracionRojoActual();
    return "NUEVO_CICLO";
  }

  estaEnVerde() {
    return this.estado === ESTADOS_SEMAFORO.VERDE;
  }

  estaEnAmarillo() {
    return this.estado === ESTADOS_SEMAFORO.AMARILLO;
  }
}
