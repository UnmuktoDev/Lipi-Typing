const tooltip = document.createElement("div");
tooltip.className = "auto-tooltip";
document.body.appendChild(tooltip);

// Shows a tooltip on hover using data-tip attributes and dynamically positions it near the target element
document.addEventListener("mouseover", e => {
    const el = e.target.closest("[data-tip]");
    if (!el) return;

    tooltip.textContent = el.getAttribute("data-tip");

    const rect = el.getBoundingClientRect();

    let place = el.getAttribute("data-tip-pos") || "auto";

    if (place === "auto") {
        place = rect.top < 40 ? "bottom" : "top";
    }

    tooltip.dataset.place = place;

    let top = place === "top" ?
        rect.top - 8 :
        rect.bottom + 8;

    let left = rect.left + rect.width / 2;

    const margin = 8;
    const tipWidth = tooltip.offsetWidth || 80;
    const minLeft = tipWidth / 2 + margin;
    const maxLeft = window.innerWidth - tipWidth / 2 - margin;

    if (left < minLeft) left = minLeft;
    if (left > maxLeft) left = maxLeft;

    tooltip.style.left = left + "px";
    tooltip.style.top = top + "px";

    const arrowX = rect.left + rect.width / 2 - left + tipWidth / 2;
    tooltip.style.setProperty("--arrow-x", arrowX + "px");

    tooltip.classList.add("show");
});

document.addEventListener("mouseout", e => {
    if (e.target.closest("[data-tip]")) {
        tooltip.classList.remove("show");
    }
});

const lowkey = document.getElementById("lowkey");
const modal = document.getElementById("welcome-modal");

let clickCount = 0;
let clickTimer;

lowkey.addEventListener("click", () => {
    clickCount++;

    clearTimeout(clickTimer);
    clickTimer = setTimeout(() => {
        clickCount = 0;
    }, 1000);

    if (clickCount === 5) {
        openWelcomeModal();
        clickCount = 0;
    }
});

function openWelcomeModal() {
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modal.children[0].classList.remove('scale-95');
    }, 100);
}

// ---------------- ELEMENTS ----------------
const typeDropdown = document.getElementById('lesson-type-dropdown');
const lessonsDropdown = document.getElementById('lessons-dropdown');
const textInput = document.getElementById('custom-text-input');
const counter = document.getElementById('custom-text-counter');

// ---------------- CONFIG ----------------
const METADATA_URL = 'lessons/metadata.json';
const LESSONS_FOLDER = 'lessons/';
let metadata = null; // loaded once

// ---------------- LOAD METADATA (once) ----------------
async function loadMetadata() {
    if (metadata) return metadata; // already loaded

    try {
        const res = await fetch(METADATA_URL);
        if (!res.ok) throw new Error('metadata not found');

        metadata = await res.json();
        return metadata;
    } catch (err) {
        console.error(err);
        alert('Failed to load lessons metadata');
        return null;
    }
}

// ---------------- TYPE SELECTED ----------------
typeDropdown.addEventListener('change', async () => {
    const selectedType = typeDropdown.value;

    lessonsDropdown.innerHTML =
        '<option value="">পাঠ্য নির্বাচন করুন...</option>';

    if (!selectedType) {
        lessonsDropdown.classList.add('hidden');
        return;
    }

    const data = await loadMetadata();
    if (!data) return;

    const filtered = data.filter(item => item.type === selectedType);

    // Function to convert number to Bangla digits
    const toBanglaNumber = (num) => {
        const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
        return String(num).split('').map(d => banglaDigits[d] || d).join('');
    };

    filtered.forEach((item, index) => {
        const opt = document.createElement('option');
        opt.value = item.file;
        opt.dataset.title = item.title;
        opt.textContent = `${toBanglaNumber(index + 1)}. ${item.title}`;
        lessonsDropdown.appendChild(opt);
    });

    lessonsDropdown.classList.remove('hidden');
    lessonsDropdown.style.maxHeight = '0';
    lessonsDropdown.style.transition = 'max-height 0.3s ease';
    setTimeout(() => {
        lessonsDropdown.style.maxHeight = '12rem';
    }, 10);
});

// ---------------- LESSON SELECTED ----------------
lessonsDropdown.addEventListener('change', async () => {
    const file = lessonsDropdown.value;
    if (!file) return;

    const selectedTitle =
        lessonsDropdown.selectedOptions[0].dataset.title;

    try {
        const res = await fetch(LESSONS_FOLDER + file);
        if (!res.ok) throw new Error('lesson file missing');

        const data = await res.json();

        const lesson = data.lessons.find(
            l => l.title === selectedTitle
        );

        if (!lesson) {
            alert('Lesson not found in file');
            return;
        }

        textInput.value = lesson.content;
        counter.textContent = `${lesson.content.length} / 5000`;

    } catch (err) {
        console.error(err);
        alert('Failed to load lesson content');
    }
});

// ---------------- TEXT COUNTER ----------------
textInput.addEventListener('input', () => {
    counter.textContent = `${textInput.value.length} / 5000`;
});