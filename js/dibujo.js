// dibujo.js — Todas las funciones de render. Vista cenital dibujada
// exclusivamente con primitivas de Canvas 2D (fillRect, arc, paths,
// roundRect). Cero imágenes.

import {
  PALETA,
  ZONAS,
  ANCHO_LIENZO,
  ALTO_LIENZO,
  RIESGO,
} from "./config.js";
import { ESTADOS_SEMAFORO } from "./semaforo.js";

// ---------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------

/** Rectángulo con esquinas redondeadas, con fallback por si roundRect no existe. */
function rectRedondeado(ctx, x, y, ancho, alto, radio) {
  if (typeof ctx.roundRect === "function") {
    ctx.beginPath();
    ctx.roundRect(x, y, ancho, alto, radio);
    return;
  }
  // Fallback manual (navegadores muy viejos sin roundRect nativo).
  const r = Math.min(radio, ancho / 2, alto / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + ancho - r, y);
  ctx.arcTo(x + ancho, y, x + ancho, y + r, r);
  ctx.lineTo(x + ancho, y + alto - r);
  ctx.arcTo(x + ancho, y + alto, x + ancho - r, y + alto, r);
  ctx.lineTo(x + r, y + alto);
  ctx.arcTo(x, y + alto, x, y + alto - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

export function formatoPlata(monto) {
  const entero = Math.max(0, Math.floor(monto));
  return "$" + entero.toLocaleString("es-CO");
}

export function formatoTiempo(segundosTotales) {
  const t = Math.max(0, Math.floor(segundosTotales));
  const mm = String(Math.floor(t / 60)).padStart(2, "0");
  const ss = String(t % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

// ---------------------------------------------------------------------
// Mapa / fondo
// ---------------------------------------------------------------------

export function dibujarFondo(ctx, tiempoTotal) {
  ctx.clearRect(0, 0, ANCHO_LIENZO, ALTO_LIENZO);

  // Andén superior
  dibujarAnden(ctx, ZONAS.andenSuperior.y0, ZONAS.andenSuperior.y1);
  // Carril A
  dibujarCarril(ctx, ZONAS.carrilA.y0, ZONAS.carrilA.y1, tiempoTotal);
  // Separador (grama/berma)
  dibujarSeparador(ctx, ZONAS.separador.y0, ZONAS.separador.y1);
  // Carril B
  dibujarCarril(ctx, ZONAS.carrilB.y0, ZONAS.carrilB.y1, tiempoTotal);
  // Cebra
  dibujarCebra(ctx, ZONAS.cebra.y0, ZONAS.cebra.y1);
  // Andén inferior
  dibujarAnden(ctx, ZONAS.andenInferior.y0, ZONAS.andenInferior.y1);
}

function dibujarAnden(ctx, y0, y1) {
  // Base de ladrillo, con baldosas grises encima.
  ctx.fillStyle = PALETA.ladrillo;
  ctx.fillRect(0, y0, ANCHO_LIENZO, y1 - y0);

  ctx.fillStyle = PALETA.anden;
  const tamBaldosa = 30;
  for (let x = 0; x < ANCHO_LIENZO; x += tamBaldosa) {
    ctx.fillRect(x + 2, y0 + 2, tamBaldosa - 4, y1 - y0 - 4);
  }

  // Postes cada 160px.
  ctx.fillStyle = "#4a4d52";
  for (let x = 60; x < ANCHO_LIENZO; x += 160) {
    ctx.fillRect(x - 3, y0 + 4, 6, y1 - y0 - 8);
    ctx.beginPath();
    ctx.arc(x, y0 + 6, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function dibujarCarril(ctx, y0, y1, tiempoTotal) {
  ctx.fillStyle = PALETA.asfalto;
  ctx.fillRect(0, y0, ANCHO_LIENZO, y1 - y0);

  // Línea central discontinua, animada levemente para dar sensación de flujo.
  const centroY = (y0 + y1) / 2;
  ctx.strokeStyle = PALETA.lineasVia;
  ctx.lineWidth = 3;
  ctx.setLineDash([22, 18]);
  ctx.lineDashOffset = -((tiempoTotal * 40) % 40);
  ctx.beginPath();
  ctx.moveTo(0, centroY);
  ctx.lineTo(ANCHO_LIENZO, centroY);
  ctx.stroke();
  ctx.setLineDash([]);

  // Bordes del carril.
  ctx.strokeStyle = "rgba(216, 212, 200, 0.35)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, y0 + 1);
  ctx.lineTo(ANCHO_LIENZO, y0 + 1);
  ctx.moveTo(0, y1 - 1);
  ctx.lineTo(ANCHO_LIENZO, y1 - 1);
  ctx.stroke();
}

function dibujarSeparador(ctx, y0, y1) {
  ctx.fillStyle = PALETA.separador;
  ctx.fillRect(0, y0, ANCHO_LIENZO, y1 - y0);

  ctx.strokeStyle = "#556340";
  ctx.lineWidth = 1;
  for (let x = 4; x < ANCHO_LIENZO; x += 9) {
    const alturaTufo = 4 + ((x * 7) % 5);
    const yBase = y0 + (y1 - y0) / 2 + (((x * 13) % 7) - 3);
    ctx.beginPath();
    ctx.moveTo(x, yBase);
    ctx.lineTo(x - 2, yBase - alturaTufo);
    ctx.moveTo(x, yBase);
    ctx.lineTo(x + 2, yBase - alturaTufo);
    ctx.stroke();
  }
}

function dibujarCebra(ctx, y0, y1) {
  ctx.fillStyle = PALETA.asfalto;
  ctx.fillRect(0, y0, ANCHO_LIENZO, y1 - y0);

  ctx.fillStyle = PALETA.cebra;
  const anchoFranja = 26;
  const espacio = 20;
  for (let x = 10; x < ANCHO_LIENZO; x += anchoFranja + espacio) {
    ctx.fillRect(x, y0 + 6, anchoFranja, y1 - y0 - 12);
  }
}

// ---------------------------------------------------------------------
// Carros
// ---------------------------------------------------------------------

export function dibujarCarro(ctx, carro) {
  const { x, y, ancho, alto } = carro;
  const top = y - alto / 2;

  ctx.save();

  // Llantas (asoman a los lados).
  ctx.fillStyle = "#1b1b1b";
  const anchoLlanta = 10;
  const altoLlanta = 16;
  const posicionesLlantaX = [x + 16, x + ancho - 16 - anchoLlanta];
  for (const lx of posicionesLlantaX) {
    ctx.fillRect(lx, top - altoLlanta / 2 + 3, anchoLlanta, altoLlanta);
    ctx.fillRect(lx, top + alto - altoLlanta / 2 - 3, anchoLlanta, altoLlanta);
  }

  const color = carro.cerrado ? "#6a6d72" : carro.color;

  // Sombra
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  rectRedondeado(ctx, x + 3, top + 4, ancho, alto, 12);
  ctx.fill();

  // Carrocería
  ctx.fillStyle = color;
  rectRedondeado(ctx, x, top, ancho, alto, 12);
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Techo más claro
  const techoAncho = ancho * 0.55;
  const techoAlto = alto * 0.62;
  ctx.fillStyle = aclararColor(color, 0.28);
  rectRedondeado(ctx, x + (ancho - techoAncho) / 2, y - techoAlto / 2, techoAncho, techoAlto, 8);
  ctx.fill();

  // Parabrisas (delantero y trasero, hacia donde avanza = derecha)
  ctx.fillStyle = carro.esTerco ? "#111318" : "rgba(60, 80, 110, 0.55)";
  const wParabrisas = 10;
  rectRedondeado(ctx, x + ancho - techoAncho / 2 - wParabrisas - 2, y - techoAlto / 2 + 4, wParabrisas, techoAlto - 8, 3);
  ctx.fill();
  rectRedondeado(ctx, x + (ancho - techoAncho) / 2 + 2, y - techoAlto / 2 + 4, wParabrisas, techoAlto - 8, 3);
  ctx.fill();

  // Si es terco: vidrios completamente polarizados (negros) encima del techo.
  if (carro.esTerco) {
    ctx.fillStyle = "rgba(10,10,14,0.75)";
    rectRedondeado(ctx, x + (ancho - techoAncho) / 2, y - techoAlto / 2, techoAncho, techoAlto, 8);
    ctx.fill();
  }

  // Letrero de taxi
  if (carro.esTaxi) {
    ctx.fillStyle = "#222";
    ctx.fillRect(x + ancho / 2 - 14, top - 6, 28, 8);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 7px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("TAXI", x + ancho / 2, top - 2);
  }

  // Ventanilla abierta: brazo con moneda saliendo hacia el jugador.
  if (carro.ventanaAbierta) {
    const punto = carro.posicionVentanilla();
    const haciaAbajo = carro.carril === "A";
    const largoBrazo = 22;
    const finY = punto.y + (haciaAbajo ? largoBrazo : -largoBrazo);

    ctx.strokeStyle = "#c98a5e";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(punto.x, punto.y);
    ctx.lineTo(punto.x, finY);
    ctx.stroke();

    // Moneda en la mano, con un pequeño brillo pulsante.
    ctx.fillStyle = PALETA.amarilloTaxi;
    ctx.beginPath();
    ctx.arc(punto.x, finY, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#a87c00";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Barrita de billetera restante encima del carro.
  const fraccion = carro.billeteraInicial > 0 ? carro.billetera / carro.billeteraInicial : 0;
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.fillRect(x + 10, top - 16, ancho - 20, 5);
  ctx.fillStyle = fraccion > 0.3 ? PALETA.verde : PALETA.rojo;
  ctx.fillRect(x + 10, top - 16, (ancho - 20) * Math.max(0, fraccion), 5);

  ctx.restore();
}

function aclararColor(hex, cantidad) {
  const num = parseInt(hex.replace("#", ""), 16);
  if (Number.isNaN(num)) return hex;
  let r = (num >> 16) & 255;
  let g = (num >> 8) & 255;
  let b = num & 255;
  r = Math.min(255, Math.round(r + (255 - r) * cantidad));
  g = Math.min(255, Math.round(g + (255 - g) * cantidad));
  b = Math.min(255, Math.round(b + (255 - b) * cantidad));
  return `rgb(${r},${g},${b})`;
}

// ---------------------------------------------------------------------
// Personajes
// ---------------------------------------------------------------------

export function dibujarJugador(ctx, jugador, tiempoTotal) {
  const { x, y, ancho, alto } = jugador;
  ctx.save();

  // Sombra
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.beginPath();
  ctx.ellipse(x, y + alto / 2 + 2, ancho / 2, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Cuerpo
  ctx.fillStyle = "#2e86ab";
  rectRedondeado(ctx, x - ancho / 2, y - alto / 2 + 4, ancho, alto - 4, 6);
  ctx.fill();

  // Cabeza
  ctx.fillStyle = "#e8b98c";
  ctx.beginPath();
  ctx.arc(x, y - alto / 2, 8, 0, Math.PI * 2);
  ctx.fill();

  // Bolitas de malabar, animadas si está quieto (malabareando).
  if (jugador.quieto) {
    const t = tiempoTotal * 6;
    const colores = ["#f2b705", "#e63946", "#43aa4c"];
    for (let i = 0; i < 3; i++) {
      const angulo = t + (i * (Math.PI * 2)) / 3;
      const bx = x + Math.cos(angulo) * 14;
      const by = y - alto / 2 - 16 + Math.sin(angulo * 2) * 6;
      ctx.fillStyle = colores[i];
      ctx.beginPath();
      ctx.arc(bx, by, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

export function dibujarCompetidor(ctx, competidor) {
  if (!competidor.activo) return;
  const { x, y, ancho, alto } = competidor;
  ctx.save();

  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.beginPath();
  ctx.ellipse(x, y + alto / 2 + 2, ancho / 2, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#c1440e";
  rectRedondeado(ctx, x - ancho / 2, y - alto / 2 + 4, ancho, alto - 4, 6);
  ctx.fill();

  ctx.fillStyle = "#f2a65a";
  ctx.beginPath();
  ctx.arc(x, y - alto / 2, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ---------------------------------------------------------------------
// Efectos
// ---------------------------------------------------------------------

export function dibujarFlashColision(ctx, intensidad) {
  if (intensidad <= 0) return;
  ctx.fillStyle = `rgba(230, 57, 70, ${Math.min(0.55, intensidad)})`;
  ctx.fillRect(0, 0, ANCHO_LIENZO, ALTO_LIENZO);
}

// ---------------------------------------------------------------------
// HUD superior
// ---------------------------------------------------------------------

export function dibujarHudSuperior(ctx, datos) {
  const { atencion, carrosVivos, vidas, plata, tiempoTranscurrido, estadoSemaforo, ciclo } = datos;
  const y0 = ZONAS.hudSuperior.y0;
  const y1 = ZONAS.hudSuperior.y1;

  ctx.fillStyle = PALETA.fondoHUD;
  ctx.fillRect(0, y0, ANCHO_LIENZO, y1 - y0);

  // --- Barra de atención (con marcas de umbral) ---
  const barraX = 96;
  const barraY = 14;
  const barraAncho = 300;
  const barraAlto = 16;

  ctx.fillStyle = "#000";
  ctx.fillRect(barraX - 2, barraY - 2, barraAncho + 4, barraAlto + 4);

  const gradiente = ctx.createLinearGradient(barraX, 0, barraX + barraAncho, 0);
  gradiente.addColorStop(0, "#f2e205");
  gradiente.addColorStop(1, "#e63946");
  ctx.fillStyle = gradiente;
  const anchoRelleno = (Math.min(100, Math.max(0, atencion)) / 100) * barraAncho;
  ctx.fillRect(barraX, barraY, anchoRelleno, barraAlto);

  ctx.strokeStyle = PALETA.textoHUD;
  ctx.lineWidth = 1;
  ctx.strokeRect(barraX, barraY, barraAncho, barraAlto);

  // Marcas verticales de los umbrales de los carros vivos.
  const umbralesUnicos = [...new Set(carrosVivos.filter((c) => !c.cerrado).map((c) => c.umbral))];
  for (const umbral of umbralesUnicos) {
    const ux = barraX + (Math.min(100, umbral) / 100) * barraAncho;
    ctx.strokeStyle = umbral >= 999 ? "#888" : "#111";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ux, barraY - 3);
    ctx.lineTo(ux, barraY + barraAlto + 3);
    ctx.stroke();
  }

  ctx.fillStyle = PALETA.textoHUD;
  ctx.font = "10px monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  ctx.fillText("ATENCIÓN", barraX, barraY - 4);

  // --- Corazones (vidas) ---
  for (let i = 0; i < 3; i++) {
    dibujarCorazon(ctx, 14 + i * 22, 20, i < vidas);
  }

  // --- Plata ---
  ctx.fillStyle = PALETA.textoHUD;
  ctx.font = "bold 16px monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(formatoPlata(plata), barraX + barraAncho + 16, 22);

  // --- Temporizador ---
  ctx.font = "bold 20px monospace";
  ctx.textAlign = "right";
  ctx.fillText(formatoTiempo(tiempoTranscurrido), ANCHO_LIENZO - 90, 22);

  // --- Ciclo ---
  ctx.font = "11px monospace";
  ctx.fillStyle = "#a8aab0";
  ctx.fillText(`CICLO ${ciclo}`, ANCHO_LIENZO - 90, 40);

  // --- Semáforo mini ---
  dibujarSemaforoMini(ctx, ANCHO_LIENZO - 40, 32, estadoSemaforo);
}

function dibujarCorazon(ctx, x, y, lleno) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(0.7, 0.7);
  ctx.fillStyle = lleno ? PALETA.rojo : "#3a3d42";
  ctx.beginPath();
  ctx.moveTo(0, 5);
  ctx.bezierCurveTo(-10, -6, -22, 2, 0, 16);
  ctx.bezierCurveTo(22, 2, 10, -6, 0, 5);
  ctx.fill();
  ctx.restore();
}

function dibujarSemaforoMini(ctx, cx, cy, estado) {
  ctx.fillStyle = "#111318";
  rectRedondeado(ctx, cx - 10, cy - 22, 20, 44, 4);
  ctx.fill();

  const colores = {
    [ESTADOS_SEMAFORO.ROJO]: PALETA.rojo,
    [ESTADOS_SEMAFORO.AMARILLO]: PALETA.amarilloTaxi,
    [ESTADOS_SEMAFORO.VERDE]: PALETA.verde,
  };
  const posiciones = [cy - 14, cy, cy + 14];
  const orden = [ESTADOS_SEMAFORO.ROJO, ESTADOS_SEMAFORO.AMARILLO, ESTADOS_SEMAFORO.VERDE];

  orden.forEach((nombreEstado, i) => {
    const encendido = nombreEstado === estado;
    ctx.beginPath();
    ctx.arc(cx, posiciones[i], 5.5, 0, Math.PI * 2);
    if (encendido) {
      ctx.fillStyle = colores[nombreEstado];
      ctx.shadowColor = colores[nombreEstado];
      ctx.shadowBlur = 8;
    } else {
      ctx.fillStyle = "#2a2d33";
      ctx.shadowBlur = 0;
    }
    ctx.fill();
    ctx.shadowBlur = 0;
  });
}

// ---------------------------------------------------------------------
// HUD inferior
// ---------------------------------------------------------------------

export function dibujarHudInferior(ctx, datos) {
  const { progresoCiclo, colorAro, multiplicador, stacksRiesgo, tiempoTotal } = datos;
  const y0 = ZONAS.hudInferior.y0;
  const y1 = ZONAS.hudInferior.y1;

  ctx.fillStyle = PALETA.fondoHUD;
  ctx.fillRect(0, y0, ANCHO_LIENZO, y1 - y0);

  dibujarMetronomo(ctx, 80, y0 + (y1 - y0) / 2, progresoCiclo, colorAro);

  // Multiplicador grande
  ctx.fillStyle = PALETA.textoHUD;
  ctx.font = "12px monospace";
  ctx.textAlign = "center";
  ctx.fillText("MULTIPLICADOR", ANCHO_LIENZO / 2, y0 + 16);
  ctx.font = "bold 30px monospace";
  ctx.fillStyle = PALETA.amarilloTaxi;
  ctx.fillText(`×${multiplicador}`, ANCHO_LIENZO / 2, y0 + 44);

  // Stacks de riesgo
  const xBase = ANCHO_LIENZO - 140;
  ctx.font = "11px monospace";
  ctx.fillStyle = PALETA.textoHUD;
  ctx.textAlign = "left";
  ctx.fillText("RIESGO", xBase, y0 + 16);
  for (let i = 0; i < RIESGO.stacksMaximos; i++) {
    const activo = i < stacksRiesgo;
    const parpadeo = activo ? 0.6 + 0.4 * Math.sin(tiempoTotal * 10 + i) : 1;
    ctx.globalAlpha = activo ? parpadeo : 0.25;
    ctx.fillStyle = PALETA.rojo;
    ctx.beginPath();
    ctx.arc(xBase + 12 + i * 22, y0 + 34, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function dibujarMetronomo(ctx, cx, cy, progreso, colorAro) {
  const radioAro = 22;
  const radioMax = 42;

  // Aro fijo
  ctx.beginPath();
  ctx.arc(cx, cy, radioAro, 0, Math.PI * 2);
  ctx.lineWidth = 4;
  ctx.strokeStyle = colorAro || "#666";
  ctx.stroke();

  // Círculo que se contrae hacia el aro
  const radioCirculo = radioMax - (radioMax - radioAro) * progreso;
  ctx.beginPath();
  ctx.arc(cx, cy, Math.max(2, radioCirculo), 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(245, 243, 238, 0.8)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = "#a8aab0";
  ctx.font = "9px monospace";
  ctx.textAlign = "center";
  ctx.fillText("ESPACIO", cx, cy + radioMax + 12);
}

// ---------------------------------------------------------------------
// Pantallas de estado
// ---------------------------------------------------------------------

function overlayOscuro(ctx, alpha = 0.72) {
  ctx.fillStyle = `rgba(10, 11, 13, ${alpha})`;
  ctx.fillRect(0, 0, ANCHO_LIENZO, ALTO_LIENZO);
}

export function dibujarPantallaMenu(ctx, record, tiempoTotal) {
  overlayOscuro(ctx, 0.85);
  ctx.textAlign = "center";

  ctx.fillStyle = PALETA.amarilloTaxi;
  ctx.font = "bold 46px monospace";
  ctx.fillText("¡PILAS QUE ARRANCA!", ANCHO_LIENZO / 2, 200);

  ctx.fillStyle = PALETA.textoHUD;
  ctx.font = "16px monospace";
  ctx.fillText("El malabarista del semáforo", ANCHO_LIENZO / 2, 234);

  ctx.font = "13px monospace";
  const lineas = [
    "WASD / Flechas: moverse",
    "ESPACIO (quieto): malabarear al ritmo",
    "Acércate a una ventanilla abierta para cobrar",
    "P: pausa",
  ];
  lineas.forEach((linea, i) => {
    ctx.fillText(linea, ANCHO_LIENZO / 2, 300 + i * 22);
  });

  ctx.fillStyle = "#a8aab0";
  ctx.font = "13px monospace";
  ctx.fillText(`Récord: ${formatoPlata(record)}`, ANCHO_LIENZO / 2, 420);

  ctx.fillStyle = PALETA.verde;
  ctx.font = "bold 18px monospace";
  const parpadeo = 0.5 + 0.5 * Math.sin((tiempoTotal || 0) * 4.5);
  ctx.globalAlpha = 0.6 + 0.4 * parpadeo;
  ctx.fillText("Presiona ENTER para empezar", ANCHO_LIENZO / 2, 470);
  ctx.globalAlpha = 1;
}

export function dibujarPantallaPausa(ctx) {
  overlayOscuro(ctx, 0.6);
  ctx.textAlign = "center";
  ctx.fillStyle = PALETA.textoHUD;
  ctx.font = "bold 44px monospace";
  ctx.fillText("PAUSA", ANCHO_LIENZO / 2, ALTO_LIENZO / 2);
  ctx.font = "14px monospace";
  ctx.fillText("Presiona P para continuar", ANCHO_LIENZO / 2, ALTO_LIENZO / 2 + 34);
}

export function dibujarPantallaGameOver(ctx, datos) {
  const { plataTotal, ciclos, record, esRecordNuevo } = datos;
  overlayOscuro(ctx, 0.85);
  ctx.textAlign = "center";

  ctx.fillStyle = PALETA.rojo;
  ctx.font = "bold 42px monospace";
  ctx.fillText("GAME OVER", ANCHO_LIENZO / 2, 200);

  ctx.fillStyle = PALETA.textoHUD;
  ctx.font = "18px monospace";
  ctx.fillText(`Plata total: ${formatoPlata(plataTotal)}`, ANCHO_LIENZO / 2, 260);
  ctx.fillText(`Ciclos sobrevividos: ${ciclos}`, ANCHO_LIENZO / 2, 290);

  ctx.fillStyle = esRecordNuevo ? PALETA.amarilloTaxi : "#a8aab0";
  ctx.font = "16px monospace";
  ctx.fillText(
    esRecordNuevo ? `¡NUEVO RÉCORD! ${formatoPlata(record)}` : `Récord: ${formatoPlata(record)}`,
    ANCHO_LIENZO / 2,
    324
  );

  ctx.fillStyle = PALETA.verde;
  ctx.font = "bold 18px monospace";
  ctx.fillText("Presiona R para reintentar", ANCHO_LIENZO / 2, 400);
}
