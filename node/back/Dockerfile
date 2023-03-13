FROM node:17-alpine
WORKDIR /app
COPY . /app
RUN npm install
COPY . /app
CMD ["yarn", "start"]