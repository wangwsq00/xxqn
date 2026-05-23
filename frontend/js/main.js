const gameState = {
    currentScreen: 'main',
    activityPanelOpen: false,
    spiritPanelOpen: false,
    challengePanelOpen: false,
    battleActive: false,
    round: 1
};

function toggleActivityPanel() {
    gameState.activityPanelOpen = !gameState.activityPanelOpen;
    const panel = document.getElementById('activity-panel');
    panel.classList.toggle('active', gameState.activityPanelOpen);
    if (gameState.activityPanelOpen) {
        document.getElementById('spirit-panel').classList.remove('active');
        gameState.spiritPanelOpen = false;
    }
}

function toggleSpiritPanel() {
    gameState.spiritPanelOpen = !gameState.spiritPanelOpen;
    const panel = document.getElementById('spirit-panel');
    panel.classList.toggle('active', gameState.spiritPanelOpen);
    if (gameState.spiritPanelOpen) {
        document.getElementById('activity-panel').classList.remove('active');
        gameState.activityPanelOpen = false;
    }
}

function openChallengePanel() {
    gameState.challengePanelOpen = !gameState.challengePanelOpen;
    const panel = document.getElementById('challenge-panel');
    panel.classList.toggle('active', gameState.challengePanelOpen);
}

function switchTab(tab) {
    showToast('功能开发中...');
}

function openCharacterPanel() {
    showToast('角色面板开发中...');
}

function showToast(message) {
    const existing = document.querySelector('.toast-msg');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = 'toast-msg';
    toast.textContent = message;
    toast.style.cssText = `
        position:fixed; top:50%; left:50%; transform:translate(-50%,-50%);
        background:rgba(0,0,0,0.9); color:#E8E8E8;
        padding:12px 28px; border-radius:8px; z-index:9999;
        font-size:14px; border:1px solid #2A3550;
        animation: toastAnim 2s ease forwards;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
}

const toastStyle = document.createElement('style');
toastStyle.textContent = `
@keyframes toastAnim {
    0% { opacity:0; transform:translate(-50%,-50%) scale(0.8); }
    15% { opacity:1; transform:translate(-50%,-50%) scale(1); }
    80% { opacity:1; }
    100% { opacity:0; }
}`;
document.head.appendChild(toastStyle);

function startBattle(type) {
    gameState.battleActive = true;
    gameState.round = 1;
    document.getElementById('main-screen').classList.remove('active');
    document.getElementById('battle-screen').classList.add('active');
    const log = document.getElementById('battle-log');
    log.innerHTML = '<div class="log-entry">战斗开始！</div>';
    document.getElementById('round-num').textContent = '1';
    setTimeout(() => simulateBattle(), 1000);
}

function simulateBattle() {
    if (!gameState.battleActive) return;
    const log = document.getElementById('battle-log');
    const logs = [
        { text: '韩立使用普通攻击！', cls: '' },
        { text: '妖王受到 500 点伤害！', cls: 'damage' },
        { text: '妖王发动反击！', cls: '' },
        { text: '韩立受到 300 点伤害！', cls: 'damage' },
        { text: '灵狐使用技能！', cls: '' },
        { text: '妖王受到 200 点伤害！', cls: 'damage' },
    ];
    logs.forEach((item, i) => {
        setTimeout(() => {
            if (!gameState.battleActive) return;
            const el = document.createElement('div');
            el.className = 'log-entry' + (item.cls ? ' ' + item.cls : '');
            el.textContent = item.text;
            log.appendChild(el);
            log.scrollTop = log.scrollHeight;
        }, i * 800);
    });
    setTimeout(() => {
        if (!gameState.battleActive) return;
        gameState.round++;
        document.getElementById('round-num').textContent = gameState.round;
    }, 1000);
    setTimeout(() => {
        if (!gameState.battleActive) return;
        const fills = document.querySelectorAll('.enemy-hp');
        if (fills[0]) fills[0].style.width = '70%';
    }, 2000);
    setTimeout(() => {
        if (!gameState.battleActive) return;
        endBattle(true);
    }, 6000);
}

function endBattle(victory) {
    gameState.battleActive = false;
    const popup = document.getElementById('battle-result');
    const banner = popup.querySelector('.result-banner');
    banner.textContent = victory ? '战斗胜利' : '战斗失败';
    popup.classList.remove('hidden');
}

function closeResult() {
    document.getElementById('battle-result').classList.add('hidden');
    exitBattle();
}

function exitBattle() {
    gameState.battleActive = false;
    document.getElementById('battle-screen').classList.remove('active');
    document.getElementById('main-screen').classList.add('active');
}

document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.activity-entry') && !e.target.closest('#activity-panel')) {
            document.getElementById('activity-panel').classList.remove('active');
            gameState.activityPanelOpen = false;
        }
        if (!e.target.closest('.spirit-orb') && !e.target.closest('#spirit-panel')) {
            document.getElementById('spirit-panel').classList.remove('active');
            gameState.spiritPanelOpen = false;
        }
    });

    const cultFill = document.getElementById('cult-fill');
    let progress = 75;
    setInterval(() => {
        if (progress < 100) {
            progress += 0.1;
            cultFill.style.width = Math.floor(progress) + '%';
        }
    }, 1000);
});
