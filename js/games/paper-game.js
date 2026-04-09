// 扒拉厕纸游戏 - 滑动拉扯纸巾
// 输入模式：swipe
// 失败动画：pinch (被捏后颈)
// 渲染方式：图片素材

window.PaperGame = (function() {
    // 图片资源路径
    var BG_IMAGE = 'assets/TissueGame_Background.png';
    var TISSUE_BOX_FULL = 'assets/TissueGame_TissueBox.png';
    var TISSUE_BOX_EMPTY = 'assets/TissueGame_TissueBox_Empty.png';
    var TISSUE_SHORT = 'assets/TissueGame_Tissue_Short.png';
    var TISSUE_LONG = 'assets/TissueGame_Tissue_long.png';
    var CAT_HAND = 'assets/TissueGame_Cat_Hand.png';
    var PILE_OF_TISSUE_1 = 'assets/TissueGame_PileOfTissue_1.png';
    var PILE_OF_TISSUE_2 = 'assets/TissueGame_PileOfTissue_2.png';

    // 游戏配置
    var TIME_LIMIT = 10;
    var INITIAL_DURABILITY = 80;
    var HARD_DURABILITY = 100;
    
    // 纸巾链配置
    var PAPER_CHAIN_CONFIG = {
        shortHeight: 1024,    // 短纸段原始高度
        longHeight: 2048,     // 长纸段原始高度
        width: 512,           // 纸巾宽度
        initialY: 150         // 纸巾盒下方起始 Y 坐标
    };

    function PaperGame(gameArea, onComplete) {
        this.gameArea = gameArea;
        this.onComplete = onComplete;
        this.durability = INITIAL_DURABILITY;
        this.maxDurability = INITIAL_DURABILITY;
        this.isHardMode = false;
        this.isActive = false;
        this.timer = TIME_LIMIT;
        this.isSuccess = false;
        
        // 纸巾拉伸状态
        this.stretchOffset = 0;
        this.stretchVelocity = 0;
        this.isStretching = false;
        this.lastSwipeY = 0;
        
        // 地板纸堆显示进度
        this.pile1Visible = 0;  // 0~1
        this.pile2Visible = 0;  // 0~1
        
        // 碎纸粒子
        this.particles = [];
        
        // 图片元素缓存
        this.bgEl = null;
        this.tissueBoxEl = null;
        this.paperChainEl = null;
        this.catHandEl = null;
        this.pile1El = null;
        this.pile2El = null;
    }

    PaperGame.prototype.start = function(config, progressDisplayEl) {
        var self = this;
        this.isHardMode = config && config.difficulty === 'hard';
        this.isActive = true;
        this.isSuccess = false;
        this.durability = this.isHardMode ? HARD_DURABILITY : INITIAL_DURABILITY;
        this.maxDurability = this.durability;
        this.timer = TIME_LIMIT;
        this.progressDisplayEl = progressDisplayEl;
        this.stretchOffset = 0;
        this.stretchVelocity = 0;
        this.pile1Visible = 0;
        this.pile2Visible = 0;
        this.particles = [];
        
        this.updateProgress();
        this.renderGameArea();
    };

    PaperGame.prototype.renderGameArea = function() {
        var areaRect = this.gameArea.getBoundingClientRect();
        var screenWidth = areaRect.width;
        var screenHeight = areaRect.height;

        // 清空游戏区域
        this.gameArea.innerHTML = '';
        this.gameArea.style.backgroundColor = '#f0f0f0';

        // 1. 创建背景层
        this.bgEl = document.createElement('div');
        this.bgEl.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;' +
            'background-image:url(' + BG_IMAGE + ');background-size:cover;background-position:center;';
        this.gameArea.appendChild(this.bgEl);

        // 2. 创建地板纸堆层（初始隐藏）
        this.pile1El = document.createElement('div');
        this.pile1El.style.cssText = 'position:absolute;left:50%;bottom:80px;' +
            'width:200px;height:50px;' +
            'background-image:url(' + PILE_OF_TISSUE_1 + ');background-size:contain;' +
            'background-repeat:no-repeat;background-position:center;' +
            'transform:translateX(-50%);opacity:0;';
        this.gameArea.appendChild(this.pile1El);

        this.pile2El = document.createElement('div');
        this.pile2El.style.cssText = 'position:absolute;left:50%;bottom:60px;' +
            'width:250px;height:60px;' +
            'background-image:url(' + PILE_OF_TISSUE_2 + ');background-size:contain;' +
            'background-repeat:no-repeat;background-position:center;' +
            'transform:translateX(-50%);opacity:0;';
        this.gameArea.appendChild(this.pile2El);

        // 3. 创建纸巾盒（满）
        this.tissueBoxEl = document.createElement('div');
        this.tissueBoxEl.style.cssText = 'position:absolute;left:50%;top:80px;' +
            'width:200px;height:100px;' +
            'background-image:url(' + TISSUE_BOX_FULL + ');background-size:contain;' +
            'background-repeat:no-repeat;background-position:center;' +
            'transform:translateX(-50%);';
        this.gameArea.appendChild(this.tissueBoxEl);

        // 4. 创建纸巾链容器（裁剪区）
        var paperChainContainer = document.createElement('div');
        paperChainContainer.style.cssText = 'position:absolute;left:50%;top:130px;' +
            'width:150px;height:400px;' +
            'overflow:hidden;' +
            'transform:translateX(-50%);';
        this.gameArea.appendChild(paperChainContainer);

        // 5. 创建纸巾链（短纸段 + 2 个长纸段）
        this.paperChainEl = document.createElement('div');
        this.paperChainEl.style.cssText = 'position:relative;width:100%;' +
            'transition:transform 0.1s ease-out;';
        
        var shortPaper = document.createElement('div');
        shortPaper.style.cssText = 'width:100%;height:200px;' +
            'background-image:url(' + TISSUE_SHORT + ');background-size:contain;' +
            'background-repeat:no-repeat;background-position:top;';
        this.paperChainEl.appendChild(shortPaper);

        var longPaper1 = document.createElement('div');
        longPaper1.style.cssText = 'width:100%;height:400px;' +
            'background-image:url(' + TISSUE_LONG + ');background-size:contain;' +
            'background-repeat:no-repeat;background-position:top;';
        this.paperChainEl.appendChild(longPaper1);

        var longPaper2 = document.createElement('div');
        longPaper2.style.cssText = 'width:100%;height:400px;' +
            'background-image:url(' + TISSUE_LONG + ');background-size:contain;' +
            'background-repeat:no-repeat;background-position:top;';
        this.paperChainEl.appendChild(longPaper2);

        paperChainContainer.appendChild(this.paperChainEl);

        // 6. 创建猫手元素（隐藏，滑动时显示）
        this.catHandEl = document.createElement('div');
        this.catHandEl.style.cssText = 'position:absolute;width:80px;height:400px;' +
            'background-image:url(' + CAT_HAND + ');background-size:contain;' +
            'background-repeat:no-repeat;background-position:top;' +
            'opacity:0;transition:opacity 0.1s;';
        this.gameArea.appendChild(this.catHandEl);

        // 绑定滑动事件
        var self = this;
        this.gameArea.addEventListener('touchmove', function(e) {
            self.handleTouchMove(e);
        }, { passive: false });
    };

    PaperGame.prototype.handleTouchMove = function(e) {
        if (!this.isActive || this.isSuccess) return;
        e.preventDefault();
    };

    PaperGame.prototype.handleSwipe = function(data) {
        if (!this.isActive || this.isSuccess) return;

        // 只处理向下划动
        var dy = data.endY - data.startY;
        var dx = data.endX - data.startX;
        
        if (dy <= 0 || Math.abs(dy) <= Math.abs(dx)) return;

        // 计算伤害
        // 设计目标：80 耐久度需要约 10-15 下划动才能完成
        // 普通划动 (100-150 像素) 造成 5-10 点伤害
        var distance = data.distance || dy;
        var damage = Math.floor(distance / 10);
        if (damage < 3) damage = 3; // 最小伤害
        if (damage > 12) damage = 12; // 最大伤害
        if (this.isHardMode) {
            damage = Math.floor(damage * 0.8);
        }

        if (damage > 0) {
            this.durability = Math.max(0, this.durability - damage);
            this.updateProgress();

            // 更新纸巾拉伸
            this.stretchOffset += distance * 0.5;
            this.stretchVelocity = distance * 0.3;
            this.isStretching = true;
            this.lastSwipeY = data.endY;

            // 显示猫手
            this.showCatHand(data.endX, data.endY);

            // 更新纸巾视觉
            this.updatePaperVisuals();

            // 震动反馈
            if (damage >= 5) {
                Utils.vibrate(30);
            }

            // 检查胜利
            if (this.durability <= 0) {
                this.isSuccess = true;
                this.isActive = false;
                this.showEmptyBox();
                if (this.onComplete) {
                    this.onComplete(true);
                }
            }
        }
    };

    PaperGame.prototype.showCatHand = function(x, y) {
        if (!this.catHandEl) return;
        
        var areaRect = this.gameArea.getBoundingClientRect();
        var handX = x - 40;  // 居中
        var handY = y - 200;
        
        this.catHandEl.style.left = handX + 'px';
        this.catHandEl.style.top = handY + 'px';
        this.catHandEl.style.opacity = '1';
        
        // 0.5 秒后隐藏
        var self = this;
        setTimeout(function() {
            self.catHandEl.style.opacity = '0';
        }, 500);
    };

    PaperGame.prototype.updatePaperVisuals = function() {
        if (!this.paperChainEl) return;
        
        // 拉伸纸巾
        this.paperChainEl.style.transform = 'translateY(' + this.stretchOffset + 'px)';
        
        // 更新地板纸堆可见度
        var progress = 1 - (this.durability / this.maxDurability);
        
        if (progress >= 0.2) {
            this.pile1Visible = Math.min(1, (progress - 0.2) * 5);
            this.pile1El.style.opacity = this.pile1Visible;
        }
        
        if (progress >= 0.5) {
            this.pile2Visible = Math.min(1, (progress - 0.5) * 2);
            this.pile2El.style.opacity = this.pile2Visible;
        }
    };

    PaperGame.prototype.showEmptyBox = function() {
        if (this.tissueBoxEl) {
            this.tissueBoxEl.style.backgroundImage = 'url(' + TISSUE_BOX_EMPTY + ')';
        }
    };

    PaperGame.prototype.update = function(dt) {
        if (!this.isActive) return;

        // 更新计时器
        this.timer -= dt;
        this.updateProgress();

        // 更新纸巾回弹
        if (this.isStretching && this.stretchOffset > 0) {
            this.stretchOffset -= this.stretchVelocity * dt * 8;
            if (this.stretchOffset <= 0) {
                this.stretchOffset = 0;
                this.isStretching = false;
            }
            this.updatePaperVisuals();
        }

        // 超时失败
        if (this.timer <= 0 && !this.isSuccess) {
            this.isActive = false;
            if (this.onComplete) {
                this.onComplete(false);
            }
        }
    };

    PaperGame.prototype.updateProgress = function() {
        if (this.progressDisplayEl) {
            this.progressDisplayEl.textContent = '剩余耐久：' + this.durability + '/' + this.maxDurability;
        }
    };

    PaperGame.prototype.getShake = function() {
        // 强力滑动时触发震动
        if (this.stretchVelocity > 50) {
            return { 
                x: (Math.random() - 0.5) * 4, 
                y: (Math.random() - 0.5) * 4 
            };
        }
        return { x: 0, y: 0 };
    };

    PaperGame.prototype.cleanup = function() {
        this.isActive = false;
        if (this.gameArea) {
            this.gameArea.innerHTML = '';
        }
        this.bgEl = null;
        this.tissueBoxEl = null;
        this.paperChainEl = null;
        this.catHandEl = null;
        this.pile1El = null;
        this.pile2El = null;
    };

    return PaperGame;
})();
