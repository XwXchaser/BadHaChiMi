// 捏泡泡纸游戏 - 点击戳破气泡
// 输入模式：click
// 失败动画：grab (从下方抓住)
// 渲染方式：程序化 Canvas 渲染 (无图片素材)

window.BubbleGame = (function() {
    // 游戏配置
    var GRID_COLS = 8;      // 8 列
    var GRID_ROWS = 10;     // 10 行 = 80 个气泡
    var TIME_LIMIT = 20;    // 20 秒限时
    
    // 气泡配置
    var BUBBLE_RADIUS = 28;     // 气泡半径 (像素)
    var BUBBLE_SPACING = 64;    // 气泡间距
    var MARGIN_X = 40;          // 左右边距
    var MARGIN_TOP = 80;        // 顶部边距
    var MARGIN_BOTTOM = 40;     // 底部边距
    
    // 颜色配置
    var COLORS = {
        bg: '#e8f0f5',          // 背景色 (浅灰蓝)
        bubbleNormal: '#ffffff',// 气泡正常颜色
        bubbleHighlight: '#a8d8ea', // 气泡高光
        bubblePopped: '#ff6b6b',// 戳破后颜色
        gridLine: '#d0d8e0'     // 网格线颜色
    };

    function BubbleGame(gameArea, onComplete) {
        this.gameArea = gameArea;
        this.onComplete = onComplete;
        this.bubbles = [];      // 气泡数组
        this.isSuccess = false;
        this.isActive = false;
        this.timer = TIME_LIMIT;
        this.poppedCount = 0;
        this.totalBubbles = GRID_COLS * GRID_ROWS;
        
        // Canvas 元素
        this.canvas = null;
        this.ctx = null;
        
        // 网格配置
        this.gridConfig = {
            cellWidth: BUBBLE_SPACING,
            cellHeight: BUBBLE_SPACING,
            startX: MARGIN_X,
            startY: MARGIN_TOP
        };
        
        // 粒子效果
        this.particles = [];
    }

    BubbleGame.prototype.start = function(config, progressDisplayEl) {
        var self = this;
        this.isActive = true;
        this.isSuccess = false;
        this.timer = TIME_LIMIT;
        this.poppedCount = 0;
        this.progressDisplayEl = progressDisplayEl;
        this.particles = [];
        
        this.initBubbles();
        this.renderGameArea();
        this.draw();
        this.updateProgress();
    };

    BubbleGame.prototype.initBubbles = function() {
        this.bubbles = [];
        for (var row = 0; row < GRID_ROWS; row++) {
            for (var col = 0; col < GRID_COLS; col++) {
                this.bubbles.push({
                    row: row,
                    col: col,
                    isPopped: false,
                    x: this.gridConfig.startX + col * this.gridConfig.cellWidth + this.gridConfig.cellWidth / 2,
                    y: this.gridConfig.startY + row * this.gridConfig.cellHeight + this.gridConfig.cellHeight / 2,
                    radius: BUBBLE_RADIUS,
                    popTime: 0
                });
            }
        }
    };

    BubbleGame.prototype.renderGameArea = function() {
        var areaRect = this.gameArea.getBoundingClientRect();
        var screenWidth = areaRect.width;
        var screenHeight = areaRect.height;

        // 清空游戏区域
        this.gameArea.innerHTML = '';
        this.gameArea.style.backgroundColor = COLORS.bg;

        // 创建 Canvas
        this.canvas = document.createElement('canvas');
        this.canvas.width = screenWidth;
        this.canvas.height = screenHeight;
        this.canvas.style.cssText = 'position:absolute;left:0;top:0;';
        this.gameArea.appendChild(this.canvas);
        
        this.ctx = this.canvas.getContext('2d');
        
        // 绑定点击事件
        var self = this;
        this.canvas.addEventListener('click', function(e) {
            self.handleClick(e);
        });
    };

    BubbleGame.prototype.handleClick = function(e) {
        if (!this.isActive || this.isSuccess) return;

        var rect = this.canvas.getBoundingClientRect();
        var clickX = e.clientX - rect.left;
        var clickY = e.clientY - rect.top;

        // 检测点击了哪个气泡
        for (var i = 0; i < this.bubbles.length; i++) {
            var bubble = this.bubbles[i];
            if (bubble.isPopped) continue;

            var dx = clickX - bubble.x;
            var dy = clickY - bubble.y;
            var distance = Math.sqrt(dx * dx + dy * dy);

            // 圆形碰撞检测
            if (distance <= bubble.radius * 1.3) {
                this.popBubble(bubble);
                break;
            }
        }
    };

    BubbleGame.prototype.popBubble = function(bubble) {
        bubble.isPopped = true;
        bubble.popTime = Date.now();
        this.poppedCount++;
        
        // 创建粒子效果
        this.createParticles(bubble.x, bubble.y);
        
        this.updateProgress();
        
        // 检查胜利条件
        if (this.poppedCount >= this.totalBubbles) {
            this.isSuccess = true;
            this.isActive = false;
            if (this.onComplete) {
                this.onComplete(true);
            }
        }
    };

    BubbleGame.prototype.createParticles = function(x, y) {
        // 创建戳破粒子
        for (var i = 0; i < 8; i++) {
            var angle = (Math.PI * 2 / 8) * i;
            var speed = 50 + Math.random() * 50;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0.5,  // 0.5 秒寿命
                maxLife: 0.5,
                radius: 3 + Math.random() * 3,
                color: COLORS.bubblePopped
            });
        }
    };

    BubbleGame.prototype.update = function(dt) {
        if (!this.isActive) return;

        // 更新计时器
        this.timer -= dt;
        this.updateProgress();

        // 更新粒子
        for (var i = this.particles.length - 1; i >= 0; i--) {
            var p = this.particles[i];
            p.life -= dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // 超时失败
        if (this.timer <= 0 && !this.isSuccess) {
            this.isActive = false;
            if (this.onComplete) {
                this.onComplete(false);
            }
        }

        // 重绘
        this.draw();
    };

    BubbleGame.prototype.draw = function() {
        if (!this.ctx) return;

        var w = this.canvas.width;
        var h = this.canvas.height;

        // 清空画布
        this.ctx.clearRect(0, 0, w, h);

        // 绘制背景网格线
        this.drawGridLines();

        // 绘制气泡
        for (var i = 0; i < this.bubbles.length; i++) {
            this.drawBubble(this.bubbles[i]);
        }

        // 绘制粒子
        for (var j = 0; j < this.particles.length; j++) {
            this.drawParticle(this.particles[j]);
        }
    };

    BubbleGame.prototype.drawGridLines = function() {
        var ctx = this.ctx;
        ctx.strokeStyle = COLORS.gridLine;
        ctx.lineWidth = 1;
        ctx.beginPath();

        // 垂直线
        for (var col = 0; col <= GRID_COLS; col++) {
            var x = this.gridConfig.startX + col * this.gridConfig.cellWidth;
            ctx.moveTo(x, this.gridConfig.startY - 20);
            ctx.lineTo(x, this.gridConfig.startY + GRID_ROWS * this.gridConfig.cellHeight + 20);
        }

        // 水平线
        for (var row = 0; row <= GRID_ROWS; row++) {
            var y = this.gridConfig.startY + row * this.gridConfig.cellHeight;
            ctx.moveTo(this.gridConfig.startX - 20, y);
            ctx.lineTo(this.gridConfig.startX + GRID_COLS * this.gridConfig.cellWidth + 20, y);
        }

        ctx.stroke();
    };

    BubbleGame.prototype.drawBubble = function(bubble) {
        var ctx = this.ctx;
        var x = bubble.x;
        var y = bubble.y;
        var r = bubble.radius;

        if (bubble.isPopped) {
            // 已戳破：绘制红点 + 十字标记
            ctx.fillStyle = COLORS.bubblePopped;
            ctx.beginPath();
            ctx.arc(x, y, r * 0.3, 0, Math.PI * 2);
            ctx.fill();

            // 十字标记
            ctx.strokeStyle = COLORS.bubblePopped;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(x - r * 0.5, y - r * 0.5);
            ctx.lineTo(x + r * 0.5, y + r * 0.5);
            ctx.moveTo(x + r * 0.5, y - r * 0.5);
            ctx.lineTo(x - r * 0.5, y + r * 0.5);
            ctx.stroke();
        } else {
            // 未戳破：径向渐变 + 高光
            var gradient = ctx.createRadialGradient(
                x - r * 0.3, y - r * 0.3, r * 0.1,
                x, y, r
            );
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(0.3, '#f0f8ff');
            gradient.addColorStop(1, COLORS.bubbleHighlight);

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();

            // 高光椭圆
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.beginPath();
            ctx.ellipse(x - r * 0.25, y - r * 0.25, r * 0.3, r * 0.2, Math.PI / 4, 0, Math.PI * 2);
            ctx.fill();

            // 边框
            ctx.strokeStyle = 'rgba(168, 216, 234, 0.5)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.stroke();
        }
    };

    BubbleGame.prototype.drawParticle = function(p) {
        var ctx = this.ctx;
        var alpha = p.life / p.maxLife;
        
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    };

    BubbleGame.prototype.updateProgress = function() {
        if (this.progressDisplayEl) {
            this.progressDisplayEl.textContent = '已戳破：' + this.poppedCount + ' / ' + this.totalBubbles;
        }
    };

    BubbleGame.prototype.getShake = function() {
        return { x: 0, y: 0 };
    };

    BubbleGame.prototype.cleanup = function() {
        this.isActive = false;
        if (this.canvas) {
            this.canvas.removeEventListener('click', this.handleClick);
        }
        if (this.gameArea) {
            this.gameArea.innerHTML = '';
        }
        this.bubbles = [];
        this.particles = [];
    };

    return BubbleGame;
})();
