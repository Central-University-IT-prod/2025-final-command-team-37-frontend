# Этап сборки
FROM node:20 AS builder
WORKDIR /app

# Копируем только файлы зависимостей для кэширования
COPY package*.json ./
RUN npm ci

# Копируем остальной исходный код и выполняем сборку
COPY . .
RUN npm run build

# Этап продакшена
FROM node:20-alpine
WORKDIR /app

# Переносим файлы из этапа сборки
COPY --from=builder /app .

EXPOSE 5173

CMD ["npm", "start"]
