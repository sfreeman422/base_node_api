FROM node:18-alpine as build
COPY . .
RUN npm ci && npm run build:prod

FROM node:18-alpine as release
COPY --from=build ./dist .
COPY --from=build ./node_modules ./node_modules
EXPOSE 3000

CMD ["node", "./index.js"]
