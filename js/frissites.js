/* =====================================================================
   frissites.js – új kérdésbázis érzékelése
   ---------------------------------------------------------------------
   A GitHubon a kerdesek.js mellett van egy kis kerdesek-verzio.json:
       { "verzio": "2026-11-03 13:05", "darab": 640, "hash": "..." }
   Ezt az Excel-ből induló feltöltő szkript (github-feltoltes.ps1) írja.

   Az app induláskor, a háttérből előjövéskor és 5 percenként megnézi
   ezt a fájlt. Ha a verzió más, mint a betöltött kerdesek.js-é,
   a kezdőképernyőn megjelenik egy sáv "Frissítés most" gombbal.
   Játék közben nem zavar: a sáv csak a kezdőképernyőn látszik.

   PWA: a gomb újratölti az oldalt, a kerdesek.js a GitHubról jön.
   APK: a gomb letölti az új kerdesek.js-t a GitHub Pages-ről, eltárolja
        a telefonon (kerdes-tar.js), majd újratölt – net nélkül is megmarad.
   ===================================================================== */
(function () {

    var VERZIO_URL = JTK_TAR.verzioUrl;
    var ELLENORZES_PERC = 5;
    var SAV_ID = "frissites-sav";
    var talaltUj = null;   // a GitHubon talált újabb verzió adatai
    var CEL_KULCS = "jtkviz-frissites-cel";   // melyik verzióra frissítettünk legutóbb

    /* A betöltött kerdesek.js verziója (a feltöltő szkript írja bele) */
    function betoltottVerzio() {
        return (typeof KERDESEK_VERZIO !== "undefined") ? KERDESEK_VERZIO : null;
    }

    /* Újabb-e a GitHubon lévő? Ha a betöltött fájlban még nincs verzió
       (régi export), a kérdések számát hasonlítjuk össze. */
    function ujabbE(adat) {
        if (!adat) return false;
        var v = betoltottVerzio();
        if (v) return !!adat.verzio && adat.verzio > v;
        return (typeof QUESTIONS !== "undefined") && !!adat.darab && adat.darab !== QUESTIONS.length;
    }

    function kezdokepernyonVanE() {
        var start = document.getElementById("screen-start");
        return !!start && !start.classList.contains("hidden");
    }

    function savMutat() {
        if (!talaltUj || !kezdokepernyonVanE()) return;
        var sav = document.getElementById(SAV_ID);
        if (!sav) {
            sav = document.createElement("div");
            sav.id = SAV_ID;
            sav.style.cssText =
                "position:fixed;left:50%;top:12px;transform:translateX(-50%);z-index:9999;" +
                "background:#002b5c;color:#fff;border:2px solid #4da3ff;border-radius:10px;" +
                "padding:10px 14px;box-shadow:0 4px 16px rgba(0,0,0,.4);font-weight:bold;" +
                "display:flex;gap:12px;align-items:center;max-width:92vw;";
            var szoveg = document.createElement("span");
            szoveg.id = SAV_ID + "-szoveg";
            var gomb = document.createElement("button");
            gomb.textContent = "Frissítés most";
            gomb.style.cssText =
                "background:#4da3ff;color:#002b5c;border:none;border-radius:6px;" +
                "padding:6px 12px;font-weight:bold;cursor:pointer;";
            gomb.onclick = function () {
                try { sessionStorage.setItem(CEL_KULCS, talaltUj.verzio || ""); } catch (e) { }
                if (JTK_TAR.apk) apkLetoltes(gomb); else location.reload();
            };
            sav.appendChild(szoveg);
            sav.appendChild(gomb);
            document.body.appendChild(sav);
        }
        var db = talaltUj.darab ? " (" + talaltUj.darab + " kérdés)" : "";
        var mar = null;
        try { mar = sessionStorage.getItem(CEL_KULCS); } catch (e) { }
        // Ha erre a verzióra már frissítettünk, de még mindig a régi jött le:
        var szoveg = (mar && mar === talaltUj.verzio)
            ? "A frissítés még úton van – próbáld újra 1-2 perc múlva."
            : "Új kérdések érkeztek" + db + "!";
        document.getElementById(SAV_ID + "-szoveg").textContent = szoveg;
        sav.style.display = "flex";
    }

    /* APK: az új kerdesek.js letöltése és eltárolása, aztán újraindítás */
    function apkLetoltes(gomb) {
        gomb.disabled = true;
        gomb.textContent = "Letöltés…";
        fetch(JTK_TAR.kerdesekUrl + "?_=" + Date.now(), { cache: "no-store" })
            .then(function (r) {
                if (!r.ok) throw new Error("HTTP " + r.status);
                return r.text();
            })
            .then(function (szoveg) {
                var e = JTK_TAR.feldolgoz(szoveg);          // hibás fájlt nem mentünk el
                if (e.verzio < talaltUj.verzio) throw new Error("még a régi jött le");
                JTK_TAR.ment(szoveg, e.verzio);
                location.reload();
            })
            .catch(function (hiba) {
                console.warn("Kérdésletöltés sikertelen:", hiba);
                gomb.disabled = false;
                gomb.textContent = "Frissítés most";
                document.getElementById(SAV_ID + "-szoveg").textContent =
                    "A letöltés nem sikerült – próbáld újra 1-2 perc múlva.";
            });
    }

    function savElrejt() {
        var sav = document.getElementById(SAV_ID);
        if (sav) sav.style.display = "none";
    }

    function ellenoriz() {
        if (navigator.onLine === false) return;
        fetch(VERZIO_URL + "?t=" + Date.now(), { cache: "no-store" })
            .then(function (r) { return r.ok ? r.json() : null; })
            .then(function (adat) {
                if (ujabbE(adat)) {
                    talaltUj = adat;
                    savMutat();
                }
            })
            .catch(function () { /* nincs net vagy nincs még verziófájl – nem gond */ });
    }

    /* A sáv csak a kezdőképernyőn látszik: figyeljük, mikor tűnik fel / el */
    function kepernyoFigyelo() {
        var start = document.getElementById("screen-start");
        if (!start || !window.MutationObserver) return;
        new MutationObserver(function () {
            if (kezdokepernyonVanE()) savMutat(); else savElrejt();
        }).observe(start, { attributes: true, attributeFilter: ["class"] });
    }

    window.addEventListener("load", function () {
        kepernyoFigyelo();
        ellenoriz();
        setInterval(ellenoriz, ELLENORZES_PERC * 60 * 1000);
    });

    /* Telefonon az app a háttérből előjőve nem töltődik újra – ilyenkor is nézzük */
    document.addEventListener("visibilitychange", function () {
        if (document.visibilityState === "visible") ellenoriz();
    });

})();
