# 苍蝇移动逻辑（Lua 实现）

本文档描述了逼真的苍蝇飞行行为系统的 Lua 实现方案，适用于游戏引擎（如 LÖVE、Corona SDK、Defold 等）。

---

## 概述

该苍蝇移动系统模拟真实苍蝇的飞行特征：
- **不规则轨迹**：苍蝇不会沿直线飞行
- **多种行为模式**：游荡、抖动、盘旋、冲刺
- **动态速度变化**：速度会波动
- **平滑转向**：使用角度累积实现平滑转弯

---

## 行为模式定义

```lua
-- 苍蝇行为模式
local FLY_BEHAVIOR = {
    WANDER = "wander",      -- 随机游荡：平滑转向，速度波动
    JITTER = "jitter",      -- 抖动：突然大幅度变向
    CIRCLE = "circle",      -- 盘旋：绕圈飞行
    DASH = "dash"           -- 冲刺：直线快速飞行
}

-- 苍蝇状态
local FLY_STATE = {
    MOVING = "moving",
    RESTING = "resting"
}
```

---

## 苍蝇数据结构

```lua
Fly = {}
Fly.__index = Fly

function Fly.new(x, y, isHardMode)
    local self = setmetatable({}, Fly)
    
    -- 位置
    self.x = x
    self.y = y
    
    -- 状态
    self.state = FLY_STATE.RESTING
    
    -- 方向（单位向量）
    local angle = math.random() * math.pi * 2
    self.direction = {
        x = math.cos(angle),
        y = math.sin(angle)
    }
    
    -- 速度
    self.baseSpeed = isHardMode and 10 or 7  -- 基础速度（像素/帧）
    self.speed = self.baseSpeed
    
    -- 停留计时
    self.restTime = 0
    self.restDuration = isHardMode 
        and (300 + math.random() * 400) 
        or (600 + math.random() * 600)
    
    -- 移动计时
    self.moveTime = 0
    self.moveDuration = isHardMode 
        and (600 + math.random() * 800) 
        or (1000 + math.random() * 1000)
    
    -- 旋转角度（弧度）
    self.rotation = 0
    
    -- 行为相关
    self.behavior = FLY_BEHAVIOR.WANDER
    self.behaviorTimer = 0
    self.behaviorDuration = 500 + math.random() * 1000
    self.turnAngle = angle  -- 当前转向角度
    self.turnSpeed = 0.1 + math.random() * 0.1  -- 转向速度
    self.jitterTimer = 0
    
    -- 动画
    self.frameIndex = 1
    self.frameTimer = 0
    
    return self
end
```

---

## 行为更新逻辑

```lua
function Fly:updateBehavior(deltaTime)
    -- 行为计时器更新
    self.behaviorTimer = self.behaviorTimer + deltaTime
    
    if self.behaviorTimer >= self.behaviorDuration then
        -- 切换新行为
        self.behaviorTimer = 0
        self.behaviorDuration = 300 + math.random() * 1200
        
        -- 根据概率选择行为
        local rand = math.random()
        if rand < 0.5 then
            self.behavior = FLY_BEHAVIOR.WANDER
        elseif rand < 0.7 then
            self.behavior = FLY_BEHAVIOR.JITTER
        elseif rand < 0.85 then
            self.behavior = FLY_BEHAVIOR.CIRCLE
        else
            self.behavior = FLY_BEHAVIOR.DASH
        end
    end
    
    -- 根据行为调整飞行参数
    if self.behavior == FLY_BEHAVIOR.WANDER then
        -- 随机游荡：平滑转向
        self.turnAngle = self.turnAngle + (math.random() - 0.5) * 0.3
        self.direction = {
            x = math.cos(self.turnAngle),
            y = math.sin(self.turnAngle)
        }
        self.speed = self.baseSpeed * (0.6 + math.random() * 0.4)
        
    elseif self.behavior == FLY_BEHAVIOR.JITTER then
        -- 抖动：突然改变方向
        self.jitterTimer = self.jitterTimer + deltaTime
        if self.jitterTimer >= 100 then  -- 每 100ms 抖动一次
            self.jitterTimer = 0
            self.turnAngle = self.turnAngle + (math.random() - 0.5) * math.pi
            self.direction = {
                x = math.cos(self.turnAngle),
                y = math.sin(self.turnAngle)
            }
        end
        self.speed = self.baseSpeed * 1.2
        
    elseif self.behavior == FLY_BEHAVIOR.CIRCLE then
        -- 盘旋：绕圈飞行
        self.turnAngle = self.turnAngle + 0.15  -- 固定角速度
        self.direction = {
            x = math.cos(self.turnAngle),
            y = math.sin(self.turnAngle)
        }
        self.speed = self.baseSpeed * 0.8
        
    elseif self.behavior == FLY_BEHAVIOR.DASH then
        -- 冲刺：直线快速飞行
        self.speed = self.baseSpeed * 2.5
        self.turnAngle = self.turnAngle + (math.random() - 0.5) * 0.1
        self.direction = {
            x = math.cos(self.turnAngle),
            y = math.sin(self.turnAngle)
        }
    end
end
```

---

## 主更新循环

```lua
function Fly:update(deltaTime, gameAreaWidth, gameAreaHeight)
    if self.state == FLY_STATE.RESTING then
        -- 停留状态
        self.restTime = self.restTime + deltaTime
        
        if self.restTime >= self.restDuration then
            -- 停留结束，开始移动
            self.state = FLY_STATE.MOVING
            self.turnAngle = math.atan2(self.direction.y, self.direction.x)
            self.moveTime = 0
        end
        
    elseif self.state == FLY_STATE.MOVING then
        -- 移动状态
        self.moveTime = self.moveTime + deltaTime
        
        -- 更新行为（转向、速度变化等）
        self:updateBehavior(deltaTime)
        
        -- 应用移动
        self.x = self.x + self.direction.x * self.speed
        self.y = self.y + self.direction.y * self.speed
        
        -- 更新旋转角度（用于渲染）
        self.rotation = math.atan2(self.direction.y, self.direction.x)
        
        -- 边界检测
        local maxX = gameAreaWidth - 40
        local maxY = gameAreaHeight - 40
        
        if self.x <= 0 or self.x >= maxX then
            self.direction.x = -self.direction.x
            self.turnAngle = math.atan2(self.direction.y, self.direction.x)
            self.x = math.max(0, math.min(self.x, maxX))
        end
        
        if self.y <= 0 or self.y >= maxY then
            self.direction.y = -self.direction.y
            self.turnAngle = math.atan2(self.direction.y, self.direction.x)
            self.y = math.max(0, math.min(self.y, maxY))
        end
        
        -- 检查移动时间是否结束
        if self.moveTime >= self.moveDuration then
            -- 移动结束，开始停留
            self.state = FLY_STATE.RESTING
            self.restTime = 0
            -- 重置行为
            self.behavior = FLY_BEHAVIOR.WANDER
            self.behaviorTimer = 0
        end
    end
end
```

---

## 渲染逻辑（LÖVE 示例）

```lua
function Fly:draw()
    -- 获取苍蝇图片（根据状态选择）
    local image
    if self.state == FLY_STATE.MOVING then
        -- 移动时使用飞行动画帧
        image = self.flyFrames[(self.frameIndex % #self.flyFrames) + 1]
    else
        -- 停留时使用 idle 图片
        image = self.flyIdle
    end
    
    -- 计算旋转中心
    local originX = image:getWidth() / 2
    local originY = image:getHeight() / 2
    
    -- 绘制旋转后的苍蝇
    -- 注意：+ math.pi/2 是因为图片默认朝向可能需要调整
    love.graphics.draw(
        image,
        self.x + originX,
        self.y + originY,
        self.rotation + math.pi / 2,  -- 旋转角度
        1, 1,                          -- 缩放
        originX, originY               -- 旋转中心
    )
end
```

---

## 动画帧更新

```lua
function Fly:updateAnimation(deltaTime)
    self.frameTimer = self.frameTimer + deltaTime
    
    if self.frameTimer >= 100 then  -- 每 100ms 切换一帧
        self.frameTimer = 0
        
        if self.state == FLY_STATE.MOVING then
            self.frameIndex = (self.frameIndex + 1) % #self.flyFrames
        end
    end
end
```

---

## 完整使用示例（LÖVE）

```lua
-- main.lua
local Fly = require("fly")  -- 引入上面的 Fly 类

local flies = {}
local gameWidth, gameHeight

function love.load()
    gameWidth, gameHeight = love.graphics.getDimensions()
    
    -- 加载图片资源
    local flyFrames = {
        love.graphics.newImage("assets/fly_fly1.png"),
        love.graphics.newImage("assets/fly_fly2.png"),
        love.graphics.newImage("assets/fly_fly3.png")
    }
    local flyIdle = love.graphics.newImage("assets/fly_idle.png")
    
    -- 创建苍蝇
    for i = 1, 3 do
        local fly = Fly.new(
            math.random(100, gameWidth - 100),
            math.random(100, gameHeight - 100),
            false  -- isHardMode
        )
        fly.flyFrames = flyFrames
        fly.flyIdle = flyIdle
        table.insert(flies, fly)
    end
end

function love.update(dt)
    local deltaTime = dt * 1000  -- 转换为毫秒
    
    for _, fly in ipairs(flies) do
        fly:update(deltaTime, gameWidth, gameHeight)
        fly:updateAnimation(deltaTime)
    end
end

function love.draw()
    for _, fly in ipairs(flies) do
        fly:draw()
    end
end

function love.mousepressed(x, y, button)
    if button == 1 then  -- 左键点击
        for i = #flies, 1, -1 do
            local fly = flies[i]
            local dx = x - (fly.x + 36)  -- 36 是苍蝇半径
            local dy = y - (fly.y + 36)
            local distance = math.sqrt(dx * dx + dy * dy)
            
            if distance < 50 then  -- 点击判定范围
                -- 消灭苍蝇
                table.remove(flies, i)
                
                -- 生成新苍蝇
                local newFly = Fly.new(
                    math.random(100, gameWidth - 100),
                    math.random(100, gameHeight - 100),
                    false
                )
                newFly.flyFrames = flies[1] and flies[1].flyFrames or {}
                newFly.flyIdle = flies[1] and flies[1].flyIdle or {}
                table.insert(flies, newFly)
            end
        end
    end
end
```

---

## 参数调优指南

| 参数 | 普通模式 | 困难模式 | 说明 |
|------|----------|----------|------|
| `baseSpeed` | 7 | 10 | 基础速度（像素/帧） |
| `restDuration` | 600-1200ms | 300-700ms | 停留时间范围 |
| `moveDuration` | 1000-2000ms | 600-1400ms | 移动持续时间 |
| `behaviorDuration` | 300-1500ms | 300-1500ms | 行为持续时间 |
| `jitterInterval` | 100ms | 100ms | 抖动间隔 |

### 行为概率分布

| 行为 | 概率 | 速度系数 |
|------|------|----------|
| WANDER（游荡） | 50% | 0.6-1.0x |
| JITTER（抖动） | 20% | 1.2x |
| CIRCLE（盘旋） | 15% | 0.8x |
| DASH（冲刺） | 15% | 2.5x |

---

## 扩展建议

1. **添加更多行为**：
   - `AVOID`：躲避玩家点击
   - `ATTRACT`：被特定区域吸引

2. **群体行为**：
   - 苍蝇之间的简单互动（避免重叠）
   - 群体迁移行为

3. **环境因素**：
   - 风速影响
   - 温度影响活动性

4. **性能优化**：
   - 使用对象池管理苍蝇实例
   - 批量渲染相同帧的苍蝇
