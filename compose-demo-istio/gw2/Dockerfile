FROM node:alpine

# 将工作目录设置为 /app
WORKDIR /app

# 将当前目录内容复制到位于 /app 中的容器中
ADD . /app

# 安装依赖包
RUN npm install --registry=https://registry.npm.taobao.org

# 使端口 3000 可供此容器外的环境使用
# EXPOSE 3000

# 定义环境变量
# ENV NAME World

# 在容器启动时运行
CMD [ "npm", "start" ]
