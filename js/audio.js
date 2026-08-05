// audio.js — Todo el sonido del juego generado con osciladores de la
// Web Audio API. Cero archivos .wav/.mp3.
//
// El AudioContext se crea en la primera interacción del usuario
// (los navegadores bloquean el audio autónomo). Todas las funciones
// están envueltas en try/catch: si el audio falla por cualquier
// razón, el juego debe seguir funcionando igual.

let contexto = null;

export function inicializarAudio() {
  if (contexto) return;
  try {
    const ContextoAudio = window.AudioContext || window.webkitAudioContext;
    contexto = new ContextoAudio();
  } catch (error) {
    console.warn("No se pudo inicializar el audio:", error);
    contexto = null;
  }
}

/** Se asegura de que el contexto esté "vivo" (algunos navegadores lo suspenden). */
function reanudarSiHaceFalta() {
  if (contexto && contexto.state === "suspended") {
    contexto.resume().catch(() => {});
  }
}

/**
 * Crea un oscilador con envolvente simple de volumen (ataque rápido,
 * caída exponencial) y lo conecta a la salida.
 */
function tocarTono({ frecuencia, tipoOnda = "square", duracion = 0.08, volumen = 0.15, frecuenciaFinal = null }) {
  if (!contexto) return;
  try {
    reanudarSiHaceFalta();
    const ahora = contexto.currentTime;

    const oscilador = contexto.createOscillator();
    const ganancia = contexto.createGain();

    oscilador.type = tipoOnda;
    oscilador.frequency.setValueAtTime(frecuencia, ahora);
    if (frecuenciaFinal !== null) {
      oscilador.frequency.linearRampToValueAtTime(frecuenciaFinal, ahora + duracion);
    }

    ganancia.gain.setValueAtTime(volumen, ahora);
    ganancia.gain.exponentialRampToValueAtTime(0.001, ahora + duracion);

    oscilador.connect(ganancia);
    ganancia.connect(contexto.destination);

    oscilador.start(ahora);
    oscilador.stop(ahora + duracion);
  } catch (error) {
    console.warn("Error reproduciendo sonido:", error);
  }
}

/** Click corto y agudo en cada beat del metrónomo. */
export function sonidoClickMetronomo() {
  tocarTono({ frecuencia: 880, tipoOnda: "square", duracion: 0.05, volumen: 0.1 });
}

/** Sonido ascendente al recoger monedas. */
export function sonidoMoneda() {
  tocarTono({
    frecuencia: 520,
    frecuenciaFinal: 1040,
    tipoOnda: "triangle",
    duracion: 0.12,
    volumen: 0.12,
  });
}

/** Bocinazo cuando el semáforo pasa a amarillo. */
export function sonidoBocina() {
  if (!contexto) return;
  try {
    reanudarSiHaceFalta();
    tocarTono({ frecuencia: 220, tipoOnda: "sawtooth", duracion: 0.35, volumen: 0.18 });
    setTimeout(() => tocarTono({ frecuencia: 196, tipoOnda: "sawtooth", duracion: 0.25, volumen: 0.15 }), 120);
  } catch (error) {
    console.warn("Error reproduciendo bocina:", error);
  }
}

/** Sonido grave de golpe al perder una vida. */
export function sonidoGolpe() {
  tocarTono({
    frecuencia: 140,
    frecuenciaFinal: 40,
    tipoOnda: "sawtooth",
    duracion: 0.3,
    volumen: 0.2,
  });
}

/** Acierto perfecto/bien en el ritmo: un pequeño destello sonoro distinto al click. */
export function sonidoAcierto(resultado) {
  if (resultado === "perfecto") {
    tocarTono({ frecuencia: 1200, tipoOnda: "sine", duracion: 0.09, volumen: 0.13 });
  } else if (resultado === "bien") {
    tocarTono({ frecuencia: 760, tipoOnda: "sine", duracion: 0.08, volumen: 0.1 });
  } else {
    tocarTono({ frecuencia: 180, tipoOnda: "square", duracion: 0.09, volumen: 0.12 });
  }
}
