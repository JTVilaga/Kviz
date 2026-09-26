/* ============================================================
   game-core.js
   A játék logikai magja: kérdések, tippelés, feltárás, Joker,
   Aranykör, Tökéletes szám, végső kiértékelés
   ============================================================ */
  
let questions = [];
  
 /* ============================================================
   Globális nyereményalap (szintenként)
   ============================================================ */

const basePrizeTable = {
    1: 100000,
    2: 200000,
    3: 300000,
    4: 600000
	 /* Aranykör*/
};

const perfectBonus = 100000;

function getMaxPrizeForLevel(level) {
    return basePrizeTable[4] * level + perfectBonus * level;
}


 
 /* ------------------------------------------------------------
   GLOBÁLIS ÁLLAPOTVÁLTOZÓK
   ------------------------------------------------------------ */ 
   
let jokerUsed = false;          // Volt-e Joker
let noWinPossible = false;      // Már nem lehet nyerni a választott Aranykör-sávval
let jokerFixedIndex = null;     // Melyik kérdést javította a Joker (questions/tips index)
let jokerWasUseful = false;     // Talált-e javítandót a Joker
let pendingNextIndex = null;    // A goToNextReveal célindexe, amíg a Joker-popup nyitva van   

let currentQuestionIndex = 0;   // 0–11: éppen melyik kérdésnél tartunk
let tips = new Array(12);       // A játékos tippjei: "IGAZ" / "HAMIS"
let revealOrder = [];           // A kevert feltárási sorrend (indexek 0–11)
let revealIndex = 0;            // Éppen hányadik feltárásnál tartunk

let correctCount = 0;           // Helyes találatok száma (feltáráskor)
let wrongCount = 0;             // Rossz találatok száma (feltáráskor)

let aranykorRange = "";         // "1-3", "4-6", "7-9", "10-12"
let perfectNumber = null;       // Tökéletes szám (pl. 7, 8, 9)
let swappedIndex = null;   // Melyik kérdésnél cserélt a játékos (questions/tips index)
let reviewChoiceMade = false;   // Igaz, ha már cserélt VAGY a "Nem cserélek"-et választotta
let jokerOriginalTip = null;   // A Jóker által felülírt EREDETI (rossz) tipp
let lastFinalPrize = 0;
let gameOverAtIndex = null;   // Hányadik kérdésnél (1-based) dőlt el, hogy már nem nyerhet
/* ------------------------------------------------------------
   JÁTÉK INICIALIZÁLÁSA
   ------------------------------------------------------------ */

function initGame() {
    currentQuestionIndex = 0;
    tips = new Array(12);
    revealOrder = [];
    revealIndex = 0;
    correctCount = 0;
    wrongCount = 0;
    jokerUsed = false;
    jokerFixedIndex = null;
    jokerWasUseful = false;
    pendingNextIndex = null;
    aranykorRange = "";
    perfectNumber = null;
	noWinPossible = false;
	reviewChoiceMade = false;
	swappedIndex = null;
	jokerOriginalTip = null;
    lastFinalPrize = 0;
    gameOverAtIndex = null;	

    showScreen("screen-start");
}


/* ------------------------------------------------------------
   12 KÉRDÉS KIVÁLASZTÁSA SZINT ALAPJÁN
   ------------------------------------------------------------ */

function selectQuestionsByLevel(level) {

    let filtered = [];

    if (level === 1) {
        filtered = QUESTIONS.filter(q => q.level === 1);
    }
    else if (level === 2) {
        filtered = QUESTIONS.filter(q => q.level === 1 || q.level === 2);
    }
    else if (level === 3) {
        filtered = QUESTIONS.filter(q => q.level === 2);
    }
    else if (level === 4) {
        filtered = QUESTIONS.filter(q => q.level === 2 || q.level === 3);
    }
    else if (level === 5) {
        filtered = QUESTIONS.filter(q => q.level === 3);
    }

    const usedIds = getUsedQuestionIds();
    let available = filtered.filter(function (q) {
        return usedIds.indexOf(q.id) === -1;
    });

    if (available.length < 12) {
        clearUsedQuestionIdsForPool(filtered);
        available = filtered.slice();
    }

    for (let i = available.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [available[i], available[j]] = [available[j], available[i]];
    }

    questions = available.slice(0, 12);

    markQuestionsAsUsed(questions);
}


/* ------------------------------------------------------------
   KÉRDÉS MEGJELENÍTÉSE
   ------------------------------------------------------------ */

function showQuestion() {
    const q = questions[currentQuestionIndex];

    const numberElem = document.getElementById("question-number");
    const textElem = document.getElementById("question-text");

    if (numberElem) {
        numberElem.textContent = (currentQuestionIndex + 1) + ". Állítás";
    }

    if (textElem) {
        textElem.textContent = q.text;
    }

    showScreen("screen-question");
}


/* ------------------------------------------------------------
   TIPP RÖGZÍTÉSE
   ------------------------------------------------------------ */

function recordTip(tipValue) {
    tips[currentQuestionIndex] = tipValue;
    currentQuestionIndex++;

    if (currentQuestionIndex < 12) {
        showQuestion();
    } else {
        showReviewScreen();
    }
}


/* ------------------------------------------------------------
   TIPPJEID KÉPERNYŐ
   ------------------------------------------------------------ */

function showReviewScreen() {
    const tbody = document.getElementById("review-body");

    if (tbody) {
        tbody.innerHTML = "";

        for (let i = 0; i < 12; i++) {
            const tr = document.createElement("tr");

            const tdText = document.createElement("td");
            tdText.textContent = questions[i].text;
            tr.appendChild(tdText);

            const tdTip = document.createElement("td");
            const currentTipValue = tips[i] || "";
            tdTip.textContent = currentTipValue;
            tdTip.classList.add("tip-cell");
            if (currentTipValue === "IGAZ") tdTip.classList.add("tip-igaz");
            else if (currentTipValue === "HAMIS") tdTip.classList.add("tip-hamis");
            tr.appendChild(tdTip);

            const tdChange = document.createElement("td");
            const btnChange = document.createElement("button");
            btnChange.className = "btn-csere";
            btnChange.innerHTML =
                '<svg class="csere-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">' +
                '<path d="M7 7h11l-3-3M17 17H6l3 3" stroke="white" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
                '</svg>' +
                '<span>Csere</span>';

            btnChange.addEventListener("click", function () {
                toggleTip(i, tdTip);
            });

            tdChange.appendChild(btnChange);
            tr.appendChild(tdChange);

            tbody.appendChild(tr);
        }
    }
    updateNoChangeButtonVisibility();
    showScreen("screen-review");
}

/* ------------------------------------------------------------
   TIPP CSERÉJE
   ------------------------------------------------------------ */
function toggleTip(index, tdTipElem) {
    if (reviewChoiceMade) {
        alert("Már döntöttél, ezután nem cserélhetsz!");
        return;
    }

    const currentTip = tips[index];
    const newTip = currentTip === "IGAZ" ? "HAMIS" : "IGAZ";

    tips[index] = newTip;
    reviewChoiceMade = true;
    swappedIndex = index;

    if (tdTipElem) {
        tdTipElem.textContent = newTip;
    }

    updateNoChangeButtonVisibility();

    showSwapNotice(function () {
        openAranykorPopup();
    });
}


/* ------------------------------------------------------------
   TÖKÉLETES SZÁM – OPCIÓK FELTÖLTÉSE
   ------------------------------------------------------------ */
function preparePerfectNumberOptions(range) {
    const bonusTextElem = document.getElementById("perfect-bonus-text");
    if (bonusTextElem) {
        const bonusAmount = perfectBonus * player.level;
        bonusTextElem.textContent =
            "Ha pontosan eltalálod, +" + bonusAmount.toLocaleString("hu-HU") + " pont bónuszt kapsz!";
    }

    const container = document.getElementById("perfect-options");


    if (!container) {
        return;
    }

    container.innerHTML = "";

    let also = 1;
    let felso = 3;

    if (range === "1-3") {
        also = 1; felso = 3;
    } else if (range === "4-6") {
        also = 4; felso = 6;
    } else if (range === "7-9") {
        also = 7; felso = 9;
    } else if (range === "10-12") {
        also = 10; felso = 12;
    }

    for (let i = also; i <= felso; i++) {
        const btn = document.createElement("button");
        btn.textContent = i.toString();

        btn.addEventListener("click", function () {
            choosePerfectNumber(i);
        });

        container.appendChild(btn);
    }
}


/* ------------------------------------------------------------
   ARANYKÖR VÁLASZTÁS
   ------------------------------------------------------------ */

function chooseAranykor(range) {
    aranykorRange = range;

    hidePopup("popup-aranykor");
    preparePerfectNumberOptions(range);

    showPopup("popup-perfect");
	
}


/* ------------------------------------------------------------
   TÖKÉLETES SZÁM VÁLASZTÁSA
   ------------------------------------------------------------ */
function choosePerfectNumber(num) {
    perfectNumber = num;

    hidePopup("popup-perfect");

    prepareRevealOrder();

    showPopup("popup-start-reveal");
}


/* ------------------------------------------------------------
   FELTÁRÁSI SORREND
   ------------------------------------------------------------ */
function startRevealSequence() {
    hidePopup("popup-start-reveal");
    showRevealScreen();
}

function prepareRevealOrder() {
    revealOrder = [];

    for (let i = 0; i < 12; i++) {
        revealOrder.push(i);
    }

    for (let i = revealOrder.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [revealOrder[i], revealOrder[j]] = [revealOrder[j], revealOrder[i]];
    }

    revealIndex = 0;
}


/* ------------------------------------------------------------
   FELTÁRÁS KÉPERNYŐ, Az ollo képzés
   ------------------------------------------------------------ */
function showRevealScreen() {
    prepareRevealTable();
    highlightAranykorRows();
    highlightPerfectNumberRow();
    fillAranykorPrizeColumn();

    hidePopup("popup-final-result");

    const buttonsBox = document.getElementById("reveal-final-buttons");
    if (buttonsBox) buttonsBox.classList.add("hidden");

    showNextRevealQuestion();
    showScreen("screen-reveal");
}

/* ------------------------------------------------------------
   KÖVETKEZŐ FELTÁRANDÓ KÉRDÉS
   ------------------------------------------------------------ */

function advanceToReveal(nextIndex) {
    revealIndex = nextIndex;
    showNextRevealQuestion();
}


function showNextRevealQuestion() {
    if (revealIndex >= revealOrder.length) {
        finalEvaluation();
        return;
    }

    const qIndex = revealOrder[revealIndex];
    const q = questions[qIndex];
    const tip = tips[qIndex];

    const questionElem = document.getElementById("reveal-question");
    const tipElem = document.getElementById("reveal-tip");
    const warningElem = document.getElementById("reveal-warning");
    const factBox = document.getElementById("reveal-fact");
    const btnReveal = document.getElementById("btn-reveal");
    const btnNext = document.getElementById("btn-next");
    const popupContent = document.querySelector("#reveal-popup .popup-content");

    if (factBox) factBox.classList.add("hidden");
    if (btnNext) btnNext.classList.add("hidden");
    if (btnReveal) btnReveal.classList.remove("hidden");

    if (popupContent) popupContent.classList.remove("bg-correct", "bg-wrong");
	
	const swappedNoticeElem = document.getElementById("reveal-swapped-notice");
    if (swappedNoticeElem) {
        if (qIndex === swappedIndex) {
            swappedNoticeElem.classList.remove("hidden");
        } else {
            swappedNoticeElem.classList.add("hidden");
        }
    }
	
	

    if (questionElem) questionElem.textContent = q.text;
    if (tipElem) tipElem.textContent = "Tipped: " + (tip || "");

    if (warningElem) {
        if (!canStillWinIfThisCorrect()) {
            warningElem.textContent = "Figyelem: ha ez a válasz is helyes lesz, ezzel már nem nyerhetsz!";
            warningElem.classList.remove("hidden");
        } else {
            warningElem.classList.add("hidden");
        }
    }

    if (btnReveal) {
        btnReveal.onclick = function () {
            revealCurrentQuestion();
        };
    }

    showPopup("reveal-popup");
}


/* ------------------------------------------------------------
   AKTUÁLIS KÉRDÉS FELTÁRÁSA
   ------------------------------------------------------------ */

function revealCurrentQuestion() {
    const qIndex = revealOrder[revealIndex];
    const q = questions[qIndex];
    const tip = tips[qIndex];

    const factBox = document.getElementById("reveal-fact");
    const factTextElem = document.getElementById("fact-text");
    const factExplainElem = document.getElementById("fact-explain");
    const btnReveal = document.getElementById("btn-reveal");
    const btnNext = document.getElementById("btn-next");
    const popupContent = document.querySelector("#reveal-popup .popup-content");

    if (factBox) factBox.classList.remove("hidden");

    const factText = q.fact ? "IGAZ" : "HAMIS";

    if (factTextElem) factTextElem.textContent = "Valójában: " + factText;
    if (factExplainElem) factExplainElem.textContent = q.explain;

    if (btnReveal) btnReveal.classList.add("hidden");
    if (btnNext) {
        btnNext.classList.remove("hidden");
        btnNext.onclick = function () {
            goToNextReveal();
        };
    }

    const isCorrect =
        (q.fact === true && tip === "IGAZ") ||
        (q.fact === false && tip === "HAMIS");

    if (popupContent) {
        popupContent.classList.add(isCorrect ? "bg-correct" : "bg-wrong");
    }

    const tbody = document.getElementById("reveal-body");
    if (!tbody) return;

    const rows = tbody.querySelectorAll("tr");

    let targetRowIndex;
    if (isCorrect) {
        correctCount++;
        targetRowIndex = rows.length - correctCount;
    } else {
        wrongCount++;
        targetRowIndex = wrongCount - 1;
    }

    const targetRow = rows[targetRowIndex];
    if (!targetRow) return;

    const cells = targetRow.querySelectorAll("td");

	
	setCellText(cells, 0, q.text);
	setCellText(cells, 1, factText);
	setCellText(cells, 2, tip || "");

    targetRow.classList.add(isCorrect ? "correct" : "wrong");
  
    if (qIndex === jokerFixedIndex) {
        targetRow.classList.add("joker-green");
    }

     scrollRevealToBottom();
}	



/* ------------------------------------------------------------
   KÖVETKEZŐ FELTÁRÁS
   ------------------------------------------------------------ */
function goToNextReveal() {
    hidePopup("reveal-popup");

    const nextIndex = revealIndex + 1;
    const hasMoreToReveal = nextIndex < revealOrder.length;


    if (hasMoreToReveal && !noWinPossible && isGameOverNow()) {
        noWinPossible = true;
        gameOverAtIndex = revealIndex + 1;
        clearAranykorPrizeColumn();
        pendingNextIndex = nextIndex;
            showGameOverEffect(function () {
            showPopup("popup-game-over");
        });
        return;
    }	

    if (hasMoreToReveal && !jokerUsed && !noWinPossible && revealIndex >= 4 && revealIndex <= 8) {
        pendingNextIndex = nextIndex;
        showPopup("popup-joker-offer");
        return;
    }

    advanceToReveal(nextIndex);
}


/* ------------------------------------------------------------
   JOKER
   ------------------------------------------------------------ */
function useJoker() {
    hidePopup("popup-joker-offer");

    jokerUsed = true;
    fillAranykorPrizeColumn();   // <-- ÚJ: azonnal frissíti a kiírt összeget felezve

    const nextIndex = pendingNextIndex;
    pendingNextIndex = null;

    let foundIndex = null;

    for (let i = nextIndex; i < revealOrder.length; i++) {

        const qIndex = revealOrder[i];
        const q = questions[qIndex];
        const tip = tips[qIndex];

        const isCorrect =
            (q.fact === true && tip === "IGAZ") ||
            (q.fact === false && tip === "HAMIS");

        if (!isCorrect) {
            foundIndex = i;
            break;
        }
    }

    if (foundIndex === null) {
        jokerFixedIndex = null;
        jokerWasUseful = false;
        showJokerEffect(function () {
            advanceToReveal(nextIndex);
        });
        return;
    }

    [revealOrder[nextIndex], revealOrder[foundIndex]] =
        [revealOrder[foundIndex], revealOrder[nextIndex]];

    const qIndex = revealOrder[nextIndex];
    const q = questions[qIndex];

    const originalTip = tips[qIndex];   // EZ tűnne el felülírás nélkül
    tips[qIndex] = q.fact ? "IGAZ" : "HAMIS";

    jokerFixedIndex = qIndex;
    jokerWasUseful = true;
    jokerOriginalTip = originalTip;
    tips[qIndex] = q.fact ? "IGAZ" : "HAMIS";

    jokerFixedIndex = qIndex;
    jokerWasUseful = true;
    jokerOriginalTip = originalTip;

    autoFillJokerRow(qIndex);

    showJokerEffect(function () {
        if (nextIndex + 1 < revealOrder.length && isGameOverNow()) {
            noWinPossible = true;
            gameOverAtIndex = nextIndex + 1;
            clearAranykorPrizeColumn();
            pendingNextIndex = nextIndex + 1;
            showGameOverEffect(function () {
                showPopup("popup-game-over");
            });
            return;
        }

        advanceToReveal(nextIndex + 1);
    });
}



function skipJoker() {
    hidePopup("popup-joker-offer");

    const nextIndex = pendingNextIndex;
    pendingNextIndex = null;

    advanceToReveal(nextIndex);
}

/* ------------------------------------------------------------
   VÉGSŐ KIÉRTÉKELÉS
   ------------------------------------------------------------ */

function finalEvaluation() {
    hidePopup("reveal-popup");

    const totalCorrect = correctCount;

    let also = 0, felso = 0;
    if (aranykorRange === "1-3") { also = 1; felso = 3; }
    else if (aranykorRange === "4-6") { also = 4; felso = 6; }
    else if (aranykorRange === "7-9") { also = 7; felso = 9; }
    else if (aranykorRange === "10-12") { also = 10; felso = 12; }

    const inRange = (totalCorrect >= also && totalCorrect <= felso);

    let basePrize = 0;
    if (aranykorRange === "1-3") basePrize = basePrizeTable[1];
    else if (aranykorRange === "4-6") basePrize = basePrizeTable[2];
    else if (aranykorRange === "7-9") basePrize = basePrizeTable[3];
    else if (aranykorRange === "10-12") basePrize = basePrizeTable[4];
	
	
    let bonus = 0;
    if (perfectNumber !== null && totalCorrect === perfectNumber) {
        bonus = perfectBonus * player.level;
    }

    basePrize = basePrize * player.level;

    let finalPrize = 0;
    if (inRange) {
        finalPrize = basePrize;

        if (jokerUsed) {
            finalPrize = Math.floor(finalPrize / 2);
        }

        finalPrize += bonus;
    }	
	lastFinalPrize = finalPrize;
	
    if (inRange) {
        clearNonFinalPrizeRows();
    }
	

    // const tbody = document.getElementById("reveal-body");
    // if (tbody) tbody.classList.add("revealed-final");
	
	

    const titleElem = document.getElementById("final-result-title");
    const scoreElem = document.getElementById("reveal-final-score");
	const btnJokerInfo = document.getElementById("btn-joker-info");
    if (btnJokerInfo) {
        if (jokerUsed) {
            btnJokerInfo.classList.remove("hidden");
        } else {
            btnJokerInfo.classList.add("hidden");
        }
    }
    if (titleElem) {
        titleElem.textContent = inRange ? "Gratulálunk!" : "Vége a játéknak!";
    }

    if (scoreElem) {
        scoreElem.textContent =
            "Helyes válaszok száma: " + totalCorrect +
            " | Aranykör: " + aranykorRange +
            " | Tökéletes szám: " + (perfectNumber || "-") +
            " | Végső nyeremény: " + finalPrize.toLocaleString("hu-HU") + " pont";
    }
	

    if (inRange) {
        showVictoryEffect(function () {
            showPopup("popup-final-result");
            const buttonsBox = document.getElementById("reveal-final-buttons");
            if (buttonsBox) buttonsBox.classList.remove("hidden");
        });
    } else {
        showPopup("popup-final-result");
        const buttonsBox = document.getElementById("reveal-final-buttons");
        if (buttonsBox) buttonsBox.classList.remove("hidden");
    }	


    const buttonsBox = document.getElementById("reveal-final-buttons");
    if (buttonsBox) buttonsBox.classList.remove("hidden");
}

function autoFillJokerRow(qIndex) {
    const q = questions[qIndex];
    const tip = tips[qIndex];   // már a javított, helyes tipp

    const factText = q.fact ? "IGAZ" : "HAMIS";

    const tbody = document.getElementById("reveal-body");
    if (!tbody) return;

    const rows = tbody.querySelectorAll("tr");

    correctCount++;
    const targetRowIndex = rows.length - correctCount;

    const targetRow = rows[targetRowIndex];
    if (!targetRow) return;

    const cells = targetRow.querySelectorAll("td");

	setCellText(cells, 0, q.text);
	setCellText(cells, 1, factText);
	setCellText(cells, 2, tip || "");
	setCellText(cells, 3, "");	
	

    targetRow.classList.add("correct", "joker-green");
}

function highlightAranykorRows() {
    const tbody = document.getElementById("reveal-body");
    if (!tbody) return;

    const rows = tbody.querySelectorAll("tr");

    let lo = 0, hi = 0;
    if (aranykorRange === "1-3") { lo = 1; hi = 3; }
    else if (aranykorRange === "4-6") { lo = 4; hi = 6; }
    else if (aranykorRange === "7-9") { lo = 7; hi = 9; }
    else if (aranykorRange === "10-12") { lo = 10; hi = 12; }
    else return;

    const startIndex = 12 - hi;
    const endIndex = 12 - lo;

    for (let i = startIndex; i <= endIndex; i++) {
        const row = rows[i];
        if (!row) continue;

        row.classList.add("aranykor-frame");
        if (i === startIndex) row.classList.add("aranykor-top");
        if (i === endIndex) row.classList.add("aranykor-bottom");
    }
}

function highlightPerfectNumberRow() {
    if (perfectNumber === null) return;

    const tbody = document.getElementById("reveal-body");
    if (!tbody) return;

    const rows = tbody.querySelectorAll("tr");
    const rowIndex = 12 - perfectNumber;

    const row = rows[rowIndex];
    if (!row) return;

    row.classList.add("perfect-row");
}

function isGameOverNow() {
    let also = 0, felso = 0;
    if (aranykorRange === "1-3") { also = 1; felso = 3; }
    else if (aranykorRange === "4-6") { also = 4; felso = 6; }
    else if (aranykorRange === "7-9") { also = 7; felso = 9; }
    else if (aranykorRange === "10-12") { also = 10; felso = 12; }
    else return false;

    const maxPossible = 12 - wrongCount;
    const minPossible = correctCount;

    return (minPossible > felso || maxPossible < also);
}

function continueAfterGameOver() {
    hidePopup("popup-game-over");

    const nextIndex = pendingNextIndex;
    pendingNextIndex = null;

    advanceToReveal(nextIndex);
}

function canStillWinIfThisCorrect() {
    let also = 0, felso = 0;
    if (aranykorRange === "1-3") { also = 1; felso = 3; }
    else if (aranykorRange === "4-6") { also = 4; felso = 6; }
    else if (aranykorRange === "7-9") { also = 7; felso = 9; }
    else if (aranykorRange === "10-12") { also = 10; felso = 12; }
    else return true;

    const hypCorrect = correctCount + 1;   // ha EZ a kérdés helyes lenne
    const maxPossible = 12 - wrongCount;   // a többi hátralévő (ezt is beleértve) mind jó
    const minPossible = hypCorrect;        // a többi hátralévő mind rossz

    return !(minPossible > felso || maxPossible < also);
}


function updateNoChangeButtonVisibility() {
    const btnNoChange = document.getElementById("btn-no-change");
    const btnContinue = document.getElementById("btn-continue-review");

    if (reviewChoiceMade) {
        if (btnNoChange) btnNoChange.classList.add("hidden");
        if (btnContinue) btnContinue.classList.remove("hidden");
    } else {
        if (btnNoChange) btnNoChange.classList.remove("hidden");
        if (btnContinue) btnContinue.classList.add("hidden");
    }
}
function showSwapNotice(callback) {
    const overlay = document.getElementById("swap-effect-overlay");
    if (!overlay) {
        if (callback) callback();
        return;
    }

    overlay.classList.remove("hidden", "swap-effect-play");
    void overlay.offsetWidth;
    overlay.classList.add("swap-effect-play");

    setTimeout(function () {
        overlay.classList.add("hidden");
        overlay.classList.remove("swap-effect-play");
        if (callback) callback();
    }, 1400);
}
function showJokerInfo() {
    const textElem = document.getElementById("joker-info-text");

    if (textElem) {
        if (jokerWasUseful && jokerFixedIndex !== null) {
            const q = questions[jokerFixedIndex];
            const correctTip = q.fact ? "IGAZ" : "HAMIS";

            textElem.textContent =
                "Eredeti tipped " + jokerOriginalTip + " volt, ezt javítottuk erre: " + correctTip;
        } else {
            textElem.textContent = "Kár volt elhasználni a Jokert, mert nem volt már rossz válaszod!";
        }
    }

    showPopup("popup-joker-info");
}
function fillAranykorPrizeColumn() {
    let lo = 0, hi = 0, bandIndex = 0;
    if (aranykorRange === "1-3") { lo = 1; hi = 3; bandIndex = 1; }
    else if (aranykorRange === "4-6") { lo = 4; hi = 6; bandIndex = 2; }
    else if (aranykorRange === "7-9") { lo = 7; hi = 9; bandIndex = 3; }
    else if (aranykorRange === "10-12") { lo = 10; hi = 12; bandIndex = 4; }
    else return;

    let basePrize = basePrizeTable[bandIndex] * player.level;
    if (jokerUsed) {
        basePrize = Math.floor(basePrize / 2);
    }

    const bonusPrize = basePrize + perfectBonus * player.level;

    const perfectRowIndex = (perfectNumber !== null) ? (12 - perfectNumber) : null;

    const tbody = document.getElementById("reveal-body");
    if (!tbody) return;

    const rows = tbody.querySelectorAll("tr");

    const startIndex = 12 - hi;
    const endIndex = 12 - lo;

    for (let i = startIndex; i <= endIndex; i++) {
        const row = rows[i];
        if (!row) continue;

        const cells = row.querySelectorAll("td");
        if (!cells[3]) continue;

        const prizeValue = (i === perfectRowIndex) ? bonusPrize : basePrize;
		setCellText(cells, 3, prizeValue.toLocaleString("hu-HU"));
    }
}
function clearAranykorPrizeColumn() {
    const tbody = document.getElementById("reveal-body");
    if (!tbody) return;

    const rows = tbody.querySelectorAll("tr");

    rows.forEach(function (row) {
        const cells = row.querySelectorAll("td");
        if (cells[3]) {
            setCellText(cells, 3, "");
        }
    });
}
function clearNonFinalPrizeRows() {
    let lo = 0, hi = 0;
    if (aranykorRange === "1-3") { lo = 1; hi = 3; }
    else if (aranykorRange === "4-6") { lo = 4; hi = 6; }
    else if (aranykorRange === "7-9") { lo = 7; hi = 9; }
    else if (aranykorRange === "10-12") { lo = 10; hi = 12; }
    else return;

    const finalRowIndex = 12 - correctCount;

    const tbody = document.getElementById("reveal-body");
    if (!tbody) return;

    const rows = tbody.querySelectorAll("tr");

    const startIndex = 12 - hi;
    const endIndex = 12 - lo;

    for (let i = startIndex; i <= endIndex; i++) {
        if (i === finalRowIndex) continue;

        const row = rows[i];
        if (!row) continue;

        const cells = row.querySelectorAll("td");
        if (cells[3]) {
            setCellText(cells, 3, ""); 
        }
    }
}
function downloadResultsCsv() {	
	const now = new Date();
	const dateStr = now.toLocaleDateString("hu-HU");

	// Dátum normalizálása: pontok → kötőjelek, szóközök eltávolítása, végéről kötőjel törlése
	const dateForFilename = dateStr
		.replace(/\./g, "-")
		.replace(/\s+/g, "")     // szóközök törlése
		.replace(/-$/, "");      // utolsó kötőjel törlése

	const pad = n => (n < 10 ? "0" + n : n);
	const timeStr = `${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;

    const safeName = (player.name || "jatekos")
        .trim()
        .replace(/[^a-zA-Z0-9áéíóöőúüűÁÉÍÓÖŐÚÜŰ]+/g, "_");
		

    const cserelt = (swappedIndex !== null) ? "Igen" : "Nem";
    const vettJokert = jokerUsed ? "Igen" : "Nem";
    const kiesesLepese = gameOverAtIndex !== null ? gameOverAtIndex : "";

    let csv = "Játékos;Dátum;Cserélt;Vett Jokert;Zöld végső;Piros végső;Aranykör;Tökéletes szám;Nyeremény összege;Kiesés lépése\n";

    csv += [
        player.name,
        dateStr,
        cserelt,
        vettJokert,
        correctCount,
        wrongCount,
        aranykorRange,
        perfectNumber || "",
        lastFinalPrize,
        kiesesLepese
    ].join(";") + "\n\n";

    csv += "Kérdés;Tény;Tipped\n";

    for (let i = 0; i < 12; i++) {
        const q = questions[i];
        const tip = tips[i];
        const fact = q.fact ? "IGAZ" : "HAMIS";
        const safeText = q.text.replace(/"/g, '""');

        csv += `"${safeText}";${fact};${tip || ""}\n`;
    }

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
	a.download = `${safeName}_${dateForFilename}_${timeStr}.csv`;
    a.click();

    URL.revokeObjectURL(url);
}
function showJokerEffect(callback) {
    const overlay = document.getElementById("joker-effect-overlay");
    if (!overlay) {
        if (callback) callback();
        return;
    }

    overlay.classList.remove("hidden", "joker-effect-play");
    void overlay.offsetWidth;
    overlay.classList.add("joker-effect-play");

    setTimeout(function () {
        overlay.classList.add("hidden");
        overlay.classList.remove("joker-effect-play");
        if (callback) callback();
    }, 2600);
}

function showGameOverEffect(callback) {
    const overlay = document.getElementById("gameover-effect-overlay");
    if (!overlay) {
        if (callback) callback();
        return;
    }

    overlay.classList.remove("hidden", "gameover-effect-play");
    void overlay.offsetWidth;
    overlay.classList.add("gameover-effect-play");

    setTimeout(function () {
        overlay.classList.add("hidden");
        overlay.classList.remove("gameover-effect-play");
        if (callback) callback();
    }, 1800);
}


function showVictoryEffect(callback) {
    const overlay = document.getElementById("victory-effect-overlay");
    if (!overlay) {
        if (callback) callback();
        return;
    }

    overlay.classList.remove("hidden", "victory-effect-play");
    void overlay.offsetWidth;
    overlay.classList.add("victory-effect-play");

    setTimeout(function () {
        overlay.classList.add("hidden");
        overlay.classList.remove("victory-effect-play");
        if (callback) callback();
    }, 1800);
}
function updateAranykorButtonLabels() {
    const aranykorButtons = document.querySelectorAll("#popup-aranykor button[data-range]");

    aranykorButtons.forEach(function (btn) {
        const range = btn.getAttribute("data-range");

        let bandIndex = 0;
        if (range === "1-3") bandIndex = 1;
        else if (range === "4-6") bandIndex = 2;
        else if (range === "7-9") bandIndex = 3;
        else if (range === "10-12") bandIndex = 4;

        const prize = basePrizeTable[bandIndex] * player.level;

        btn.textContent = range.replace("-", "–") + " találat (" + prize.toLocaleString("hu-HU") + " pont)";
    });
}
function setCellText(cells, index, text) {
    const cell = cells[index];
    if (!cell) return;

    const clip = cell.querySelector(".cell-clip");
    if (clip) {
        clip.textContent = text;
    } else {
        cell.textContent = text;
    }
}

function getUsedIdsKey() {
    const safeName = (player.name || "default").trim().toLowerCase();
    return "used-question-ids-" + safeName;
}

function getUsedQuestionIds() {
    try {
        const raw = localStorage.getItem(getUsedIdsKey());
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
}

function markQuestionsAsUsed(qs) {
    const used = getUsedQuestionIds();
    qs.forEach(function (q) {
        if (used.indexOf(q.id) === -1) {
            used.push(q.id);
        }
    });
    localStorage.setItem(getUsedIdsKey(), JSON.stringify(used));
}

function clearUsedQuestionIdsForPool(pool) {
    const poolIds = pool.map(function (q) { return q.id; });
    const used = getUsedQuestionIds().filter(function (id) {
        return poolIds.indexOf(id) === -1;
    });
    localStorage.setItem(getUsedIdsKey(), JSON.stringify(used));
}

function scrollRevealToBottom() {
    const screen = document.getElementById("screen-reveal");
    if (!screen) return;

    requestAnimationFrame(function () {
        screen.scrollTo({
            top: screen.scrollHeight,
            behavior: "smooth"
        });
    });
}

function shareGameLink() {
    if (!navigator.share) return;

    navigator.share({
        url: window.location.href
    }).catch(function () {
        // A felhasználó megszakította a megosztást - nincs teendő
    });
}


function initShareButton() {
    const btnShare = document.getElementById("btn-share");
    if (!btnShare) return;

    if (navigator.share) {
        btnShare.classList.remove("hidden");
    }
}

function initShareButton() {
    const btnShare = document.getElementById("btn-share");
    if (!btnShare) return;

    const isHttp = window.location.protocol === "http:" || window.location.protocol === "https:";

    if (navigator.share && isHttp) {
        btnShare.classList.remove("hidden");
    }
}

function goToStartScreen() {
    const confirmed = confirm("Biztosan megszakítod a jelenlegi játékot, és visszatérsz a kezdőképernyőre?");
    if (!confirmed) return;

    document.querySelectorAll(".popup").forEach(function (popup) {
        popup.classList.add("hidden");
    });

    ["joker-effect-overlay", "swap-effect-overlay", "gameover-effect-overlay", "victory-effect-overlay"].forEach(function (id) {
        const el = document.getElementById(id);
        if (el) el.classList.add("hidden");
    });

    const buttonsBox = document.getElementById("reveal-final-buttons");
    if (buttonsBox) buttonsBox.classList.add("hidden");

    initGame();
    showScreen("screen-start");
}