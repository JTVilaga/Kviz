/* ============================================================
   player.js
   Játékos név + szint kezelése popupból, tartós tárolással
   ============================================================ */

let player = {
    name: "",
    level: 1
};


/* ------------------------------------------------------------
   Játékos betöltése (böngészőből)
   ------------------------------------------------------------ */
function loadPlayer() {
    const saved = localStorage.getItem("player-data");

    if (saved) {
        try {
            player = JSON.parse(saved);
        } catch (e) {
            player = { name: "", level: 1 };
        }
    }

    // Popup mezők frissítése
    const nameInput = document.getElementById("player-name");
    const levelSelect = document.getElementById("player-level");

    if (nameInput && player.name) nameInput.value = player.name;
    if (levelSelect && player.level) levelSelect.value = player.level;

    // *** KEZDŐKÉPERNYŐ FRISSÍTÉSE ***
    updatePlayerBox();
}



/* ------------------------------------------------------------
   Játékos mentése (böngészőbe)
   ------------------------------------------------------------ */

function savePlayer() {
    localStorage.setItem("player-data", JSON.stringify(player));
	// Kezdőképernyő frissítése mentés után
	const nameDisplay = document.getElementById("player-name-display");
	const levelDisplay = document.getElementById("player-level-display");

	if (nameDisplay) {
		nameDisplay.textContent = "Név: " + player.name;
	}

	if (levelDisplay) {
		levelDisplay.textContent = "Szint: Level-" + player.level;
	}
	
}


/* ------------------------------------------------------------
   Form beolvasása
   ------------------------------------------------------------ */

function updatePlayerFromForm() {
    const nameInput = document.getElementById("player-name");
    const levelSelect = document.getElementById("player-level");

    player.name = nameInput.value.trim();
    player.level = parseInt(levelSelect.value);
}


/* ------------------------------------------------------------
   Validálás
   ------------------------------------------------------------ */

function validatePlayer() {
    if (!player.name) {
        alert("Kérlek add meg a neved!");
        return false;
    }

    if (!player.level || player.level < 1 || player.level > 5) {
        alert("Kérlek válassz szintet!");
        return false;
    }

    return true;
}



/* ------------------------------------------------------------
   Popup megnyitása / bezárása
   ------------------------------------------------------------ */

function openPlayerPopup() {
    showPopup("player-popup");
}

function closePlayerPopup() {
    hidePopup("player-popup");
}


/* ------------------------------------------------------------
   Popup gombok működése
   ------------------------------------------------------------ */

function bindPlayerEvents() {
    const btnOk = document.getElementById("btn-player-ok");
    const btnCancel = document.getElementById("btn-player-cancel");

    if (btnOk) {
	btnOk.onclick = function () {
		updatePlayerFromForm();

		if (!validatePlayer()) return;

		savePlayer();
		updatePlayerBox();   // <<< EZ KELL IDE
		closePlayerPopup();
	};

    }

    if (btnCancel) {
        btnCancel.onclick = function () {
            closePlayerPopup();
        };
    }
}

function populateLevelSelect() {
    const levelSelect = document.getElementById("player-level");
    if (!levelSelect) return;

    levelSelect.innerHTML = "";

    for (let lvl = 1; lvl <= 5; lvl++) {
        const opt = document.createElement("option");
        opt.value = lvl;

        const maxPrize = getMaxPrizeForLevel(lvl);
        opt.textContent = `Level ${lvl}  –   Elérhető maximum . ${maxPrize.toLocaleString("hu-HU")}`;

        levelSelect.appendChild(opt);
    }
}

function updatePlayerBox() {
    const nameDisplay = document.getElementById("player-name-display");
    const levelDisplay = document.getElementById("player-level-display");

    if (nameDisplay) {
        nameDisplay.textContent = "Név: " + (player.name || "Nincs megadva");
    }

    if (levelDisplay) {
        const maxPrize = getMaxPrizeForLevel(player.level)
        levelDisplay.textContent =`Szint: Level-${player.level} (max: ${maxPrize.toLocaleString("hu-HU")})`;
    }
}
