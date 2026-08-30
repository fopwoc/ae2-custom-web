FROM node:26.8.1-alpine3.23 AS build

RUN corepack enable
WORKDIR /workspace

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json tokens.css ./
COPY scripts ./scripts
COPY packages ./packages
COPY apps ./apps

ARG VERSION
ENV VERSION=$VERSION
RUN test -n "$VERSION"
RUN pnpm install --frozen-lockfile
RUN pnpm build
RUN pnpm install --prod --frozen-lockfile

FROM node:26.8.1-alpine3.23 AS runtime

ENV HOST=0.0.0.0 \
    PORT=3000 \
    LOG_LEVEL=error \
    NODE_ENV=production
WORKDIR /app

COPY --from=build --chown=node:node /workspace/node_modules ./node_modules
COPY --from=build --chown=node:node /workspace/apps/terminal/build ./apps/terminal/build
COPY --from=build --chown=node:node /workspace/apps/terminal/node_modules ./apps/terminal/node_modules
COPY --from=build --chown=node:node /workspace/apps/terminal/package.json ./apps/terminal/package.json
COPY --from=build --chown=node:node /workspace/packages ./packages

USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:3000/healthz || exit 1

CMD ["node", "apps/terminal/build"]
