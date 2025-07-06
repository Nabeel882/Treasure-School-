let audioContext;
const audioBuffers = {};
let musicSource;

export async function initAudio() {
    if (audioContext) return;
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        if (audioContext.state === 'suspended') {
            await audioContext.resume();
        }
        await Promise.all([
            loadSound('success.mp3'),
            loadSound('fail.mp3'),
            loadSound('music.mp3', 'music')
        ]);
    } catch (error) {
        console.error("Audio initialization failed:", error);
    }
}

async function loadSound(url, key) {
    if (!audioContext) return;
    try {
        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        audioBuffers[key || url] = audioBuffer;
    } catch (error) {
        console.error(`Error loading sound: ${url}`, error);
    }
}

export function playSound(url) {
    if (!audioContext || !audioBuffers[url]) return;
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffers[url];
    source.connect(audioContext.destination);
    source.start(0);
}

export function playMusic() {
    // Music is disabled as per user request.
    return;
}