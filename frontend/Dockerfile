# Build the SPA (real Authentik auth) and serve it with nginx.
# Build-time config is baked into the static bundle via build args (set in
# docker-compose.yml), so no runtime env is needed.

FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .

# Served under /planning by the gateway; API is reached origin-relative at
# /cpp-api/planning (so VITE_API_BASE_URL stays empty = same origin).
ARG BASE_PATH=/planning/
ARG VITE_API_BASE_URL=
ARG VITE_OIDC_AUTHORITY=https://hackathon.amogusdrip.de/auth/application/o/vibecode/
ARG VITE_OIDC_CLIENT_ID=oIgnzizlgBgGKtC1SJBvM6HqEtasIMXxkTsIN8O9
ENV BASE_PATH=$BASE_PATH \
    VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_OIDC_AUTHORITY=$VITE_OIDC_AUTHORITY \
    VITE_OIDC_CLIENT_ID=$VITE_OIDC_CLIENT_ID
RUN npm run build

FROM nginx:1.27-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
