# mirror-frontend

[English](./README.md) · [简体中文](./README.zh-CN.md)

Lida Mirror（上海立达学院开源镜像站）前端

## 技术栈

[Nuxt 4](https://nuxt.com/)（SSG，`nitro.preset: static`）· Vue 3 · Tailwind CSS v4 ·
[@nuxtjs/i18n](https://i18n.nuxtjs.org/) · [@nuxt/icon](https://github.com/nuxt/icon)

## 快速开始

```bash
pnpm install

# 开发：HMR 实时预览，API 指向本机 Go 后端
NUXT_PUBLIC_API_BASE=http://127.0.0.1:18000/api/v1 pnpm dev --host 127.0.0.1
#   → http://127.0.0.1:3000

# 构建静态站点
pnpm generate

# 交给后端托管（后端 config.yaml 的 web.dir 指向该目录）
rm -rf ../mirror-backend/web && cp -R .output/public ../mirror-backend/web
```

开发模式下前端在 3000、后端在 18000，属于**跨源**请求：后端需要放行该来源，
在 `config_debug.yaml` 里已配好（`mirror.cors_allow_origins`）。
同源部署（后端同时托管本前端与 `/api`）不需要任何 CORS 配置，默认即为关闭。

`pnpm dev` 支持热更新：改 `.vue` / `app/` 下的组件与方法即时生效。注意两点：

- **改 `i18n/locales/*.json` 需要刷新页面**（翻译文件是懒加载的，不参与 HMR）。
- **改 `nuxt.config.ts` 会自动重启** dev server。

## 目录结构

```
app/
  app.vue                   页面外壳：header / main / footer / toast / skip link
  assets/css/main.css       Tailwind v4 主题（品牌色、暗色变体、组件类）
  components/
    AppHeader.vue           顶栏：品牌、导航、语言切换、主题切换
    AppFooter.vue           页脚：支持方、运维方、源码地址、Logo
    LocaleSwitcher.vue      语言切换（数据驱动，见下文）
    ThemeToggle.vue         浅色 / 深色 / 跟随系统
    MirrorTable.vue         镜像表格（宽屏）+ 行内展开详情
    MirrorCard.vue          镜像卡片（移动端）
    MirrorDetail.vue        展开行内的详情面板
    MirrorStatus.vue        同步状态徽章（含未知状态兜底）
    MirrorTypeChip.vue      类别徽章（reverse_proxy / rsync / …）
    MirrorSearch.vue        搜索框（按 `/` 聚焦）
    StatusSummary.vue       表格上方的状态计数
    StateMessage.vue        加载 / 错误 / 空 / 无搜索结果 的统一呈现
    DirectoryTable.vue      目录表格（排序、图标、下载/复制）
    MirrorTableSkeleton.vue 骨架屏
    Toaster.vue             轻提示（复制成功等）
  composables/
    useMirrors.ts           列表数据 + 轮询刷新
    useListing.ts           目录列表数据 + 面包屑
    useToast.ts             轻提示状态
    useMediaQuery.ts        断点响应（表格/卡片的可访问性切换）
  pages/
    index.vue               镜像列表首页
    mirror/[...path].vue    目录浏览页：/mirror/{key}/{...path}
  types/mirror.ts           接口类型（与后端 Go 结构体一一对应）
  types/directory.ts        目录列表类型
  utils/format.ts           字节、数字、时间的本地化格式化
  utils/status.ts           状态 → 色调/图标/排序键
i18n/
  locales.ts                语言清单（唯一来源）
  locales/zh-CN.json        简体中文
  locales/en.json           English
public/                     logo.svg、logo-mark.svg、robots.txt
nuxt.config.ts             构建、i18n、图标、运行时配置
```

## 数据流

页面是静态 HTML，数据在浏览器端获取，因此**新增镜像或状态变化无需重新构建前端**：

```
pages/index.vue
   └─ useMirrors()  ──GET /api/v1/mirrors.json──▶  Go 后端（Redis 快照）
        └─ 每 NUXT_PUBLIC_REFRESH_INTERVAL 毫秒轮询一次（页面可见时才请求）
```

目录浏览页的数据来自 `/api/v1/list/{key}/{path}/mirrors.json`：后端经缓存代理取上游目录、
解析成统一结构后返回，所以前端**看不到上游 HTML**，也不需要为每个镜像站写适配。
浏览页里点目录继续走 `/mirror/...`（留在我们界面），点文件跳到 `/{key}/...`（经代理下载）。

## 新增语言

1. 复制 `i18n/locales/zh-CN.json` 为 `i18n/locales/<code>.json` 并翻译；
2. 在 `i18n/locales.ts` 的 `locales` 数组追加一项（`code` / `language` / `file` / `name` / `short` / `dir`）。

语言切换器、预渲染路由、`hreflang` 会自动包含新语言，组件无需改动——
没有写死的「中/EN 二选一」按钮。

## 状态与类别的展示约定

- 上游状态词汇各不相同（TUNA 用 `success/failed/syncing/paused`），
  前端按 `status.*` 翻译键渲染；**遇到未知值显示「未知」**，不会把英文原文漏进中文页面，
  悬停提示里才显示原始 token 便于排障。
- 类别按数据库 `mirror_type` 枚举渲染；新增枚举值时自动回落为中性样式与原文标签，
  不会因为缺翻译而崩溃。

## 环境变量

| 变量                            | 默认值                        | 说明                              |
| ------------------------------- | ----------------------------- | --------------------------------- |
| `NUXT_PUBLIC_API_BASE`          | `/api/v1`                     | 接口前缀或完整 URL                |
| `NUXT_PUBLIC_SITE_NAME`         | `Lida Mirror`                 | 站点名（i18n 缺失时兜底）         |
| `NUXT_PUBLIC_SITE_URL`          | `https://mirror.example.edu`  | 站点地址，i18n `baseUrl` 使用      |
| `NUXT_PUBLIC_REFRESH_INTERVAL`  | `60000`                       | 状态轮询间隔（毫秒）              |
| `NUXT_PUBLIC_OUTPUT_DIR`        | `.output/public`              | 覆盖构建产物目录                  |

## License

见 [LICENSE](./LICENSE)。
