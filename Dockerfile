FROM node:18.16.0-slim
WORKDIR /usr/src/app/aqukin
ADD * /usr/src/app
RUN wget http://vincentprivate.synology.me:107/file_manager/discord_bot/aqukin/.env
RUN npm install
RUN npm run build
CMD [ "npm", "run", "serve" ]