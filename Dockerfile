FROM node:21-bullseye

# Install dependencies
RUN apt-get update && apt-get install -y \
    wget unzip xvfb libnss3 libatk1.0-0 libx11-xcb1 \
    libasound2 libxss1 libglib2.0-dev libdrm-dev \
    libgbm-dev libxshmfence-dev ca-certificates

WORKDIR /foundry

# Download Foundry VTT (Replace the URL with your Foundry download)
ADD https://r2.foundryvtt.com/releases/12.331/FoundryVTT-12.331.zip?verify=1740862602-8l57Sz6UJQ77%2FhRbJvnKyBDk60Xdu92wOT0zo0pVQ3U%3D /foundry/foundry.zip
RUN unzip foundry.zip -d /foundry

# Create data directory
RUN mkdir -p /foundryData

# Expose Foundry's port
EXPOSE 30000

# Start Foundry
CMD ["node", "resources/app/main.js", "--dataPath=/foundryData"]
