FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist

# El proceso corre como `node` (uid 1000), no como root. El directorio de
# uploads se crea acá con ese dueño porque un volumen nombrado NUEVO hereda la
# propiedad del directorio que tapa; los volúmenes que ya existían (creados
# root cuando el contenedor era root) los normaliza el servicio `init-perms`
# del compose, que corre una vez antes que este.
RUN mkdir -p /app/uploads && chown -R node:node /app/uploads

USER node

ARG PORT=3001
ENV PORT=$PORT
EXPOSE $PORT

# Node 20 trae fetch global, así que el health check no necesita curl ni wget
# en la imagen. Es lo que habilita `depends_on: condition: service_healthy` en
# el frontend y lo que espera deploy.sh.
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "dist/index.js"]
