/* ============================================================
   events.js
   Gombok, kattintások, eseménykötések
   ============================================================ */


/* ------------------------------------------------------------
   ESEMÉNYEK HOZZÁRENDELÉSE
   ------------------------------------------------------------ */

function bindEvents() {

    /* -----------------------------
       START gomb
       ----------------------------- */
    const btnStart = document.getElementById("btn-start");
    if (btnStart) {
        btnStart.onclick = function () {
			
         /* FullScreen ideiglenesen kivéve */
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen().catch(function () {
                    // Ha elutasítja vagy nem támogatott, a játék enélkül is fut tovább
                });
            }
         
            initGame();

            const level = 1;
            selectQuestionsByLevel(player.level);

            currentQuestionIndex = 0;
            showQuestion();
        };
    }


    /* -----------------------------
       Tipp gombok
       ----------------------------- */
    const btnTrue = document.getElementById("btn-true");
    const btnFalse = document.getElementById("btn-false");

    if (btnTrue) {
        btnTrue.onclick = function () {
            recordTip("IGAZ");
        };
    }

    if (btnFalse) {
        btnFalse.onclick = function () {
            recordTip("HAMIS");
        };
    }


    /* -----------------------------
       Tippjeid képernyő – Nem cserélek
       ----------------------------- */

    const btnNoChange = document.getElementById("btn-no-change");
    if (btnNoChange) {
        btnNoChange.onclick = function () {
            reviewChoiceMade = true;
            updateNoChangeButtonVisibility();
            openAranykorPopup();
        };
    }

    /* -----------------------------
       Aranykör popup gombok
       ----------------------------- */
    const aranykorButtons = document.querySelectorAll("#popup-aranykor button");
    aranykorButtons.forEach(function (btn) {
        btn.onclick = function () {
            const range = btn.getAttribute("data-range");
            chooseAranykor(range);
			
        };
    });


    /* -----------------------------
       Új játék gomb
       ----------------------------- */
    const btnNewGame = document.getElementById("btn-new-game");
    if (btnNewGame) {
        btnNewGame.onclick = function () {
            initGame();
        };
    }


    /* -----------------------------
       Játékos módosítása gomb
       ----------------------------- */
	const btnNewPlayer = document.getElementById("btn-new-player");
	if (btnNewPlayer) {
		btnNewPlayer.onclick = function () {
			openPlayerPopup();
		};
	}
	/* -----------------------------
     Játékos módosítása gomb2
    ----------------------------- */
	const btnNewPlayer2 = document.getElementById("btn-new-player2");
	if (btnNewPlayer2) {
		btnNewPlayer2.onclick = function () {
			openPlayerPopup();
		};
	}
   /* -----------------------------
       Jóker felkínáló popup gombjai
       ----------------------------- */
    const btnJokerYes = document.getElementById("btn-joker-yes");
    if (btnJokerYes) {
        btnJokerYes.onclick = function () {
            useJoker();
        };
    }

    const btnJokerNo = document.getElementById("btn-joker-no");
    if (btnJokerNo) {
        btnJokerNo.onclick = function () {
            skipJoker();
        };
    }
	
    /* -----------------------------
       Végső eredmény popup - Bezár
       ----------------------------- */
    const btnFinalClose = document.getElementById("btn-final-close");
    if (btnFinalClose) {
        btnFinalClose.onclick = function () {
            hidePopup("popup-final-result");

            const tbody = document.getElementById("reveal-body");
            if (tbody) tbody.classList.add("revealed-final");
        };
    }	
    const btnGameOverContinue = document.getElementById("btn-game-over-continue");
    if (btnGameOverContinue) {
        btnGameOverContinue.onclick = function () {
            continueAfterGameOver();
        };
    }	
    const btnStartReveal = document.getElementById("btn-start-reveal");
    if (btnStartReveal) {
        btnStartReveal.onclick = function () {
            startRevealSequence();
        };
    }	
    const btnContinueReview = document.getElementById("btn-continue-review");
    if (btnContinueReview) {
        btnContinueReview.onclick = function () {
            openAranykorPopup();
			
        };
    }
	
	const btnJokerInfo = document.getElementById("btn-joker-info");
    if (btnJokerInfo) {
        btnJokerInfo.onclick = function () {
            showJokerInfo();
        };
    }

    const btnJokerInfoClose = document.getElementById("btn-joker-info-close");
    if (btnJokerInfoClose) {
        btnJokerInfoClose.onclick = function () {
            hidePopup("popup-joker-info");
        };
    }
	    const rulesLink = document.querySelector(".rules-link");
    if (rulesLink) {
        rulesLink.onclick = function () {
            showPopup("popup-rules");
        };
    }

    const btnRulesClose = document.getElementById("btn-rules-close");
    if (btnRulesClose) {
        btnRulesClose.onclick = function () {
            hidePopup("popup-rules");
        };
    }
    const btnDownloadCsv = document.getElementById("btn-download-csv");
    if (btnDownloadCsv) {
        btnDownloadCsv.onclick = function () {
            downloadResultsCsv();
        };
    }	
	
}


/* ------------------------------------------------------------
   OLDAL BETÖLTÉSEKOR
   ------------------------------------------------------------ */

window.onload = function () {
    initGame();
    bindEvents();
	loadPlayer();
    bindPlayerEvents();
	populateLevelSelect();


};
