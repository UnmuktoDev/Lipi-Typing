import {
    UNIJOY_DISPLAY_MAP as UNIJOY_MAP,
    PRE_VOWELS
} from './keyboardMapper.js';

const FULL_VOWELS = {
    'া': 'আ',
    'ি': 'ই',
    'ী': 'ঈ',
    'ু': 'উ',
    'ূ': 'ঊ',
    'ৃ': 'ঋ',
    'ে': 'এ',
    'ৈ': 'ঐ'
};

// UniJoyTypingEngine handles real-time Bengali typing input, managing vowel/hasanta rules and inserting characters correctly into a textarea/input.
class UniJoyTypingEngine {
    constructor(elementId) {
        this.element = document.getElementById(elementId);
        if (!this.element) {
            console.error(`Element with id "${elementId}" not found.`);
            return;
        }
        this.preVowelBuffer = null;
        this.hasHasantaBuffer = false;
        this.enabled = false;
        this.init();
    }
    init() {
        this.element.addEventListener('keydown', (e) => {
            if (!this.enabled) return;
            this.handleKeyDown(e);
        });
    }
    enable() {
        this.enabled = true;
    }
    disable() {
        this.enabled = false;
        this.preVowelBuffer = null;
        this.hasHasantaBuffer = false;
    }
    handleKeyDown(e) {
        if (e.ctrlKey || e.altKey || e.metaKey) return;
        if (['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Tab', 'Enter', 'Escape'].includes(e.code)) {
            this.preVowelBuffer = null;
            this.hasHasantaBuffer = false;
            return;
        }
        const mapping = UNIJOY_MAP[e.code];
        if (!mapping) return;
        const char = e.shiftKey ? mapping.shifted : mapping.unshifted;
        if (this.hasHasantaBuffer) {
            this.hasHasantaBuffer = false;
            const start = this.element.selectionStart;
            if (FULL_VOWELS[char] && this.element.value.charAt(start - 1) === '্') {
                e.preventDefault();
                this.deleteLastChar();
                this.insertText(FULL_VOWELS[char]);
                return;
            }
        }
        if (char === '্') {
            e.preventDefault();
            this.insertText('্');
            this.hasHasantaBuffer = true;
            this.preVowelBuffer = null;
            return;
        }
        if (char === 'া' || char === 'ৗ') {
            const start = this.element.selectionStart;
            const value = this.element.value;
            const lastChar = value.charAt(start - 1);
            if (lastChar === 'ে') {
                e.preventDefault();
                const mergedChar = char === 'া' ? 'ো' : 'ৌ';
                this.element.value = value.substring(0, start - 1) + mergedChar + value.substring(start);
                this.element.selectionStart = this.element.selectionEnd = start;
                this.element.dispatchEvent(new Event('input', {
                    bubbles: true
                }));
                return;
            }
        }
        if (PRE_VOWELS.includes(char) || char === 'র্') {
            e.preventDefault();
            this.preVowelBuffer = char;
            this.hasHasantaBuffer = false;
            return;
        }
        e.preventDefault();
        let textToInsert = char;
        if (this.preVowelBuffer) {
            if (char === ' ') {
                textToInsert = this.preVowelBuffer + ' ';
            } else if (this.preVowelBuffer === 'র্') {
                textToInsert = 'র' + '্' + char;
            } else {
                textToInsert = char + this.preVowelBuffer;
            }
            this.preVowelBuffer = null;
        }
        this.insertText(textToInsert);
    }
    deleteLastChar() {
        const start = this.element.selectionStart;
        const value = this.element.value;
        if (start > 0) {
            this.element.value = value.substring(0, start - 1) + value.substring(start);
            this.element.selectionStart = this.element.selectionEnd = start - 1;
            this.element.dispatchEvent(new Event('input', {
                bubbles: true
            }));
        }
    }
    insertText(text) {
        const start = this.element.selectionStart;
        const end = this.element.selectionEnd;
        const value = this.element.value;
        this.element.value = value.substring(0, start) + text + value.substring(end);
        this.element.selectionStart = this.element.selectionEnd = start + text.length;
        this.element.dispatchEvent(new Event('input', {
            bubbles: true
        }));
    }
}

window.UniJoyTypingEngine = UniJoyTypingEngine;

// Enables or disables Bangla typing mode (UniJoy) for the custom text input and saves the preference
document.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('bangla-typing-toggle');
    const textarea = document.getElementById('custom-text-input');
    if (toggle && textarea) {
        let engine = null;
        const savedValue = localStorage.getItem('lipi_bijoy_mode');
        const savedMode = savedValue === null ? true : savedValue === 'true';
        toggle.checked = savedMode;
        const updateMode = () => {
            if (toggle.checked) {
                if (!engine) {
                    engine = new UniJoyTypingEngine('custom-text-input');
                }
                engine.enable();
                textarea.placeholder = "এখানে আপনি যেকোনো বাংলা লেখা টাইপ করে অনুশীলন করতে পারেন...";
            } else {
                if (engine) engine.disable();
                textarea.placeholder = "এখানে আপনি যেকোনো বাংলা লেখা পেস্ট করে অনুশীলন করতে পারেন...";
            }
            localStorage.setItem('lipi_unijoy_mode', toggle.checked);
        };
        toggle.addEventListener('change', updateMode);
        if (savedMode) updateMode();
    }
});