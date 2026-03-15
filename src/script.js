import {
    KEYBOARD_ROWS,
    CODE_TO_LABEL,
    UNIJOY_DISPLAY_MAP,
    PRE_VOWELS,
    SPLIT_VOWELS,
    K,
    CHAR_TO_ACTIONS
} from './keyboardMapper.js';

// Handles service worker registration, checks for updates, clears cache if a new version is found, and reloads the page
async function handleUpdatesAndServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            await navigator.serviceWorker.register('./sw.js');
        } catch (err) {
            console.error('Service Worker registration failed:', err);
        }
    }

    try {
        const response = await fetch(`public/update.json?t=${Date.now()}`);
        const updateInfo = await response.json();
        const currentVersion = localStorage.getItem('lipi-typing-unmukto') || '0.0.0';

        if (updateInfo.version !== currentVersion) {
            console.log('New update found, clearing cache...');

            if ('caches' in window) {
                const names = await caches.keys();
                await Promise.all(names.map(name => caches.delete(name)));
            }

            localStorage.setItem('lipi-typing-unmukto', updateInfo.version);

            window.location.reload();
            return true;
        }
    } catch (err) {
        console.warn('Update check skipped:', err);
    }
    return false;
}

// Performs a full app reset by clearing caches, localStorage, fetching the latest version, and reloading the page
async function forceCacheUpdate() {

    if (!navigator.onLine) {
        alert(
            "You are currently offline.\n\n" +
            "A hard reset will remove all offline files and the app will not load again until you reconnect to the internet.\n\n" +
            "Please connect to the internet first."
        );
        return;
    }

    const confirmWipe = confirm(
        "⚠ Hard Reset Warning\n\n" +
        "This will completely reset the app.\n\n" +
        "• All cached lessons and app files will be removed.\n" +
        "• Your settings will be reset.\n" +
        "• Offline mode will stop working until the site downloads files again.\n" +
        "• The page will reload immediately.\n\n" +
        "Do you want to proceed?"
    );

    if (!confirmWipe) return;

    const icon = document.getElementById('update-icon');
    if (icon) icon.classList.add('fa-spin');

    try {

        if ('caches' in window) {
            const names = await caches.keys();
            await Promise.all(names.map(name => caches.delete(name)));
        }
        
        localStorage.clear();
        
        const response = await fetch(`public/update.json?t=${Date.now()}`);
        const updateInfo = await response.json();

        localStorage.setItem('lipi-typing-unmukto', updateInfo.version);
        
        window.location.reload();

    } catch (err) {
        console.error('Hard reset failed:', err);

        if (icon) icon.classList.remove('fa-spin');

        alert(
            "Reset failed.\n\n" +
            "Please check your internet connection and try again."
        );
    }
}

// Manages sound effects including toggle, initialization, Icons updates, and playing click, error, and success sounds
class SoundManager {
    constructor() {
        this.ctx = null;
        this.enabled = localStorage.getItem('sound_enabled') === 'true';
        this.updateIcons();
        this.init();
    }

    async toggle() {
        this.enabled = !this.enabled;
        localStorage.setItem('sound_enabled', this.enabled);

        if (this.enabled) {
            const isBlocked = await this.init();
            if (!isBlocked) this.playClick();
        } else {
            this.updateIcons(false);
        }
    }

    async init() {
        if (!this.ctx) {
            this.ctx = new(window.AudioContext || window.webkitAudioContext)();
            this.ctx.onstatechange = () => {
                console.log("State changed to:", this.ctx.state);
                this.updateIcons(this.ctx.state === 'suspended');
            };
        }

        if (this.ctx.state === 'suspended') {
            await this.ctx.resume();
        }

        const isBlocked = this.ctx.state === 'suspended';
        this.updateIcons(isBlocked);
        return isBlocked;
    }

    updateIcons(isBlocked = false) {
        requestAnimationFrame(() => {
            const onIcon = document.getElementById('sound-on-icon');
            const offIcon = document.getElementById('sound-off-icon');
            const toggleBtn = document.getElementById('sound-toggle');

            toggleBtn?.classList.remove('border-red-500', 'text-indigo-500', 'active');

            if (isBlocked && this.enabled) {
                onIcon?.classList.add('hidden');
                offIcon?.classList.remove('hidden');
                toggleBtn?.classList.add('border-red-500');
                toggleBtn?.setAttribute('data-tip', 'Sound is muted in browser settings');
                return;
            }

            if (this.enabled) {
                onIcon?.classList.remove('hidden');
                offIcon?.classList.add('hidden');
                toggleBtn?.classList.add('active', 'text-indigo-500');
                toggleBtn?.classList.remove('text-slate-400');
                toggleBtn?.setAttribute('data-tip', 'Mute sound');
            } else {
                onIcon?.classList.add('hidden');
                offIcon?.classList.remove('hidden');
                toggleBtn?.classList.add('text-slate-400');
                toggleBtn?.setAttribute('data-tip', 'Enable sound');
            }
        });
    }

    playClick() {
        if (!this.enabled) return;
        this.init();
        const now = this.ctx.currentTime;

        const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.05, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < noiseBuffer.length; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        const noiseSource = this.ctx.createBufferSource();
        noiseSource.buffer = noiseBuffer;
        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(1200, now);
        noiseFilter.Q.setValueAtTime(1, now);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.3, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.04);

        noiseSource.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);
        noiseSource.start();

        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.06);

        oscGain.gain.setValueAtTime(0.15, now);
        oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);

        const oscFilter = this.ctx.createBiquadFilter();
        oscFilter.type = 'lowpass';
        oscFilter.frequency.setValueAtTime(400, now);

        osc.connect(oscFilter);
        oscFilter.connect(oscGain);
        oscGain.connect(this.ctx.destination);
        osc.start();
        osc.stop(now + 0.06);
    }

    playError() {
        if (!this.enabled) return;
        this.init();
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(80, now);
        osc.frequency.linearRampToValueAtTime(40, now + 0.2);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

        const lowpass = this.ctx.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.setValueAtTime(200, now);

        osc.connect(lowpass);
        lowpass.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(now + 0.25);
    }

    playSuccess() {
        if (!this.enabled) return;
        this.init();
        const now = this.ctx.currentTime;

        const notes = [440, 554.37, 659.25, 880];
        notes.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + i * 0.1);
            gain.gain.setValueAtTime(0, now + i * 0.1);
            gain.gain.linearRampToValueAtTime(0.2, now + i * 0.1 + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.6);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + i * 0.1);
            osc.stop(now + i * 0.1 + 0.8);
        });
    }
}

const sounds = new SoundManager();

// Holds the current state of the typing app including lessons, progress, typing stats, and session info
let state = {
    lessons: [],
    currentLessonId: null,
    graphemes: [],
    stepIdx: 0,
    subStepIdx: 0,
    typedText: "",
    isCompleted: false,
    startTime: null,
    elapsedSeconds: 0,
    timeLimit: 0,
    lastActivityTime: null,
    isPaused: false,
    isShiftDown: false,
    mistakes: new Set(),
    stats: {
        correct: 0,
        wrong: 0,
        wpm: 0,
        accuracy: 100
    }
};

// Converts total seconds into a MM:SS formatted string
function formatTime(totalSeconds) {
    if (totalSeconds < 0) totalSeconds = 0;
    const mins = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const secs = (totalSeconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
}

// Randomly shuffles the elements of an array in place
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Randomizes the content of the current lesson and triggers UI feedback
function randomizeCurrentLesson() {
    const lesson = state.lessons.find(l => l.id === state.currentLessonId);
    console.log(lesson);
    if (!lesson || (lesson.type !== 'character' && lesson.id !== 'numb-1' && lesson.id !== 'numb-2')) return;

    const characters = lesson.content.split(' ').filter(c => c.trim() !== '');
    const shuffled = shuffleArray([...characters]);
    lesson.content = shuffled.join(' ');

    resetLesson();

    const btn = document.getElementById('randomize-btn');
    btn.classList.add('bg-amber-500', 'text-slate-950');
    setTimeout(() => btn.classList.remove('bg-amber-500', 'text-slate-950'), 500);
}

// Splits Bengla text into its constituent characters and vowel signs
function segmentBangla(text) {
    const regex = /[\u0980-\u09FF][\u09BC]?(\u09CD[\u0980-\u09FF][\u09BC]?)*[\u09BE-\u09CC\u09D7]?[\u0981-\u0983]?|./g;
    return text.match(regex) || [];
}

// Splits Bengla text into symbols including consonant clusters and vowel marks
function segmentBanglaOnlySymbol(text) {
    const regex = /(\u09CD[\u0980-\u09FF][\u09BC]?)|([\u0980-\u09FF][\u09BC]?\u09CD)|([\u0980-\u09FF][\u09BC]?(\u09CD[\u0980-\u09FF][\u09BC]?)*[\u09BE-\u09CC\u09D7]?[\u0981-\u0983]?)|./g;

    return text.match(regex) || [];
}

// Converts a Bengla cluster into a sequence of typing actions for UniJoy keyboard
function getUniJoySequence(cluster) {
    const normalized = cluster
        .replace(/\u09AF\u09BC/g, 'য়')
        .replace(/\u09B0\u09BC/g, 'ড়')
        .replace(/\u09A2\u09BC/g, 'ঢ়');

    const chars = Array.from(normalized);
    let finalActions = [];

    let preVowelFound = null;
    let mainChars = [];

    for (let char of chars) {
        if (SPLIT_VOWELS[char]) {
            const [pre, post] = SPLIT_VOWELS[char];
            preVowelFound = pre;
            mainChars.push(post);
        } else if (PRE_VOWELS.includes(char)) {
            preVowelFound = char;
        } else {
            mainChars.push(char);
        }
    }

    const pushCharActions = (char) => {
        const actions = CHAR_TO_ACTIONS[char] || [K('Space')];
        actions.forEach(action => {
            finalActions.push({
                char: action.label || char,
                actions: [action]
            });
        });
    };

    if (preVowelFound) pushCharActions(preVowelFound);
    mainChars.forEach(pushCharActions);

    return finalActions;
}

// Resets the current lesson state, segments text into graphemes, clears progress and stats, and updates the UI
function resetLesson() {
    let lesson;
    if (state.currentLessonId === 'custom') {
        const customContent = localStorage.getItem('lipi_custom_text') || "আপনার কাস্টম টেক্সট এখানে থাকবে।";
        lesson = {
            id: 'custom',
            name: 'Custom Run',
            content: customContent
        };
    } else {
        lesson = state.lessons.find(l => l.id === state.currentLessonId);
    }

    if (!lesson) return;

    let clusters;
    let specialSymbolLessonIds = ['char-3', 'char-4'];
    if (specialSymbolLessonIds.includes(lesson.id)) {
        clusters = segmentBanglaOnlySymbol(lesson.content);
    } else {
        clusters = segmentBangla(lesson.content);
    }

    state.graphemes = clusters.map((g, idx) => ({
        display: g,
        sequence: getUniJoySequence(g),
        status: 'pending'
    }));

    state.stepIdx = 0;
    state.subStepIdx = 0;
    state.typedText = "";
    state.isCompleted = false;
    state.startTime = null;
    state.elapsedSeconds = 0;
    state.lastActivityTime = null;
    state.isPaused = false;
    state.isShiftDown = false;
    state.mistakes = new Set();
    state.stats = {
        correct: 0,
        wrong: 0,
        wpm: 0,
        accuracy: 100
    };

    hideModals();
    render();

    document.getElementById('pause-indicator').classList.add('hidden');
}

// Sets up the lesson reset modal with confirm/cancel actions, triggers reset animation, calls resetLesson, and shows a toast
window.resetMyLesson = () => {
    const resetModal = document.getElementById("reset-modal");
    const confirmReset = document.getElementById("confirm-reset");
    const cancelReset = document.getElementById("cancel-reset");
    const resetIcon = document.querySelector("#lesson-reset i");
    const toast = document.getElementById("reset-toast");

    if (!resetModal) return;

    resetModal.classList.remove("hidden");

    cancelReset.onclick = () => {
        resetModal.classList.add("hidden");
    };

    resetModal.onclick = (e) => {
        if (e.target === resetModal) {
            resetModal.classList.add("hidden");
        }
    };

    confirmReset.onclick = () => {

        resetModal.classList.add("hidden");

        if (resetIcon) {
            resetIcon.animate(
                [{
                        transform: "rotate(0deg)"
                    },
                    {
                        transform: "rotate(-360deg)"
                    }
                ], {
                    duration: 500,
                    easing: "cubic-bezier(0.34, 1.56, 0.64, 1)"
                }
            );
        }

        if (typeof resetLesson === "function") {
            resetLesson();
        }

        if (toast) {
            toast.classList.remove("hidden");

            setTimeout(() => {
                toast.classList.add("hidden");
            }, 1200);
        }
    };
};

// Displays the result modal with typing stats, shows mistakes or a perfect message, and plays the success sound with animation
function showModal() {
    const modal = document.getElementById('result-modal');
    document.getElementById('modal-wpm').innerText = state.stats.wpm;
    document.getElementById('modal-acc').innerText = state.stats.accuracy;
    document.getElementById('modal-time').innerText = formatTime(state.elapsedSeconds);
    const mistakeContainer = document.getElementById('modal-mistakes');

    mistakeContainer.innerHTML = Array.from(state.mistakes).length > 0 ?
        Array.from(state.mistakes).map(m => {
            const label = m === ' ' ? 'স্পেস' : m;
            return `<span class="px-3 py-1 bg-rose-950/40 text-rose-400 rounded-lg text-lg font-bold border border-rose-900/50">${label}</span>`;
        }).join('') :
        '<span class="font-hind-siliguri text-white-600 italic text-lx">আপনার লিপি টাইপিং একদম নিখুঁত।</span>';
    modal.classList.remove('hidden');
    sounds.playSuccess();
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modal.children[0].classList.remove('scale-95');
    }, 50);
}

// Hides all specified modals with fade-out and scale-down animations
function hideModals() {
    const modals = ['result-modal', 'custom-text-modal', 'time-limit-modal'];

    modals.forEach(id => {
        const m = document.getElementById(id);
        if (!m) return;

        m.classList.add('opacity-0');
        m.firstElementChild?.classList.add('scale-95');
        setTimeout(() => {
            m.classList.add('hidden');
        }, 300);
    });
}

// Shows the custom text modal, validates Bengla input with allowed punctuation, updates character counter, and starts a custom lesson
function showCustomModal() {
    const modal = document.getElementById('custom-text-modal');
    const input = document.getElementById('custom-text-input');
    const startBtn = document.getElementById('custom-text-start');
    const errorEl = document.getElementById('custom-text-error');
    const counterEl = document.getElementById('custom-text-counter');

    const MAX_LEN = 5000;

    errorEl.textContent = '';

    input.setAttribute('maxlength', MAX_LEN);

    input.value = localStorage.getItem('lipi_custom_text') || "";

    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modal.children[0].classList.remove('scale-95');
        document.getElementById('custom-text-input').focus();
    }, 50);

    const allowedCharRegex = /[\u0980-\u09FF\s,!?৳।‘’;:\-“”\/\[\]\{\}\(\)%]/;
    const fullValueRegex = /^[\u0980-\u09FF\s,!?৳।‘’;:\-“”\/\[\]\{\}\(\)%]+$/;

    counterEl.textContent = `${input.value.length} / ${MAX_LEN}`;

    input.oninput = () => {
        let filtered = '';
        let invalidChars = [];

        for (let char of input.value) {
            if (allowedCharRegex.test(char)) {
                filtered += char;
            } else {
                invalidChars.push(char);
            }
        }

        let hitLimit = false;

        if (filtered.length > MAX_LEN) {
            filtered = filtered.slice(0, MAX_LEN);
            hitLimit = true;
        }

        input.value = filtered;
        counterEl.textContent = `${filtered.length} / ${MAX_LEN}`;

        if (hitLimit) {
            errorEl.textContent = `😅 দুঃখিত! সর্বোচ্চ সীমায় পৌঁছে গেছেন (${MAX_LEN})`;
        } else if (invalidChars.length > 0) {
            errorEl.textContent = `⚠ শুধুমাত্র বাংলা অক্ষর ব্যবহার করতে পারবেন। (${invalidChars.join('')})`;
        } else {
            errorEl.textContent = '';
        }
    };

    input.onpaste = (e) => {
        const pasted = (e.clipboardData || window.clipboardData).getData('text');
        if (pasted.length > MAX_LEN) {
            e.preventDefault();
            errorEl.textContent = '⚠ পেস্ট করা লেখা অনেক বড়। ছোট করে দিন।';
        }
    };

    startBtn.onclick = () => {
        const value = input.value.trim();

        if (!value) {
            errorEl.textContent = '⚠ কাস্টম লেখা খালি রাখা যাবে না।';
            input.focus();
            return;
        }

        if (value.length > MAX_LEN) {
            errorEl.textContent = `⚠ সর্বোচ্চ ${MAX_LEN} অক্ষর পর্যন্ত লেখা যাবে।`;
            input.focus();
            return;
        }

        if (!fullValueRegex.test(value)) {
            errorEl.textContent = '⚠ কেবল বাংলা অক্ষর, স্পেস এবং অনুমোদিত পাংচুয়েশন ব্যবহার করতে হবে।';
            input.focus();
            return;
        }

        localStorage.setItem('lipi_custom_text', value);
        state.currentLessonId = 'custom';
        resetLesson();
        hideModals();
    };
}

// Displays the time limit modal with fade-in and scale-up animation
function showTimeLimitModal() {
    const modal = document.getElementById('time-limit-modal');
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modal.children[0].classList.remove('scale-95');
    }, 50);
}

// Sets a new time limit for the lesson, stores it, hides modals, resets the lesson, and updates the UI
window.setTimeLimit = (seconds) => {
    state.timeLimit = seconds;
    localStorage.setItem('lipi_time_limit', seconds);
    hideModals();
    resetLesson();
    updateLimitUI();
};

// Updates the UI to show the current time limit or hides it if no limit is set
function updateLimitUI() {
    const label = document.getElementById('limit-label');
    if (state.timeLimit > 0) {
        label.classList.remove('hidden');
        label.innerText = `Limit: ${formatTime(state.timeLimit)}`;
        document.getElementById('timer-display').innerText = formatTime(state.timeLimit);
    } else {
        label.classList.add('hidden');
        document.getElementById('timer-display').innerText = "00:00";
    }
}

// Renders the lesson content, highlights current grapheme, updates typing stats, progress bar, target key, and keyboard UI
function render() {
    const preview = document.getElementById('lesson-content-preview');
    if (!preview) return;

    preview.innerHTML = state.graphemes.map((g, i) => {
        const status = i < state.stepIdx ?
            'done' :
            (i === state.stepIdx && !state.isCompleted) ?
            'active' :
            (state.isCompleted ? 'done' : '');

        const isSpace = g.display === ' ';
        const spaceClass = isSpace ? 'space' : '';

        return `<span id="cluster-${i}" class="bengali ${status} ${spaceClass}">
                    ${isSpace ? '&nbsp;' : g.display}
                </span>`;
    }).join('');

    const activeIdx = state.isCompleted ? state.graphemes.length - 1 : state.stepIdx;
    const activeEl = document.getElementById(`cluster-${activeIdx}`);
    if (activeEl) {
        activeEl.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center'
        });
    }

    const currentCluster = state.graphemes[state.stepIdx];
    const sequenceItem = currentCluster?.sequence[state.subStepIdx];
    const targetAction = sequenceItem?.actions?.[0];

    let charToDisplay = (sequenceItem?.char || '-');
    if (charToDisplay === ' ') charToDisplay = 'স্পেস';

    document.getElementById('unijoy-char-display').innerText =
        state.isCompleted ? '-' : charToDisplay;

    document.getElementById('latin-key-display').innerHTML =
        (targetAction && !state.isCompleted) ?
        `${targetAction.shift ? '<span class="text-amber-500 mr-1 animate-pulse">⇧</span>' : ''}${CODE_TO_LABEL[targetAction.key] || targetAction.key}` :
        '-';

    const completedCount = state.isCompleted ? state.graphemes.length : state.stepIdx;
    document.getElementById('progress-text').innerText = `${completedCount} / ${state.graphemes.length}`;
    document.getElementById('progress-bar-inner').style.width = `${(completedCount / state.graphemes.length) * 100}%`;
    document.getElementById('wpm-display').innerText = state.stats.wpm;
    document.getElementById('accuracy-display').innerText = state.stats.accuracy;
    document.getElementById('correct-display').innerText = state.stats.correct;
    document.getElementById('wrong-display').innerText = state.stats.wrong;

    if (state.timeLimit > 0) {
        const remaining = state.timeLimit - state.elapsedSeconds;
        document.getElementById('timer-display').innerText = formatTime(remaining);
    } else {
        document.getElementById('timer-display').innerText = formatTime(state.elapsedSeconds);
    }

    const randBtn = document.getElementById('randomize-btn');
    const currentLesson = state.lessons.find(l => l.id === state.currentLessonId);
    if (
        currentLesson &&
        (currentLesson.type === 'character' ||
            currentLesson.id === 'numb-1' ||
            currentLesson.id === 'numb-2')
    ) {
        randBtn.classList.remove('disabled');
    } else {
        randBtn.classList.add('disabled');
    }

    document.querySelectorAll('.keyboard-key').forEach(k => {
        k.classList.remove('active-target', 'shift-warning', 'pulse-glow', 'pulse-glow-amber');
        k.style.opacity = "1";
    });
    document.querySelectorAll('.char-label').forEach(c => c.classList.remove('active-char'));

    if (targetAction && !state.isCompleted) {
        const needsShift = targetAction.shift;
        const hasShift = state.isShiftDown;

        if (needsShift && !hasShift) {
            document.querySelectorAll('[id^="key-Shift"]').forEach(s => s.classList.add('pulse-glow-amber'));
            const keyEl = document.getElementById(`key-${targetAction.key}`);
            if (keyEl) keyEl.style.opacity = "0.4";
        } else {
            const keyEl = document.getElementById(`key-${targetAction.key}`);
            if (keyEl) {
                keyEl.classList.add('active-target', 'pulse-glow');
                const type = targetAction.shift ? 'shifted' : 'unshifted';
                const charEl = keyEl.querySelector(`.char-${type}`);
                if (charEl) charEl.classList.add('active-char');
            }
            if (hasShift) {
                document.querySelectorAll('[id^="key-Shift"]').forEach(s => s.classList.add('active-target'));
            }
        }
    }

    if (state.isCompleted) {
        document.getElementById('completion-state').classList.remove('hidden');
    } else {
        document.getElementById('completion-state').classList.add('hidden');
    }
}

// Handles key presses during typing: checks correctness with shift, updates stats, plays sounds, triggers modals, and updates UI
function handleKeyDown(e) {
    const activeModals = ['result-modal', 'custom-text-modal', 'time-limit-modal', 'welcome-modal', 'rage-modal'];
    const isModalOpen = activeModals.some(id => {
        const el = document.getElementById(id);
        return el && !el.classList.contains('hidden');
    });

    if (isModalOpen) {
        if (e.target.id === 'custom-text-input' || e.target.id === 'custom-limit-input') {
            return;
        }
        return;
    }

    const code = e.code;
    const activeElement = document.activeElement;
    const modalInputs = ['custom-text-input', 'custom-limit-input'];

    if (modalInputs.includes(activeElement.id)) {
        return;
    }

    if (code.startsWith('Shift')) {
        state.isShiftDown = true;
        render();
        return;
    }

    if (['Space', 'Backspace', 'Tab'].includes(code)) e.preventDefault();
    if (state.isCompleted || e.repeat) return;

    if (!state.startTime) {
        state.startTime = Date.now();
        state.lastActivityTime = Date.now();
    }

    if (state.isPaused) {
        state.isPaused = false;
        state.lastActivityTime = Date.now();
        const pauseInd = document.getElementById('pause-indicator');
        if (pauseInd) pauseInd.classList.add('hidden');
    } else {
        state.lastActivityTime = Date.now();
    }

    const currentCluster = state.graphemes[state.stepIdx];
    const sequenceItem = currentCluster?.sequence[state.subStepIdx];
    if (!sequenceItem) return;

    const target = sequenceItem.actions[0];
    const isCorrectKey = code === target.key;
    const isCorrectShift = e.shiftKey === target.shift;

    if (isCorrectKey && isCorrectShift) {
        state.stats.correct++;
        sounds.playClick();

        if (state.subStepIdx + 1 < currentCluster.sequence.length) {
            state.subStepIdx++;
        } else {
            state.typedText += currentCluster.display;
            if (state.stepIdx + 1 < state.graphemes.length) {
                state.stepIdx++;
                state.subStepIdx = 0;
            } else {
                state.isCompleted = true;
                showModal();
            }
        }
    } else {
        sounds.playError();
        if (isCorrectKey && !isCorrectShift) {
            state.mistakes.add(sequenceItem.char);
            document.querySelectorAll('[id^="key-Shift"]').forEach(s => {
                s.classList.add('shift-warning');
                setTimeout(() => s.classList.remove('shift-warning'), 400);
            });
        } else {
            state.stats.wrong++;
            state.mistakes.add(sequenceItem.char);

            const now = Date.now();
            if (!state.recentErrors) state.recentErrors = [];
            if (!state.lastRageWarning) state.lastRageWarning = 0;

            state.recentErrors = state.recentErrors.filter(time => now - time < 1500);
            state.recentErrors.push(now);

            if (state.recentErrors.length >= 10 && (now - state.lastRageWarning > 5000)) {
                state.lastRageWarning = now;
                showRageModal();
                return;
            }

            const keyEl = document.getElementById(`key-${code}`);
            if (keyEl) {
                keyEl.classList.add('error');
                setTimeout(() => keyEl.classList.remove('error'), 300);
            }
        }
    }

    const total = state.stats.correct + state.stats.wrong;
    state.stats.accuracy = total > 0 ? Math.round((state.stats.correct / total) * 100) : 100;
    render();
}

// Tracks Shift key release to update state and re-render the keyboard UI
function handleKeyUp(e) {
    if (e.code.startsWith('Shift')) {
        state.isShiftDown = false;
        render();
    }
}

// Pauses the lesson and displays the rage modal when the user makes repeated errors
function showRageModal() {
    state.isPaused = true;

    const modal = document.getElementById('rage-modal');
    if (!modal) return;

    const panel = modal.firstElementChild;

    modal.classList.remove('hidden', 'opacity-0');
    panel.classList.remove('scale-95');
    panel.classList.add('scale-100');
}

// Closes the rage modal, resumes the lesson, resets recent error tracking, and updates the UI
function closeRageModal() {
    const modal = document.getElementById('rage-modal');
    if (!modal) return;

    const panel = modal.firstElementChild;

    modal.classList.add('opacity-0');
    panel.classList.remove('scale-100');
    panel.classList.add('scale-95');

    setTimeout(() => modal.classList.add('hidden'), 300);

    state.isPaused = false;
    state.lastActivityTime = Date.now();
    state.recentErrors = [];
    state.lastRageWarning = 0;

    render();
}

// Sets up the welcome modal to show on first visit and closes it with animation when the close button is clicked
function setupWelcomeModal() {
    const modal = document.getElementById('welcome-modal');
    const closeBtn = document.getElementById('welcome-close-btn');
    const welcomeShown = localStorage.getItem('lipi_welcome_shown');

    if (!modal || !closeBtn) return;

    function closeModal() {
        modal.classList.add('opacity-0');
        modal.children[0].classList.add('scale-95');

        localStorage.setItem('lipi_welcome_shown', 'true');

        setTimeout(() => {
            modal.classList.add('hidden');
        }, 500);
    }

    closeBtn.addEventListener("click", closeModal);

    if (!welcomeShown) {

        modal.classList.remove('hidden');

        setTimeout(() => {
            modal.classList.remove('opacity-0');
            modal.children[0].classList.remove('scale-95');
        }, 100);

    }
}

// Wraps each Bengla grapheme cluster in a span with Unicode-based class for styling or identification
function wrapClusters(text) {
    const seg = new Intl.Segmenter("bn", {
        granularity: "grapheme"
    });
    const segments = [...seg.segment(text)].map(s => s.segment);

    const result = [];

    for (let i = 0; i < segments.length; i++) {
        let cluster = segments[i];

        if (cluster === "\u09CD" && i + 1 < segments.length) {
            const next = segments[i + 1];

            if (/[\u0995-\u09B9]/.test(next)) {
                cluster = cluster + next;
                i++;
            }
        }

        const codes = Array.from(cluster)
            .map(c => c.codePointAt(0).toString(16).toUpperCase().padStart(4, "0"))
            .join("-");

        const isBn = /[\u0980-\u09FF]/.test(cluster);

        if (isBn) {
            result.push(
                `<span class="bengali u${codes}">${cluster}</span>`
            );
        } else {
            result.push(`<span class="u${codes}">${cluster}</span>`);
        }
    }

    return result.join("");
}

/** Initializes the typing app: registers service worker, loads lessons, sets up keyboard and categories,
attaches event listeners, handles time/typing updates, and starts the first lesson **/
(async function init() {
    try {
        const isUpdating = await handleUpdatesAndServiceWorker();
        if (isUpdating) return;

        const updateBtn = document.getElementById('check-update');
        if (updateBtn) {
            updateBtn.onclick = forceCacheUpdate;
        }

        setupWelcomeModal();

        const res = await fetch('public/lipi_dataset.json');
        state.lessons = await res.json();

        state.timeLimit = parseInt(localStorage.getItem('lipi_time_limit')) || 0;
        updateLimitUI();

        const kbd = document.getElementById('keyboard-container');
        kbd.innerHTML = KEYBOARD_ROWS.map(row => `
            <div class="flex gap-1 md:gap-1.5 justify-center mb-1.5">
                ${row.map(code => {
                    const UniJoy = UNIJOY_DISPLAY_MAP[code];
                    const label = CODE_TO_LABEL[code];
                    let w = 'w-12 md:w-15';
                    if (code === 'Backspace' || code === 'Enter') w = 'w-16 md:w-20';
                    else if (code === 'Tab') w = 'w-12 md:w-14';
                    else if (code === 'CapsLock') w = 'w-14 md:w-16';
                    else if (code.startsWith('Shift')) w = 'w-20 md:w-24';
                    else if (code === 'Space') w = 'w-full max-w-[600px]';

                    return `
                        <div id="key-${code}" class="keyboard-key h-10 md:h-14 flex flex-col items-center justify-center rounded-xl border-b-[3px] bg-slate-800 text-slate-500 border-slate-950 ${w} shrink-0">
                            ${UniJoy ? `
                                <div class="grid grid-cols-2 grid-rows-2 w-full h-full p-1 md:p-2 pointer-events-none">
                                    <span class="text-[14px] md:text-[16px] text-white-500/30 font-bold">${label}</span>
                                    <span class="char-label char-shifted text-[14px] md:text-[16px] text-right text-amber-500 font-bold leading-none">${wrapClusters(UniJoy.shifted)}</span>
                                    <span class="char-label char-unshifted col-start-2 row-start-2 text-[16px] md:text-[18px] text-right text-slate-200 font-black leading-none">${wrapClusters(UniJoy.unshifted)}</span>
                                </div>
                            ` : `<span class="text-[12px] md:text-[14px] font-black uppercase tracking-tighter">${label}</span>`}
                        </div>
                    `;
                }).join('')}
            </div>
        `).join('');

        const categories = [
            { key: 'character', title: 'বর্ণ', icon: 'fa-solid fa-font' },
            { key: 'number', title: 'সংখ্যা', icon: 'fa-solid fa-7' },
            { key: 'word', title: 'শব্দ', icon: 'fa-solid fa-align-center' },
            { key: 'passage', title: 'পাঠ্য', icon: 'fa-solid fa-book-open' }
        ]
        let activeCat = 'character';

        const categoryNav = document.getElementById('category-nav');

        const buildCategoryOnce = () => {
            categoryNav.innerHTML = categories.map((c, i) => `
            <button class="category-tab ${c.key === activeCat ? 'active' : ''}" data-cat="${c.key}" data-index="${i}">
                <i class="${c.icon} text-xs"></i> ${c.title}
            </button>
          `).join('');
        };

        const buildNav = () => {
            document.getElementById('lesson-nav').innerHTML =
                state.lessons
                .filter(l => l.type === activeCat)
                .map(l => `
                <button class="lesson-card ${l.id === state.currentLessonId ? 'active' : ''}"
                        onclick="window.setLesson('${l.id}')">
                  ${l.name}
                </button>
              `).join('');
        };

        buildCategoryOnce();
        let tabs = Array.from(categoryNav.querySelectorAll('.category-tab'));

        const indicator = document.createElement('div');
        indicator.id = 'category-indicator';
        categoryNav.prepend(indicator);

        function updateIndicatorToTab(tab) {
            const parentRect = categoryNav.getBoundingClientRect();
            const rect = tab.getBoundingClientRect();

            indicator.style.width = rect.width + "px";
            indicator.style.transform =
                "translateX(" + (rect.left - parentRect.left) + "px)";
        }

        const activeTab = categoryNav.querySelector('.category-tab.active');
        updateIndicatorToTab(activeTab);

        categoryNav.addEventListener('click', async (e) => {
            const targetTab = e.target.closest('.category-tab');
            if (!targetTab || targetTab.classList.contains('active')) return;

            tabs = Array.from(categoryNav.querySelectorAll('.category-tab'));

            const currentTab = categoryNav.querySelector('.category-tab.active');
            const currentIndex = parseInt(currentTab.dataset.index);
            const targetIndex = parseInt(targetTab.dataset.index);

            const step = targetIndex > currentIndex ? 1 : -1;

            for (let i = currentIndex + step; step > 0 ? i <= targetIndex : i >= targetIndex; i += step) {
                updateIndicatorToTab(tabs[i]);
                await new Promise(res => setTimeout(res, 150));
            }

            tabs.forEach(t => t.classList.remove('active'));
            targetTab.classList.add('active');

            updateIndicatorToTab(targetTab);

            activeCat = targetTab.dataset.cat;
            buildNav();
        });

        window.setLesson = (id) => {
            state.currentLessonId = id;
            resetLesson();
            buildNav();
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        document.getElementById('sound-toggle').addEventListener('click', () => sounds.toggle());
        document.getElementById('show-results-btn').addEventListener('click', showModal);
        document.getElementById('modal-close-btn').addEventListener('click', hideModals);
        document.getElementById('close-rage-modal').addEventListener('click', closeRageModal);
        document.getElementById('modal-restart-btn').addEventListener('click', () => {
            hideModals();
            resetLesson();
        });
        document.getElementById('modal-restart-btn-second').addEventListener('click', () => {
            hideModals();
            resetLesson();
        });
        document.getElementById('custom-text-btn').addEventListener('click', showCustomModal);
        document.getElementById('custom-text-cancel').addEventListener('click', hideModals);
        document.getElementById('custom-text-start').addEventListener('click', () => {
            const txt = document.getElementById('custom-text-input').value.trim();
            if (txt) {
                localStorage.setItem('lipi_custom_text', txt);
                state.currentLessonId = 'custom';
                resetLesson();
            }
        });
        document.getElementById('randomize-btn').addEventListener('click', randomizeCurrentLesson);
        document.getElementById('set-time-limit-btn').addEventListener('click', showTimeLimitModal);
        document.getElementById('time-limit-close').addEventListener('click', hideModals);
        document.getElementById('custom-limit-apply').addEventListener('click', () => {
            const mins = parseInt(document.getElementById('custom-limit-input').value);
            if (mins > 0 && mins <= 60) {
                window.setTimeLimit(mins * 60);
            }
        });

        setInterval(() => {
            if (state.startTime && !state.isCompleted && !state.isPaused) {
                const now = Date.now();

                if (now - state.lastActivityTime > 5000) {
                    state.isPaused = true;
                    document.getElementById('pause-indicator').classList.remove('hidden');
                    return;
                }

                state.elapsedSeconds++;

                if (state.timeLimit > 0 && state.elapsedSeconds >= state.timeLimit) {
                    state.isCompleted = true;
                    showModal();
                }

                const elapsedMins = state.elapsedSeconds / 60;
                state.stats.wpm = elapsedMins > 0 ? Math.round((state.stats.correct / 5) / elapsedMins) : 0;
                document.getElementById('wpm-display').innerText = state.stats.wpm;

                if (state.timeLimit > 0) {
                    const remaining = state.timeLimit - state.elapsedSeconds;
                    document.getElementById('timer-display').innerText = formatTime(remaining);
                } else {
                    document.getElementById('timer-display').innerText = formatTime(state.elapsedSeconds);
                }
            }
        }, 1000);

        window.setLesson(state.lessons[0].id);

    } catch (e) {
        console.error(e);
    }
})();