FROM node:18.16.0-slim
WORKDIR /usr/src/app/aqukin
COPY . .
RUN npm install
RUN npm run build
ENTRYPOINT [ "npm", "run", "serve" ]