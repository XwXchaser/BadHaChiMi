// 主入口文件

document.addEventListener('DOMContentLoaded', function() {
    console.log('猫咪的十分钟 - 初始化中...');
    
    // 初始化游戏管理器（暴露到全局作用域）
    window.gameManager = new GameManager();
    window.gameManager.init();
    
    // 初始化猫爪输入系统
    var gameArea = document.getElementById('game-area');
    var pawInput = new PawInput(gameArea);
    
    // 设置输入回调
    pawInput.setCallbacks({
        onTap: function(data) {
            // 点击事件由游戏自己处理
        },
        onSwipe: function(data) {
            // 滑动事件 - 用于破坏游戏
            if (gameManager.currentGame && gameManager.currentGame.handleSwipe) {
                gameManager.currentGame.handleSwipe(data);
            }
        },
        onRelease: function() {
            // 释放事件
        }
    });
    
    // 防止默认触摸行为
    document.addEventListener('touchmove', function(e) {
        e.preventDefault();
    }, { passive: false });
    
    console.log('游戏初始化完成！');
});
