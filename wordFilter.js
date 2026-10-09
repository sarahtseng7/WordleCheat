// wordFilter.js
// Direct port of WordFilterEngine.java's matching algorithm.
//
// State values, same meaning as the Java version:
//   0 = EMPTY  (no color marked yet -> no constraint)
//   1 = GRAY   (letter not in the word)
//   2 = YELLOW (letter in the word, wrong position)
//   3 = GREEN  (letter in the word, correct position)

const EMPTY = 0;
const GRAY = 1;
const YELLOW = 2;
const GREEN = 3;

/**
 * guess = { letters: ['a','b',...], states: [EMPTY, GRAY, ...] }
 * Returns true if `word` is still consistent with this one guess.
 */
function matchesGuess(word, guess) {
    const len = guess.letters.length;
    if (word.length !== len) return false;

    // Green letters must match exactly at their position.
    for (let i = 0; i < len; i++) {
        if (guess.states[i] === GREEN && word[i] !== (guess.letters[i] || '').toLowerCase()) {
            return false;
        }
    }

    // Yellow and gray letters cannot occupy their marked position,
    // including gray duplicates of a letter marked green/yellow elsewhere.
    for (let i = 0; i < len; i++) {
        if ((guess.states[i] === YELLOW || guess.states[i] === GRAY) && word[i] === (guess.letters[i] || '').toLowerCase()) {
            return false;
        }
    }

    // Duplicate-letter handling: figure out, per letter, the minimum number
    // of copies the word must contain (from green + yellow marks), and
    // whether a gray mark caps that letter at exactly that count.
    const minCount = {};
    const capped = {};

    for (let i = 0; i < len; i++) {
        const c = (guess.letters[i] || '').toLowerCase();
        if (!c) continue;
        const state = guess.states[i];
        if (state === GREEN || state === YELLOW) {
            minCount[c] = (minCount[c] || 0) + 1;
        }
    }
    for (let i = 0; i < len; i++) {
        const c = (guess.letters[i] || '').toLowerCase();
        if (!c) continue;
        if (guess.states[i] === GRAY) {
            capped[c] = true;
            if (!(c in minCount)) minCount[c] = 0;
        }
    }

    for (const c in minCount) {
        const needed = minCount[c];
        let actual = 0;
        for (let i = 0; i < word.length; i++) {
            if (word[i] === c) actual++;
        }
        if (actual < needed) return false;
        if (capped[c] && actual !== needed) return false;
    }

    return true;
}

/** Filters candidates down to words consistent with every guess submitted so far. */
function filterWords(candidates, guesses) {
    return candidates.filter((word) => guesses.every((g) => matchesGuess(word, g)));
}
