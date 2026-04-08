# 猫咪的十分钟 (BadHaChiMi)

一款竖屏第一人称视角的超休闲猫咪捣蛋小游戏合集。

## 🎮 游戏特色

- **隐形猫咪设定**：通过猫爪特效增强代入感，你就是那只调皮的猫咪！
- **购物清单 UI 选关**：独特的关卡选择界面，沉浸式体验
- **10 秒限时关卡**：短平快的游戏节奏，随时随地来一局
- **触摸划动操作**：简单直观的手势控制，轻松上手

## 🕹️ 已实现游戏

### 1. 打苍蝇 (Fly Hunter)
- 点击屏幕上的苍蝇将其拍死
- 限时 10 秒内消灭所有苍蝇
- 包含成功/失败音效和震动反馈

### 2. 破坏大王 (Destroyer)
- 划动屏幕挠沙发、扒拉厕纸
- 耐久度系统：沙发/厕纸有 80 点耐久度
- 伤害计算：每划动 3 像素造成 1 点伤害
- 爪痕特效和震动反馈

## 🚀 在线游玩

访问 [GitHub Pages](https://xwxchaser.github.io/BadHaChiMi/) 直接游玩

## 📱 安卓 APK 打包

### 环境要求
- Node.js v16+
- Android Studio（最新稳定版）
- Java JDK v17+

### 构建步骤

```bash
# 1. 安装依赖
npm install

# 2. 构建并同步到 Android
npm run build:android

# 3. 打开 Android Studio
npm run open

# 4. 在 Android Studio 中：
#    Build → Build Bundle(s) / APK(s) → Build APK(s)
```

详细指南请参考 [`ANDROID_BUILD_GUIDE.md`](ANDROID_BUILD_GUIDE.md)

## 📁 项目结构

```
BadHaChiMi/
├── index.html              # 主页面
├── js/
│   ├── main.js            # 入口文件
│   ├── game-manager.js    # 游戏管理器
│   ├── paw-input.js       # 触摸输入处理
│   ├── utils.js           # 工具函数
│   └── games/             # 游戏模块
│       ├── fly-hunter.js  # 打苍蝇游戏
│       └── destroyer.js   # 破坏大王游戏
├── styles/
│   └── main.css           # 样式文件
├── www/                   # 构建输出目录
├── android/               # Android 原生项目
├── capacitor.config.json  # Capacitor 配置
└── package.json           # 项目配置
```

## 🛠️ 技术栈

- **前端**：HTML5 + CSS3 + Vanilla JavaScript
- **触摸处理**：自定义 PawInput 类处理触摸/鼠标事件
- **音效**：Web Audio API 动态生成音效
- **打包**：Capacitor 框架
- **部署**：GitHub Pages

## 🎯 开发待办

- [ ] 推杯子游戏
- [ ] 抓窗帘游戏
- [ ] 更多迷你游戏关卡
- [ ] 游戏音效资源优化
- [ ] 成就系统

## 📄 许可证

MIT License
