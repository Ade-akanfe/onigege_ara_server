FROM node:18.6.0-alpine3.16

WORKDIR /app

COPY ./ ./

EXPOSE 4000

RUN npm install


CMD [ "npm run dev" ]