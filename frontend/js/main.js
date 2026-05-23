// 修仙千年 - 主脚本

// 状态管理
const gameState = {
    currentScreen: 'main',
    activityPanelOpen: false,
    spiritPanelOpen: false,
    challengePanelOpen: false,
    battleActive: false,
    round: 1
};

// 切换活动面板
function toggleActivityPanel() {
    gameState.activityPanelOpen = !gameState.activityPanelOpen;
    const panel = document.getElementById('activity-panel');
    if (gameState.activityPanelOpen) {
        panel.classList.add('active');
        // 关闭其他面板
        document.getElementById('spirit-panel').classList.remove('active');
        gameState.spiritPanelOpen = false;
    } else {
        panel.classList.remove('active');
    }
}

// 切换灵气面板
function toggleSpiritPanel() {
    gameState.spiritPanelOpen = !gameState.spiritPanelOpen;
    const panel = document.getElementById('spirit-panel');
    if (gameState.spiritPanelOpen) {
        panel.classList.add('active');
        // 关闭其他面板
        document.getElementById('activity-panel').classList.remove('active');
        gameState.activityPanelOpen = false;
    } else {
        panel.classList.remove('active');
    }
}

// 打开挑战面板
function openChallengePanel() {
    gameState.challengePanelOpen = !gameState.challengePanelOpen;
    const panel = document.getElementById('challenge-panel');
    if (gameState.challengePanelOpen) {
        panel.classList.add('active');
    } else {
        panel.classList.remove('active');
    }
}

// 切换标签
function switchTab(tab) {
    console.log('切换到:', tab);
    showToast('功能开发中...');
}

// 打开角色面板
function openCharacterPanel() {
    showToast('角色面板开发中...');
}

// 显示提示
function showToast(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.9);
        color: var(--moon-white);
        padding: 12px 24px;
        border-radius: 8px;
        z-index: 1000;
        font-size: 14px;
        animation: fadeInOut 2s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 2000);
}

// 添加动画样式
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInOut {
        0% { opacity: 0; }
        20% { opacity: 1; }
        80% { opacity: 1; }
        100% { opacity: 0; }
    }
`;
document.head.appendChild(style);

// 开始战斗
function startBattle(type) {
    console.log('开始战斗:', type);
    gameState.battleActive = true;
    gameState.round = 1;
    
    // 切换到战斗界面
    document.getElementById('main-screen').classList.remove('active');
    document.getElementById('battle-screen').classList.add('active');
    
    // 重置战斗日志
    const log = document.querySelector('.battle-log');
    log.innerHTML = '<div class="log-item">战斗开始！</div>';
    
    // 开始模拟战斗
    setTimeout(() => simulateBattle(), 1000);
}

// 模拟战斗
function simulateBattle() {
    if (!gameState.battleActive) return;
    
    const log = document.querySelector('.battle-log');
    const roundDisplay = document.querySelector('.battle-round');
    
    // 添加战斗日志
    const logs = [
        '韩立使用普通攻击！',
        '妖王受到 500 点伤害！',
        '妖王发动反击！',
        '韩立受到 300 点伤害！',
        '灵狐使用技能！',
        '妖王受到 200 点伤害！'
    ];
    
    logs.forEach((text, index) => {
        setTimeout(() => {
            if (!gameState.battleActive) return;
            const item = document.createElement('div');
            item.className = 'log-item';
            if (text.includes('伤害')) {
                item.classList.add('damage');
            }
            item.textContent = text;
            log.appendChild(item);
            log.scrollTop = log.scrollHeight;
        }, index * 800);
    });
    
    // 更新回合
    setTimeout(() => {
        if (!gameState.battleActive) return;
        gameState.round++;
        roundDisplay.textContent = `回合: ${gameState.round}`;
    }, 1000);
    
    // 更新HP条模拟
    setTimeout(() => {
        if (!gameState.battleActive) return;
        const enemyHp = document.querySelectorAll('.enemy-slot .hp-fill');
        enemyHp[2].style.width = '70%';
        enemyHp[2].parentElement.nextElementSibling.nextElementSibling.textContent = '3500/5000';
    }, 2000);
    
    // 战斗胜利
    setTimeout(() => {
        if (!gameState.battleActive) return;
        endBattle(true);
    }, 6000);
}

// 结束战斗
function endBattle(victory) {
    gameState.battleActive = false;
    
    const resultPopup = document.getElementById('battle-result');
    const resultTitle = resultPopup.querySelector('.result-title');
    
    if (victory) {
        resultTitle.textContent = '🎉 战斗胜利！';
    } else {
        resultTitle.textContent = '💀 战斗失败...';
    }
    
    resultPopup.classList.remove('hidden');
}

// 关闭战斗结果
function closeResult() {
    document.getElementById('battle-result').classList.add('hidden');
    exitBattle();
}

// 退出战斗
function exitBattle() {
    gameState.battleActive = false;
    document.getElementById('battle-screen').classList.remove('active');
    document.getElementById('main-screen').classList.add('active');
}

// 模拟修炼进度增长
function simulateCultivation() {
    const progressFill = document.querySelector('.progress-fill');
    const orbText = document.querySelector('.orb-text');
    const miniFill = document.querySelector('.mini-progress-fill');
    let progress = 75;
    
    setInterval(() => {
        if (progress < 100) {
            progress += 0.1;
            const displayProgress = Math.floor(progress);
            progressFill.style.width = `${displayProgress}%`;
            orbText.textContent = `${displayProgress}%`;
            if (miniFill) {
                miniFill.style.width = `${displayProgress}%`;
            }
        }
    }, 1000);
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log('修仙千年 - 游戏启动');
    
    // 点击空白处关闭面板
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.activity-btn') && !e.target.closest('.activity-panel')) {
            document.getElementById('activity-panel').classList.remove('active');
            gameState.activityPanelOpen = false;
        }
        if (!e.target.closest('.spirit-orb') && !e.target.closest('.spirit-panel')) {
            document.getElementById('spirit-panel').classList.remove('active');
            gameState.spiritPanelOpen = false;
        }
    });
    
    // 开始模拟修炼
    simulateCultivation();
});
