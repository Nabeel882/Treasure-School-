let state = {
    playerName: null,
    unlockedLevels: 1,
    score: 0,
    usedTemplates: {}
};

export function getPlayerName() {
    return state.playerName;
}

export function setPlayerName(name) {
    state.playerName = name;
}

export function getUnlockedLevels() {
    return state.unlockedLevels;
}

export function unlockNextLevel(currentLevel) {
    if (currentLevel >= state.unlockedLevels) {
        state.unlockedLevels = currentLevel + 1;
    }
}

export function getScore() {
    return state.score;
}

export function increaseScore(points) {
    state.score += points;
}

export function deductScore(points) {
    state.score -= points;
    if (state.score < 0) {
        state.score = 0;
    }
}

export function getUsedTemplates() {
    return state.usedTemplates || {};
}

export function addUsedTemplate(levelType, templateIndex) {
    if (!state.usedTemplates) {
        state.usedTemplates = {};
    }
    if (!state.usedTemplates[levelType]) {
        state.usedTemplates[levelType] = [];
    }
    if (!state.usedTemplates[levelType].includes(templateIndex)) {
        state.usedTemplates[levelType].push(templateIndex);
    }
}

export function resetUsedTemplatesForType(levelType) {
    if (state.usedTemplates && state.usedTemplates[levelType]) {
        state.usedTemplates[levelType] = [];
    }
}

export function saveProgress() {
    localStorage.setItem('promptRunnerState', JSON.stringify(state));
}

export function loadProgress() {
    const savedState = localStorage.getItem('promptRunnerState');
    if (savedState) {
        state = JSON.parse(savedState);
        // Ensure usedTemplates exists for older save files
        if (!state.usedTemplates) {
            state.usedTemplates = {};
        }
    }
}

export function resetProgress() {
    const name = state.playerName;
    if (name) {
        state = { playerName: name, unlockedLevels: 1, score: 0, usedTemplates: {} };
    } else {
        state = { playerName: null, unlockedLevels: 1, score: 0, usedTemplates: {} };
    }
    saveProgress();
}