FROM node:21-bullseye

# Install dependencies
RUN apt-get update && apt-get install -y \
    wget unzip xvfb libnss3 libatk1.0-0 libx11-xcb1 \
    libasound2 libxss1 libglib2.0-dev libdrm-dev \
    libgbm-dev libxshmfence-dev ca-certificates

WORKDIR /foundry

# Download Foundry VTT (Replace the URL with your Foundry download)
ADD https://r2.foundryvtt.com/releases/12.331/FoundryVTT-12.331.zip?verify=1740875655-X%2F6SQQtiewUyBrl7Ed11Yz%2FJrnyEfB6CS97e%2FV4BVMo%3D /foundry/foundry.zip
RUN unzip foundry.zip -d /foundry
RUN rm foundry.zip

# Create data directory
RUN mkdir -p /foundryData

# Setup the testing infrastructure
RUN npm i -g puppeteer
RUN mkdir -p /testScript
COPY run-tests.js /testScript

# Expose Foundry's port
EXPOSE 30000

# Start Foundry
CMD ["node", "resources/app/main.js", "--dataPath=/foundryData"]
