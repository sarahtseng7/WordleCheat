// app.js
// Main application logic - DOM-building counterpart to WordGuessGame.java.
(function () {
    const MAX_BUTTON_ICON_WIDTH = 260;

    const menuScreen = document.getElementById('menu-screen');
    const gameScreen = document.getElementById('game-screen');

    let wordLength, rowCount, columns, fullWordList;
    let boxesState = [];    // boxesState[r][c] = { letter: '', state: EMPTY }
    let boxElements = [];   // boxElements[r][c] = DOM element for that box
    let rowInputs = [];     // rowInputs[r] = the row's <input>

    // -----------------------------------------------------------------
    // Image helpers (crop + graceful text fallback, same pattern as the
    // Java version's buildImageButton()/buildTitleLabel()).
    // -----------------------------------------------------------------

    async function setImageOrFallback(container, src, wFrac, hFrac, fallbackEl) {
        const dataUrl = await cropImage(src, wFrac, hFrac, null);
        container.innerHTML = '';
        if (dataUrl) {
            const img = document.createElement('img');
            img.src = dataUrl;
            img.alt = fallbackEl.textContent;
            container.appendChild(img);
        } else {
            container.appendChild(fallbackEl);
        }
    }

    async function replaceWithImageButton(existingBtn, src, wFrac, hFrac, fallbackText) {
        const dataUrl = await cropImage(src, wFrac, hFrac, MAX_BUTTON_ICON_WIDTH);
        if (dataUrl) {
            existingBtn.classList.add('has-image');
            existingBtn.textContent = '';
            const img = document.createElement('img');
            img.src = dataUrl;
            img.alt = fallbackText;
            existingBtn.title = fallbackText;
            existingBtn.appendChild(img);
        }
    }

    async function makeImageButton(id, src, wFrac, hFrac, fallbackText, onClick) {
        const btn = document.createElement('button');
        btn.id = id;
        btn.className = 'action-btn';
        btn.textContent = fallbackText;
        btn.addEventListener('click', onClick);
        await replaceWithImageButton(btn, src, wFrac, hFrac, fallbackText);
        return btn;
    }

    function fallbackHeading(text, fontSize) {
        const h1 = document.createElement('h1');
        h1.className = 'fallback-title';
        if (fontSize) h1.style.fontSize = fontSize;
        h1.textContent = text;
        return h1;
    }

    // -----------------------------------------------------------------
    // Menu screen
    // -----------------------------------------------------------------

    async function initMenu() {
        const titleSlot = document.getElementById('menu-title');
        await setImageOrFallback(titleSlot, 'images/title.gif', 1, 1, fallbackHeading('Word Guess Helper'));

        const wordleBtn = document.getElementById('wordle-btn');
        const jeffBtn = document.getElementById('jeff-btn');

        await replaceWithImageButton(wordleBtn, 'images/wordle.gif', 1 / 3, 1, 'Wordle (5 letters, 6 tries)');
        await replaceWithImageButton(jeffBtn, 'images/jeff.gif', 1 / 3, 1, 'Jeff Goldblum (12 letters, 3 tries)');

        wordleBtn.addEventListener('click', () => startGame({
            wordLength: 5, rows: 6, columns: 2,
            wordList: WORDLE_WORDS,
            titleSrc: 'images/wordle_title.png', titleFallback: 'Wordle',
            titleWFrac: 2 / 3, titleHFrac: 1 / 2,
        }));
        jeffBtn.addEventListener('click', () => startGame({
            wordLength: 12, rows: 3, columns: 1,
            wordList: JEFF_WORDS,
            titleSrc: 'images/jeff_title.png', titleFallback: 'Jeff Goldblum',
            titleWFrac: 1, titleHFrac: 1 / 2,
        }));
    }

    // -----------------------------------------------------------------
    // Game screen
    // -----------------------------------------------------------------

    async function startGame(opts) {
        wordLength = opts.wordLength;
        gameScreen.style.setProperty('--letter-count', wordLength);
        rowCount = opts.rows;
        columns = opts.columns;
        fullWordList = opts.wordList;

        boxesState = Array.from({ length: rowCount }, () =>
            Array.from({ length: wordLength }, () => ({ letter: '', state: EMPTY }))
        );
        boxElements = Array.from({ length: rowCount }, () => new Array(wordLength));
        rowInputs = new Array(rowCount);

        menuScreen.classList.add('hidden');
        gameScreen.classList.remove('hidden');

        const titleSlot = document.getElementById('game-title');
        await setImageOrFallback(
            titleSlot, opts.titleSrc, opts.titleWFrac, opts.titleHFrac,
            fallbackHeading(opts.titleFallback, '32px')
        );

        buildRows();
        await buildActionButtons();
        await buildBackButton();
        updateResults();
    }

    function buildRows() {
        const container = document.getElementById('rows-container');
        container.innerHTML = '';

        if (columns <= 1) {
            const col = document.createElement('div');
            col.className = 'rows-column';
            for (let r = 0; r < rowCount; r++) col.appendChild(buildRow(r));
            container.appendChild(col);
        } else {
            const perColumn = Math.ceil(rowCount / columns);
            let rowIndex = 0;
            for (let c = 0; c < columns; c++) {
                const col = document.createElement('div');
                col.className = 'rows-column';
                for (let k = 0; k < perColumn && rowIndex < rowCount; k++, rowIndex++) {
                    col.appendChild(buildRow(rowIndex));
                }
                container.appendChild(col);
            }
        }
    }

    function buildRow(rowIndex) {
        const row = document.createElement('div');
        row.className = 'guess-row';

        const label = document.createElement('span');
        label.className = 'guess-label';
        label.textContent = `Guess ${rowIndex + 1}:`;

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'guess-input';
        input.maxLength = wordLength;
        input.autocomplete = 'off';
        input.setAttribute('aria-label', `Guess ${rowIndex + 1}`);
        input.spellcheck = false;
        rowInputs[rowIndex] = input;

        const boxesRow = document.createElement('div');
        boxesRow.className = 'boxes-row';
        for (let c = 0; c < wordLength; c++) {
            const box = document.createElement('div');
            box.className = 'letter-box';
            box.addEventListener('click', () => cycleBox(rowIndex, c));
            boxesRow.appendChild(box);
            boxElements[rowIndex][c] = box;
        }

        // Mirrors the Java row's DocumentFilter (letters only, max length,
        // uppercase) + DocumentListener (mirror letters into the boxes,
        // resetting each box's color when its letter changes).
        input.addEventListener('input', () => {
            const text = input.value.replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, wordLength);
            input.value = text;
            for (let c = 0; c < wordLength; c++) {
                const ch = c < text.length ? text[c] : '';
                if (boxesState[rowIndex][c].letter !== ch) {
                    boxesState[rowIndex][c] = { letter: ch, state: EMPTY };
                }
                renderBox(rowIndex, c);
            }
        });

        row.appendChild(label);
        row.appendChild(input);
        row.appendChild(boxesRow);
        return row;
    }

    function renderBox(r, c) {
        const cell = boxesState[r][c];
        const el = boxElements[r][c];
        el.textContent = cell.letter || '';
        el.className = 'letter-box' + (cell.letter ? ` state-${cell.state}` : '');
    }

    // Cycles white -> gray -> yellow -> green -> white, same as LetterBox.java.
    function cycleBox(r, c) {
        const cell = boxesState[r][c];
        if (!cell.letter) return;
        cell.state = (cell.state + 1) % 4;
        renderBox(r, c);
    }

    async function buildActionButtons() {
        const row = document.querySelector('.action-row');
        row.innerHTML = '';
        const resetBtn = await makeImageButton('reset-btn', 'images/reset.png', 1 / 6, 1 / 2, 'Reset All Boxes', resetAll);
        const updateBtn = await makeImageButton('update-btn', 'images/update.png', 1 / 6, 1 / 2, 'Update Results', updateResults);
        row.appendChild(resetBtn);
        row.appendChild(updateBtn);
    }

    async function buildBackButton() {
        const row = document.querySelector('.back-row');
        row.innerHTML = '';
        const backBtn = await makeImageButton('back-btn', 'images/back.png', 1 / 6, 1 / 2, 'Back to Menu', () => {
            gameScreen.classList.add('hidden');
            menuScreen.classList.remove('hidden');
        });
        row.appendChild(backBtn);
    }

    function resetAll() {
        for (let r = 0; r < rowCount; r++) {
            rowInputs[r].value = '';
            for (let c = 0; c < wordLength; c++) {
                boxesState[r][c] = { letter: '', state: EMPTY };
                renderBox(r, c);
            }
        }
        updateResults();
    }

    function updateResults() {
        const guesses = [];
        for (let r = 0; r < rowCount; r++) {
            const letters = [];
            const states = [];
            let anyLetter = false;
            for (let c = 0; c < wordLength; c++) {
                const cell = boxesState[r][c];
                letters.push(cell.letter ? cell.letter.toLowerCase() : '');
                states.push(cell.letter ? cell.state : EMPTY);
                if (cell.letter) anyLetter = true;
            }
            if (anyLetter) guesses.push({ letters, states });
        }

        const matches = filterWords(fullWordList, guesses).slice().sort();

        const listEl = document.getElementById('result-list');
        listEl.innerHTML = '';
        const shown = Math.min(matches.length, 500);
        const frag = document.createDocumentFragment();
        for (let i = 0; i < shown; i++) {
            const div = document.createElement('div');
            div.textContent = matches[i];
            frag.appendChild(div);
        }
        listEl.appendChild(frag);

        const suffix = matches.length > shown ? `  (showing first ${shown})` : '';
        document.getElementById('result-count').textContent = `Possible words: ${matches.length}${suffix}`;
    }

    document.addEventListener('DOMContentLoaded', initMenu);
})();
