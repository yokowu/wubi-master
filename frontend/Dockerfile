# Step 1: 构建应用
FROM node:20-alpine AS builder

WORKDIR /app

# 复制依赖定义并安装
COPY package*.json ./
RUN npm ci

# 复制源文件并打包
COPY . .
RUN npm run build

# Step 2: 使用轻量级 Nginx 镜像托管静态资源
FROM nginx:stable-alpine

# 将构建产物复制到 Nginx 默认静态资源目录
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制自定义 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露 80 端口
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
