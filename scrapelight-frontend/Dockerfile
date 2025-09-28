FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./

RUN if [ -f package-lock.json ]; then npm ci; \
    elif [ -f pnpm-lock.yaml ]; then npm i -g pnpm && pnpm i --frozen-lockfile; \
    elif [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
    else npm i; fi

COPY . .

EXPOSE 5173

# Ensure dependencies exist in the runtime volume (mounted /app and /app/node_modules)
CMD ["sh", "-c", "if [ ! -d node_modules ] || [ ! -d node_modules/@vitejs/plugin-react ]; then \
  if [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then npm i -g pnpm && pnpm i --frozen-lockfile; \
  elif [ -f yarn.lock ]; then yarn install --frozen-lockfile; \
  else npm i; fi; \
fi; \
exec npm run dev -- --host 0.0.0.0 --port 5173"]


