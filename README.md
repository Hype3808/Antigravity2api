# Antigravity Gateway

<div align="center">
  <img src="client/public/rocket.svg" width="120" alt="Antigravity Logo" />
  <h3>Google Antigravity API to OpenAI Proxy</h3>
  <p>
    将 Google Antigravity API 转换为 OpenAI 兼容格式的高性能网关服务。
    <br />
    内置现代化管理后台，支持多账号轮询、Token 自动刷新、密钥管理与实时监控。
  </p>
  <p>
    <a href="https://github.com/lwl2005/Antigravity-">
      <img src="https://img.shields.io/badge/原项目-lwl2005/Antigravity-blue?style=flat-square&logo=github" alt="Original Project" />
    </a>
  </p>
</div>

> [!NOTE]
> 本项目基于 [lwl2005/Antigravity-](https://github.com/lwl2005/Antigravity-) 进行开发和优化。

---

## ⚠️ 重要提示

> [!WARNING]
> **使用风险警告**
> - 本项目仅供学习与技术研究，请勿用于商业用途或违反服务条款的场景
> - 使用本项目可能违反 Google 服务条款，存在账号被封禁的风险
> - 请妥善保管 `data/accounts.json` 文件，其中包含敏感的访问凭证
> - 建议不要将账号数据文件提交到版本控制系统或公开分享
> - 使用者需自行承担因使用本项目而产生的一切后果

---

## ✨ 功能特性

### 核心功能
- **OpenAI 兼容**: 完全兼容 OpenAI Chat Completions API 格式，无缝对接现有生态。
- **流式响应**: 支持 SSE (Server-Sent Events) 流式输出，体验流畅。
- **多模态支持**: 支持文本及 Base64 编码的图片输入 (GPT-4 Vision 兼容)。
- **工具调用**: 支持 Function Calling，扩展模型能力。

### 增强特性
- **多账号池**: 支持配置多个 Google 账号，自动负载均衡与轮询。
- **Token 自动保活**: 内置 Token 刷新机制，自动处理过期与 403 错误。
- **高并发支持**: 优化的请求处理队列，支持高并发场景。

### 管理后台 (Dashboard)
- **现代化 UI**: 基于 React + Tailwind CSS 构建的极简主义设计风格。
- **密钥管理**: 创建、删除、禁用 API Key，支持设置额度与过期时间。
- **Token 管理**: 可视化管理 Google 账号，实时查看 Token 状态。
- **系统监控**: 实时监控 CPU、内存、请求数与响应时间。
- **在线测试**: 内置 Chat 调试界面，方便测试模型效果。
- **日志审计**: 完整的请求日志记录与查询。

## 🛠️ 技术栈

- **后端**: Node.js (Express), Native Fetch
- **前端**: React, Vite, Tailwind CSS, Framer Motion, Lucide React
- **数据存储**: 本地 JSON 文件存储 (轻量级，无外部数据库依赖)

## 🚀 快速开始

### 环境要求
- Node.js >= 18.0.0

### 1. 安装与构建

```bash
# 安装项目依赖
npm install

# 构建前端资源
npm run build
```

### 2. 配置服务

编辑根目录下的 `config.json` 文件：

```json
{
  "server": {
    "port": 8045,           // 服务端口
    "host": "0.0.0.0"       // 监听地址
  },
  "security": {
    "apiKey": "sk-admin",   // 管理员/默认 API Key
    "maxRequestSize": "50mb" // 最大请求体大小
  },
  "defaults": {
    "model": "gemini-2.0-flash-exp" // 默认模型
  }
}
```

### 3. 添加 Google 账号

运行 OAuth 登录脚本获取 Access Token：

```bash
npm run login
```

按提示在浏览器中授权，获取的 Token 将自动保存到 `data/accounts.json`。

> [!CAUTION]
> **数据安全警告**
> - `data/accounts.json` 文件包含您的 Google 账号访问令牌,具有高度敏感性
> - 请确保该文件权限设置正确 (建议 chmod 600)，仅所有者可读写
> - **切勿**将此文件上传到 GitHub、Gitee 等公开代码仓库
> - **切勿**与他人分享此文件或将其暴露在公网环境
> - 定期检查 `.gitignore` 文件，确保 `data/` 目录已被排除
> - 如发现令牌泄露，请立即在 Google 账号设置中撤销相关应用权限

### 4. 启动服务

```bash
# 生产模式
npm start

# 开发模式 (支持热重载)
npm run dev
```

服务启动后，访问 `http://localhost:8045` 进入管理后台。

## 🔌 API 使用指南

### 基础 URL
`http://localhost:8045`

### 认证
所有请求需在 Header 中携带 API Key：
`Authorization: Bearer <YOUR_API_KEY>`

### 1. 获取模型列表
`GET /v1/models`

### 2. 聊天补全
`POST /v1/chat/completions`

**请求示例:**
```bash
curl http://localhost:8045/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-admin" \
  -d '{
    "model": "gemini-2.0-flash-exp",
    "messages": [{"role": "user", "content": "Hello!"}],
    "stream": true
  }'
```

## 📂 项目结构

```
.
├── client/                 # 前端 React 项目
│   ├── src/
│   │   ├── components/     # UI 组件
│   │   ├── pages/          # 页面组件
│   │   └── ...
│   └── ...
├── data/                   # 数据存储目录
│   ├── accounts.json       # Google 账号数据
│   ├── keys.json           # API Key 数据
│   └── ...
├── src/                    # 后端源码
│   ├── server/             # 服务器入口
│   ├── api/                # API 路由处理
│   ├── auth/               # 认证与 Token 管理
│   └── ...
├── scripts/                # 工具脚本
├── config.json             # 配置文件
└── package.json
```

## ⚖️ 免责声明

本项目 (Antigravity Gateway) 仅供技术学习、研究和交流使用，开发者不对使用本项目产生的任何后果负责。

### 使用条款

1. **自行承担风险**: 使用者在使用本项目时，需完全理解并接受相关风险，包括但不限于：
   - Google 账号被暂停、封禁或限制访问
   - 违反 Google 服务条款可能导致的法律责任
   - 数据泄露、隐私侵犯等安全风险
   - 服务不稳定、数据丢失等技术问题

2. **禁止商业用途**: 本项目严禁用于任何商业用途，包括但不限于：
   - 提供付费 API 代理服务
   - 作为商业产品的技术组件
   - 任何形式的盈利性活动

3. **合规使用**: 使用者需确保：
   - 遵守所在地区的法律法规
   - 遵守 Google 及相关服务的使用条款
   - 不利用本项目进行任何违法或侵权行为

4. **数据安全**: 使用者应当：
   - 妥善保管账号凭证和敏感数据
   - 采取适当的安全措施防止数据泄露
   - 对因疏忽导致的安全问题自行负责

5. **无担保声明**: 本项目按 "现状" 提供，不提供任何明示或暗示的担保，包括但不限于：
   - 适销性担保
   - 特定用途适用性担保
   - 不侵权担保
   - 服务质量或可靠性担保

### 责任限制

在任何情况下，本项目的开发者、贡献者及相关方均不对以下情况承担责任：
- 因使用或无法使用本项目而产生的任何直接、间接、偶然、特殊或后果性损害
- 数据丢失、业务中断、利润损失或其他经济损失
- 第三方的任何索赔或诉讼

**使用本项目即表示您已充分理解并接受上述所有条款。如不同意，请勿使用本项目。**

---

## 📝 License

MIT License

本许可证授予的权利和义务不影响上述免责声明的效力。
