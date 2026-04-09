// 游戏管理器 - 管理游戏流程和状态

// 打苍蝇游戏实现
window.FlyHunterGame = (function() {
    // 苍蝇图片路径 - 使用新的美术资源
    var FLY_FRAMES = [
        'assets/KillBugsGame_FlyBugs_0.png',
        'assets/KillBugsGame_FlyBugs_1.png',
        'assets/KillBugsGame_FlyBugs_2.png'
    ];
    // 使用第一帧作为静止帧（没有单独的 idle 图片）
    var FLY_IDLE = 'assets/KillBugsGame_FlyBugs_0.png';
    
    // 游戏背景
    var GAME_BG = 'assets/cake_on_table_bg.png';
    
    // 猫手素材（用于拍击特效）
    var CAT_HAND = 'assets/TissueGame_Cat_Hand.png';

    // 苍蝇状态
    var FLY_STATE = {
        MOVING: 'moving',
        RESTING: 'resting'
    };
    
    // 苍蝇行为模式
    var FLY_BEHAVIOR = {
        WANDER: 'wander',      // 随机游荡
        JITTER: 'jitter',      // 抖动（突然变向）
        CIRCLE: 'circle',      // 盘旋
        DASH: 'dash'           // 冲刺
    };

    function FlyHunterGame(gameArea, onComplete) {
        this.gameArea = gameArea;
        this.onComplete = onComplete;
        this.flies = [];
        this.score = 0;
        this.target = 0;
        this.isHardMode = false;
        this.spawnInterval = null;
        this.updateInterval = null;
        this.isActive = false;
    }

    FlyHunterGame.prototype.start = function(isHardMode, progressDisplayEl) {
        var self = this;
        this.isHardMode = isHardMode;
        this.isActive = true;
        this.score = 0;
        this.target = isHardMode ? 8 : 5;
        this.progressDisplayEl = progressDisplayEl;
        this.updateProgress();

        // 设置游戏背景
        this.gameArea.style.backgroundImage = 'url(' + GAME_BG + ')';
        this.gameArea.style.backgroundSize = 'cover';
        this.gameArea.style.backgroundPosition = 'center';

        // 初始生成 3 只苍蝇
        for (var i = 0; i < 3; i++) {
            this.spawnFly();
        }

        // 定时生成新苍蝇
        this.spawnInterval = setInterval(function() {
            if (self.isActive && self.flies.length < 6) {
                self.spawnFly();
            }
        }, isHardMode ? 800 : 1200);

        // 游戏循环 - 更新苍蝇状态
        this.updateInterval = setInterval(function() {
            self.updateFlies();
        }, 50); // 每 50ms 更新一次
    };

    FlyHunterGame.prototype.spawnFly = function() {
        var self = this;
        var fly = document.createElement('div');
        fly.className = 'fly';
        
        // 创建苍蝇图片，使用 idle 图片作为初始状态
        var flyImg = document.createElement('img');
        flyImg.src = FLY_IDLE;
        flyImg.alt = '苍蝇';
        flyImg.draggable = false;
        flyImg.style.width = '72px';
        flyImg.style.height = '72px';
        fly.innerHTML = '';
        fly.appendChild(flyImg);

        var pos = Utils.getRandomPosition(this.gameArea);
        fly.style.left = pos.x + 'px';
        fly.style.top = pos.y + 'px';
        fly.style.transition = 'none'; // 初始无过渡

        // 苍蝇数据
        var flyData = {
            element: fly,
            imgElement: flyImg,
            x: pos.x,
            y: pos.y,
            state: FLY_STATE.RESTING,
            direction: this.getRandomDirection(),
            baseSpeed: this.isHardMode ? 10 : 7, // 基础速度（像素/帧）
            speed: this.isHardMode ? 10 : 7, // 当前速度（像素/帧）
            restTime: 0,
            restDuration: this.isHardMode ? 300 + Math.random() * 400 : 600 + Math.random() * 600, // 停留时间（毫秒）
            moveTime: 0,
            moveDuration: this.isHardMode ? 600 + Math.random() * 800 : 1000 + Math.random() * 1000, // 移动持续时间（毫秒）
            frameIndex: 0,
            frameTimer: 0,
            rotation: 0, // 苍蝇旋转角度（弧度）
            // 行为相关
            behavior: FLY_BEHAVIOR.WANDER,
            behaviorTimer: 0,
            behaviorDuration: 500 + Math.random() * 1000, // 行为持续时间
            turnAngle: 0, // 当前转向角度（弧度）
            turnSpeed: 0.1 + Math.random() * 0.1, // 转向速度
            jitterTimer: 0
        };

        // 点击事件
        var clickHandler = function(e) {
            e.stopPropagation();
            if (!self.isActive) return;

            // 消灭苍蝇
            self.score++;
            self.updateProgress();
            Utils.playSound('tap');
            Utils.vibrate(30);

            // 爪印特效
            if (window.PawInput && window.PawInput.addEffect) {
                var rect = fly.getBoundingClientRect();
                window.PawInput.addEffect(rect.left + rect.width / 2, rect.top + rect.height / 2, 'tap');
            }

            // 移除苍蝇
            fly.remove();
            self.flies = self.flies.filter(function(f) { return f !== flyData; });

            // 检查胜利
            if (self.score >= self.target) {
                self.isActive = false;
                self.cleanup();
                self.onComplete(true);
            }
        };

        fly.addEventListener('click', clickHandler);
        fly.addEventListener('touchstart', clickHandler);

        this.gameArea.appendChild(fly);
        this.flies.push(flyData);
    };

    FlyHunterGame.prototype.getRandomDirection = function() {
        var angle = Math.random() * Math.PI * 2;
        return {
            x: Math.cos(angle),
            y: Math.sin(angle)
        };
    };
    
    // 更新苍蝇行为（更逼真的飞行轨迹）
    FlyHunterGame.prototype.updateFlyBehavior = function(flyData, deltaTime) {
        // 行为计时器
        flyData.behaviorTimer += deltaTime;
        if (flyData.behaviorTimer >= flyData.behaviorDuration) {
            // 切换新行为
            flyData.behaviorTimer = 0;
            flyData.behaviorDuration = 300 + Math.random() * 1200;
            
            // 根据概率选择行为
            var rand = Math.random();
            if (rand < 0.5) {
                flyData.behavior = FLY_BEHAVIOR.WANDER;
            } else if (rand < 0.7) {
                flyData.behavior = FLY_BEHAVIOR.JITTER;
            } else if (rand < 0.85) {
                flyData.behavior = FLY_BEHAVIOR.CIRCLE;
            } else {
                flyData.behavior = FLY_BEHAVIOR.DASH;
            }
        }
        
        // 根据行为调整飞行参数
        switch (flyData.behavior) {
            case FLY_BEHAVIOR.WANDER:
                // 随机游荡：平滑转向
                flyData.turnAngle += (Math.random() - 0.5) * 0.3; // 小幅度随机转向
                flyData.direction = {
                    x: Math.cos(flyData.turnAngle),
                    y: Math.sin(flyData.turnAngle)
                };
                flyData.speed = flyData.baseSpeed * (0.6 + Math.random() * 0.4); // 速度波动
                break;
                
            case FLY_BEHAVIOR.JITTER:
                // 抖动：突然改变方向
                flyData.jitterTimer += deltaTime;
                if (flyData.jitterTimer >= 100) { // 每 100ms 抖动一次
                    flyData.jitterTimer = 0;
                    flyData.turnAngle += (Math.random() - 0.5) * Math.PI; // 大幅度转向
                    flyData.direction = {
                        x: Math.cos(flyData.turnAngle),
                        y: Math.sin(flyData.turnAngle)
                    };
                }
                flyData.speed = flyData.baseSpeed * 1.2; // 稍快速度
                break;
                
            case FLY_BEHAVIOR.CIRCLE:
                // 盘旋：绕圈飞行
                flyData.turnAngle += 0.15; // 固定角速度
                flyData.direction = {
                    x: Math.cos(flyData.turnAngle),
                    y: Math.sin(flyData.turnAngle)
                };
                flyData.speed = flyData.baseSpeed * 0.8; // 较慢速度
                break;
                
            case FLY_BEHAVIOR.DASH:
                // 冲刺：直线快速飞行
                flyData.speed = flyData.baseSpeed * 2.5; // 快速
                // 方向基本保持不变，只加一点扰动
                flyData.turnAngle += (Math.random() - 0.5) * 0.1;
                flyData.direction = {
                    x: Math.cos(flyData.turnAngle),
                    y: Math.sin(flyData.turnAngle)
                };
                break;
        }
    };

    FlyHunterGame.prototype.updateFlies = function() {
        var deltaTime = 50; // 50ms per frame

        for (var i = 0; i < this.flies.length; i++) {
            var flyData = this.flies[i];
            var fly = flyData.element;
            var flyImg = flyData.imgElement;

            // 更新动画帧
            flyData.frameTimer += deltaTime;
            if (flyData.frameTimer >= 100) { // 每 100ms 切换一帧
                flyData.frameTimer = 0;
                if (flyData.state === FLY_STATE.MOVING) {
                    // 移动时使用飞行动画帧
                    flyData.frameIndex = (flyData.frameIndex + 1) % FLY_FRAMES.length;
                    flyImg.src = FLY_FRAMES[flyData.frameIndex];
                } else {
                    // 停留时使用 idle 图片
                    flyImg.src = FLY_IDLE;
                }
            }

            if (flyData.state === FLY_STATE.RESTING) {
                // 停留状态
                flyData.restTime += deltaTime;
                if (flyData.restTime >= flyData.restDuration) {
                    // 停留结束，开始移动
                    flyData.state = FLY_STATE.MOVING;
                    flyData.turnAngle = Math.atan2(flyData.direction.y, flyData.direction.x);
                    flyData.moveTime = 0;
                    fly.style.transition = 'none';
                }
            } else if (flyData.state === FLY_STATE.MOVING) {
                // 移动状态 - 使用更逼真的飞行行为
                flyData.moveTime += deltaTime;
                
                // 更新行为（转向、速度变化等）
                this.updateFlyBehavior(flyData, deltaTime);
                
                // 应用移动
                flyData.x += flyData.direction.x * flyData.speed;
                flyData.y += flyData.direction.y * flyData.speed;

                // 检查边界，碰到边界反弹
                var maxX = this.gameArea.clientWidth - 40;
                var maxY = this.gameArea.clientHeight - 40;

                if (flyData.x <= 0 || flyData.x >= maxX) {
                    flyData.direction.x *= -1;
                    flyData.turnAngle = Math.atan2(flyData.direction.y, flyData.direction.x);
                    flyData.x = Math.max(0, Math.min(flyData.x, maxX));
                }
                if (flyData.y <= 0 || flyData.y >= maxY) {
                    flyData.direction.y *= -1;
                    flyData.turnAngle = Math.atan2(flyData.direction.y, flyData.direction.x);
                    flyData.y = Math.max(0, Math.min(flyData.y, maxY));
                }

                fly.style.left = flyData.x + 'px';
                fly.style.top = flyData.y + 'px';
                // 锁定图片旋转，只根据飞行方向进行水平翻转
                // 苍蝇默认朝上飞行，当 direction.x < 0 时向左翻转
                var scaleX = flyData.direction.x < 0 ? -1 : 1;
                flyImg.style.transform = 'scaleX(' + scaleX + ')';

                // 检查移动时间是否结束
                if (flyData.moveTime >= flyData.moveDuration) {
                    // 移动结束，开始停留
                    flyData.state = FLY_STATE.RESTING;
                    flyData.restTime = 0;
                    // 重置行为
                    flyData.behavior = FLY_BEHAVIOR.WANDER;
                    flyData.behaviorTimer = 0;
                }
            }
        }
    };

    FlyHunterGame.prototype.updateProgress = function() {
        if (this.progressDisplayEl) {
            this.progressDisplayEl.textContent = '已消灭：' + this.score + '/' + this.target;
        }
    };

    FlyHunterGame.prototype.cleanup = function() {
        this.isActive = false;
        if (this.spawnInterval) clearInterval(this.spawnInterval);
        if (this.updateInterval) clearInterval(this.updateInterval);

        // 清理背景
        this.gameArea.style.backgroundImage = '';
        this.gameArea.style.backgroundSize = '';
        this.gameArea.style.backgroundPosition = '';

        for (var i = 0; i < this.flies.length; i++) {
            this.flies[i].element.remove();
        }
        this.flies = [];
    };

    return FlyHunterGame;
})();

// 破坏大王游戏实现（挠沙发/扒拉厕纸）
window.DestroyerGame = (function() {
    // 沙发 SVG 图片
    var SOFA_SVG = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMTUwIj48cmVjdCB4PSIxMCIgeT0iNTAiIHdpZHRoPSIxODAiIGhlaWdodD0iODAiIHJ4PSIxMCIgZmlsbD0iIzhCNzM1NSIvPjxyZWN0IHg9IjIwIiB5PSIzMCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iNSIgZmlsbD0iIzhCNzM1NSIvPjxyZWN0IHg9IjE0MCIgeT0iMzAiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcng9IjUiIGZpbGw9IiM4QjczNTUiLz48cmVjdCB4PSIzMCIgeT0iNjAiIHdpZHRoPSIxNDAiIGhlaWdodD0iNDAiIHJ4PSI1IiBmaWxsPSIjYTg4NzY3Ii8+PC9zdmc+';
    
    // 厕纸 SVG 图片
    var TOILET_PAPER_SVG = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTUwIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0MCIgZmlsbD0iI2ZmZiIvPjxyZWN0IHg9IjM1IiB5PSI1MCIgd2lkdGg9IjMwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjZmZmIi8+PGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iMTUiIGZpbGw9IiNlZWUiLz48L3N2Zz4=';
    
    // 爪痕 SVG 图片
    var CLAW_MARK_SVG = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MCA1MCI+PHBhdGggZD0iTSAxMCA0MCBMIDIwIDEwIE0gMjUgNDUgTCAyNSAxNSBNIDQwIDQwIEwgMzAgMTAiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLXdpZHRoPSIzIiBzdHJva2UtbGluZWNhcD0icm91bmQiIGZpbGw9Im5vbmUiIG9wYWNpdHk9IjAuOCIvPjwvc3ZnPg==';

    function DestroyerGame(gameArea, onComplete) {
        this.gameArea = gameArea;
        this.onComplete = onComplete;
        this.durability = 80;
        this.maxDurability = 80;
        this.isHardMode = false;
        this.isActive = false;
        this.destroyObjects = [];
        this.clawMarks = [];
        this.lastSwipePos = null;
        this.swipeDistance = 0;
    }

    DestroyerGame.prototype.start = function(isHardMode, progressDisplayEl, objectType) {
        var self = this;
        this.isHardMode = isHardMode;
        this.isActive = true;
        this.durability = this.isHardMode ? 100 : 80;
        this.maxDurability = this.durability;
        this.progressDisplayEl = progressDisplayEl;
        this.objectType = objectType || 'sofa';
        
        this.updateProgress();
        this.createDestroyObject();
        
        // 划动回调由 main.js 中的 pawInput.setCallbacks 统一处理
    };

    DestroyerGame.prototype.createDestroyObject = function() {
        var self = this;
        var obj = document.createElement('div');
        obj.className = 'destroy-object';
        
        if (this.objectType === 'sofa') {
            obj.innerHTML = '<img src="' + SOFA_SVG + '" alt="沙发" draggable="false">';
            obj.style.width = '200px';
            obj.style.height = '150px';
        } else {
            obj.innerHTML = '<img src="' + TOILET_PAPER_SVG + '" alt="厕纸" draggable="false">';
            obj.style.width = '100px';
            obj.style.height = '150px';
        }
        
        obj.style.position = 'absolute';
        obj.style.left = '50%';
        obj.style.top = '50%';
        obj.style.transform = 'translate(-50%, -50%)';
        
        this.gameArea.appendChild(obj);
        this.destroyObject = obj;
    };

    DestroyerGame.prototype.handleSwipe = function(data) {
        if (!this.isActive) {
            console.log('[DestroyerGame] 游戏已结束，忽略划动');
            return;
        }
        
        var self = this;
        
        // 使用 PawInput 传递的 distance 数据
        var distance = data.distance || 0;
        
        // 根据划动距离计算伤害
        // 设计目标：10 秒内需要划动至少 10 下才能通关
        // 普通模式：80 耐久度，每下平均需要造成 8 点伤害
        // 困难模式：100 耐久度，每下平均需要造成 10 点伤害
        // 公式：伤害 = floor(距离 / 2.5)，即 20 像素划动造成 8 点伤害
        var damage = Math.floor(distance / 2.5);
        if (this.isHardMode) {
            damage = Math.floor(damage * 0.8); // 高难度伤害降低 20%
        }
        
        console.log('[DestroyerGame] 划动伤害:', damage, '剩余耐久度:', this.durability);
        
        if (damage > 0) {
            this.durability = Math.max(0, this.durability - damage);
            this.updateProgress();
            
            // 添加爪痕特效
            this.addClawMark(data.x, data.y);
            
            // 震动反馈
            if (damage >= 5) {
                Utils.vibrate(30);
            }
            
            // 检查胜利
            if (this.durability <= 0) {
                console.log('[DestroyerGame] 耐久度归零，触发胜利');
                this.isActive = false;
                this.showDestroyEffect();
                setTimeout(function() {
                    console.log('[DestroyerGame] 调用 onComplete 回调');
                    self.onComplete(true);
                }, 500);
            }
        }
    };

    DestroyerGame.prototype.addClawMark = function(x, y) {
        var mark = document.createElement('div');
        mark.className = 'claw-mark';
        mark.innerHTML = '<img src="' + CLAW_MARK_SVG + '" alt="爪痕" draggable="false" style="width: 40px; height: 40px; opacity: 0.8;">';
        mark.style.position = 'absolute';
        mark.style.left = (x - 20) + 'px';
        mark.style.top = (y - 20) + 'px';
        mark.style.transform = 'rotate(' + (Math.random() * 360) + 'deg)';
        mark.style.pointerEvents = 'none';
        
        this.gameArea.appendChild(mark);
        this.clawMarks.push(mark);
    };

    DestroyerGame.prototype.showDestroyEffect = function() {
        // 显示破坏完成效果
        if (this.destroyObject) {
            this.destroyObject.style.opacity = '0.5';
            this.destroyObject.style.filter = 'grayscale(100%)';
        }
        
        // 添加更多爪痕
        for (var i = 0; i < 10; i++) {
            var rect = this.gameArea.getBoundingClientRect();
            var x = Math.random() * rect.width;
            var y = Math.random() * rect.height;
            this.addClawMark(x, y);
        }
    };

    DestroyerGame.prototype.updateProgress = function() {
        if (this.progressDisplayEl) {
            var percent = Math.floor((this.durability / this.maxDurability) * 100);
            this.progressDisplayEl.textContent = '耐久度：' + this.durability + '/' + this.maxDurability + ' (' + percent + '%)';
        }
    };

    DestroyerGame.prototype.cleanup = function() {
        this.isActive = false;
        
        // 清理爪痕
        for (var i = 0; i < this.clawMarks.length; i++) {
            this.clawMarks[i].remove();
        }
        this.clawMarks = [];
        
        // 清理破坏对象
        if (this.destroyObject) {
            this.destroyObject.remove();
            this.destroyObject = null;
        }
        
        this.lastSwipePos = null;
    };

    return DestroyerGame;
})();

// 拉卷纸游戏实现（扒拉卷纸）
window.ToiletPaperGame = (function() {
    // 卷纸 SVG 图片
    var TOILET_PAPER_SVG = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMjAgMTgwIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9InBhcGVyR3JhZCIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6I2ZmZmZmZiIvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3R5bGU9InN0b3AtY29sb3I6I2ZmZmZlMCIvPjwvbGluZWFyR3JhZGllbnQ+PGxpbmVhckdyYWRpZW50IGlkPSJjb3JlR3JhZCIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNlMGUwZTAiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNmMGYwZjAiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB4PSIxMCIgeT0iMjAiIHdpZHRoPSIxMDAiIGhlaWdodD0iMTQwIiByeD0iNSIgZmlsbD0idXJsKCNwYXBlckdyYWQpIiBzdHJva2U9IiNjY2MiIHN0cm9rZS13aWR0aD0iMSIvPjxyZWN0IHg9IjM1IiB5PSIyMCIgd2lkdGg9IjUwIiBoZWlnaHQ9IjE0MCIgcng9IjMiIGZpbGw9InVybCgjY29yZUdyYWQpIiBvcGFjaXR5PSIwLjUiLz48Y2lyY2xlIGN4PSI2MCIgY3k9IjQwIiByPSIxNSIgZmlsbD0iI2ZmZiIgc3Ryb2tlPSIjY2NjIiBzdHJva2Utd2lkdGg9IjIiLz48cGF0aCBkPSJNIDIwIDIwIEwgMjAgMTYwIEwgMTIwIDE2MCBMIDEyMCAyMCBaIiBmaWxsPSJub25lIiBzdHJva2U9IiNjY2MiIHN0cm9rZS13aWR0aD0iMSIgb3BhY2l0eT0iMC4zIi8+PHBhdGggZD0iTSAyMCA2MCBMIDEyMCA2MCBNIDIwIDEwMCBMIDEyMCAxMDAgTSAyMCAxNDAgTCAxMjAgMTQwIiBzdHJva2U9IiNjY2MiIHN0cm9rZS13aWR0aD0iMSIgb3BhY2l0eT0iMC4yIi8+PC9zdmc+';
    
    // 撕裂效果 SVG
    var TEAR_SVG = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMjAiPjxwYXRoIGQ9Ik0gMCAxMCBMIDEwIDUgTCAyMCAxNSBMIDMwIDUgTCA0MCAxNSBMIDUwIDUgTCA2MCAxNSBMIDcwIDUgTCA4MCAxNSBMIDkwIDUgTCAxMDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI2NjYyIgc3Ryb2tlLXdpZHRoPSIxIiBzdHJva2UtZGFzaGFycmF5PSIzLDMiLz48L3N2Zz4=';

    function ToiletPaperGame(gameArea, onComplete) {
        this.gameArea = gameArea;
        this.onComplete = onComplete;
        this.durability = 80;
        this.maxDurability = 80;
        this.isHardMode = false;
        this.isActive = false;
        this.paperHeight = 180; // 卷纸初始高度（像素）
        this.minPaperHeight = 40; // 卷纸最小高度
        this.stretchOffset = 0; // 拉伸偏移量
        this.isStretching = false;
        this.stretchStartTime = 0;
        this.lastSwipeY = 0;
        this.tearEffects = [];
    }

    ToiletPaperGame.prototype.start = function(isHardMode, progressDisplayEl) {
        var self = this;
        this.isHardMode = isHardMode;
        this.isActive = true;
        this.durability = this.isHardMode ? 100 : 80;
        this.maxDurability = this.durability;
        this.progressDisplayEl = progressDisplayEl;
        this.paperHeight = this.isHardMode ? 200 : 180;
        
        this.updateProgress();
        this.createToiletPaper();
    };

    ToiletPaperGame.prototype.createToiletPaper = function() {
        var self = this;
        var paper = document.createElement('div');
        paper.className = 'toilet-paper';
        paper.innerHTML = '<img src="' + TOILET_PAPER_SVG + '" alt="卷纸" draggable="false" style="width: 120px; height: ' + this.paperHeight + 'px; object-fit: fill;">';
        paper.style.position = 'absolute';
        paper.style.left = '50%';
        paper.style.top = '50px';
        paper.style.transform = 'translateX(-50%)';
        paper.style.transition = 'height 0.1s ease-out';
        
        this.gameArea.appendChild(paper);
        this.paperElement = paper;
        this.paperImgElement = paper.querySelector('img');
    };

    ToiletPaperGame.prototype.handleSwipe = function(data) {
        if (!this.isActive) {
            console.log('[ToiletPaperGame] 游戏已结束，忽略划动');
            return;
        }
        
        var self = this;
        
        // 只处理向下划动：dy > 0 且 |dy| > |dx|
        if (data.dy <= 0 || Math.abs(data.dy) <= Math.abs(data.dx)) {
            console.log('[ToiletPaperGame] 忽略非向下划动：dy=' + data.dy + ', dx=' + data.dx);
            return;
        }
        
        // 使用 PawInput 传递的 distance 数据
        var distance = data.distance || 0;
        
        // 根据划动距离计算伤害
        // 设计目标：10 秒内需要划动至少 10 下才能通关
        // 普通模式：80 耐久度，每下平均需要造成 8 点伤害
        // 困难模式：100 耐久度，每下平均需要造成 10 点伤害
        // 公式：伤害 = floor(距离 / 2.5)，即 20 像素划动造成 8 点伤害
        var damage = Math.floor(distance / 2.5);
        if (this.isHardMode) {
            damage = Math.floor(damage * 0.8); // 高难度伤害降低 20%
        }
        
        console.log('[ToiletPaperGame] 划动伤害:', damage, '剩余耐久度:', this.durability, '划动距离:', distance);
        
        if (damage > 0) {
            this.durability = Math.max(0, this.durability - damage);
            this.updateProgress();
            
            // 更新卷纸视觉表现
            this.updatePaperVisuals(distance, data.y);
            
            // 震动反馈
            if (damage >= 5) {
                Utils.vibrate(30);
            }
            
            // 检查胜利
            if (this.durability <= 0) {
                console.log('[ToiletPaperGame] 耐久度归零，触发胜利');
                this.isActive = false;
                this.showDestroyEffect();
                setTimeout(function() {
                    console.log('[ToiletPaperGame] 调用 onComplete 回调');
                    self.onComplete(true);
                }, 500);
            }
        }
    };

    ToiletPaperGame.prototype.updatePaperVisuals = function(swipeDistance, swipeY) {
        // 计算卷纸剩余高度比例
        var heightRatio = this.durability / this.maxDurability;
        var targetHeight = this.minPaperHeight + (this.paperHeight - this.minPaperHeight) * heightRatio;
        
        // 更新卷纸高度
        if (this.paperImgElement) {
            this.paperImgElement.style.height = targetHeight + 'px';
        }
        
        // 拉伸效果：当向下划动时，卷纸底部跟随手指拉伸
        if (swipeDistance > 30) {
            this.stretchOffset = Math.min(swipeDistance * 0.3, 30); // 最大拉伸 30 像素
            if (this.paperElement) {
                this.paperElement.style.transform = 'translateX(-50%) scaleY(' + (1 + this.stretchOffset / 100) + ')';
            }
            
            // 0.3 秒后恢复
            var self = this;
            setTimeout(function() {
                if (self.paperElement && self.isActive) {
                    self.paperElement.style.transform = 'translateX(-50%) scaleY(1)';
                }
                self.stretchOffset = 0;
            }, 300);
        }
        
        // 低耐久度时添加撕裂效果
        if (this.durability < this.maxDurability * 0.3 && this.durability > 0) {
            this.addTearEffect();
        }
    };

    ToiletPaperGame.prototype.addTearEffect = function() {
        // 限制撕裂效果数量
        if (this.tearEffects.length >= 5) {
            return;
        }
        
        var tear = document.createElement('div');
        tear.className = 'tear-effect';
        tear.innerHTML = '<img src="' + TEAR_SVG + '" alt="撕裂" draggable="false" style="width: 80px; height: 20px; opacity: 0.6;">';
        tear.style.position = 'absolute';
        tear.style.left = (50 + (Math.random() - 0.5) * 40) + '%';
        tear.style.top = (50 + this.paperHeight / 2 + Math.random() * 30) + 'px';
        tear.style.transform = 'translateX(-50%) rotate(' + (Math.random() * 60 - 30) + 'deg)';
        tear.style.pointerEvents = 'none';
        
        this.gameArea.appendChild(tear);
        this.tearEffects.push(tear);
        
        // 2 秒后移除
        var self = this;
        setTimeout(function() {
            if (tear && tear.parentNode) {
                tear.remove();
            }
            self.tearEffects = self.tearEffects.filter(function(t) { return t !== tear; });
        }, 2000);
    };

    ToiletPaperGame.prototype.showDestroyEffect = function() {
        // 显示破坏完成效果 - 卷纸散落
        if (this.paperElement) {
            this.paperElement.style.opacity = '0.5';
            this.paperElement.style.filter = 'grayscale(100%)';
        }
        
        // 添加更多撕裂效果
        for (var i = 0; i < 8; i++) {
            this.addTearEffect();
        }
    };

    ToiletPaperGame.prototype.updateProgress = function() {
        if (this.progressDisplayEl) {
            var percent = Math.floor((this.durability / this.maxDurability) * 100);
            this.progressDisplayEl.textContent = '卷纸耐久：' + this.durability + '/' + this.maxDurability + ' (' + percent + '%)';
        }
    };

    ToiletPaperGame.prototype.cleanup = function() {
        this.isActive = false;
        
        // 清理撕裂效果
        for (var i = 0; i < this.tearEffects.length; i++) {
            this.tearEffects[i].remove();
        }
        this.tearEffects = [];
        
        // 清理卷纸
        if (this.paperElement) {
            this.paperElement.remove();
            this.paperElement = null;
            this.paperImgElement = null;
        }
    };

    return ToiletPaperGame;
})();

// 游戏管理器 - 管理游戏流程和状态

window.GameManager = (function() {
    // 游戏类型图标映射
    var GAME_ICONS = {
        'fly': '🪰',
        'sofa': '🛋️',
        'paper': '🧻',
        'cup': '🥤',
        'bubble': '🫧'
    };
    
    function GameManager() {
        this.currentGame = null;
        this.currentLevel = null;
        this.timer = null;
        this.timeLeft = 10000;
        this.startTime = 0;
        
        // 关卡配置从 levels.json 加载
        this.levels = [];
        this.chapters = [];
        
        // 玩家进度
        this.playerProgress = Utils.storage.get('playerProgress', {
            unlockedLevels: [1],
            completedLevels: [],
            currentChapter: 1
        });
    }
    
    // 从 levels.json 加载关卡配置
    GameManager.prototype.loadLevelsConfig = function() {
        var self = this;
        return new Promise(function(resolve, reject) {
            fetch('data/levels.json')
                .then(function(response) { return response.json(); })
                .then(function(data) {
                    self.levels = data.levels || [];
                    self.chapters = data.chapters || [];
                    console.log('[GameManager] 加载关卡配置：', self.levels.length, '个关卡');
                    resolve();
                })
                .catch(function(error) {
                    console.error('[GameManager] 加载关卡配置失败:', error);
                    // 使用默认配置
                    self.levels = [];
                    self.chapters = [];
                    resolve();
                });
        });
    };
    
    GameManager.prototype.init = function() {
        var self = this;
        this.setupUI();
        
        // 加载关卡配置
        this.loadLevelsConfig().then(function() {
            self.renderShoppingList();
        });
    };
    
    GameManager.prototype.setupUI = function() {
        var self = this;
        
        // 屏幕元素
        this.shoppingListScreen = document.getElementById('shopping-list');
        this.gameScreen = document.getElementById('game-screen');
        this.successScreen = document.getElementById('success-screen');
        this.failScreen = document.getElementById('fail-screen');
        
        // 游戏区域
        this.gameArea = document.getElementById('game-area');
        this.instructionEl = document.getElementById('instruction');
        this.timerFillEl = document.getElementById('timer-fill');
        this.progressDisplayEl = document.getElementById('progress-display');
        
        // 绑定刷新按钮点击
        var refreshBtn = document.getElementById('refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', function() {
                self.resetProgress();
            });
        }
        
        // 绑定成功界面点击
        this.successScreen.addEventListener('click', function() {
            self.showScreen('shopping-list');
            self.renderShoppingList();
        });
        
        // 绑定失败界面点击
        this.failScreen.addEventListener('click', function() {
            self.showScreen('shopping-list');
            self.renderShoppingList();
        });
    };
    
    GameManager.prototype.showScreen = function(screenName) {
        var screens = {
            'shopping-list': this.shoppingListScreen,
            'game': this.gameScreen,
            'success': this.successScreen,
            'fail': this.failScreen
        };
        
        for (var key in screens) {
            if (screens[key]) {
                screens[key].classList.remove('active');
            }
        }
        
        if (screens[screenName]) {
            screens[screenName].classList.add('active');
        }
    };
    
    GameManager.prototype.renderShoppingList = function() {
        var container = document.getElementById('list-container');
        if (!container) return;
        
        container.innerHTML = '';
        
        var self = this;
        
        if (this.levels.length === 0) {
            container.innerHTML = '<div class="empty-message">加载中...</div>';
            return;
        }
        
        this.levels.forEach(function(level) {
            var item = document.createElement('div');
            item.className = 'list-item';
            
            var isUnlocked = self.playerProgress.unlockedLevels.indexOf(level.id) !== -1;
            var isCompleted = self.playerProgress.completedLevels.indexOf(level.id) !== -1;
            var difficulty = level.difficulty || 1;
            var isHardMode = difficulty >= 2;
            var isExpertMode = difficulty === 3;
            
            if (!isUnlocked) {
                item.classList.add('locked');
            }
            if (isCompleted) {
                item.classList.add('completed');
            }
            if (isHardMode) {
                item.classList.add('hard-mode');
            }
            if (isExpertMode) {
                item.classList.add('expert-mode');
            }
            
            // 获取游戏类型图标
            var gameIcon = GAME_ICONS[level.gameType] || GAME_ICONS[level.type] || '🎮';
            var difficultyText = isExpertMode ? '（专家）' : (isHardMode ? '（困难）' : '');
            
            item.innerHTML = '<div class="item-text">' + gameIcon + ' ' + level.name + '</div>' +
                            '<div class="item-difficulty">' + level.listText + difficultyText + '</div>';
            
            if (isUnlocked && !isCompleted) {
                item.addEventListener('click', function() {
                    self.startLevel(level);
                });
            }
            
            container.appendChild(item);
        });
    };
    
    GameManager.prototype.startLevel = function(level) {
        var self = this;
        this.currentLevel = level;
        this.showScreen('game');
        
        // 设置指令
        this.instructionEl.textContent = level.instruction || level.name;
        
        // 重置进度显示
        if (this.progressDisplayEl) {
            this.progressDisplayEl.textContent = '';
        }
        
        // 获取难度配置
        var config = level.config || {};
        var difficulty = level.difficulty || 1;
        
        // 创建游戏实例
        if (level.gameType === 'fly' || level.type === 'fly') {
            this.currentGame = new FlyHunterGame(this.gameArea, function(success) {
                self.onGameComplete(success);
            });
            this.currentGame.start(config, this.progressDisplayEl);
        } else if (level.gameType === 'sofa' || level.type === 'destroy') {
            this.currentGame = new DestroyerGame(this.gameArea, function(success) {
                self.onGameComplete(success);
            });
            this.currentGame.start(config, this.progressDisplayEl, 'sofa');
        } else if (level.gameType === 'paper' || level.type === 'toiletPaper') {
            this.currentGame = new PaperGame(this.gameArea, function(success) {
                self.onGameComplete(success);
            });
            this.currentGame.start(config, this.progressDisplayEl);
        } else if (level.gameType === 'cup') {
            this.currentGame = new CupGame(this.gameArea, function(success) {
                self.onGameComplete(success);
            });
            this.currentGame.start(config, this.progressDisplayEl);
        } else if (level.gameType === 'bubble') {
            this.currentGame = new BubbleGame(this.gameArea, function(success) {
                self.onGameComplete(success);
            });
            this.currentGame.start(config, this.progressDisplayEl);
        }
        
        // 启动计时器
        var timeLimit = (config && config.timeLimit) ? config.timeLimit * 1000 : 10000;
        this.startTimer(timeLimit);
    };
    
    GameManager.prototype.startTimer = function(duration) {
        var self = this;
        duration = duration || 10000; // 默认 10 秒
        this.timeLeft = duration;
        this.startTime = Date.now();
        
        this.timer = setInterval(function() {
            var elapsed = Date.now() - self.startTime;
            self.timeLeft = Math.max(0, duration - elapsed);
            
            // 更新计时器 UI
            if (self.timerFillEl) {
                var percent = (self.timeLeft / duration) * 100;
                self.timerFillEl.style.width = percent + '%';
            }
            
            if (self.timeLeft <= 0) {
                self.onGameComplete(false);
            }
        }, 50);
    };
    
    GameManager.prototype.stopTimer = function() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    };
    
    GameManager.prototype.onGameComplete = function(success) {
        this.stopTimer();
        
        // 清理当前游戏
        if (this.currentGame) {
            this.currentGame.cleanup();
            this.currentGame = null;
        }
        
        if (success) {
            // 成功
            Utils.playSound('success');
            this.showSuccessScreen();
            
            // 更新进度
            if (this.playerProgress.completedLevels.indexOf(this.currentLevel.id) === -1) {
                this.playerProgress.completedLevels.push(this.currentLevel.id);
                Utils.storage.set('playerProgress', this.playerProgress);
            }
            
            // 检查解锁新关卡
            this.checkUnlocks();
        } else {
            // 失败
            Utils.playSound('fail');
            this.showFailScreen();
        }
    };
    
    GameManager.prototype.showSuccessScreen = function() {
        var imageEl = document.getElementById('success-image');
        var captionEl = document.getElementById('success-caption');
        
        var gameType = this.currentLevel.gameType || this.currentLevel.type;
        
        if (gameType === 'fly') {
            imageEl.textContent = '🪰💥';
            captionEl.textContent = '苍蝇全灭！';
        } else if (gameType === 'sofa') {
            imageEl.textContent = '🛋️💥';
            captionEl.textContent = '沙发报废！';
        } else if (gameType === 'paper') {
            imageEl.textContent = '🧻💥';
            captionEl.textContent = '厕纸散落！';
        } else if (gameType === 'cup') {
            imageEl.textContent = '🥤💥';
            captionEl.textContent = '杯子落桌！';
        } else if (gameType === 'bubble') {
            imageEl.textContent = '🫧💥';
            captionEl.textContent = '泡泡全破！';
        } else {
            imageEl.textContent = '🎉';
            captionEl.textContent = '任务完成！';
        }
        
        this.showScreen('success');
    };
    
    GameManager.prototype.showFailScreen = function() {
        this.showScreen('fail');
        
        var self = this;
        // 2 秒后自动返回
        setTimeout(function() {
            if (self.failScreen.classList.contains('active')) {
                self.showScreen('shopping-list');
            }
        }, 2000);
    };
    
    GameManager.prototype.checkUnlocks = function() {
        var currentId = this.currentLevel.id;
        var maxLevelId = this.levels.length;
        
        // 解锁下一关
        var nextLevelId = currentId + 1;
        if (nextLevelId <= maxLevelId && this.playerProgress.unlockedLevels.indexOf(nextLevelId) === -1) {
            this.playerProgress.unlockedLevels.push(nextLevelId);
            Utils.storage.set('playerProgress', this.playerProgress);
        }
        
        // 如果当前是章节的最后一关，解锁下一章的第一关
        if (this.currentLevel.chapter) {
            var nextLevel = this.levels.find(function(l) { return l.id === nextLevelId; });
            if (nextLevel && nextLevel.chapter !== this.currentLevel.chapter) {
                // 新章节的第一关已解锁
                console.log('[GameManager] 解锁新章节：' + nextLevel.chapter);
            }
        }
    };
    
    GameManager.prototype.resetProgress = function() {
        // 重置玩家进度
        this.playerProgress = {
            unlockedLevels: [1],
            completedLevels: [],
            currentLayer: 1
        };
        Utils.storage.set('playerProgress', this.playerProgress);
        
        // 重新渲染关卡列表
        this.renderShoppingList();
        
        // 提示音效
        Utils.playSound('tap');
    };
    
    return GameManager;
})();
