/* ============================================================
   ui.js
   Képernyők, popupok, táblázatok, DOM műveletek
   ============================================================ */


/* ------------------------------------------------------------
   KÉPERNYŐK VÁLTÁSA
   ------------------------------------------------------------ */
function showScreen(id) {
    const screens = document.querySelectorAll(".screen");
    screens.forEach(function (screen) {
        screen.classList.add("hidden");
    });

    const target = document.getElementById(id);
    if (target) {
        target.classList.remove("hidden");
    }

    const btnHome = document.getElementById("btn-home");
    if (btnHome) {
        if (id === "screen-start") {
            btnHome.classList.add("hidden");
        } else {
            btnHome.classList.remove("hidden");
        }
    }
}


/* ------------------------------------------------------------
   POPUPOK MEGJELENÍTÉSE / ELREJTÉSE
   ------------------------------------------------------------ */

function showPopup(id) {
    const popup = document.getElementById(id);
    if (popup) {
        popup.classList.remove("hidden");
    }
}

function hidePopup(id) {
    const popup = document.getElementById(id);
    if (popup) {
        popup.classList.add("hidden");
    }
}


/* ------------------------------------------------------------
   FELTÁRÁS TÁBLÁZAT – ÜRES SOROK LÉTREHOZÁSA
   (12 sor, 4 oszlop: kérdés, tény, tipp, nyeremény)
   ------------------------------------------------------------ */
function prepareRevealTable() {
    const tbody = document.getElementById("reveal-body");
    if (!tbody) return;

    tbody.classList.remove("revealed-final");
    tbody.innerHTML = "";

    for (let i = 0; i < 12; i++) {
        const tr = document.createElement("tr");

        for (let c = 0; c < 4; c++) {
            const td = document.createElement("td");
            const div = document.createElement("div");
            div.className = "cell-clip";
            td.appendChild(div);
            tr.appendChild(td);
        }

        tbody.appendChild(tr);
    }
}




/* ------------------------------------------------------------
   POPUPOK MEGJELENÍTÉSE / ELREJTÉSE
   ------------------------------------------------------------ */

function showPopup(id) {
    const popup = document.getElementById(id);
    if (popup) {
        popup.classList.remove("hidden");
    }
}

function hidePopup(id) {
    const popup = document.getElementById(id);
    if (popup) {
        popup.classList.add("hidden");
    }
}

/* ------------------------------------------------------------
   ARANYKÖR POPUP MEGNYITÁSA
   ------------------------------------------------------------ */

function openAranykorPopup() {
    const btnNoChange = document.getElementById("btn-no-change");
    const btnContinue = document.getElementById("btn-continue-review");

    if (btnNoChange) btnNoChange.classList.add("hidden");
    if (btnContinue) btnContinue.classList.add("hidden");

    updateAranykorButtonLabels();

    showPopup("popup-aranykor");
}

/* ----------------------------------------------------------------
   LAIKUS VÉDELEM – JOBB KLIKK, KIJELÖLÉS, GYORSBILLENTYŰK
   --------------------------------------------------------------- */

function isEditableTarget(target) {
    if (!target) return false;
    const tag = target.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable;
}


function laikusvedelem(){

    document.addEventListener('contextmenu', function (event) {
        if (isEditableTarget(event.target)) return;
        event.preventDefault();
    }, { passive: false });

    document.addEventListener('selectstart', function (event) {
        if (isEditableTarget(event.target)) return;
        event.preventDefault();
    }, { passive: false });

    document.addEventListener('dragstart', function (event) {
        event.preventDefault();
    }, { passive: false });

    document.addEventListener('keydown', function (event) {
        if (event.key === 'F12') {
            event.preventDefault();
        }
        if (event.ctrlKey && event.key.toLowerCase() === 'u') {
            event.preventDefault();
        }
        if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'i') {
            event.preventDefault();
        }
        if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'j') {
            event.preventDefault();
        }
    });
}

