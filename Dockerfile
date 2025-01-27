FROM node:23.6.1
WORKDIR /usr/src/app/aqukin
COPY . .

RUN apt-get update && apt-get install -y \
    build-essential \
    libtool \
    automake \
    python3 \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

RUN npm install
RUN npm run build
ENTRYPOINT [ "npm", "run", "serve" ]