FROM node:23.6.1
WORKDIR /usr/src/app/aqukin
COPY . .

RUN apt-get update && apt-get install -y \
    build-essential \
    libtool \
    autoconf \
    automake \
    python3 \
    python3-pip \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install yt-dlp for reliable YouTube audio extraction
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp

RUN npm install
RUN npm run build
ENTRYPOINT [ "npm", "run", "serve" ]