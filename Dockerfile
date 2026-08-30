# --- build stage: type-check + production bundle ---
FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json vite.config.ts index.html ./
COPY src ./src

# Vite inlines env at build time; the browser runs on the host, so the default
# points at the backend's published port rather than a compose service name.
ARG VITE_API_BASE=http://localhost:8000
ENV VITE_API_BASE=$VITE_API_BASE
# Offline stand-in for the team/billing screens, for reviewing them where no
# payment provider is configured. Off by default, and never a demo mode.
ARG VITE_TEAM_FIXTURES=
ENV VITE_TEAM_FIXTURES=$VITE_TEAM_FIXTURES
# Where "Book a demo" on the sales-led plan goes. Unset means the card states
# the plan without a button — a dead link is worse than no link.
ARG VITE_CONTACT_SALES_URL=
ENV VITE_CONTACT_SALES_URL=$VITE_CONTACT_SALES_URL
RUN npm run build

# --- runtime stage: static files behind nginx ---
FROM nginx:1.27-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
