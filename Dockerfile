FROM node:18.16.0-slim
WORKDIR /usr/src/app/aqukin
ADD * /usr/src/app/aqukin
RUN npm install
RUN npm run build
RUN pwd
RUN ls -la
RUN ls -la dist
ENTRYPOINT [ "npm", "run", "serve" ]