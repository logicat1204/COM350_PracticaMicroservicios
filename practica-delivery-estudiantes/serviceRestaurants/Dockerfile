# Imagen base de Node.js
FROM node:24-alpine

# Directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia solo los archivos de dependencias para aprovechar la cache de Docker
COPY package*.json ./

# Instala solo dependencias de produccion
RUN npm install --omit=dev

# Copia el resto del codigo
COPY . .

# Puerto del microservicio
EXPOSE 3002

CMD ["npm", "start"]
