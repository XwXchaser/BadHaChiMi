// 猫爪输入处理系统

window.PawInput = (function() {
    function PawInput(container) {
        this.container = container;
        this.effectsContainer = document.getElementById('paw-effects');
        this.isPressing = false;
        this.lastPosition = null;
        this.touchId = null;
        
        this.init();
    }
    
    PawInput.prototype.init = function() {
        var self = this;
        
        // 记录滑动起点
        this.swipeStart = null;
        
        // 触摸事件
        this.container.addEventListener('touchstart', function(e) {
            e.preventDefault();
            var touch = e.changedTouches[0];
            self.touchId = touch.identifier;
            self.isPressing = true;
            self.lastPosition = { x: touch.clientX, y: touch.clientY };
            self.swipeStart = { x: touch.clientX, y: touch.clientY };
            
            self.showPawPrint(touch.clientX, touch.clientY, 'tap');
            Utils.playSound('tap');
            Utils.vibrate(30);
            
            if (self.onTap) {
                self.onTap({ x: touch.clientX, y: touch.clientY });
            }
        }, { passive: false });
        
        this.container.addEventListener('touchmove', function(e) {
            e.preventDefault();
            if (!self.isPressing) return;
            
            var touch = null;
            for (var i = 0; i < e.changedTouches.length; i++) {
                if (e.changedTouches[i].identifier === self.touchId) {
                    touch = e.changedTouches[i];
                    break;
                }
            }
            
            if (!touch) return;
            
            var currentX = touch.clientX;
            var currentY = touch.clientY;
            
            var dx = currentX - self.lastPosition.x;
            var dy = currentY - self.lastPosition.y;
            var distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 10) {
                self.showPawTrail(currentX, currentY, dx, dy);
                Utils.playSound('scratch');
                Utils.vibrate(20);
                
                if (self.onSwipe) {
                    self.onSwipe({
                        x: currentX,
                        y: currentY,
                        dx: dx,
                        dy: dy,
                        distance: distance,
                        startX: self.swipeStart.x,
                        startY: self.swipeStart.y,
                        endX: currentX,
                        endY: currentY
                    });
                }
                
                self.lastPosition = { x: currentX, y: currentY };
            }
        }, { passive: false });
        
        this.container.addEventListener('touchend', function(e) {
            e.preventDefault();
            self.isPressing = false;
            self.touchId = null;
            
            if (self.onRelease) {
                self.onRelease();
            }
        });
        
        this.container.addEventListener('touchcancel', function(e) {
            e.preventDefault();
            self.isPressing = false;
            self.touchId = null;
            
            if (self.onRelease) {
                self.onRelease();
            }
        });
        
        // 鼠标事件（用于桌面测试）
        this.container.addEventListener('mousedown', function(e) {
            self.isPressing = true;
            self.lastPosition = { x: e.clientX, y: e.clientY };
            self.swipeStart = { x: e.clientX, y: e.clientY };
            
            self.showPawPrint(e.clientX, e.clientY, 'tap');
            Utils.playSound('tap');
            
            if (self.onTap) {
                self.onTap({ x: e.clientX, y: e.clientY });
            }
        });
        
        this.container.addEventListener('mousemove', function(e) {
            if (!self.isPressing) return;
            
            var currentX = e.clientX;
            var currentY = e.clientY;
            
            var dx = currentX - self.lastPosition.x;
            var dy = currentY - self.lastPosition.y;
            var distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 10) {
                self.showPawTrail(currentX, currentY, dx, dy);
                Utils.playSound('scratch');
                
                if (self.onSwipe) {
                    self.onSwipe({
                        x: currentX,
                        y: currentY,
                        dx: dx,
                        dy: dy,
                        distance: distance,
                        startX: self.swipeStart.x,
                        startY: self.swipeStart.y,
                        endX: currentX,
                        endY: currentY
                    });
                }
                
                self.lastPosition = { x: currentX, y: currentY };
            }
        });
        
        this.container.addEventListener('mouseup', function() {
            self.isPressing = false;
            
            if (self.onRelease) {
                self.onRelease();
            }
        });
    };
    
    PawInput.prototype.showPawPrint = function(x, y, type) {
        var paw = document.createElement('div');
        paw.className = 'paw-print';
        paw.textContent = '🐾';
        paw.style.left = (x - 20) + 'px';
        paw.style.top = (y - 20) + 'px';
        this.effectsContainer.appendChild(paw);
        
        setTimeout(function() {
            paw.remove();
        }, 500);
    };
    
    PawInput.prototype.showPawTrail = function(x, y, dx, dy) {
        var trail = document.createElement('div');
        trail.className = 'paw-trail';
        trail.textContent = '💨';
        trail.style.left = (x - 15) + 'px';
        trail.style.top = (y - 15) + 'px';
        
        var angle = Math.atan2(dy, dx) * 180 / Math.PI;
        trail.style.transform = 'rotate(' + angle + 'deg)';
        
        this.effectsContainer.appendChild(trail);
        
        setTimeout(function() {
            trail.remove();
        }, 500);
    };
    
    PawInput.prototype.setCallbacks = function(callbacks) {
        if (callbacks.onTap) this.onTap = callbacks.onTap;
        if (callbacks.onSwipe) this.onSwipe = callbacks.onSwipe;
        if (callbacks.onRelease) this.onRelease = callbacks.onRelease;
    };
    
    PawInput.prototype.clearCallbacks = function() {
        this.onTap = null;
        this.onSwipe = null;
        this.onRelease = null;
    };
    
    return PawInput;
})();
