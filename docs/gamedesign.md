猫咪的十分钟 - 系统设计文档
版本: v1.0
最后更新: 2026-04-09
引擎: UrhoX (Lua 5.4 + NanoVG)
屏幕方向: 竖屏 (Portrait, 9:16)

目录
项目概述
项目结构
核心架构
游戏模块接口规范
核心模块详解
游戏模块详解
关卡与章节系统
美术资源清单
渲染管线
输入系统
结算系统
1. 项目概述
猫咪的十分钟 是一款竖屏休闲小游戏合集。玩家扮演一只家猫，在主人不在家的十分钟里尽情搞破坏。游戏包含 5 种玩法，共 50 个关卡，分布在 5 个章节（房间场景）中。

核心玩法循环
章节选择菜单 → 选择关卡 → 显示操作提示气泡 → 限时挑战
                                                    ↓
                                              成功: 拍立得照片展示
                                              失败: 被主人抓住动画
                                                    ↓
                                              返回章节菜单
五种游戏类型
类型	代号	玩法	输入方式	失败动画
打苍蝇	fly	点击消灭苍蝇	点击 (click)	从下方抓住 (grab)
挠沙发	sofa	滑动抓挠沙发	滑动 (swipe)	被捏后颈 (pinch)
扒拉厕纸	paper	滑动拉扯纸巾	滑动 (swipe)	被捏后颈 (pinch)
推杯子	cup	滑动推杯落桌	滑动 (swipe)	从下方抓住 (grab)
捏泡泡纸	bubble	点击戳破气泡	点击 (click)	从下方抓住 (grab)
2. 项目结构
/workspace/
├── scripts/                    # 游戏代码
│   ├── main.lua                # 入口：生命周期管理、模块编排
│   ├── core/
│   │   ├── shared.lua          # 全局状态：关卡数据、章节配置、屏幕参数
│   │   ├── hud.lua             # HUD：计时条 + 信息标签
│   │   ├── input.lua           # 输入分发：鼠标/触摸统一处理
│   │   ├── settlement.lua      # 结算：胜负动画与流程控制
│   │   ├── menu.lua            # 章节选关菜单：竖向翻页卡片
│   │   └── utils.lua           # 工具函数：坐标转换、程序化猫爪绘制
│   └── games/
│       ├── fly.lua             # 打苍蝇
│       ├── sofa.lua            # 挠沙发
│       ├── paper.lua           # 扒拉厕纸
│       ├── cup.lua             # 推杯子
│       └── bubble.lua          # 捏泡泡纸
├── assets/
│   └── image/                  # 图片素材 (详见第8节)
└── docs/
    └── system-design.md        # 本文档
3. 核心架构
3.1 生命周期流程
Start()
  ├── 初始化 NanoVG 上下文 (vg)
  ├── 加载字体 (MiSans)
  ├── 计算屏幕尺寸 (物理 → 逻辑)
  ├── 遍历调用所有 game.init(vg)      ← 预加载图片资源
  ├── 初始化菜单 (initMenu)
  └── 订阅 NanoVGRender → HandleMenuRender

StartGame(levelIndex)
  ├── 确定 gameType → 查找对应模块
  ├── 调用 game.start()               ← 重置游戏状态
  ├── 创建 HUD (计时条+信息标签)
  ├── 订阅输入事件 (Mouse/Touch)
  ├── 切换渲染 → HandleGameRender
  ├── 订阅 Update → HandleGameUpdate
  └── 显示操作提示气泡 (2秒)

HandleGameUpdate(dt)
  ├── 结算中 → settlement.updateState(dt)
  └── 游戏中 → game.update(dt)
       ├── 更新计时器
       ├── 更新 HUD
       └── 超时 → OnGameFail()

HandleGameRender()
  ├── nvgBeginFrame (DPR 缩放)
  ├── nvgTranslate (屏幕震动偏移)
  ├── game.drawScene(ctx, w, h)        ← 游戏场景绘制
  ├── 绘制操作提示气泡 (如果活跃)
  └── settlement 覆盖层 (如果结算中)
3.2 模块依赖关系
main.lua
  ├── core/shared.lua     ← 全局状态 (所有模块共享)
  ├── core/hud.lua         ← HUD 控件
  ├── core/input.lua       ← 输入分发
  ├── core/settlement.lua  ← 结算动画
  ├── core/menu.lua        ← 选关菜单
  ├── core/utils.lua       ← 工具函数
  └── games/*              ← 5 个游戏模块 (通过 GAME_MODULES 表注册)
3.3 全局状态管理 (shared.lua)
shared.lua 导出一个单例模块 M，持有所有跨模块共享的状态：

字段	类型	说明
M.vg	userdata	NanoVG 上下文
M.sw, M.sh	number	逻辑屏幕宽高 (物理/DPR)
M.dpr	number	设备像素比
M.levels	table[50]	关卡定义数组
M.chapters	table[5]	章节配置
M.currentLevel	number	当前关卡索引
M.currentGame	module	当前活跃的游戏模块引用
M.settlement	table	结算动画状态
M.uiRoot	UIElement	UI 根节点
4. 游戏模块接口规范
每个游戏模块必须实现以下标准接口：

lua

复制
local M = {}

-- ========== 配置属性 ==========
M.inputType  = "click" | "swipe"   -- 输入模式
M.failStyle  = "grab"  | "pinch"   -- 失败动画风格

-- ========== 生命周期 ==========

--- 初始化：加载图片等资源（仅调用一次）
---@param vg userdata NanoVG 上下文
function M.init(vg) end

--- 开始/重置游戏状态（每次进入关卡调用）
function M.start() end

--- 每帧更新
---@param dt number 帧间隔秒数
function M.update(dt) end

-- ========== 输入处理 ==========

--- 点击处理（仅 inputType="click" 时调用）
---@param px number 逻辑坐标 X
---@param py number 逻辑坐标 Y
function M.onClick(px, py) end

--- 滑动处理（仅 inputType="swipe" 时调用）
---@param x1 number 起点 X
---@param y1 number 起点 Y
---@param x2 number 终点 X
---@param y2 number 终点 Y
function M.onSwipeMove(x1, y1, x2, y2) end

-- ========== 渲染 ==========

--- 绘制游戏场景（在 NanoVGRender 事件中调用）
---@param ctx userdata NanoVG 上下文
---@param w number 逻辑屏幕宽
---@param h number 逻辑屏幕高
function M.drawScene(ctx, w, h) end

--- 获取屏幕震动偏移量
---@return number shakeX, number shakeY
function M.getShake() end

--- 绘制成功结算照片内容（在拍立得相框内绘制）
---@param ctx userdata NanoVG 上下文
---@param cX number 照片区域中心 X
---@param cY number 照片区域中心 Y
---@param cW number 照片区域宽度
---@param cH number 照片区域高度
---@param alpha number 透明度 0~1
function M.drawSuccessPhoto(ctx, cX, cY, cW, cH, alpha) end

return M
5. 核心模块详解
5.1 main.lua — 主控入口
职责: 引擎入口、模块注册、生命周期调度、渲染/更新分发。

游戏模块注册表:

lua

复制
GAME_MODULES = {
    fly    = require("games.fly"),
    sofa   = require("games.sofa"),
    paper  = require("games.paper"),
    cup    = require("games.cup"),
    bubble = require("games.bubble"),
}
关键流程:

Start(): 引擎初始化入口，设置 NanoVG、字体、DPR 缩放，预加载所有模块
StartGame(levelIndex): 根据关卡的 gameType 从注册表取模块，订阅输入/渲染事件
ReturnToMenu(): 清理游戏状态，切换回菜单渲染
HandleGameRender(): NanoVG 渲染主循环，处理 DPR 缩放 + 震动偏移 + 结算叠加
操作提示气泡: 进入关卡后显示 2 秒的半透明提示文字（如"点击苍蝇消灭它们！"），带圆角矩形背景，自动淡出。

5.2 shared.lua — 全局共享状态
职责: 定义关卡数据、章节配置、管理跨模块共享的运行时状态。

核心数据结构:

lua

复制
-- 章节定义 (5个)
M.chapters = {
    { name = "客厅篇", cardImage = "..." },
    { name = "厨房篇", cardImage = "..." },
    { name = "卧室篇", cardImage = "..." },
    { name = "卫生间篇", cardImage = "..." },
    { name = "阳台篇", cardImage = "..." },
}

-- 关卡定义 (50个, 每章10关)
M.levels[i] = {
    id         = i,
    chapter    = 1~5,
    name       = "关卡显示名",
    gameType   = "fly"|"sofa"|"paper"|"cup"|"bubble",
    instruction = "操作提示文字",
    listText   = "菜单列表中的短文本",
    status     = "unlocked"|"locked"|"cleared",
    difficulty = 1~3,
}
关卡分布: 5 种游戏类型在 50 关中交替出现，每章 10 关。

5.3 hud.lua — HUD 覆盖层
职责: 管理游戏中的计时条和信息标签。

组件:

组件	位置	说明
计时条 (TimerBar)	屏幕顶部	宽度随时间递减，颜色分三阶段变化
信息标签 (InfoLabel)	右上角	显示击杀数/HP 等游戏状态信息
计时条颜色阶段:

> 60% 剩余: 绿色
30% ~ 60%: 橙色
< 30%: 红色
API:

lua

复制
hud.CreateGameHUD()               -- 创建 HUD 元素
hud.UpdateTimerBar(timer, maxTime) -- 更新计时条
hud.UpdateInfoLabel(text)          -- 更新信息文本
5.4 input.lua — 输入系统
职责: 统一鼠标和触摸输入，根据游戏的 inputType 分发到对应处理函数。

详见第 10 节。

5.5 settlement.lua — 结算系统
职责: 管理胜利/失败动画的全部逻辑和渲染。

详见第 11 节。

5.6 menu.lua — 章节选关菜单
职责: 全屏竖向翻页式章节卡片菜单，带关卡选择功能。

核心特性:

5 个章节卡片，竖向排列，支持上下滑动翻页
带惯性的拖拽物理 (velocity-based page snapping)
每张卡片显示章节图片 + 10 个关卡文字标签
关卡文字位置/角度/字号由 CHAPTER_TEXT_CONFIG 配置
点击关卡文字区域触发 StartGame()
背景颜色在页面间平滑插值过渡
包含调试用的"解锁全部"按钮
章节卡片渲染:

卡片图片以 CHAPTER_SRC 记录的原始尺寸为基准
统一缩放到屏幕宽度 85%，保持原始比例
关卡文字位置用归一化坐标 (0~1) 映射到卡片实际区域
5.7 utils.lua — 工具函数
职责: 提供全局工具函数。

函数	说明
PhysToLogical(px, py)	物理坐标 → 逻辑坐标转换 (除以 DPR)
DrawCatPaw(ctx, alpha)	程序化绘制矢量猫爪 (掌心椭圆 + 粉色肉垫 + 4个脚趾)
6. 游戏模块详解
6.1 fly.lua — 打苍蝇
概述: 苍蝇在屏幕上飞来飞去，玩家点击消灭它们。猫爪从屏幕边缘滑入拍击。

属性	值
输入模式	click
失败动画	grab
时间限制	10 秒
胜利条件	消灭 5 只苍蝇
渲染方式	图片素材 + 程序化猫爪
苍蝇 AI 系统:

4 种行为模式: wander (漫游) / jitter (抖动) / circle (盘旋) / dash (冲刺)
状态机: moving ↔ resting，随机切换
翅膀动画: 3 帧循环 (fly_fly1/2/3 + fly_idle)
猫爪拍击动画:

命中时猫手臂 (TissueGame_Cat_Hand.png) 从随机方向滑入
锚点 PAW_ANCHOR_X = 0.31，宽度 = 屏幕 45%
动画: easeOut 滑入 → 短暂停留 → easeIn 滑出
未命中时绘制程序化猫爪 (DrawCatPaw)
图片资源:

背景: cake_on_table_bg_*.png (cover 模式铺满)
苍蝇: fly_idle.png, fly_fly1/2/3.png (256x256, 4帧)
猫手: TissueGame_Cat_Hand.png (256x1448)
成功照片: edited_polaroid_cake_final_*.png
6.2 sofa.lua — 挠沙发
概述: 玩家滑动屏幕抓挠沙发，制造划痕和棉絮。纯程序化渲染，无图片素材。

属性	值
输入模式	swipe
失败动画	pinch
时间限制	10 秒
胜利条件	HP 从 100 降到 0
渲染方式	全程序化 NanoVG
沙发伤害系统:

初始 HP = 100，每次滑动根据距离扣减
伤害视觉:
沙发颜色随损坏程度加深
划痕: 每次滑动生成 4 条平行线
棉絮粒子: 从划痕处弹出
撕裂形状: 损坏 > 30% 时出现
场景组成 (全部程序化):

房间: 墙壁 + 地板 + 踢脚线
装饰: 画框 + 台灯
沙发: 带渐变色的矩形 + 圆角靠垫
猫爪轨迹: DrawCatPaw 跟随滑动位置
6.3 paper.lua — 扒拉厕纸
概述: 玩家向下滑动拉扯纸巾卷，纸链随之伸长。图片素材渲染。

属性	值
输入模式	swipe
失败动画	pinch
时间限制	10 秒
胜利条件	HP 从 80 降到 0
渲染方式	图片素材
纸巾链系统:

纸巾盒固定在屏幕上部 (TissueGame_TissueBox.png)
纸链 = 1 段短纸 (Tissue_Short) + 2 段长纸 (Tissue_long)，垂直拼接
裁剪区: 纸巾盒下方使用 nvgScissor 裁剪，纸链下端随 HP 下降逐渐露出
拉伸/回弹: 滑动时 stretchY 增加拉伸量，释放后以 8 倍速率弹回
统一缩放策略:

lua

复制
displayScale = (screenWidth * 0.5) / imageBoxWidth
-- 所有纸巾相关图片共享同一缩放因子，保持比例一致
视觉层次 (从后到前):

背景图 (TissueGame_Background.png, cover 模式)
地板纸堆 (PileOfTissue_1/2, 渐显: 20%/50% 进度)
纸巾链 (裁剪区内)
背景遮罩 (重绘纸巾盒上方背景，隐藏溢出)
纸巾盒 (满/空状态切换)
碎纸粒子
猫爪图片 (Cat_Hand, 跟随滑动)
图片资源:

资源	文件	尺寸
背景	TissueGame_Background.png	1080x1920
纸巾盒(满)	TissueGame_TissueBox.png	1024x512
纸巾盒(空)	TissueGame_TissueBox_Empty.png	1024x512
短纸段	TissueGame_Tissue_Short.png	512x1024
长纸段	TissueGame_Tissue_long.png	512x2048
猫手	TissueGame_Cat_Hand.png	256x1448
纸堆1	TissueGame_PileOfTissue_1.png	2048x512
纸堆2	TissueGame_PileOfTissue_2.png	2048x512
6.4 cup.lua — 推杯子
概述: 伪 3D 透视桌面上摆放杯子，玩家滑动将杯子推落桌面。图片素材渲染。

属性	值
输入模式	swipe
失败动画	grab
时间限制	10 秒
胜利条件	所有杯子被推落且落地
渲染方式	图片素材 + 透视映射
透视桌面系统:

桌面为梯形: 近端(屏幕下方)宽，远端(屏幕上方)窄
TABLE_SCAN 定义梯形四角坐标 (从 alpha 通道扫描得出)
tableToScreen(depth, tableX) 将桌面归一化坐标 (0~1) 映射为屏幕坐标 + 透视缩放
杯子物理:

6 个杯子分布在桌面不同深度
双向推动: 左右滑动均可
落桌条件: tableX <= -0.03 或 tableX >= 1.03
落桌后: 杯子进入自由落体 (重力 = 1200) + 旋转动画
胜利判定: 所有杯子落桌 (pushed) 且全部落地 (landed)
缩放规则:

lua

复制
-- 桌面图片统一缩放，nvgRect 必须与 nvgImagePattern 精确匹配
local scale = screenWidth / imgW  -- 统一缩放
-- nvgImagePattern 和 nvgRect 使用完全相同的 x, y, w, h
图片资源:

资源	文件	尺寸
背景	PushCupGame_Background.png	1080x1920
桌面	PushCupGame_Table.png	1024x2048
杯子1~4	PushCupGame_Cup1~4.png	128x128
6.5 bubble.lua — 捏泡泡纸
概述: 屏幕上显示一张气泡膜，玩家点击戳破气泡。纯程序化渲染，无图片素材。

属性	值
输入模式	click
失败动画	grab
时间限制	20 秒
胜利条件	戳破全部气泡 (8x10 = 80 个)
渲染方式	全程序化 NanoVG
气泡网格系统:

网格: 8 列 x 10 行 = 80 个气泡
布局计算: 根据屏幕尺寸减去边距，等分计算格子大小
碰撞检测: screenToGrid() 将触摸坐标映射到网格，使用圆形碰撞半径
气泡渲染:

未戳破: 径向渐变 (白→浅蓝) + 高光椭圆
已戳破: 红点 + 十字标记
视觉效果:

戳破粒子: 从气泡位置弹出
猫爪轨迹: DrawCatPaw 在最近点击位置渐隐
背景: 浅灰蓝色 + 网格线纹理
7. 关卡与章节系统
7.1 章节配置
#	章节名	卡片图片	原始尺寸
1	客厅篇	UI_StageSelect_Chapter1.png	393x622
2	厨房篇	UI_StageSelect_Chapter2.png	483x399
3	卧室篇	UI_StageSelect_Chapter3.png	476x385
4	卫生间篇	UI_StageSelect_Chapter4.png	393x706
5	阳台篇	UI_StageSelect_Chapter5.png	478x429
7.2 关卡分布
每章 10 关，5 种游戏类型交替出现。关卡定义字段:

lua

复制
{
    id         = 1,           -- 全局关卡 ID
    chapter    = 1,           -- 所属章节 (1~5)
    name       = "客厅探险1",  -- 显示名称
    gameType   = "fly",       -- 游戏类型
    instruction = "快速点击...", -- 操作提示
    listText   = "苍蝇危机",    -- 菜单列表短文本
    status     = "unlocked",  -- 状态: unlocked/locked/cleared
    difficulty = 1,           -- 难度 (1~3, 预留)
}
7.3 关卡解锁规则
第 1 关默认解锁 (unlocked)
其余关卡默认锁定 (locked)
通关一关后，下一关自动解锁
已通关的关卡标记为 cleared
调试模式: 菜单中的解锁按钮可一键解锁全部
7.4 章节菜单文字定位
每个章节卡片上的关卡文字位置通过 CHAPTER_TEXT_CONFIG 配置:

lua

复制
CHAPTER_TEXT_CONFIG[chapterIndex] = {
    { nx = 0.3, ny = 0.2, angle = -5, fontSize = 14 },  -- 关卡1 位置
    { nx = 0.7, ny = 0.35, angle = 3, fontSize = 13 },  -- 关卡2 位置
    -- ... 共 10 个
}
nx, ny: 归一化坐标 (0~1)，相对于卡片区域
angle: 文字旋转角度 (度)
fontSize: 字号
8. 美术资源清单
8.1 UI 素材
文件名	尺寸	用途
UI_StageSelect_Background.png	467x2048	菜单背景
UI_StageSelect_Chapter1~5.png	各异	章节卡片图
icon_settings.png	128x128	设置图标
8.2 打苍蝇 (fly) 素材
文件名	尺寸	用途
fly_idle.png	256x256	苍蝇静止帧
fly_fly1.png	256x256	苍蝇飞行帧 1 (翅膀上)
fly_fly2.png	256x256	苍蝇飞行帧 2 (翅膀平)
fly_fly3.png	256x256	苍蝇飞行帧 3 (翅膀下)
cake_on_table_bg_*.png	450x806	蛋糕桌面背景
TissueGame_Cat_Hand.png	256x1448	猫手臂 (共用)
edited_polaroid_cake_final_*.png	512x686	成功拍立得照片
8.3 扒拉厕纸 (paper) 素材
文件名	尺寸	用途
TissueGame_Background.png	1080x1920	卫生间背景
TissueGame_TissueBox.png	1024x512	纸巾盒 (满)
TissueGame_TissueBox_Empty.png	1024x512	纸巾盒 (空)
TissueGame_Tissue_Short.png	512x1024	短纸段
TissueGame_Tissue_long.png	512x2048	长纸段
TissueGame_Cat_Hand.png	256x1448	猫手
TissueGame_Cat_Arm.png	256x1024	猫臂 (未使用)
TissueGame_PileOfTissue_1.png	2048x512	地板纸堆 1
TissueGame_PileOfTissue_2.png	2048x512	地板纸堆 2
8.4 推杯子 (cup) 素材
文件名	尺寸	用途
PushCupGame_Background.png	1080x1920	厨房背景
PushCupGame_Table.png	1024x2048	桌面 (含 alpha 梯形)
PushCupGame_Cup1.png	128x128	杯子类型 1
PushCupGame_Cup2.png	128x128	杯子类型 2
PushCupGame_Cup3.png	128x128	杯子类型 3
PushCupGame_Cup4.png	128x128	杯子类型 4
8.5 挠沙发 (sofa) / 捏泡泡 (bubble) 素材
无图片素材，全部使用 NanoVG 程序化渲染。

8.6 未使用 / 参考素材
文件名	说明
KillBugsGame_FlyBugs_0~2.png	早期苍蝇素材 (已被 fly_* 替代)
苍蝇_*.png (多套)	多个迭代版本的苍蝇素材 (参考)
ref.png, ref_left*.png	参考图
推杯子示意图.png	推杯子游戏设计参考
cake_intact_.png, polaroid_.png	蛋糕/拍立得中间迭代素材
9. 渲染管线
9.1 渲染流程
所有游戏画面通过 NanoVG 渲染，绑定在 NanoVGRender 事件上:

NanoVGRender 事件触发
  │
  ├── 菜单状态 → HandleMenuRender()
  │     ├── nvgBeginFrame(vg, physW, physH, 1.0)
  │     ├── nvgScale(vg, dpr, dpr)     ← DPR 缩放
  │     ├── 绘制背景渐变
  │     ├── 绘制章节卡片 (当前页 ± 1)
  │     ├── 绘制关卡文字标签
  │     └── nvgEndFrame(vg)
  │
  └── 游戏状态 → HandleGameRender()
        ├── nvgBeginFrame(vg, physW, physH, 1.0)
        ├── nvgScale(vg, dpr, dpr)     ← DPR 缩放
        ├── nvgTranslate(shakeX, shakeY)  ← 震动偏移
        ├── game.drawScene(ctx, sw, sh)   ← 游戏场景
        ├── 绘制操作提示气泡 (如果活跃)
        ├── settlement 覆盖层 (如果结算中)
        │     ├── 成功: 拍立得照片 + 白框
        │     └── 失败: 手掌动画 (grab/pinch)
        └── nvgEndFrame(vg)
9.2 DPR 缩放策略
采用 模式 B (系统逻辑分辨率):

lua

复制
local physW = graphics:GetWidth()
local physH = graphics:GetHeight()
local dpr   = graphics:GetDPR()
local sw    = physW / dpr   -- 逻辑宽度
local sh    = physH / dpr   -- 逻辑高度

-- NanoVG 使用物理分辨率开帧，然后缩放到逻辑坐标
nvgBeginFrame(vg, physW, physH, 1.0)
nvgScale(vg, dpr, dpr)
-- 后续所有绘制使用逻辑坐标 (sw x sh)
9.3 图片渲染最佳实践
lua

复制
-- 统一缩放 (保持原始比例)
local scale = targetWidth / imageWidth
local dispW = imageWidth * scale
local dispH = imageHeight * scale

-- NanoVG 图片绘制五步法
local paint = nvgImagePattern(ctx, x, y, dispW, dispH, 0, image, 1.0)
nvgBeginPath(ctx)
nvgRect(ctx, x, y, dispW, dispH)  -- 必须与 pattern 区域精确匹配!
nvgFillPaint(ctx, paint)
nvgFill(ctx)
关键陷阱: nvgRect 的区域必须与 nvgImagePattern 完全一致，否则图片会平铺 (tile)。

9.4 Cover 模式背景
lua

复制
-- 背景图铺满屏幕 (裁剪超出部分)
local scaleX = screenW / imgW
local scaleY = screenH / imgH
local scale  = math.max(scaleX, scaleY)  -- 取大值 = cover
local drawW  = imgW * scale
local drawH  = imgH * scale
local drawX  = (screenW - drawW) / 2     -- 水平居中
local drawY  = (screenH - drawH) / 2     -- 垂直居中
10. 输入系统
10.1 输入分发架构
鼠标/触摸事件
  ├── MouseButtonDown / TouchBegin
  │     ├── inputType == "click"  → game.onClick(logicalX, logicalY)
  │     └── inputType == "swipe"  → 记录起始点
  │
  ├── MouseMove / TouchMove
  │     └── inputType == "swipe" && 按下中
  │           → game.onSwipeMove(lastX, lastY, currentX, currentY)
  │           → 更新 lastX/lastY
  │
  └── MouseButtonUp / TouchEnd
        └── 清除按下状态
10.2 坐标转换
所有输入坐标经过 PhysToLogical() 转换:

lua

复制
function PhysToLogical(px, py)
    return px / shared.dpr, py / shared.dpr
end
10.3 两种输入模式
Click 模式 (inputType = "click"):

用于: fly (打苍蝇), bubble (捏泡泡)
行为: 每次按下立即触发 onClick(x, y)
支持多点触摸 (TouchBegin 可多次触发)
Swipe 模式 (inputType = "swipe"):

用于: sofa (挠沙发), paper (扒拉厕纸), cup (推杯子)
行为: 按下记录起点，移动过程中持续触发 onSwipeMove(x1, y1, x2, y2)
(x1, y1) 为上一帧位置，(x2, y2) 为当前位置
11. 结算系统
11.1 胜利结算
流程:

OnGameSuccess()
  ├── 设置结算状态标记
  ├── 解锁下一关 (locked → unlocked)
  ├── 当前关标记为 cleared
  └── 订阅点击返回菜单

结算动画 (2秒)
  ├── 0 ~ 0.3s: 白色渐显遮罩
  ├── 0.3 ~ 1.5s: 拍立得照片从上方滑入
  │     ├── 白色相框 (带阴影)
  │     └── game.drawSuccessPhoto() ← 游戏模块绘制照片内容
  └── 1.5s+: 底部"点击继续"文字闪烁
拍立得照片: 白色矩形相框，内嵌游戏模块提供的照片内容 (静态图片或程序化绘制)。

11.2 失败结算
两种失败动画风格:

grab (从下方抓住)
适用于: fly, cup, bubble

动画序列:
  ├── 0 ~ 1.0s: 手掌从屏幕底部升起
  │     └── 程序化绘制: 手掌 + 5 根手指 (肤色)
  ├── 1.0 ~ 1.5s: 手指合拢 (抓住动作)
  └── 2.5s: 自动返回菜单
pinch (被捏后颈)
适用于: sofa, paper

动画序列:
  ├── 0 ~ 0.8s: 手从屏幕上方伸入
  │     └── 拇指 + 食指 捏合姿态
  ├── 0.8 ~ 2.0s: 整个画面旋转 (模拟被提起)
  │     └── nvgRotate 绕屏幕顶部中心旋转
  └── 2.5s: 自动返回菜单
11.3 结算状态字段
lua

复制
shared.settlement = {
    active    = false,    -- 是否处于结算状态
    success   = false,    -- 成功/失败
    timer     = 0,        -- 动画计时器
    -- 成功专用
    photoAlpha = 0,       -- 照片透明度
    photoY     = -200,    -- 照片 Y 坐标 (滑入动画)
    -- 失败专用
    handY      = 0,       -- 手掌 Y 坐标
    fingerClose = 0,      -- 手指合拢程度 (0~1)
    shakeAngle  = 0,      -- pinch 模式的旋转角度
}
附录: 技术备忘
A. NanoVG 图片渲染注意事项
nvgCreateImage() 只在 init() 中调用一次
nvgImageSize() 获取原始尺寸
nvgImagePattern 的区域 = nvgRect 的区域 (否则平铺)
使用统一缩放因子 (scale = targetW / imgW)，不要分别缩放 X/Y
B. 程序化 vs 图片渲染
游戏	渲染方式	原因
fly	图片	苍蝇有精灵动画帧，背景需要照片级画面
sofa	程序化	沙发破损效果需要动态生成 (划痕、撕裂)
paper	图片	纸巾链需要真实纹理，纸堆需要立体感
cup	图片	透视桌面 + 不同杯型需要美术差异
bubble	程序化	气泡是简单圆形渐变，规则网格适合程序生成
C. 屏幕震动
部分游戏模块实现 getShake() 返回偏移量:

paper: 强力滑动时触发震动
其他模块: 返回 0, 0
震动通过 nvgTranslate 应用于整个场景