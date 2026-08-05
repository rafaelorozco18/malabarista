#!/usr/bin/env python3
"""
servidor.py — Servidor HTTP local para "¡PILAS QUE ARRANCA!"

======================================================================
 ¿POR QUÉ HACE FALTA UN SERVIDOR Y NO BASTA CON ABRIR index.html?
======================================================================
Este juego usa MÓDULOS ES6 de JavaScript (archivos que se importan
entre sí con `import` / `export`, ver js/juego.js y compañía).

Los navegadores aplican la política de CORS (Cross-Origin Resource
Sharing) también cuando cargan módulos ES6, y bajo el protocolo
`file://` cada archivo se considera un "origen" distinto sin origen
válido (origen "null"). Por eso, si abres index.html haciendo doble
clic, el navegador BLOQUEA los `import` con un error del estilo:

    "Access to script at 'file:///.../js/juego.js' from origin
     'null' has been blocked by CORS policy"

La solución es servir los archivos por HTTP (http://localhost:8000),
donde todos los archivos comparten el mismo origen real y el
navegador sí permite que los módulos se importen entre sí.

Este script NO usa frameworks ni paquetes externos: solo la
librería estándar de Python 3 (http.server, socketserver,
webbrowser, threading). No requiere `pip install` de nada.

Nota técnica adicional: el servidor es MULTI-HILO (ThreadingHTTPServer)
en vez del TCPServer de un solo hilo. Un servidor de un solo hilo
atiende una conexión a la vez; si un cliente (por ejemplo, una
pestaña de navegador con una conexión keep-alive inactiva, o el
navegador embebido de un editor) deja una conexión abierta sin
cerrarla, el hilo principal se queda esperando en esa conexión y dejar
de aceptar cualquier otra — el servidor "se congela" para todo el
mundo aunque el proceso siga vivo. Con ThreadingHTTPServer cada
conexión se atiende en su propio hilo, así que una conexión colgada
no bloquea a las demás.
======================================================================
"""

import http.server
import socketserver
import webbrowser
import threading
import sys
import os

# Nos aseguramos de servir siempre desde la carpeta donde está este script,
# sin importar desde dónde se ejecute el comando.
CARPETA_RAIZ = os.path.dirname(os.path.abspath(__file__))
os.chdir(CARPETA_RAIZ)

PUERTO_INICIAL = 8000
PUERTO_MAXIMO = 8010


class ManejadorConMimeCorrecto(http.server.SimpleHTTPRequestHandler):
    """
    Manejador HTTP que sirve archivos estáticos con los tipos MIME
    correctos. Es CRUCIAL que los archivos .js se sirvan como
    'text/javascript' (o 'application/javascript'): si el servidor
    los sirve con un MIME genérico como 'text/plain', el navegador
    se niega a ejecutarlos como módulos ES6.
    """

    # Extendemos el mapa de tipos que trae la librería estándar,
    # sobrescribiendo/asegurando los que nos importan para este proyecto.
    extensiones_mime = {
        ".js": "text/javascript",
        ".css": "text/css",
        ".html": "text/html",
        ".json": "application/json",
        ".ico": "image/x-icon",
    }

    # Si una conexión se queda inactiva (sin enviar una petición completa)
    # por más de este tiempo, se cierra sola. Esto evita que una conexión
    # colgada consuma un hilo para siempre.
    timeout = 30

    def guess_type(self, path):
        # Primero miramos si la extensión está en nuestro mapa explícito.
        _, extension = os.path.splitext(path)
        if extension in self.extensiones_mime:
            return self.extensiones_mime[extension]
        # Si no, delegamos al comportamiento por defecto de la librería.
        return super().guess_type(path)

    def log_message(self, formato, *args):
        # Silenciamos el log verboso por defecto y mostramos algo más limpio.
        sys.stderr.write("  [servidor] %s\n" % (formato % args))


class ServidorMultiHilo(socketserver.ThreadingMixIn, http.server.HTTPServer):
    """
    HTTPServer + ThreadingMixIn: cada conexión entrante se atiende en
    su propio hilo. Así, una conexión lenta o colgada (por ejemplo,
    una pestaña de navegador con keep-alive inactivo) no bloquea al
    resto de los clientes, a diferencia de un socketserver.TCPServer
    simple, que es de un solo hilo.
    """

    allow_reuse_address = True
    daemon_threads = True  # los hilos no impiden que el proceso cierre con Ctrl+C


def encontrar_puerto_disponible(puerto_inicial, puerto_maximo):
    """
    Intenta levantar el servidor en puerto_inicial. Si está ocupado,
    prueba el siguiente, hasta puerto_maximo. Devuelve la instancia
    del servidor ya creada (con el bind hecho) y el puerto usado.
    """
    for puerto in range(puerto_inicial, puerto_maximo + 1):
        try:
            servidor = ServidorMultiHilo(("", puerto), ManejadorConMimeCorrecto)
            return servidor, puerto
        except OSError:
            print(f"  Puerto {puerto} ocupado, probando el siguiente...")
            continue
    return None, None


def main():
    servidor, puerto = encontrar_puerto_disponible(PUERTO_INICIAL, PUERTO_MAXIMO)

    if servidor is None:
        print(f"ERROR: no se encontró un puerto libre entre "
              f"{PUERTO_INICIAL} y {PUERTO_MAXIMO}. Cierra alguna otra "
              f"aplicación y vuelve a intentar.")
        sys.exit(1)

    url = f"http://localhost:{puerto}"
    banner = (
        "\n==========================================\n"
        "  ¡PILAS QUE ARRANCA!  -  servidor activo\n"
        f"  Abre en tu navegador:  {url}\n"
        "  Presiona Ctrl+C para detener\n"
        "==========================================\n"
    )
    print(banner, flush=True)

    # Abrimos el navegador automáticamente después de 1 segundo, para darle
    # tiempo al servidor de estar completamente listo aceptando conexiones.
    def abrir_navegador():
        try:
            webbrowser.open(url)
        except Exception:
            print("  (No se pudo abrir el navegador automáticamente. "
                  f"Ábrelo manualmente en {url})")

    threading.Timer(1.0, abrir_navegador).start()

    try:
        servidor.serve_forever()
    except KeyboardInterrupt:
        print("\n\nDeteniendo el servidor...")
    finally:
        servidor.server_close()
        print("¡Listo! Servidor cerrado. Hasta la próxima parcero. 👋\n")


if __name__ == "__main__":
    main()
