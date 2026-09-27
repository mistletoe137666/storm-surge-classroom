# 风暴潮课堂模拟平台

面向高中地理课堂的移动端风暴潮形成过程模拟。页面用侧面海岸剖面展示向岸风、异常增水、潮位叠加和越堤淹没之间的关系。

## 本地运行

```bash
npm install
npm run dev
```

## 生产构建

```bash
npm run build
npm run preview
```

## 发布到 GitHub Pages

1. 在 GitHub 新建名为 `storm-surge-classroom` 的 Public 仓库。
2. 将本项目内容推送到仓库的 `main` 分支。
3. 在仓库的 `Settings > Pages` 中，把 Source 设置为 `GitHub Actions`。
4. `.github/workflows/deploy.yml` 会自动构建并发布 `dist` 目录。

项目已经在 `vite.config.ts` 中设置了 `/storm-surge-classroom/` 基础路径。如果仓库名改变，需要同步修改 `base`。

## 说明

模拟数值是帮助课堂理解的示意模型，不是实时预报或工程计算。参考视频仅用于确定海洋到城市的侧面构图，不会被打包到网页中。
