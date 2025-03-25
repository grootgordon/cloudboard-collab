
# Hocuspocus 实时协作服务器

此服务器基于 Hocuspocus 实现，用于为白板提供 Yjs 协作功能。

## 环境要求

- Node.js 14.0 或更高版本
- npm 或 yarn

## 设置和运行

1. 进入 server 目录:
```
cd server
```

2. 安装依赖:
```
npm install
```

3. 启动服务器:
```
npm start
```

服务器将在 http://localhost:1234 运行，使用 WebSocket 协议 (ws://localhost:1234)。

## 故障排除

如果连接出现问题，请检查以下事项：

1. 确保服务器正在运行，查看终端输出
2. 确保没有防火墙阻止 WebSocket 连接
3. 如果在生产环境中运行，请确保已设置正确的 VITE_HOCUSPOCUS_URL 环境变量
4. 如果您看到错误消息"WebSocket connection failed"，请确保启动服务器并且端口可访问

## 自定义配置

如需更改端口，可以设置环境变量:

```
PORT=5678 npm start
```

然后在前端项目中设置对应的 `.env` 文件:

```
VITE_HOCUSPOCUS_URL=ws://localhost:5678
```

## 生产部署

生产环境下可使用 PM2 管理服务器进程:

```
npm install -g pm2
pm2 start index.js --name hocuspocus-server
```

务必设置适当的安全措施，如 HTTPS、身份验证等。
