# Queen Xavena Bot
# ffmpeg is required for .sticker on video

FROM node:20-bookworm-slim

# System dependency: ffmpeg (sticker conversion)
RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package*.json ./
RUN npm install --omit=dev

# Copy the rest
COPY . .

# The bot has no HTTP server — no EXPOSE needed.
# Runtime state lives in ./session and ./database; mount them if you
# want the session to survive container rebuilds.

CMD ["npm", "start"]