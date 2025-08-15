FROM node:20.11.0-alpine

WORKDIR /app

RUN apk update && apk add --no-cache git

COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile

COPY . .

EXPOSE 5173

CMD ["yarn", "dev", "--host", "0.0.0.0"]