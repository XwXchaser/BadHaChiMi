// 推杯子游戏 - 滑动推杯落桌
// 输入模式：swipe
// 失败动画：grab (从下方抓住)

window.CupGame = (function() {
    // 图片资源路径
    var BG_IMAGE = 'assets/PushCupGame_Background.png';
    var TABLE_IMAGE = 'assets/PushCupGame_Table.png';
    var CUP_IMAGES = [
        'assets/PushCupGame_Cup1.png',
        'assets/PushCupGame_Cup2.png',
        'assets/PushCupGame_Cup3.png',
        'assets/PushCupGame_Cup4.png'
    ];

    // 桌面梯形扫描数据 (从 alpha 通道获取的透视映射)
    // 归一化坐标：近端 (屏幕下方) 宽，远端 (屏幕上方) 窄
    var TABLE_SCAN = {
        topLeft: { x: 0.15, y: 0.35 },      // 远端左侧
        topRight: { x: 0.85, y: 0.35 },     // 远端右侧
        bottomLeft: { x: 0.05, y: 0.85 },   // 近端左侧
        bottomRight: { x: 0.95, y: 0.85 }   // 近端右侧
    };

    // 杯子配置
    var CUP_CONFIGS = [
        { depth: 0.2, tableX: 0.3, cupType: 0 },   // 深度 20%, 横向 30%
        { depth: 0.2, tableX: 0.7, cupType: 1 },
        { depth: 0.5, tableX: 0.2, cupType: 2 },   // 深度 50%
        { depth: 0.5, tableX: 0.5, cupType: 3 },
        { depth: 0.5, tableX: 0.8, cupType: 0 },
        { depth: 0.8, tableX: 0.4, cupType: 1 }    // 深度 80% (最近)
    ];

    // 物理常量
    var GRAVITY = 1200;         // 重力加速度 (像素/秒²)
    var FALL_THRESHOLD = -0.03; // 落桌阈值 (< -0.03 或 > 1.03)
    var SWIPE_FORCE_SCALE = 0.015; // 滑动力度系数

    function CupGame(gameArea, onComplete) {
        this.gameArea = gameArea;
        this.onComplete = onComplete;
        this.cups = [];
        this.isSuccess = false;
        this.isActive = false;
        this.timer = 0;
        this.timeLimit = 10;
        
        // 图片元素缓存
        this.bgImg = null;
        this.tableImg = null;
        this.cupImgs = [];
        
        // 桌面渲染区域
        this.tableRect = null;
    }

    CupGame.prototype.start = function(config, progressDisplayEl) {
        var self = this;
        this.isActive = true;
        this.isSuccess = false;
        this.timer = this.timeLimit;
        this.progressDisplayEl = progressDisplayEl;
        this.updateProgress();

        // 加载图片资源
        this.loadImages(function() {
            self.renderGameArea();
            self.initCups();
        });
    };

    CupGame.prototype.loadImages = function(callback) {
        var self = this;
        var loadedCount = 0;
        var totalImages = 2 + CUP_IMAGES.length; // bg + table + 4 cups

        function onImageLoad() {
            loadedCount++;
            if (loadedCount >= totalImages) {
                callback();
            }
        }

        // 加载背景
        this.bgImg = new Image();
        this.bgImg.src = BG_IMAGE;
        this.bgImg.onload = onImageLoad;

        // 加载桌面
        this.tableImg = new Image();
        this.tableImg.src = TABLE_IMAGE;
        this.tableImg.onload = onImageLoad;

        // 加载杯子图片
        this.cupImgs = [];
        for (var i = 0; i < CUP_IMAGES.length; i++) {
            (function(index) {
                var img = new Image();
                img.src = CUP_IMAGES[index];
                img.onload = onImageLoad;
                self.cupImgs[index] = img;
            })(i);
        }
    };

    CupGame.prototype.renderGameArea = function() {
        var self = this;
        var areaRect = this.gameArea.getBoundingClientRect();
        var screenWidth = areaRect.width;
        var screenHeight = areaRect.height;

        // 清空游戏区域
        this.gameArea.innerHTML = '';
        this.gameArea.style.backgroundImage = 'none';
        this.gameArea.style.backgroundColor = '#f5f5f5';

        // 创建背景层
        var bgEl = document.createElement('div');
        bgEl.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;' +
            'background-image:url(' + BG_IMAGE + ');background-size:cover;background-position:center;';
        this.gameArea.appendChild(bgEl);

        // 计算桌面渲染区域 (保持原始比例)
        var tableOriginalWidth = 1024;
        var tableOriginalHeight = 2048;
        var tableScale = screenWidth * 0.9 / tableOriginalWidth;
        var tableDisplayWidth = tableOriginalWidth * tableScale;
        var tableDisplayHeight = tableOriginalHeight * tableScale;

        // 桌面居中
        var tableX = (screenWidth - tableDisplayWidth) / 2;
        var tableY = (screenHeight - tableDisplayHeight) / 2;

        this.tableRect = {
            x: tableX,
            y: tableY,
            width: tableDisplayWidth,
            height: tableDisplayHeight,
            scale: tableScale
        };

        // 创建桌面层
        var tableEl = document.createElement('div');
        tableEl.style.cssText = 'position:absolute;left:' + tableX + 'px;top:' + tableY + 'px;' +
            'width:' + tableDisplayWidth + 'px;height:' + tableDisplayHeight + 'px;' +
            'background-image:url(' + TABLE_IMAGE + ');background-size:contain;background-repeat:no-repeat;' +
            'background-position:center;';
        this.gameArea.appendChild(tableEl);

        // 创建杯子元素
        for (var i = 0; i < this.cups.length; i++) {
            this.updateCupElement(this.cups[i]);
        }
    };

    CupGame.prototype.initCups = function() {
        this.cups = [];
        var areaRect = this.gameArea.getBoundingClientRect();
        var screenWidth = areaRect.width;

        for (var i = 0; i < CUP_CONFIGS.length; i++) {
            var config = CUP_CONFIGS[i];
            var cup = {
                index: i,
                depth: config.depth,        // 深度 0~1 (0=远端，1=近端)
                tableX: config.tableX,      // 横向位置 0~1
                tableY: 0,                  // 垂直位置 (自由落体用)
                cupType: config.cupType,
                velocityX: 0,
                velocityY: 0,
                rotation: 0,
                rotationSpeed: 0,
                isFalling: false,
                hasLanded: false,
                pushed: false,
                element: null
            };
            this.cups.push(cup);
            this.createCupElement(cup);
        }
    };

    CupGame.prototype.createCupElement = function(cup) {
        var cupEl = document.createElement('div');
        cupEl.className = 'cup';
        cupEl.style.cssText = 'position:absolute;width:64px;height:64px;' +
            'background-image:url(' + CUP_IMAGES[cup.cupType] + ');' +
            'background-size:contain;background-repeat:no-repeat;' +
            'background-position:center;transition:transform 0.1s;';
        this.gameArea.appendChild(cupEl);
        cup.element = cupEl;
        this.updateCupElement(cup);
    };

    CupGame.prototype.updateCupElement = function(cup) {
        if (!cup.element) return;

        if (cup.isFalling) {
            // 自由落体状态
            cup.element.style.transform = 'translate(' + cup.screenX + 'px,' + cup.screenY + 'px) ' +
                'rotate(' + cup.rotation + 'deg)';
        } else {
            // 在桌面上
            var pos = this.tableToScreen(cup.depth, cup.tableX);
            cup.screenX = pos.x;
            cup.screenY = pos.y;
            var scale = pos.scale;
            
            cup.element.style.transform = 'translate(' + cup.screenX + 'px,' + cup.screenY + 'px) ' +
                'scale(' + scale + ')';
        }
    };

    // 将桌面归一化坐标转换为屏幕坐标
    CupGame.prototype.tableToScreen = function(depth, tableX) {
        if (!this.tableRect) {
            return { x: 0, y: 0, scale: 1 };
        }

        // 线性插值计算 X 坐标 (透视效果)
        var leftX = TABLE_SCAN.topLeft.x + (TABLE_SCAN.bottomLeft.x - TABLE_SCAN.topLeft.x) * depth;
        var rightX = TABLE_SCAN.topRight.x + (TABLE_SCAN.bottomRight.x - TABLE_SCAN.topRight.x) * depth;
        
        // 归一化 tableX 映射到实际 X
        var normalizedX = leftX + (rightX - leftX) * tableX;
        
        // Y 坐标 (深度越深，Y 越小)
        var normalizedY = TABLE_SCAN.topLeft.y + (TABLE_SCAN.bottomLeft.y - TABLE_SCAN.topLeft.y) * depth;

        // 转换为屏幕坐标
        var screenX = this.tableRect.x + normalizedX * this.tableRect.width;
        var screenY = this.tableRect.y + normalizedY * this.tableRect.height;

        // 透视缩放 (近大远小)
        var scale = 0.6 + 0.4 * depth; // 0.6 (远端) ~ 1.0 (近端)

        return { x: screenX - 32 * scale, y: screenY - 32 * scale, scale: scale };
    };

    CupGame.prototype.update = function(dt) {
        if (!this.isActive) return;

        // 更新计时器
        this.timer -= dt;
        this.updateProgress();

        // 更新杯子物理
        for (var i = 0; i < this.cups.length; i++) {
            var cup = this.cups[i];
            
            if (cup.isFalling) {
                // 自由落体
                cup.velocityY += GRAVITY * dt;
                cup.tableY += cup.velocityY * dt;
                cup.rotation += cup.rotationSpeed * dt;

                // 落地检测 - 当杯子落到屏幕底部时
                var areaHeight = this.gameArea.getBoundingClientRect().height;
                if (cup.tableY > areaHeight - 100) {
                    cup.hasLanded = true;
                    cup.isFalling = false;
                    // 将杯子固定在底部
                    cup.tableY = areaHeight - 100;
                }

                this.updateCupElement(cup);
            }
        }

        // 检查胜利条件：所有杯子被推落且落地
        if (!this.isSuccess) {
            var allPushed = this.cups.every(function(cup) { return cup.pushed; });
            var allLanded = this.cups.every(function(cup) { return cup.hasLanded; });
            
            if (allPushed && allLanded) {
                this.isSuccess = true;
                this.isActive = false;
                if (this.onComplete) {
                    this.onComplete(true);
                }
            }
        }

        // 超时失败
        if (this.timer <= 0 && !this.isSuccess) {
            this.isActive = false;
            if (this.onComplete) {
                this.onComplete(false);
            }
        }
    };

    CupGame.prototype.handleSwipe = function(data) {
        if (!this.isActive || this.isSuccess) return;

        var dx = data.endX - data.startX;
        var dy = data.endY - data.startY;
        var distance = Math.sqrt(dx * dx + dy * dy);

        // 最小滑动距离阈值 - 确保是有意滑动
        if (distance < 50) {
            return;
        }

        // 必须是水平滑动
        if (Math.abs(dx) < Math.abs(dy)) {
            return;
        }

        var direction = dx > 0 ? 1 : -1; // 1=向右，-1=向左

        // 检测哪个杯子被滑动影响 - 只影响一个杯子
        for (var i = 0; i < this.cups.length; i++) {
            var cup = this.cups[i];
            if (cup.pushed || cup.isFalling) continue;

            // 检查滑动是否经过杯子位置
            var pos = this.tableToScreen(cup.depth, cup.tableX);
            var cupY = pos.y + 32;
            var cupX = pos.x + 32;
            
            // 使用滑动起点的 Y 坐标进行检测
            var swipeY = data.startY;
            var yTolerance = 40; // 缩小 Y 轴容差范围，只影响一个杯子

            // 检测滑动起点是否在杯子附近
            if (Math.abs(cupY - swipeY) <= yTolerance) {
                // 每次滑动只推动固定距离
                var moveAmount = 0.15; // 每次推动 15% 的桌面宽度
                cup.tableX += direction * moveAmount;
                
                // 落桌检测 - 杯子超出桌子左右边缘
                if (cup.tableX <= -0.1 || cup.tableX >= 1.1) {
                    cup.pushed = true;
                    cup.isFalling = true;
                    cup.velocityY = 0;
                    cup.tableY = 0;
                    cup.rotationSpeed = direction * 180; // 旋转下落
                }
                
                // 更新杯子位置并退出 - 每次滑动只影响一个杯子
                this.updateCupElement(cup);
                break;
            }
        }
    };

    CupGame.prototype.updateProgress = function() {
        if (this.progressDisplayEl) {
            var remaining = this.cups.filter(function(cup) { return !cup.pushed; }).length;
            this.progressDisplayEl.textContent = '剩余杯子：' + remaining;
        }
    };

    CupGame.prototype.getShake = function() {
        return { x: 0, y: 0 };
    };

    CupGame.prototype.cleanup = function() {
        this.isActive = false;
        this.gameArea.innerHTML = '';
        this.cups = [];
    };

    return CupGame;
})();
