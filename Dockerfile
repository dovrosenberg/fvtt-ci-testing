FROM node:21-bullseye

# Install dependencies
RUN apt-get update && apt-get install -y \
    wget unzip xvfb libnss3 libatk1.0-0 libx11-xcb1 \
    libasound2 libxss1 libglib2.0-dev libdrm-dev \
    libgbm-dev libxshmfence-dev ca-certificates \
    libdbus-1-3 libxcomposite1 libxdamage1 libxrandr2 \
    libgbm1 libpangocairo-1.0-0 libgtk-3-0 && \

# Download Foundry VTT (Replace the URL with your Foundry download)

    wget -O foundry.zip "https://r2.foundryvtt.com/releases/12.331/FoundryVTT-12.331.zip?verify=1740952654-HRNgGgvw8eiIF0RkloBKGWv6c149QKahaEk7%2B0tq%2BPE%3D" && \
    unzip foundry.zip -d /foundry && \
    rm foundry.zip && \
    mkdir -p /foundryData && \

# Setup the testing infrastructure
    mkdir -p /testScript

COPY run-tests.js /testScript
WORKDIR /testScript
RUN npm i puppeteer

# Expose Foundry's port
EXPOSE 30000

# Start Foundry
CMD ["node", "/foundry/resources/app/main.js", "--dataPath=/foundryData"]
