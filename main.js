import * as UI from './ui.js';
import * as GameState from './gameState.js';
import * as Audio from './audio.js';
import { generateLevel } from './levels.js';

// --- GAME STATE ---
let currentLevelData = null;
let userAnswer = null;
let timerInterval = null;

// --- GAME FLOW ---
function startLevel(levelNumber) {
    currentLevelData = generateLevel(levelNumber, GameState.getUsedTemplates());
    GameState.addUsedTemplate(currentLevelData.type, currentLevelData.templateIndex);
    userAnswer = null;

    UI.setTheme(currentLevelData.theme);
    UI.updateGameHeader(levelNumber, GameState.getScore());
    UI.resetFeedback();
    UI.toggleGameButtons(true, GameState.getScore());
    
    UI.renderChallenge(currentLevelData, (selectedOption) => {
        userAnswer = selectedOption;
    });

    UI.showScreen(UI.screens.game);
    startTimer();
}

// --- TIMER ---
function startTimer() {
    clearInterval(timerInterval);
    let timeLeft = 60; // 60 seconds per level
    UI.updateTimer(timeLeft);

    timerInterval = setInterval(() => {
        timeLeft--;
        UI.updateTimer(timeLeft);
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            timeUp();
        }
    }, 1000);
}

function timeUp() {
    Audio.playSound('fail.mp3');
    UI.showFeedback(false, "انتهى الوقت! حاول أن تكون أسرع في المرة القادمة.", currentLevelData.correctAnswer, true);
    UI.toggleGameButtons(false);
    UI.hintBtn.style.display = 'none'; // Hide hint button on time up
    UI.skipBtn.style.display = 'none'; // Hide skip button on time up
    UI.checkAnswerBtn.disabled = true;
}

// --- ANSWER EVALUATION ---
function checkAnswer() {
    clearInterval(timerInterval); // Stop timer on answer
    const { type, correctAnswer } = currentLevelData;
    let isCorrect = false;
    let feedback = {};
    let userInput = '';

    switch (type) {
        case 'mcq':
            userInput = userAnswer;
            isCorrect = (userInput === correctAnswer);
            feedback = { isCorrect, feedbackText: isCorrect ? 'اختيار ممتاز!' : 'هذا ليس الخيار الأدق. حاول مرة أخرى.' };
            break;
        case 'forbid':
            userInput = UI.getFreeTextAnswer();
            const forbiddenWord = currentLevelData.forbiddenWord;
            const userWords = userInput.toLowerCase().split(/\s+/);
            if(userWords.includes(forbiddenWord.toLowerCase())) {
                 feedback = { isCorrect: false, feedbackText: `لقد استخدمت الكلمة الممنوعة "${forbiddenWord}"! حاول مرة أخرى.` };
            } else {
                 feedback = evaluateFreeText(userInput, correctAnswer);
            }
            break;
        case 'scramble':
            userInput = UI.getScrambledAnswer();
            isCorrect = (userInput === correctAnswer);
            feedback = { isCorrect, feedbackText: isCorrect ? 'ترتيب رائع!' : 'الترتيب غير صحيح. فكر في بنية الجملة.' };
            break;
        case 'correction':
        case 'creation':
            userInput = UI.getFreeTextAnswer();
            if (userInput.length < 5) {
                feedback = { isCorrect: false, feedbackText: "الأمر قصير جدًا. حاول إضافة المزيد من التفاصيل." };
            } else {
                feedback = evaluateFreeText(userInput, correctAnswer);
            }
            break;
    }
    
    handleFeedback(feedback, correctAnswer);
}

function evaluateFreeText(userInput, idealAnswer) {
    let score = 0;
    const userWords = new Set(userInput.toLowerCase().split(/\s+/));
    const idealWords = new Set(idealAnswer.toLowerCase().split(/\s+/));
    
    let intersection = new Set([...userWords].filter(x => idealWords.has(x)));
    score = (intersection.size / idealWords.size) * 100;
    
    let feedbackText = `نسبة الدقة: ${Math.round(score)}%. `;
    if (score > 90) feedbackText += "إجابة ممتازة وواضحة!";
    else if (score > 70) feedbackText += "جيد جداً، الأمر فعال.";
    else if (score > 50) feedbackText += "بداية جيدة، لكن يمكن إضافة المزيد من التفاصيل لتحسين النتيجة.";
    else feedbackText += "الأمر لا يزال بحاجة للكثير من التحسينات ليكون فعالاً.";
    
    return { isCorrect: score > 50, feedbackText, score };
}

function handleFeedback({ isCorrect, feedbackText, score }, correctAnswer) {
    if (isCorrect) {
        Audio.playSound('success.mp3');
        
        let points = 0;
        // For free-text answers, calculate points based on the score percentage.
        // For other types, use a fixed value.
        if (score !== undefined && (currentLevelData.type === 'correction' || currentLevelData.type === 'creation' || currentLevelData.type === 'forbid')) {
            if (score > 90) points = 30;
            else if (score > 75) points = 25;
            else if (score > 60) points = 20;
            else points = 15; // For scores between 51 and 60
        } else {
            // Default points for non-free-text types like mcq and scramble
            points = 10;
        }

        GameState.increaseScore(points);
        UI.updateScore(GameState.getScore());
        UI.showConfettiEffect();
        
        const currentLevel = parseInt(UI.levelCounter.textContent);
        GameState.unlockNextLevel(currentLevel);

        UI.showFeedback(true, `<span class="feedback-title">أحسنت! +${points} نقطة</span> ${feedbackText}`, correctAnswer);
        UI.toggleGameButtons(false, GameState.getScore());
    } else {
        Audio.playSound('fail.mp3');
        UI.showFeedback(false, feedbackText, correctAnswer, false);
        // Allow retry if it wasn't a time-up failure
        const timeLeft = parseInt(document.getElementById('timer-counter').textContent);

        // Only allow retry if time is not up.
        if (timeLeft > 0) { 
             UI.checkAnswerBtn.disabled = false;
        } else {
            // This case is for when checkAnswer is called after time is already up,
            // which can happen with a fast click. Ensure button stays disabled.
            UI.checkAnswerBtn.disabled = true;
        }
    }
    GameState.saveProgress();
}


// --- HINTS & SKIPS ---
function provideHint() {
    if (GameState.getScore() < 20) {
        alert("ليس لديك نقاط كافية للحصول على تلميح! (التكلفة: 20 نقطة)");
        return;
    }
    GameState.deductScore(20);
    UI.updateScore(GameState.getScore());
    UI.showHint(currentLevelData);
    UI.hintBtn.disabled = true; // Only one hint per level
    UI.skipBtn.disabled = GameState.getScore() < 50; // Re-check skip button
    GameState.saveProgress();
}

function skipLevel() {
    if (GameState.getScore() < 50) {
        alert("ليس لديك نقاط كافية لتخطي المستوى! (التكلفة: 50 نقطة)");
        return;
    }
    clearInterval(timerInterval);
    GameState.deductScore(50);
    const currentLevel = parseInt(UI.levelCounter.textContent);
    GameState.unlockNextLevel(currentLevel); // Unlock next level on skip
    GameState.saveProgress();

    Audio.playSound('fail.mp3');
    UI.showFeedback(false, `لقد تخطيت هذا التحدي وتم خصم 50 نقطة.`, currentLevelData.correctAnswer, false);
    UI.toggleGameButtons(false, GameState.getScore());
}


// --- NAVIGATION ---
function goToLevelSelection() {
    UI.populateLevelSelection(GameState.getUnlockedLevels(), startLevel);
    UI.showScreen(UI.screens.levelSelection);
}


// --- INITIALIZATION ---
function initializeGame() {
    GameState.loadProgress();
    const playerName = GameState.getPlayerName();
    if (playerName) {
        UI.showResumeView(playerName, GameState.getUnlockedLevels() -1);
    }

    // --- EVENT LISTENERS ---
    UI.startGameBtn.addEventListener('click', () => {
        const name = UI.playerNameInput.value.trim();
        if (!name) {
            UI.playerNameInput.style.borderColor = 'red';
            return;
        }
        UI.playerNameInput.style.borderColor = '#ccc';
        Audio.initAudio().then(() => Audio.playMusic());
        GameState.setPlayerName(name);
        GameState.saveProgress();
        goToLevelSelection();
    });

    UI.resumeGameBtn.addEventListener('click', () => {
        Audio.initAudio().then(() => Audio.playMusic());
        goToLevelSelection();
    });
    
    UI.newGameBtn.addEventListener('click', () => {
        if(confirm("هل أنت متأكد أنك تريد بدء لعبة جديدة؟ سيتم مسح تقدمك الحالي.")) {
            Audio.initAudio().then(() => Audio.playMusic());
            const currentName = GameState.getPlayerName();
            GameState.resetProgress();
            GameState.setPlayerName(currentName); // Keep player name
            GameState.saveProgress();
            UI.showResumeView(currentName, 0); // Reset view to level 0
            goToLevelSelection();
        }
    });

    UI.nextLevelBtn.addEventListener('click', goToLevelSelection);
    
    UI.checkAnswerBtn.addEventListener('click', checkAnswer);

    UI.hintBtn.addEventListener('click', provideHint);
    UI.skipBtn.addEventListener('click', skipLevel);
    
    UI.backToMenuBtn.addEventListener('click', () => {
        clearInterval(timerInterval);
        UI.resetTheme();
        goToLevelSelection();
    });

    UI.showScreen(UI.screens.start);
}

document.addEventListener('DOMContentLoaded', initializeGame);