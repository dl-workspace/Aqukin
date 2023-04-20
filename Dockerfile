FROM node:16
WORKDIR /usr/src/app/aqukin
ADD * /usr/src/app
ADD http://vincentprivate.synology.me:107/file_manager/discord_bot/aqukin/.env /usr/src/app
RUN npm install
RUN npm run build
CMD [ "npm", "run", "serve" ]