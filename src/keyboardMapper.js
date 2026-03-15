// ===== Keyboard Layout =====
export const KEYBOARD_ROWS = [
  ['Backquote', 'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8', 'Digit9', 'Digit0', 'Minus', 'Equal', 'Backspace'],
  ['Tab', 'KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyY', 'KeyU', 'KeyI', 'KeyO', 'KeyP', 'BracketLeft', 'BracketRight', 'Backslash'],
  ['CapsLock', 'KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK', 'KeyL', 'Semicolon', 'Quote', 'Enter'],
  ['ShiftLeft', 'KeyZ', 'KeyX', 'KeyC', 'KeyV', 'KeyB', 'KeyN', 'KeyM', 'Comma', 'Period', 'Slash', 'ShiftRight'],
  ['Space']
];

// ===== Key Codes to Labels =====
export const CODE_TO_LABEL = {
  Backquote: '`', Digit1: '1', Digit2: '2', Digit3: '3', Digit4: '4', Digit5: '5', Digit6: '6', Digit7: '7', Digit8: '8', Digit9: '9', Digit0: '0',
  Minus: '-', Equal: '=', Backspace: 'BKSP', Tab: 'TAB ↹', Enter: 'ENTER',
  CapsLock: 'CAPS', ShiftLeft: 'SHIFT', ShiftRight: 'SHIFT', Space: 'SPACE',

  KeyQ: 'Q', KeyW: 'W', KeyE: 'E', KeyR: 'R', KeyT: 'T', KeyY: 'Y', KeyU: 'U', KeyI: 'I', KeyO: 'O', KeyP: 'P',
  KeyA: 'A', KeyS: 'S', KeyD: 'D', KeyF: 'F', KeyG: 'G', KeyH: 'H', KeyJ: 'J', KeyK: 'K', KeyL: 'L',
  KeyZ: 'Z', KeyX: 'X', KeyC: 'C', KeyV: 'V', KeyB: 'B', KeyN: 'N', KeyM: 'M',

  BracketLeft: '[', BracketRight: ']', Backslash: '\\', Semicolon: ';', Quote: "'",
  Comma: ',', Period: '.', Slash: '/'
};

// ===== UniJoy Display Map =====
export const UNIJOY_DISPLAY_MAP = {
  KeyQ: { unshifted: 'ঙ', shifted: 'ং' }, KeyW: { unshifted: 'য', shifted: 'য়' }, KeyE: { unshifted: 'ড', shifted: 'ঢ' },
  KeyR: { unshifted: 'প', shifted: 'ফ' }, KeyT: { unshifted: 'ট', shifted: 'ঠ' }, KeyY: { unshifted: 'চ', shifted: 'ছ' },
  KeyU: { unshifted: 'জ', shifted: 'ঝ' }, KeyI: { unshifted: 'হ', shifted: 'ঞ' }, KeyO: { unshifted: 'গ', shifted: 'ঘ' },
  KeyP: { unshifted: 'ড়', shifted: 'ঢ়' },

  BracketLeft: { unshifted: '[', shifted: '{' }, BracketRight: { unshifted: ']', shifted: '}' }, Backslash: { unshifted: 'ৎ', shifted: 'ঃ' },

  KeyA: { unshifted: 'ৃ', shifted: 'র্' }, KeyS: { unshifted: 'ু', shifted: 'ূ' }, KeyD: { unshifted: 'ি', shifted: 'ী' },
  KeyF: { unshifted: 'া', shifted: 'অ' }, KeyG: { unshifted: '্', shifted: '।' }, KeyH: { unshifted: 'ব', shifted: 'ভ' },
  KeyJ: { unshifted: 'ক', shifted: 'খ' }, KeyK: { unshifted: 'ত', shifted: 'থ' }, KeyL: { unshifted: 'দ', shifted: 'ধ' },
  Semicolon: { unshifted: ';', shifted: ':' }, Quote: { unshifted: '’', shifted: '”' },

  KeyZ: { unshifted: '্র', shifted: '্য' }, KeyX: { unshifted: 'ও', shifted: 'ৗ' }, KeyC: { unshifted: 'ে', shifted: 'ৈ' },
  KeyV: { unshifted: 'র', shifted: 'ল' }, KeyB: { unshifted: 'ন', shifted: 'ণ' }, KeyN: { unshifted: 'স', shifted: 'ষ' },
  KeyM: { unshifted: 'ম', shifted: 'শ' }, Comma: { unshifted: ',', shifted: '<' }, Period: { unshifted: '.', shifted: '>' },
  Slash: { unshifted: '/', shifted: '?' },

  Digit1: { unshifted: '১', shifted: '!' }, Digit2: { unshifted: '২', shifted: '@' }, Digit3: { unshifted: '৩', shifted: '#' },
  Digit4: { unshifted: '৪', shifted: '৳' }, Digit5: { unshifted: '৫', shifted: '%' }, Digit6: { unshifted: '৬', shifted: '^' },
  Digit7: { unshifted: '৭', shifted: 'ঁ' }, Digit8: { unshifted: '৮', shifted: '*' }, Digit9: { unshifted: '৯', shifted: '(' },
  Digit0: { unshifted: '০', shifted: ')' }, Equal: { unshifted: '=', shifted: '+' }, Backquote: { unshifted: '‘', shifted: '“' },
  Minus: { unshifted: '-', shifted: '_' }
};

// ===== Pre & Split Vowels =====
export const PRE_VOWELS = ['ি', 'ে', 'ৈ'];
export const SPLIT_VOWELS = { 'ো': ['ে', 'া'], 'ৌ': ['ে', 'ৗ'] };

// ===== Helper Function =====
export const K = (key, shift = false, label = null) => ({ key, shift, label });

// ===== Character to Actions =====
export const CHAR_TO_ACTIONS = {
  // Consonants
  'ক': [K('KeyJ')], 'খ': [K('KeyJ', true)], 'গ': [K('KeyO')], 'ঘ': [K('KeyO', true)], 'ঙ': [K('KeyQ')],
  'চ': [K('KeyY')], 'ছ': [K('KeyY', true)], 'জ': [K('KeyU')], 'ঝ': [K('KeyU', true)], 'ঞ': [K('KeyI', true)],
  'ট': [K('KeyT')], 'ঠ': [K('KeyT', true)], 'ড': [K('KeyE')], 'ঢ': [K('KeyE', true)], 'ণ': [K('KeyB', true)],
  'ত': [K('KeyK')], 'থ': [K('KeyK', true)], 'দ': [K('KeyL')], 'ধ': [K('KeyL', true)], 'ন': [K('KeyB')],
  'প': [K('KeyR')], 'ফ': [K('KeyR', true)], 'ব': [K('KeyH')], 'ভ': [K('KeyH', true)], 'ম': [K('KeyM')],
  'য': [K('KeyW')], 'র': [K('KeyV')], 'ল': [K('KeyV', true)], 'শ': [K('KeyM', true)], 'ষ': [K('KeyN', true)],
  'স': [K('KeyN')], 'হ': [K('KeyI')],
  'ড়': [K('KeyP')], 'ঢ়': [K('KeyP', true)], 'য়': [K('KeyW', true)],

  // Vowel Signs
  'া': [K('KeyF')], 'ি': [K('KeyD')], 'ী': [K('KeyD', true)], 'ু': [K('KeyS')], 'ূ': [K('KeyS', true)],
  'ৃ': [K('KeyA')], 'ে': [K('KeyC')], 'ৈ': [K('KeyC', true)], 'ৗ': [K('KeyX', true)],
  'ো': [K('KeyC', false, 'ে'), K('KeyF', false, 'া')],
  'ৌ': [K('KeyC', false, 'ে'), K('KeyX', true, 'ৗ')],

  // Vowels
  'অ': [K('KeyF', true)],
  'আ': [K('KeyG', false, '্'), K('KeyF', false, 'া')],
  'ই': [K('KeyG', false, '্'), K('KeyD', false, 'ি')],
  'ঈ': [K('KeyG', false, '্'), K('KeyD', true, 'ী')],
  'উ': [K('KeyG', false, '্'), K('KeyS', false, 'ু')],
  'ঊ': [K('KeyG', false, '্'), K('KeyS', true, 'ূ')],
  'ঋ': [K('KeyG', false, '্'), K('KeyA', false, 'ৃ')],
  'এ': [K('KeyG', false, '্'), K('KeyC', false, 'ে')],
  'ঐ': [K('KeyG', false, '্'), K('KeyC', true, 'ৈ')],
  'ও': [K('KeyX')],
  'ঔ': [K('KeyG', false, '্'), K('KeyX', true, 'ৗ')],

  // Marks & Ligatures
  '্': [K('KeyG')], 'ং': [K('KeyQ', true)], 'ঃ': [K('Backslash', true)], 'ঁ': [K('Digit7', true)],
  '্য': [K('KeyZ', true)], '্র': [K('KeyZ')], 'র্': [K('KeyA', true)], 'ৎ': [K('Backslash')],
  '।': [K('KeyG', true)],

  // Numbers
  '১': [K('Digit1')], '২': [K('Digit2')], '৩': [K('Digit3')], '৪': [K('Digit4')], '৫': [K('Digit5')],
  '৬': [K('Digit6')], '৭': [K('Digit7')], '৮': [K('Digit8')], '৯': [K('Digit9')], '০': [K('Digit0')],

  // Punctuation
  ' ': [K('Space')],
  ',': [K('Comma')], ';': [K('Semicolon')], ':': [K('Semicolon', true)], '?': [K('Slash', true)], '!': [K('Digit1', true)],
  '.': [K('Period')], '-': [K('Minus')], '_': [K('Minus', true)], '/': [K('Slash')],
  '৳': [K('Digit4', true)], '%': [K('Digit5', true)],
  '=': [K('Equal')], '+': [K('Equal', true)],
  '(': [K('Digit9', true)], ')': [K('Digit0', true)],
  '[': [K('BracketLeft')], ']': [K('BracketRight')],
  '{': [K('BracketLeft', true)], '}': [K('BracketRight', true)],
  '<': [K('Comma', true)], '>': [K('Period', true)],
  '‘': [K('Backquote')], '’': [K('Quote')], '“': [K('Backquote', true)], '”': [K('Quote', true)]
};