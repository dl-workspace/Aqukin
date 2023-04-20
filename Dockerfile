FROM node:18-alpine
WORKDIR /usr/src/app/aqukin
COPY . .
RUN npm install
RUN npm run build
ENTRYPOINT [ "npm", "run", "serve" ]