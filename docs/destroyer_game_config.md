# 破坏大王游戏数值配置表

本文档记录了破坏大王小游戏（挠沙发/扒拉厕纸）的完整数值配置。

---

## 基础配置

| 配置项 | 普通模式 | 困难模式 | 说明 |
|--------|----------|----------|------|
| 沙发耐久度 | 80 | 100 | 沙发总血量 |
| 厕纸耐久度 | 80 | 100 | 厕纸总血量 |
| 游戏时间 | 10 秒 | 10 秒 | 固定 10 秒限时 |
| 伤害系数 | 1.0 | 0.8 | 困难模式伤害降低 20% |
| 最少划动次数 | 10 次 | 10 次 | 10 秒内通关所需最少划动次数 |

---

## 伤害计算公式

```
伤害 = floor(划动距离 / 2.5) × 伤害系数
```

**设计目标**：10 秒内需要划动至少 10 下才能通关，平均每下造成 8 点伤害（普通模式）

| 划动距离（像素） | 普通模式伤害 | 困难模式伤害 | 耐久度百分比 |
|-----------------|-------------|-------------|-------------|
| 0-2 | 0 | 0 | 0% |
| 3-4 | 1 | 0 | 1.25% / 1% |
| 5-7 | 2 | 1 | 2.5% / 1% |
| 8-9 | 3 | 2 | 3.75% / 2% |
| 10-12 | 4 | 3 | 5% / 3% |
| 13-14 | 5 | 4 | 6.25% / 4% |
| 15-17 | 6 | 4 | 7.5% / 4% |
| 18-19 | 7 | 5 | 8.75% / 5% |
| 20-22 | 8 | 6 | 10% / 6% |
| 23-24 | 9 | 7 | 11.25% / 7% |
| 25-27 | 10 | 8 | 12.5% / 8% |
| 28-29 | 11 | 8 | 13.75% / 8% |
| 30-32 | 12 | 9 | 15% / 9% |
| 33-34 | 13 | 10 | 16.25% / 10% |
| 35-37 | 14 | 11 | 17.5% / 11% |
| 38-39 | 15 | 12 | 18.75% / 12% |
| 40-42 | 16 | 12 | 20% / 12% |
| 43-44 | 17 | 13 | 21.25% / 13% |
| 45-47 | 18 | 14 | 22.5% / 14% |
| 48-49 | 19 | 15 | 23.75% / 15% |
| 50+ | 20+ | 16+ | 25%+ / 16%+ |

---

## 通关要求

| 模式 | 目标 | 平均每次划动需要造成 | 最少有效划动次数 | 推荐划动距离 |
|------|------|---------------------|-----------------|-------------|
| 普通模式 | 耐久度降至 0 | 8 点伤害 | 10 次 | 20-22 像素 |
| 困难模式 | 耐久度降至 0 | 10 点伤害 | 10 次 | 25-27 像素 |

### 10 秒内通关所需划动频率

| 模式 | 最少划动次数 | 所需频率 | 平均划动距离 |
|------|-------------|---------|-------------|
| 普通模式 | 10 次 | 1 次/秒 | 20 像素 |
| 困难模式 | 10 次 | 1 次/秒 | 25 像素 |

---

## 物体配置

### 沙发（Sofa）

| 属性 | 值 |
|------|-----|
| 尺寸 | 200x150 像素 |
| 初始耐久度 | 80/100 |
| 破坏效果 | 爪痕叠加、灰度滤镜、透明度降低 |
| 胜利条件 | 耐久度 ≤ 0 |

### 厕纸（Toilet Paper）

| 属性 | 值 |
|------|-----|
| 尺寸 | 100x150 像素 |
| 初始耐久度 | 80/100 |
| 破坏效果 | 爪痕叠加、灰度滤镜、透明度降低 |
| 胜利条件 | 耐久度 ≤ 0 |

---

## 爪痕特效配置

| 属性 | 值 |
|------|-----|
| 爪痕尺寸 | 40x40 像素 |
| 爪痕透明度 | 0.8 |
| 爪痕旋转 | 随机 0-360 度 |
| 震动阈值 | 伤害 ≥ 5 时触发震动 30ms |

---

## Lua 配置表（可直接用于游戏引擎）

```lua
-- destroyer_config.lua
-- 破坏大王游戏数值配置

DestroyerConfig = {
    -- 基础配置
    base = {
        timeLimit = 10000,  -- 游戏时间（毫秒）
    },
    
    -- 普通模式配置
    normal = {
        sofa = {
            maxDurability = 80,
            damageCoefficient = 1.0,
        },
        toiletPaper = {
            maxDurability = 80,
            damageCoefficient = 1.0,
        },
    },
    
    -- 困难模式配置
    hard = {
        sofa = {
            maxDurability = 100,
            damageCoefficient = 0.8,
        },
        toiletPaper = {
            maxDurability = 100,
            damageCoefficient = 0.8,
        },
    },
    
    -- 特效配置
    effects = {
        clawMark = {
            size = 40,          -- 爪痕尺寸（像素）
            opacity = 0.8,      -- 透明度
            randomRotation = true,
        },
        vibration = {
            threshold = 5,      -- 触发震动的伤害阈值
            duration = 30,      -- 震动持续时间（毫秒）
        },
    },
    
    -- 物体视觉配置
    objects = {
        sofa = {
            width = 200,
            height = 150,
        },
        toiletPaper = {
            width = 100,
            height = 150,
        },
    },
}

-- 伤害计算函数
function DestroyerConfig:calculateDamage(distance, isHardMode, objectType)
    local config = isHardMode and self.hard or self.normal
    local objConfig = config[objectType or "sofa"]
    
    -- 基础伤害：每 3 像素距离造成 1 点伤害
    local baseDamage = math.floor(distance / 3)
    
    -- 应用伤害系数
    local finalDamage = math.floor(baseDamage * objConfig.damageCoefficient)
    
    return math.max(0, finalDamage)
end

-- 检查是否胜利
function DestroyerConfig:checkVictory(currentDurability)
    return currentDurability <= 0
end

-- 获取耐久度百分比
function DestroyerConfig:getDurabilityPercent(current, isHardMode, objectType)
    local config = isHardMode and self.hard or self.normal
    local maxDurability = config[objectType or "sofa"].maxDurability
    return math.floor((current / maxDurability) * 100)
end
```

---

## 使用示例

```lua
-- 游戏初始化
local config = DestroyerConfig
local isHardMode = false
local objectType = "sofa"

-- 获取物体最大耐久度
local maxDurability = config[isHardMode and "hard" or "normal"][objectType].maxDurability
local currentDurability = maxDurability

-- 玩家划动时调用
function onSwipe(distance, x, y)
    local damage = config:calculateDamage(distance, isHardMode, objectType)
    currentDurability = currentDurability - damage
    
    -- 添加爪痕特效
    if damage > 0 then
        addClawMark(x, y)
    end
    
    -- 震动反馈
    if damage >= config.effects.vibration.threshold then
        vibrate(config.effects.vibration.duration)
    end
    
    -- 检查胜利
    if config:checkVictory(currentDurability) then
        onVictory()
    end
    
    -- 更新 UI
    updateDurabilityDisplay(currentDurability, maxDurability)
end
```

---

## 数值平衡建议

### 如果觉得游戏太难：
1. 降低耐久度：80 → 60（普通模式）
2. 提高伤害系数：1.0 → 1.2
3. 降低划动距离阈值：3 像素 → 2 像素

### 如果觉得游戏太简单：
1. 提高耐久度：80 → 100（普通模式）
2. 降低伤害系数：1.0 → 0.8
3. 提高划动距离阈值：3 像素 → 4 像素

---

## 版本历史

| 版本 | 日期 | 变更内容 |
|------|------|----------|
| 1.0 | 2026-04-08 | 初始配置：沙发耐久度 80，每 3 像素造成 1 点伤害 |
