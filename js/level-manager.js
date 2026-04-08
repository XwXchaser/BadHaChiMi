/**
 * 关卡管理器 - 负责加载和解析关卡配置
 */

var LevelManager = (function() {
    var levelsData = null;
    var levels = [];

    /**
     * 加载关卡配置
     * @param {string} url - 配置文件路径
     * @returns {Promise}
     */
    function loadLevels(url) {
        return new Promise(function(resolve, reject) {
            fetch(url)
                .then(function(response) {
                    if (!response.ok) {
                        throw new Error('无法加载关卡配置文件');
                    }
                    return response.json();
                })
                .then(function(data) {
                    levelsData = data;
                    levels = data.levels || [];
                    console.log('关卡配置加载成功，共', levels.length, '个关卡');
                    resolve(levels);
                })
                .catch(function(error) {
                    console.error('加载关卡配置失败:', error);
                    reject(error);
                });
        });
    }

    /**
     * 根据 ID 获取关卡
     * @param {number} id - 关卡 ID
     * @returns {Object|null}
     */
    function getLevelById(id) {
        for (var i = 0; i < levels.length; i++) {
            if (levels[i].id === id) {
                return levels[i];
            }
        }
        return null;
    }

    /**
     * 根据游戏类型获取关卡列表
     * @param {string} gameType - 游戏类型 (fly-hunter | destroyer)
     * @returns {Array}
     */
    function getLevelsByType(gameType) {
        return levels.filter(function(level) {
            return level.gameType === gameType;
        });
    }

    /**
     * 根据难度获取关卡列表
     * @param {string} difficulty - 难度等级 (easy | medium | hard)
     * @returns {Array}
     */
    function getLevelsByDifficulty(difficulty) {
        return levels.filter(function(level) {
            return level.difficulty === difficulty;
        });
    }

    /**
     * 获取所有关卡
     * @returns {Array}
     */
    function getAllLevels() {
        return levels;
    }

    /**
     * 获取关卡数量
     * @returns {number}
     */
    function getLevelCount() {
        return levels.length;
    }

    /**
     * 根据关卡 ID 获取下一个关卡
     * @param {number} currentId - 当前关卡 ID
     * @returns {Object|null}
     */
    function getNextLevel(currentId) {
        var currentIndex = -1;
        for (var i = 0; i < levels.length; i++) {
            if (levels[i].id === currentId) {
                currentIndex = i;
                break;
            }
        }
        if (currentIndex >= 0 && currentIndex < levels.length - 1) {
            return levels[currentIndex + 1];
        }
        return null;
    }

    return {
        loadLevels: loadLevels,
        getLevelById: getLevelById,
        getLevelsByType: getLevelsByType,
        getLevelsByDifficulty: getLevelsByDifficulty,
        getAllLevels: getAllLevels,
        getLevelCount: getLevelCount,
        getNextLevel: getNextLevel
    };
})();

// 暴露到全局作用域
window.LevelManager = LevelManager;
