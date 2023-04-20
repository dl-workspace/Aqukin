FROM node:19.9.0
WORKDIR /usr/src/app/aqukin
COPY . .
RUN npm install
RUN npm run build
ENTRYPOINT [ "npm", "run", "serve" ]