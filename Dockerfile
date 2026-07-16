FROM node:22-alpine

WORKDIR /app

COPY package-lock.json package.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json
COPY packages/shared/package.json ./packages/shared/package.json

RUN npm install --workspaces

COPY . .

RUN npm run build --workspace @bloom/shared
RUN npm run build --workspace @bloom/api

WORKDIR /app/apps/api

EXPOSE 10000

CMD ["node", "dist/index.js"]
