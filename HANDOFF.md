# 照片墙工作室：AI 对接清单

## 项目位置

```text
D:\codex\图片墙
```

这是一个 Vite + Three.js 的静态前端项目，运行在 Windows 环境。

## 技术栈和入口

- 入口：`src/main.js`
- 布局计算：`src/ring-layout.js`
- 样式：`src/style.css`
- 静态资源：`public/`
- 测试：`tests/camera-state.test.mjs`
- 构建目录：`dist/`
- 包管理器：pnpm

## 本地启动

在 PowerShell 中执行：

```powershell
cd D:\codex\图片墙
pnpm install --frozen-lockfile
pnpm dev
```

## 修改后的默认流程

1. 修改源码。
2. `pnpm build`
3. `node tests/camera-state.test.mjs`
4. 检查本地页面。
5. `git add .` 和 `git commit`。

不要因为普通修改自动部署线上。只有用户明确说“部署”“同步线上”时，才执行：

```powershell
pnpm deploy:pages
```

部署细节见 [DEPLOYMENT.md](./DEPLOYMENT.md)。

## Cloudflare Pages

- Pages 项目：`photo-wall-editor`
- 稳定地址：`https://photo-wall-editor.pages.dev`
- 部署方式：Direct Upload
- 上传目录：`dist`
- 部署命令：`pnpm deploy:pages`
- 若登录失效：`pnpm dlx wrangler login`

不要索要或记录用户的 Cloudflare 密码、API Token 或验证码。

## 当前产品约定

- 默认主题是暗夜模式，且暗夜模式按钮需要显示为选中。
- 设置弹窗打开时需要有遮罩，弹窗位于遮罩上方。
- 导出弹窗定位在右上角“导出”按钮下方，不使用画布中央弹窗。
- 用户要求部署时才部署；否则只修改本地并提交 Git。
- 界面支持中文和 English，中文翻译要继续检查弹窗、底部提示和设置面板。

## 数据边界

- 示例图片和二维码在 `public/`，会随网站部署。
- 用户上传图片、项目和参数保存在浏览器 localStorage/IndexedDB 中，不在 Git 或服务器上。
- 不要把 `node_modules`、临时日志、缓存或用户本地图片当作源码提交。

## 最近提交

```text
d010aed 修复设置弹窗遮罩层级
ee1f391 明确部署需用户主动要求
74e1e95 优化设置遮罩和导出弹窗定位
0ec4e6d 修复暗夜主题默认选中状态
```
