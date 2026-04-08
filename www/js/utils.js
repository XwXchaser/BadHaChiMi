// 工具函数库

window.Utils = {
    /**
     * 检查是否为竖屏
     */
    isPortrait: function() {
        return window.innerHeight > window.innerWidth;
    },

    /**
     * 获取随机整数
     */
    randomInt: function(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    /**
     * 获取随机位置（在游戏区域内）
     */
    getRandomPosition: function(gameArea, padding) {
        padding = padding || 50;
        const rect = gameArea.getBoundingClientRect();
        return {
            x: this.randomInt(padding, rect.width - padding),
            y: this.randomInt(padding, rect.height - padding)
        };
    },

    /**
     * 播放震动反馈
     */
    vibrate: function(pattern) {
        pattern = pattern || 50;
        if (navigator.vibrate) {
            navigator.vibrate(pattern);
        }
    },

    /**
     * 创建音效（使用 Web Audio API）
     */
    playSound: function(type) {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            switch (type) {
                case 'tap':
                    oscillator.frequency.value = 800;
                    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.1);
                    break;
                case 'success':
                    oscillator.frequency.value = 523.25;
                    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.1);
                    
                    setTimeout(() => {
                        const osc2 = audioContext.createOscillator();
                        const gain2 = audioContext.createGain();
                        osc2.connect(gain2);
                        gain2.connect(audioContext.destination);
                        osc2.frequency.value = 659.25;
                        gain2.gain.setValueAtTime(0.3, audioContext.currentTime);
                        osc2.start(audioContext.currentTime);
                        osc2.stop(audioContext.currentTime + 0.2);
                    }, 100);
                    break;
                case 'fail':
                    oscillator.frequency.value = 200;
                    oscillator.type = 'sawtooth';
                    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.3);
                    break;
                case 'scratch':
                    oscillator.frequency.value = 400;
                    oscillator.type = 'square';
                    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
                    oscillator.start(audioContext.currentTime);
                    oscillator.stop(audioContext.currentTime + 0.05);
                    break;
            }
        } catch (e) {
            console.log('Audio error:', e);
        }
    },

    /**
     * 延迟执行
     */
    delay: function(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    /**
     * 本地存储管理
     */
    storage: {
        get: function(key, defaultValue) {
            defaultValue = defaultValue || null;
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        },
        
        set: function(key, value) {
            localStorage.setItem(key, JSON.stringify(value));
        },
        
        remove: function(key) {
            localStorage.removeItem(key);
        }
    }
};
