# 关卡配置指南

## 📁 配置文件位置

关卡配置文件位于 [`levels.json`](levels.json)

## 📋 配置结构

### 基本结构

```json
{
  "levels": [
    {
      "id": 1001,
      "name": "关卡名称",
      "gameType": "游戏类型",
      "difficulty": "难度等级",
      "config": {
        // 游戏具体配置
      },
      "description": "关卡描述"
    }
  ]
}
```

## 🔧 字段说明

### 关卡基础字段

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| `id` | 数字 | 关卡唯一编号 | `1001` |
| `name` | 字符串 | 关卡显示名称 | `"初来乍到"` |
| `gameType` | 字符串 | 游戏类型 | `"fly-hunter"` 或 `"destroyer"` |
| `difficulty` | 字符串 | 难度等级 | `"easy"`, `"medium"`, `"hard"` |
| `description` | 字符串 | 关卡描述/提示 | `"有 3 只苍蝇在飞，拍死它们！"` |

### 难度等级说明

| 值 | 说明 | 建议用途 |
|------|------|------|
| `easy` | 简单 | 新手教学关卡 |
| `medium` | 中等 | 普通关卡 |
| `hard` | 困难 | 挑战关卡 |

### 游戏类型配置

#### 1. 打苍蝇游戏 (fly-hunter)

```json
{
  "id": 1001,
  "name": "初来乍到",
  "gameType": "fly-hunter",
  "difficulty": "easy",
  "config": {
    "flyCount": 3,        // 苍蝇数量 (1-10)
    "timeLimit": 10       // 时间限制 (秒)
  },
  "description": "有 3 只苍蝇在飞，拍死它们！"
}
```

**config 字段说明：**
- `flyCount`: 苍蝇数量，建议范围 1-10
- `timeLimit`: 时间限制（秒），固定为 10 秒

#### 2. 破坏大王游戏 (destroyer)

```json
{
  "id": 2001,
  "name": "挠痒痒",
  "gameType": "destroyer",
  "difficulty": "easy",
  "config": {
    "objectType": "sofa",    // 破坏对象类型
    "durability": 60,        // 耐久度
    "timeLimit": 10          // 时间限制 (秒)
  },
  "description": "挠挠沙发，留下你的爪痕！"
}
```

**config 字段说明：**
- `objectType`: 破坏对象类型
  - `"sofa"` - 沙发
  - `"toilet-paper"` - 厕纸
- `durability`: 耐久度，建议值：
  - 简单：60
  - 中等：80
  - 困难：120
- `timeLimit`: 时间限制（秒），固定为 10 秒

## 📝 添加新关卡步骤

1. 打开 `levels.json` 文件
2. 在 `levels` 数组中添加新的关卡对象
3. 确保 `id` 唯一
4. 保存文件

### 示例：添加新的打苍蝇关卡

```json
{
  "id": 1004,
  "name": "苍蝇狂欢",
  "gameType": "fly-hunter",
  "difficulty": "hard",
  "config": {
    "flyCount": 10,
    "timeLimit": 10
  },
  "description": "10 只苍蝇！终极挑战！"
}
```

### 示例：添加新的破坏关卡

```json
{
  "id": 2004,
  "name": "厕纸风暴",
  "gameType": "destroyer",
  "difficulty": "hard",
  "config": {
    "objectType": "toilet-paper",
    "durability": 150,
    "timeLimit": 10
  },
  "description": "超级耐用的厕纸，用力挠！"
}
```

## ⚠️ 注意事项

1. **JSON 格式要求**
   - 使用双引号 `"` 包裹字符串
   - 最后一个元素后不能有逗号
   - 确保括号正确匹配

2. **ID 命名规则**
   - 打苍蝇游戏：1xxx（如 1001, 1002, 1003）
   - 破坏大王游戏：2xxx（如 2001, 2002, 2003）

3. **难度平衡建议**
   - 打苍蝇：苍蝇数量 3/5/8 对应简单/中等/困难
   - 破坏大王：耐久度 60/80/120 对应简单/中等/困难

## 🧪 测试配置

修改配置后，在浏览器中打开游戏，检查：
1. 新关卡是否正确显示
2. 难度是否符合预期
3. 游戏是否能正常完成

## 📊 当前关卡列表

| ID | 名称 | 类型 | 难度 | 配置 |
|----|------|------|------|------|
| 1001 | 初来乍到 | 打苍蝇 | easy | 3 只苍蝇 |
| 1002 | 苍蝇围攻 | 打苍蝇 | medium | 5 只苍蝇 |
| 1003 | 苍蝇大军 | 打苍蝇 | hard | 8 只苍蝇 |
| 2001 | 挠痒痒 | 破坏大王 | easy | 沙发 (60 耐久) |
| 2002 | 厕纸飞舞 | 破坏大王 | medium | 厕纸 (80 耐久) |
| 2003 | 破坏大王 | 破坏大王 | hard | 沙发 (120 耐久) |
