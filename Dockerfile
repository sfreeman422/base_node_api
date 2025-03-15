FROM node:18-alpine as build
COPY . /usr/src/app
WORKDIR /usr/src/app
RUN npm ci && npm run lint && npm run test && npm run build:prod && npm run minify

FROM node:18-alpine as release
ENV NODE_ENV=production PORT=80
COPY --from=build /usr/src/app/dist /usr/src/app
COPY --from=build /usr/src/app/package.json /usr/src/app/
COPY --from=build /usr/src/app/package-lock.json /usr/src/app/
WORKDIR /usr/src/app
RUN mkdir -p /usr/src/app/logs
RUN npm pkg delete scripts.prepare && npm ci --omit=dev && npm prune --production
EXPOSE 80

CMD ["node", "/usr/src/app/index.js"]
