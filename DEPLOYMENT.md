# 部署清单

本项目是 Vite 静态网站。线上只发布构建后的 `dist` 文件夹，不上传源码目录，也不需要常驻 Node 服务。

## 默认修改流程

### 1. 本地开发和检查

```powershell
pnpm install --frozen-lockfile
pnpm dev
```

在本地页面检查修改内容。完成后停止开发预览服务。

### 2. 构建生产文件

```powershell
pnpm build
```

确认构建成功，并检查 `dist` 已生成。`dist` 会包含页面、打包后的 JavaScript/CSS 和 `public` 中的静态资源。

### 3. 运行已有测试

```powershell
node tests/camera-state.test.mjs
```

### 4. 提交 Git

```powershell
git status
git add .
git commit -m "描述本次修改"
```

不要提交 `node_modules`、`dist`、预览日志或临时文件；这些已在 `.gitignore` 中排除。

默认修改到 Git 提交即可，**不要因为每次修改就自动部署**。只有你明确要求“部署”“同步线上”或类似指令时，才执行下面的 Cloudflare 部署步骤。

## 明确要求部署时

### 1. 部署到 Cloudflare Pages

```powershell
pnpm deploy:pages
```

该命令会先重新构建，再把 `dist` 上传到 Cloudflare Pages 项目 `photo-wall-editor`。没有收到明确部署指令时不要运行它。

如果 Cloudflare 登录凭据失效，先执行：

```powershell
pnpm dlx wrangler login
```

### 2. 线上验证

打开线上地址：

```text
https://photo-wall-editor.pages.dev
```

检查首页、示例图片、设置面板、弯曲效果、弹窗和导出功能。更新后如果浏览器仍显示旧版本，执行强制刷新。

## 重要说明

- 用户上传的图片、项目和参数保存在浏览器的 localStorage/IndexedDB 中，不会随静态网站部署到服务器。
- `public/photos`、二维码等静态资源会被打包进 `dist` 并部署。
- 当前 Pages 项目使用 Direct Upload。以后仍然使用 `pnpm deploy:pages` 更新，不要改为上传源码。
- 若要更换 Pages 地址，需要新建 Pages 项目；自定义域名则在 Cloudflare Pages 的 Custom domains 中绑定。
