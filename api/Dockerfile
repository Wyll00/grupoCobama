FROM node:22-alpine

WORKDIR /app

# Las dependencias se instalan DENTRO de la imagen y no se traen del host: sharp
# lleva binarios compilados y los de Windows no valen en Alpine. Por eso el
# compose monta src y scripts, pero nunca node_modules.
COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src

ENV NODE_ENV=production

# Documenta el puerto real. Estaba en 4000, que no es el que usa la API: el
# valor no lo usa Docker para nada, pero manda a mirar el puerto equivocado
# a quien lea el fichero.
EXPOSE 4100

# Para curl del healthcheck. Alpine no lo trae.
RUN apk add --no-cache curl

CMD ["node", "src/server.js"]
