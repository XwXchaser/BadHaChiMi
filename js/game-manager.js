// 游戏管理器 - 管理游戏流程和状态

// 打苍蝇游戏实现
window.FlyHunterGame = (function() {
    // 苍蝇 SVG 图片（替代 emoji）
    var FLY_SVG = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSIzMCIgZmlsbD0iIzMzMyIvPjxjaXJjbGUgY3g9IjQwIiBjeT0iNDUiIHI9IjgiIGZpbGw9IiNmZmYiLz48Y2lyY2xlIGN4PSI2MCIgY3k9IjQ1IiByPSI4IiBmaWxsPSIjZmZmIi8+PHBhdGggZD0iTSAyMCA1MCBMIDUgMzAgTSA4MCA1MCBMIDk1IDMwIiBzdHJva2U9IiM1NTUiIHN0cm9rZS13aWR0aD0iNSIgZmlsbD0ibm9uZSIgb3BhY2l0eT0iMC41Ii8+PC9zdmc+';

    // 苍蝇状态
    var FLY_STATE = {
        MOVING: 'moving',
        RESTING: 'resting'
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
        fly.innerHTML = '<img src="' + FLY_SVG + '" alt="苍蝇" draggable="false">';

        var pos = Utils.getRandomPosition(this.gameArea);
        fly.style.left = pos.x + 'px';
        fly.style.top = pos.y + 'px';
        fly.style.transition = 'none'; // 初始无过渡

        // 苍蝇数据
        var flyData = {
            element: fly,
            x: pos.x,
            y: pos.y,
            state: FLY_STATE.RESTING,
            direction: this.getRandomDirection(),
            speed: this.isHardMode ? 4 : 2, // 移动速度（像素/帧）
            restTime: 0,
            restDuration: this.isHardMode ? 500 : 1000, // 停留时间（毫秒）
            moveTime: 0,
            moveDuration: this.isHardMode ? 800 : 1500 // 移动持续时间（毫秒）
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

    FlyHunterGame.prototype.updateFlies = function() {
        var deltaTime = 50; // 50ms per frame

        for (var i = 0; i < this.flies.length; i++) {
            var flyData = this.flies[i];
            var fly = flyData.element;

            if (flyData.state === FLY_STATE.RESTING) {
                // 停留状态
                flyData.restTime += deltaTime;
                if (flyData.restTime >= flyData.restDuration) {
                    // 停留结束，开始移动
                    flyData.state = FLY_STATE.MOVING;
                    flyData.direction = this.getRandomDirection();
                    flyData.moveTime = 0;
                    fly.style.transition = 'none'; // 移除过渡，使用 JS 动画
                }
            } else if (flyData.state === FLY_STATE.MOVING) {
                // 移动状态 - 匀速直线运动
                flyData.moveTime += deltaTime;
                flyData.x += flyData.direction.x * flyData.speed;
                flyData.y += flyData.direction.y * flyData.speed;

                // 检查边界，碰到边界反弹
                var maxX = this.gameArea.clientWidth - 40;
                var maxY = this.gameArea.clientHeight - 40;

                if (flyData.x <= 0 || flyData.x >= maxX) {
                    flyData.direction.x *= -1;
                    flyData.x = Math.max(0, Math.min(flyData.x, maxX));
                }
                if (flyData.y <= 0 || flyData.y >= maxY) {
                    flyData.direction.y *= -1;
                    flyData.y = Math.max(0, Math.min(flyData.y, maxY));
                }

                fly.style.left = flyData.x + 'px';
                fly.style.top = flyData.y + 'px';

                // 检查移动时间是否结束
                if (flyData.moveTime >= flyData.moveDuration) {
                    // 移动结束，开始停留
                    flyData.state = FLY_STATE.RESTING;
                    flyData.restTime = 0;
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
        var damage = Math.floor(distance / 3); // 每 3 像素距离造成 1 点伤害
        if (this.isHardMode) {
            damage = Math.floor(damage * 0.8); // 高难度伤害降低
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

// 游戏管理器 - 管理游戏流程和状态

window.GameManager = (function() {
    function GameManager() {
        this.currentGame = null;
        this.currentLevel = null;
        this.timer = null;
        this.timeLeft = 10000;
        this.startTime = 0;
        
        // 关卡配置 - 打苍蝇和破坏大王
        this.levels = [
            { id: 1, type: 'fly', name: '打苍蝇！', icon: '🪰', difficulty: 1, target: 5 },
            { id: 2, type: 'destroy', name: '破坏沙发！', icon: '🛋️', difficulty: 1, objectType: 'sofa' }
        ];
        
        // 玩家进度
        this.playerProgress = Utils.storage.get('playerProgress', {
            unlockedLevels: [1],
            completedLevels: [],
            currentLayer: 1
        });
    }
    
    GameManager.prototype.init = function() {
        this.setupUI();
        this.renderShoppingList();
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
        
        var storyTexts = [
            '买个新苍蝇拍',
            '买个新沙发'
        ];
        
        var self = this;
        
        this.levels.forEach(function(level, index) {
            var item = document.createElement('div');
            item.className = 'list-item';
            
            var isUnlocked = self.playerProgress.unlockedLevels.indexOf(level.id) !== -1;
            var isCompleted = self.playerProgress.completedLevels.indexOf(level.id) !== -1;
            var isHardMode = level.difficulty === 2;
            
            if (!isUnlocked) {
                item.classList.add('locked');
            }
            if (isCompleted) {
                item.classList.add('completed');
            }
            if (isHardMode) {
                item.classList.add('hard-mode');
            }
            
            var storyText = storyTexts[index % storyTexts.length];
            var difficultyText = isHardMode ? '（高难度）' : '';
            
            item.innerHTML = '<div class="item-text">' + level.icon + ' ' + level.name + '</div>' +
                            '<div class="item-difficulty">' + storyText + difficultyText + '</div>';
            
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
        this.instructionEl.textContent = level.name;
        
        // 重置进度显示
        if (this.progressDisplayEl) {
            this.progressDisplayEl.textContent = '';
        }
        
        // 创建游戏实例
        var isHardMode = level.difficulty === 2;
        
        if (level.type === 'fly') {
            this.currentGame = new FlyHunterGame(this.gameArea, function(success) {
                self.onGameComplete(success);
            });
            this.currentGame.start(isHardMode, this.progressDisplayEl);
        } else if (level.type === 'destroy') {
            this.currentGame = new DestroyerGame(this.gameArea, function(success) {
                self.onGameComplete(success);
            });
            this.currentGame.start(isHardMode, this.progressDisplayEl, level.objectType);
        }
        
        // 启动计时器（统一 10 秒）
        this.startTimer();
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
        
        if (this.currentLevel.type === 'fly') {
            imageEl.textContent = '🪰💥';
            captionEl.textContent = '苍蝇全灭！';
        } else if (this.currentLevel.type === 'destroy') {
            if (this.currentLevel.objectType === 'sofa') {
                imageEl.textContent = '🛋️💥';
                captionEl.textContent = '沙发报废！';
            } else {
                imageEl.textContent = '🧻💥';
                captionEl.textContent = '厕纸散落！';
            }
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
