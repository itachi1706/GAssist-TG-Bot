FROM node:14.17-alpine

RUN mkdir -p /usr/local/tgbot
WORKDIR /usr/local/tgbot
# Copy related files in
COPY credentials.json credentials_google.json credentials-secure_google.json config.js server.js package.json package-lock.json ./

# Move to relevant place
RUN mkdir -p ./.config/google-oauthlib-tool && mv credentials_google.json ./.config/google-oauthlib-tool/credentials.json && mv credentials-secure_google.json ./.config/google-oauthlib-tool/credentials-secure.json

# Testing
#RUN mkdir .config && cd .config && mkdir google-oauthlib-tool && pwd
#RUN mv credentials_google.json ./.config/google-oauthlib-tool/credentials.json && mv credentials-secure_google.json ./.config/google-oauthlib-tool/credentials-secure.json && ls ./.config/google-oauthlib-tool
#RUN ls . 

# Install NPM
RUN npm install

# Start app
CMD npm start server.js
