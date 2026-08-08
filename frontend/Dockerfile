FROM node:18-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN chmod -R +x ./node_modules/.bin && npm run build

FROM nginx:alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
cd /workspaces/acos
git add frontend/Dockerfile frontend/.dockerignore
git commit -m "Fix frontend Docker build permission error for tsc"
git push