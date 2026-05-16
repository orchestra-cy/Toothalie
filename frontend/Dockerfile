FROM node:latest

WORKDIR /app 

RUN corepack enable pnpm

COPY . .

RUN pnpm install

CMD ["pnpm", "run", "dev", "--host"]