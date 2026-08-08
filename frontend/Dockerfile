FROM node:18-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
# use npm ci for reproducible installs and allow scripts to run as root
RUN npm ci --unsafe-perm
COPY . .
# ensure local binaries are on PATH and are executable, then run build
ENV PATH=/app/node_modules/.bin:$PATH
# ensure all node module binaries and scripts are executable
RUN chmod -R +x /app/node_modules || true
# run tsc and vite via npx to avoid shell/permission issues
RUN npx tsc && npx vite build

FROM nginx:alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
