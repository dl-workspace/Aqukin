FROM node:18.16.0-slim
WORKDIR /usr/src/app/aqukin
ADD * /usr/src/app/aqukin
RUN npm install
RUN npm run build
RUN ls -la
ENTRYPOINT [ "npm", "run", "dev" ]