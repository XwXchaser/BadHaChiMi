# Gradle 手动安装指南

## 问题说明
Android Studio 在首次打开项目时会尝试自动下载 Gradle，但由于网络问题（尤其是国内用户），经常会遇到 `java.net.SocketTimeoutException: Connect timed out` 错误。

---

## 解决方案

### 步骤 1：手动下载 Gradle

1. 打开浏览器访问：https://services.gradle.org/distributions/
2. 下载与项目匹配的 Gradle 版本（根据 `android/gradle/wrapper/gradle-wrapper.properties` 中的版本）
3. 对于本项目，下载 **gradle-8.14.3-all.zip**

**国内镜像下载（推荐）：**
- 腾讯镜像：https://mirrors.cloud.tencent.com/gradle/
- 阿里云镜像：https://maven.aliyun.com/gradle/

---

### 步骤 2：找到 Gradle 缓存目录

Gradle 会在全局缓存目录中查找已下载的 Gradle 版本。你需要将下载的 Gradle 放到正确的位置。

**Windows 系统默认缓存目录：**
```
C:\Users\<你的用户名>\.gradle\wrapper\dists\gradle-8.14.3-all\<随机哈希值>\
```

**操作步骤：**
1. 打开文件资源管理器
2. 在地址栏输入 `%USERPROFILE%\.gradle\wrapper\dists\` 并回车
3. 找到 `gradle-8.14.3-all` 文件夹（如果没有就创建一个）
4. 进入该文件夹，你会看到一个以随机哈希值命名的子文件夹（如 `bpn8g2x3y9z1q2w3e4r5t6y7u8`）
5. 将下载的 `gradle-8.14.3-all.zip` **解压到该哈希值文件夹内**

**解压后的目录结构应该是：**
```
C:\Users\<你的用户名>\.gradle\wrapper\dists\gradle-8.14.3-all\<随机哈希值>\
└── gradle-8.14.3\
    ├── bin\
    ├── lib\
    ├── init.d\
    └── ...
```

**注意：** 必须解压，不能直接放 zip 文件！

---

### 步骤 3：配置 GRADLE_USER_HOME（可选）

如果你想自定义 Gradle 缓存位置，可以设置环境变量：

1. 右键点击「此电脑」→「属性」→「高级系统设置」
2. 点击「环境变量」
3. 在「系统变量」或「用户变量」中点击「新建」
4. 变量名：`GRADLE_USER_HOME`
5. 变量值：你想要的缓存路径（例如 `D:\Gradle\Cache`）
6. 点击「确定」保存

---

### 步骤 4：在 Android Studio 中配置

1. 打开 Android Studio
2. 点击 `File` → `Settings`（或 `Android Studio` → `Preferences` on Mac）
3. 导航到 `Build, Execution, Deployment` → `Build Tools` → `Gradle`
4. 在「Gradle User Home」中确认路径与你步骤 2 或 3 中设置的一致
5. 点击「Apply」→「OK」

---

### 步骤 5：重新打开项目

1. 关闭 Android Studio
2. 重新打开项目（或点击 `File` → `Open` 重新选择项目目录）
3. Android Studio 应该会检测到已下载的 Gradle，不再尝试重新下载

---

## 替代方案：使用国内镜像

### 方法 1：修改 Gradle Wrapper 配置

编辑 `android/gradle/wrapper/gradle-wrapper.properties` 文件：

```properties
distributionUrl=https\://mirrors.cloud.tencent.com/gradle/gradle-8.14.3-all.zip
```

### 方法 2：配置国内 Maven 镜像

编辑 `android/build.gradle` 文件，在 `repositories` 块中添加：

```gradle
repositories {
    maven { url 'https://maven.aliyun.com/repository/google' }
    maven { url 'https://maven.aliyun.com/repository/public' }
    maven { url 'https://maven.aliyun.com/repository/gradle-plugin' }
    google()
    mavenCentral()
}
```

---

## 验证安装

在 Android Studio 中打开项目后，检查底部状态栏是否显示 Gradle 同步完成，且没有超时错误。

你也可以在终端运行以下命令验证：
```bash
cd android
./gradlew --version
```

如果显示 Gradle 版本信息，说明安装成功。

---

## 常见问题

### Q: 找不到 `.gradle` 文件夹？
A: `.gradle` 是隐藏文件夹。在文件资源管理器中开启「显示隐藏的项目」，或直接在地址栏输入 `%USERPROFILE%\.gradle`。

### Q: 解压后 Android Studio 仍然下载？
A: 可能是哈希值文件夹名称不匹配。删除 `gradle-8.14.3-all` 下的所有子文件夹，只保留解压后的 `gradle-8.14.3` 文件夹。

### Q: 磁盘空间不足？
A: Gradle 缓存可能占用数 GB 空间。确保至少有 5GB 可用空间。
