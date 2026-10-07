#!/usr/bin/env bash
#
# Despliega Cobama en el servidor.
#
#     ./desplegar.sh
#
# Se lanza DESDE ESTA MAQUINA y conduce el servidor por SSH. No hay que entrar
# a ningun panel: Cobama no esta en Coolify, por mucho que Coolify corra en la
# misma maquina. Vive en /opt/cobama como un docker compose a mano, detras del
# Traefik que Coolify si gestiona. Lo unico que hay en el panel es Uptime Kuma.
#
# Esto existe porque el despliegue eran cuatro pasos en un orden concreto que
# habia que recordar, y el dia que se olvida uno no falla: queda a medias. Lo
# que paso de verdad fue peor que eso -se dio por desplegado algo que seguia
# sin comitear, y la web sirvio durante horas la version de hacia dos semanas
# sin que nada avisara-. De ahi que el script COMPRUEBE antes y despues, y no
# se limite a ejecutar.
#
# Lo que hace, en orden:
#
#   1. Se asegura de que lo que hay aqui esta comiteado y subido a GitHub.
#      Sin esto, el servidor se trae lo de siempre y todo parece ir bien.
#   2. Trae el codigo en el servidor.
#   3. Reconstruye la imagen. La web se compila DENTRO, en la primera etapa
#      del Dockerfile.produccion.
#   4. Levanta y espera a que la API responda.
#   5. Aplica las migraciones pendientes. No corren solas al arrancar.
#   6. Comprueba que lo que sirve la web es el commit que acabas de subir.
#
# set -e para que un fallo pare el despliegue en vez de seguir y dejarlo a
# medias; -u para que una variable sin definir se note; pipefail para que un
# fallo dentro de una tuberia cuente como fallo.
set -euo pipefail

SERVIDOR="${COBAMA_SERVIDOR:-astro-vps}"
CARPETA="${COBAMA_CARPETA:-/opt/cobama}"
DOMINIO="${COBAMA_DOMINIO:-cobama.wyll-servidor.duckdns.org}"
RAMA="main"

rojo()  { printf '\033[31m%s\033[0m\n' "$*"; }
verde() { printf '\033[32m%s\033[0m\n' "$*"; }
paso()  { printf '\n\033[1m==> %s\033[0m\n' "$*"; }

morir() { rojo "ERROR: $*"; exit 1; }

cd "$(dirname "$0")"

# ---------------------------------------------------------------- 1. aqui

paso "Comprobando lo que hay aqui"

# `if` y no `[ ... ] && { ... }`: bajo `set -e`, una lista con && cuya
# condicion sale falsa devuelve 1, y el script se iria sin decir nada
# justo cuando todo esta bien.
if [ -n "$(git status --porcelain)" ]; then
  git status --short
  morir "Hay cambios sin comitear. Comitealos o guardalos antes de desplegar."
fi

actual="$(git branch --show-current)"
[ "$actual" = "$RAMA" ] || morir "Estas en la rama '$actual' y el servidor despliega '$RAMA'."

git fetch --quiet origin "$RAMA"
local_sha="$(git rev-parse HEAD)"
remoto_sha="$(git rev-parse "origin/$RAMA")"

if [ "$local_sha" != "$remoto_sha" ]; then
  # Si lo de aqui es ANTERIOR a lo de GitHub, desplegar sobrescribiria con
  # algo viejo. Si es posterior, solo falta empujar.
  if git merge-base --is-ancestor HEAD "origin/$RAMA"; then
    morir "GitHub va por delante. Haz 'git pull' antes de desplegar."
  fi
  echo "Hay commits sin subir. Subiendolos..."
  git push origin "$RAMA"
fi

verde "Listo para desplegar $(git log --oneline -1)"

# -------------------------------------------------------------- 2..5 alla

paso "Desplegando en $SERVIDOR"

# Todo en UNA sesion de SSH: si se partiera en varias, un fallo a mitad
# dejaria el servidor con el codigo nuevo y la imagen vieja.
#
# `bash -s` con el script por la entrada estandar, y las variables pasadas
# como argumentos en vez de interpoladas: asi nada de aqui se expande por
# sorpresa en el servidor.
ssh "$SERVIDOR" 'bash -s' -- "$CARPETA" "$RAMA" <<'REMOTO'
set -euo pipefail
CARPETA="$1"
RAMA="$2"

echo "--- trayendo el codigo ---"
cd "$CARPETA/repo"
git fetch --quiet origin "$RAMA"
git reset --hard "origin/$RAMA"
echo "ahora en: $(git log --oneline -1)"

echo
echo "--- reconstruyendo la imagen (compila la web dentro) ---"
cd "$CARPETA"
# Se construye ANTES de parar nada: la web sigue en pie mientras tanto, y el
# corte se reduce al reinicio del final.
docker compose build api

echo
echo "--- levantando ---"
docker compose up -d api

echo
echo "--- esperando a la API ---"
for i in $(seq 1 60); do
  if docker compose exec -T api node -e "fetch('http://127.0.0.1:4100/api/restaurantes').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))" 2>/dev/null; then
    echo "responde tras ${i}s"
    break
  fi
  if [ "$i" = 60 ]; then
    echo "la API no responde"
    docker compose logs --tail 40 api
    exit 1
  fi
  sleep 1
done

echo
echo "--- migraciones ---"
# No corren al arrancar: hay que aplicarlas aqui. Si alguna falla, el script
# para y la API se queda con el codigo nuevo contra una base vieja, que es
# justo lo que hay que ver en los logs y arreglar a mano.
docker compose exec -T api npm run db:migrate

echo
echo "--- commit desplegado ---"
cd "$CARPETA/repo" && git rev-parse HEAD
REMOTO

# ------------------------------------------------------------ 6. comprobar

paso "Comprobando que la web sirve lo nuevo"

# El commit que el servidor dice tener tiene que ser el que acabamos de subir.
desplegado="$(ssh "$SERVIDOR" "cd $CARPETA/repo && git rev-parse HEAD")"
[ "$desplegado" = "$local_sha" ] || morir "El servidor quedo en $desplegado y aqui estamos en $local_sha."

# Y la web tiene que responder de verdad, no solo el contenedor estar vivo.
for ruta in / /api/restaurantes /sw.js /manifest.webmanifest; do
  codigo="$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 "https://$DOMINIO$ruta")"
  printf '  %-24s %s\n' "$ruta" "$codigo"
  [ "$codigo" = "200" ] || morir "$ruta devuelve $codigo."
done

verde ""
verde "Desplegado: $(git log --oneline -1)"
verde "https://$DOMINIO"
