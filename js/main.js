// 主入口文件 - 猫咪的十分钟 (BadHaChiMi)

document.addEventListener('DOMContentLoaded', function() {
    console.log('猫咪的十分钟 - 初始化中...');
    
    // 初始化关卡管理器（暴露到全局作用域）
    window.levelManager = LevelManager;
    window.levelManager.loadLevels('data/levels.json').then(function() {
        console.log('关卡配置加载完成，共', window.levelManager.getLevelCount(), '个关卡');
    });
    
    // 初始化游戏管理器（暴露到全局作用域）
    window.gameManager = new GameManager();
    window.gameManager.init();
    
    // 初始化猫爪输入系统
    var gameArea = document.getElementById('game-area');
    var pawInput = new PawInput(gameArea);
    
    // 设置输入回调
    pawInput.setCallbacks({
        onTap: function(data) {
            // 点击事件由游戏自己处理（如打苍蝇、捏泡泡）
            if (gameManager.currentGame && gameManager.currentGame.handleClick) {
                gameManager.currentGame.handleClick(data);
            }
        },
        onSwipe: function(data) {
            // 滑动事件 - 用于推杯子、扒拉厕纸、挠沙发等游戏
            if (!gameManager.currentGame || !gameManager.currentGame.handleSwipe) return;
            
            // 使用 paw-input 传递的完整滑动数据
            var swipeData = {
                startX: data.startX || (data.x - data.dx),
                startY: data.startY || (data.y - data.dy),
                endX: data.endX || data.x,
                endY: data.endY || data.y,
                dx: data.dx,
                dy: data.dy,
                distance: data.distance
            };
            gameManager.currentGame.handleSwipe(swipeData);
        },
        onRelease: function() {
            // 释放事件
            if (gameManager.currentGame && gameManager.currentGame.handleRelease) {
                gameManager.currentGame.handleRelease();
            }
        }
    });
    
    // 防止默认触摸行为
    document.addEventListener('touchmove', function(e) {
        e.preventDefault();
    }, { passive: false });
    
    console.log('游戏初始化完成！');
});
