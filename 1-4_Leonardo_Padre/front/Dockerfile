FROM oven/bun:1 AS build
WORKDIR /app

COPY front/package.json front/bun.lock front/bunfig.toml ./
RUN bun install --frozen-lockfile

COPY front/ .

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

ENV NITRO_PRESET=node-server
RUN bun run build

FROM oven/bun:1-slim AS runtime
WORKDIR /app

COPY --from=build /app/.output ./.output

ENV PORT=3000
ENV HOST=0.0.0.0

EXPOSE 3000

CMD ["bun", "run", ".output/server/index.mjs"]