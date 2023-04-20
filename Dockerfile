FROM node:18.16.0-slim
WORKDIR /usr/src/app/aqukin
ADD * /usr/src/app/aqukin
RUN npm install
RUN npm run build
RUN pwd
RUN ls -la /usr/src/app/aqukin
RUN cat .env
CMD [ "npm", "run", "serve" ]