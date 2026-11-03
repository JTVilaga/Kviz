/* =====================================================================
   kerdes-tar.js – letöltött kérdésbázis használata (főleg az APK-hoz)
   ---------------------------------------------------------------------
   Közvetlenül a kerdesek.js UTÁN kell betölteni (index.html).

   Az APK a telefonra csomagolt fájlokból fut, ezért a kérdésfrissítést
   a GitHub Pages-ről tölti le (frissites.js), és itt, a telefonon tárolja.
   Induláskor ez a fájl megnézi: ha a tárolt kérdések újabbak, mint a
   csomagba építettek, azokat használja. Net nélkül is működik.

   A PWA-ban (böngészőben) nem tárol semmit, ott a kerdesek.js mindig
   a GitHubról jön, ezért ott ez a fájl csak a beállításokat adja.
   ===================================================================== */
var JTK_TAR = (function () {

    var OLDAL = "https://jtvilaga.github.io/Kviz/";

    // APK-e? A Capacitor-os app a https://localhost címről fut, port nélkül.
    var apk = !!window.Capacitor ||
              (location.hostname === "localhost" && location.port === "" && location.protocol === "https:");

    var tar = {
        apk: apk,
        kulcs: "jtkviz-kerdesek",
        verzioUrl: apk ? OLDAL + "kerdesek-verzio.json" : "kerdesek-verzio.json",
        kerdesekUrl: apk ? OLDAL + "js/kerdesek.js" : "js/kerdesek.js",

        /* A kerdesek.js szövegéből kiolvassa a kérdéseket és a verziót */
        feldolgoz: function (szoveg) {
            var f = new Function(szoveg +
                "\n;return { kerdesek: QUESTIONS, verzio: (typeof KERDESEK_VERZIO !== 'undefined' ? KERDESEK_VERZIO : '') };");
            var e = f();
            if (!e || !Array.isArray(e.kerdesek) || e.kerdesek.length === 0) throw new Error("Üres kérdésbázis");
            return e;
        },

        /* Letöltött kerdesek.js eltárolása a telefonon */
        ment: function (szoveg, verzio) {
            localStorage.setItem(this.kulcs, JSON.stringify({ verzio: verzio, szoveg: szoveg }));
        }
    };

    if (!apk) return tar;

    // ---- APK induláskor: a tárolt, újabb kérdések betöltése ----
    try {
        var mentett = JSON.parse(localStorage.getItem(tar.kulcs) || "null");
        var beepitett = (typeof KERDESEK_VERZIO !== "undefined") ? KERDESEK_VERZIO : "";
        if (mentett && mentett.verzio && mentett.verzio > beepitett) {
            var e = tar.feldolgoz(mentett.szoveg);
            QUESTIONS.length = 0;
            Array.prototype.push.apply(QUESTIONS, e.kerdesek);
            KERDESEK_VERZIO = e.verzio;
        } else if (mentett) {
            // a csomagba épített már ugyanolyan friss vagy frissebb – a tárolt felesleges
            localStorage.removeItem(tar.kulcs);
        }
    } catch (hiba) {
        console.warn("A tárolt kérdésbázis nem tölthető be, a beépítettet használom.", hiba);
    }

    return tar;
})();
