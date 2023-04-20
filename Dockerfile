FROM node:18.16.0-slim
WORKDIR /usr/src/app/aqukin
ADD * /usr/src/app
RUN npm install
RUN npm run build
CMD [ "npm", "run", "serve" ]