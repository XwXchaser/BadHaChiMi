# 安卓 APK 打包指南

## 项目概述
《猫咪的十分钟》是一款竖屏第一人称视角的超休闲猫咪捣蛋小游戏合集，使用 Capacitor 框架打包成安卓应用。

---

## 环境要求

### 必需软件
1. **Node.js** (v16 或更高版本)
   - 下载地址：https://nodejs.org/
   
2. **Android Studio** (最新稳定版)
   - 下载地址：https://developer.android.com/studio
   - 安装时需勾选：
     - Android SDK
     - Android SDK Platform
     - Android Virtual Device (可选)

3. **Java JDK** (v17 或更高版本)
   - 通常 Android Studio 会自带

---

## 构建步骤

### 1. 安装依赖
```bash
cd H:\Project\BadHaChiMi
npm install
```

### 2. 构建 Web 资源并同步到 Android
```bash
npm run build:android
```

### 3. 打开 Android Studio
```bash
npm run open
```
或在 Android Studio 中打开 `android` 目录

### 4. 在 Android Studio 中构建 APK

#### 方法 A：生成调试版 APK（用于测试）
1. 点击菜单 `Build` → `Build Bundle(s) / APK(s)` → `Build APK(s)`
2. 等待构建完成
3. APK 位置：`android/app/build/outputs/apk/debug/app-debug.apk`

#### 方法 B：生成发布版 APK（用于上架）
1. 点击菜单 `Build` → `Generate Signed Bundle / APK`
2. 选择 `APK`，点击 `Next`
3. 创建或选择密钥库（Keystore）
4. 选择 `release` 构建类型
5. 点击 `Finish`

---

## 配置选项

### 修改应用信息
编辑 `capacitor.config.json`：
```json
{
  "appId": "com.badhachimi.game",
  "appName": "猫咪的十分钟",
  "webDir": "www"
}
```

### 修改 Android 配置
编辑 `android/app/build.gradle`：
```gradle
android {
    defaultConfig {
        applicationId "com.badhachimi.game"
        minSdkVersion 22  // 最低支持 Android 5.1
        targetSdkVersion 34
        versionCode 1
        versionName "1.0.0"
    }
}
```

---

## 在真机上测试

### 方法 1：通过 USB 调试
1. 手机开启开发者选项和 USB 调试
2. 用 USB 连接电脑
3. 在 Android Studio 中点击运行按钮

### 方法 2：直接安装 APK
1. 将 APK 文件传输到手机
2. 在手机上点击安装（可能需要允许"未知来源"）

---

## 常见问题

### 1. 构建失败：SDK 未找到
**解决方案**：在 Android Studio 中安装所需的 Android SDK Platform

### 2. 构建失败：Java 版本不匹配
**解决方案**：确保 JAVA_HOME 环境变量指向正确的 JDK 版本

### 3. 应用闪退
**解决方案**：
- 检查 `www` 目录是否存在且包含所有文件
- 运行 `npm run sync` 重新同步资源
- 查看 Logcat 日志排查错误

### 4. 触摸/划动无响应
**解决方案**：
- 检查 `paw-input.js` 中的事件绑定
- 确保 `index.html` 中正确引用了所有脚本

---

## 快速命令参考

| 命令 | 说明 |
|------|------|
| `npm run build` | 复制 Web 资源到 www 目录 |
| `npm run sync` | 同步资源到 Android 项目 |
| `npm run open` | 在 Android Studio 中打开项目 |
| `npm run build:android` | 一键构建并同步 |

---

## 下一步

1. **测试游戏**：在多个设备上测试触摸响应
2. **优化性能**：检查内存使用和帧率
3. **添加图标**：替换 `android/app/src/main/res/mipmap` 中的应用图标
4. **准备上架**：创建应用截图、描述等素材
