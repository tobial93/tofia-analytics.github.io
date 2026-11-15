(function () {
  "use strict";

  // Fragen: jede Antwort zaehlt 0 bis 3 Punkte.
  var AREAS = [
    {
      id: "daten", name: "Daten zusammenführen", station: "Bauen",
      q: "Wie kommen die Daten aus Ihren Systemen zusammen (ERP, CRM, Shop, Tracking)?",
      a: [
        "Von Hand: Exporte, Kopieren, Excel.",
        "Teils automatisch, aber mit Lücken und viel Handarbeit.",
        "Die wichtigsten Quellen laufen automatisch zusammen.",
        "Alles läuft automatisch an einer zentralen Stelle und ist dokumentiert."
      ],
      low: ["Ihre Daten liegen verstreut und werden von Hand verbunden. Das kostet Zeit und führt zu Fehlern.", "Ich würde die wichtigsten Quellen automatisch an einer zentralen Stelle zusammenführen, zunächst nur die, die Ihre Berichte wirklich brauchen."],
      mid: ["Die Grundlage steht, aber einzelne Quellen oder Schritte hängen noch an Handarbeit.", "Ich würde die verbleibenden Lücken schließen und die Datenflüsse so dokumentieren, dass sie nachvollziehbar bleiben."],
      high: ["Ihre Daten fließen automatisch und zentral zusammen.", "Hier ist kein Handlungsbedarf. Lohnenswert ist höchstens ein Blick auf Kosten und Laufzeiten."]
    },
    {
      id: "vertrauen", name: "Vertrauen in Zahlen", station: "Verstehen",
      q: "Wie oft gibt es Diskussionen darüber, welche Zahl stimmt?",
      a: [
        "Regelmäßig. Jede Abteilung hat eigene Zahlen.",
        "Gelegentlich. Wir müssen oft nachrechnen.",
        "Selten. Die wichtigsten Kennzahlen sind einheitlich definiert.",
        "Praktisch nie. Kennzahlen sind einheitlich definiert und werden geprüft."
      ],
      low: ["Wenn Zahlen angezweifelt werden, werden Entscheidungen langsamer und Berichte verlieren an Wert.", "Ich würde zuerst klären, welche Kennzahlen es gibt, wie sie definiert sind und wo die Abweichungen entstehen. Das ist der Kern des Audits."],
      mid: ["Die meisten Zahlen passen, einzelne Kennzahlen sorgen aber für Rückfragen.", "Ich würde die strittigen Kennzahlen eindeutig definieren und automatisch prüfen lassen."],
      high: ["Ihre Kennzahlen sind einheitlich definiert und werden geprüft.", "Hier ist kein Handlungsbedarf."]
    },
    {
      id: "reporting", name: "Reporting", station: "Bauen",
      q: "Wie entsteht Ihr Monatsreport?",
      a: [
        "Mehrere Tage manueller Arbeit.",
        "Ein bis zwei Tage, teils mit Skripten, teils von Hand.",
        "Weitgehend automatisch, mit kleinen manuellen Schritten.",
        "Vollautomatisch. Die Zahlen sind jederzeit abrufbar."
      ],
      low: ["Ihr Monatsreport bindet jeden Monat mehrere Arbeitstage. Das ist Zeit, die für Analyse fehlt.", "Ich würde den Report automatisieren. In meinem Praxisbeispiel sank der Aufwand von drei Tagen auf eine Stunde."],
      mid: ["Der Report ist weitgehend automatisiert, einzelne Schritte kosten aber noch Zeit.", "Ich würde die verbleibenden manuellen Schritte entfernen und die Zahlen jederzeit abrufbar machen."],
      high: ["Ihr Reporting läuft automatisch.", "Hier ist kein Handlungsbedarf. Interessant wäre eher, ob die Berichte auch genutzt werden."]
    },
    {
      id: "wissen", name: "Wissen im Team", station: "Übergeben",
      q: "Wer versteht Ihre Datenplattform, und was passiert, wenn diese Person ausfällt?",
      a: [
        "Eine Person. Ohne sie steht vieles still.",
        "Eine Person kennt sich aus, es gibt etwas Dokumentation.",
        "Mehrere Personen kennen sie, die Dokumentation ist lückenhaft.",
        "Ein Team versteht sie, sie ist dokumentiert, die Vertretung ist geklärt."
      ],
      low: ["Ihre Plattform hängt an einer Person. Fällt sie aus oder geht, ist das ein Geschäftsrisiko.", "Ich würde die Plattform dokumentieren, Ihr Team schulen und gemeinsam klären, wer sie künftig betreut."],
      mid: ["Das Wissen ist verteilt, aber nicht abgesichert.", "Ich würde die Lücken in der Dokumentation schließen und eine Vertretung aufbauen."],
      high: ["Ihr Team versteht die Plattform und kann sie betreiben.", "Hier ist kein Handlungsbedarf."]
    },
    {
      id: "betrieb", name: "Betrieb", station: "Betreiben",
      q: "Was passiert, wenn nachts eine Datenlieferung ausfällt?",
      a: [
        "Wir merken es erst, wenn jemand falsche Zahlen sieht.",
        "Wir merken es meist am nächsten Tag, die Behebung ist Handarbeit.",
        "Es gibt Warnungen, die Behebung hängt aber an einzelnen Personen.",
        "Automatische Warnung, klare Zuständigkeit, der Wiederanlauf ist geregelt."
      ],
      low: ["Ausfälle fallen spät auf und werden von Hand behoben. Fehlerhafte Berichte können unbemerkt bleiben.", "Ich würde Überwachung und Warnungen einrichten und Zuständigkeiten klären. Auf Wunsch übernehme ich den Betrieb."],
      mid: ["Ausfälle werden bemerkt, die Behebung ist aber noch nicht abgesichert.", "Ich würde den Wiederanlauf klar regeln und eine Vertretung festlegen."],
      high: ["Ihr Betrieb ist abgesichert.", "Hier ist kein Handlungsbedarf."]
    }
  ];

  var LEVELS = [
    { max: 4, name: "Excel-Welt", text: "Ihre Daten laufen vor allem über Handarbeit. Das funktioniert, kostet aber jeden Monat Zeit und ist anfällig für Fehler." },
    { max: 8, name: "Gewachsen", text: "Es gibt Automatisierung, aber sie ist über die Jahre gewachsen. Vieles hängt an einzelnen Lösungen und Personen." },
    { max: 12, name: "Stabil", text: "Die Grundlagen stehen. Es geht um gezielte Lücken, nicht um einen Neubau." },
    { max: 15, name: "Souverän", text: "Ihre Plattform ist in guter Verfassung. Ein Blick von außen kann Feinschliff und Kosten betreffen." }
  ];

  var PRICES = {
    "Verstehen": "2.900 €",
    "Bauen": "ab 30.000 €",
    "Übergeben": "im Projekt enthalten",
    "Betreiben": "ab 1.500 € im Monat"
  };

  var CAL = "https://cal.com/tobias-lewen-nzmbl3/15min";
  var MAIL = "tobias@tofia-analytics.com";

  // Adresse des Workers fuer Stufe 2. Leer lassen, solange der Worker nicht eingerichtet ist:
  // dann bleibt der Check bei Stufe 1. Beispiel: "https://api.tofia-analytics.com/health-check"
  var ENDPOINT = "https://api.tofia-analytics.com";

  // Vertiefende Fragen (Stufe 2), je eine pro Bereich in derselben Reihenfolge wie AREAS
  var DEEP = [
    { q: "Wie viele Ihrer Quellsysteme sind automatisch angebunden?", a: ["Keines.", "Weniger als die Hälfte.", "Die meisten.", "Alle."] },
    { q: "Sind Ihre wichtigsten Kennzahlen schriftlich definiert, und wird geprüft, ob die Zahlen stimmen?", a: ["Nein, es gibt keine Definitionen.", "Teilweise definiert, aber nicht geprüft.", "Definiert, geprüft wird nur stichprobenartig.", "Definiert und automatisch geprüft."] },
    { q: "Werden Ihre Berichte tatsächlich für Entscheidungen genutzt?", a: ["Kaum. Viele Berichte werden nicht gelesen.", "Manche, aber nicht regelmäßig.", "Regelmäßig in einzelnen Teams.", "Regelmäßig in allen relevanten Bereichen."] },
    { q: "Könnte sich ein neuer Kollege mit Ihrer Dokumentation in einer Woche einarbeiten?", a: ["Es gibt keine Dokumentation.", "Nur Bruchstücke.", "Grundlegend ja, mit Lücken.", "Ja, vollständig."] },
    { q: "Wissen Sie, was Ihre Datenplattform monatlich kostet, und können Sie die Kosten zuordnen?", a: ["Nein.", "Grob, aber nicht zuordenbar.", "Der Gesamtbetrag ist bekannt, die Zuordnung nur teilweise.", "Ja, nach Bereichen oder Projekten nachvollziehbar."] }
  ];

  var OPTIONS = {
    branche: ["Handel und E-Commerce", "Industrie", "Medien und Verlage", "Dienstleistung", "Finanzen", "Sonstiges"],
    groesse: ["unter 50", "50 bis 250", "250 bis 1.000", "über 1.000"],
    systeme: ["ERP", "CRM", "Shop", "Tracking und Web-Analytics", "Cloud-Warehouse", "BI-Tool (z. B. Power BI)"],
    entscheider: ["Geschäftsführung", "IT-Leitung", "Fachabteilung", "Noch unklar"],
    zeitrahmen: ["Innerhalb von 3 Monaten", "Innerhalb eines Jahres", "Noch kein Zeitplan"],
    budget: ["Ja", "Noch nicht", "Weiß ich nicht"]
  };

  var answers = [];
  var deep = [];
  var ctx = null;
  var step = 0;
  var root = document.getElementById("hc");
  if (!root) return;

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function clear(n) { while (n.firstChild) n.removeChild(n.firstChild); }
  // Mit Stufe 2 zaehlt der Mittelwert aus beiden Antworten (0 bis 3 in halben Schritten)
  function areaScore(i) { return deep.length === AREAS.length ? (answers[i] + deep[i]) / 2 : answers[i]; }
  function tier(score) { return score < 1.5 ? "low" : (score < 2.5 ? "mid" : "high"); }
  function tierLabel(score) { return score < 1.5 ? "Handlungsbedarf" : (score < 2.5 ? "Lücken" : "Stabil"); }

  function renderIntro() {
    clear(root);
    var box = el("div", "hc__card");
    box.appendChild(el("p", "mono", "Health Check"));
    box.appendChild(el("h1", "", "Wo steht Ihre Datenplattform?"));
    box.appendChild(el("p", "hc__lead", "Fünf Fragen, etwa 90 Sekunden. Sie sehen danach, wo es bei Ihnen läuft und wo nicht, und was ich an den Stellen tun würde."));
    var ul = el("ul", "hc__facts");
    ["Kein Konto, keine E-Mail-Adresse nötig.", "Die Auswertung läuft in Ihrem Browser. Es werden keine Antworten an einen Server gesendet.", "Eine Ersteinschätzung, kein Audit. Für ein belastbares Bild gibt es das Audit (Verstehen)."].forEach(function (t) { ul.appendChild(el("li", "", t)); });
    box.appendChild(ul);
    var b = el("button", "btn", "Check starten");
    b.type = "button";
    b.addEventListener("click", function () { step = 0; answers = []; deep = []; ctx = null; renderQuestion(); });
    box.appendChild(b);
    root.appendChild(box);
  }

  function renderQuestion() {
    clear(root);
    var area = AREAS[step];
    var box = el("div", "hc__card");
    var top = el("div", "hc__top");
    top.appendChild(el("p", "mono", "Frage " + (step + 1) + " von " + AREAS.length + " · " + area.name));
    var bar = el("div", "hc__progress");
    var fill = el("span", "");
    fill.style.width = (step / AREAS.length * 100) + "%";
    bar.appendChild(fill);
    top.appendChild(bar);
    box.appendChild(top);

    var fs = el("fieldset", "hc__q");
    var lg = el("legend", "", area.q);
    fs.appendChild(lg);
    area.a.forEach(function (text, i) {
      var id = "q" + step + "a" + i;
      var lab = el("label", "hc__opt");
      lab.setAttribute("for", id);
      var inp = document.createElement("input");
      inp.type = "radio"; inp.name = "q" + step; inp.id = id; inp.value = String(i);
      if (answers[step] === i) inp.checked = true;
      inp.addEventListener("change", function () { answers[step] = i; next.disabled = false; });
      lab.appendChild(inp);
      lab.appendChild(el("span", "", text));
      fs.appendChild(lab);
    });
    box.appendChild(fs);

    var nav = el("div", "hc__nav");
    var back = el("button", "btn btn--line", "Zurück");
    back.type = "button";
    back.addEventListener("click", function () { if (step === 0) renderIntro(); else { step--; renderQuestion(); } });
    var next = el("button", "btn", step === AREAS.length - 1 ? "Ergebnis anzeigen" : "Weiter");
    next.type = "button";
    next.disabled = answers[step] === undefined;
    next.addEventListener("click", function () { if (step === AREAS.length - 1) renderResult(); else { step++; renderQuestion(); } });
    nav.appendChild(back); nav.appendChild(next);
    box.appendChild(nav);
    root.appendChild(box);
    var first = fs.querySelector("input:checked") || fs.querySelector("input");
    if (first) first.focus({ preventScroll: true });
  }

  function fmt(n) { return String(n).replace(".", ","); }

  function summaryText(total, level) {
    var lines = ["Health Check tofia analytics", "Gesamtstufe: " + level.name + " (" + fmt(total) + " von 15 Punkten)", ""];
    AREAS.forEach(function (a, i) { var s = areaScore(i); lines.push(a.name + ": " + fmt(s) + " von 3 (" + tierLabel(s) + ")"); });
    return lines.join("\n");
  }

  function renderResult() {
    clear(root);
    var detailed = deep.length === AREAS.length;
    var total = AREAS.reduce(function (s, a, i) { return s + areaScore(i); }, 0);
    var level = LEVELS.filter(function (l) { return total <= l.max; })[0];
    var box = el("div", "hc__card hc__card--wide");

    box.appendChild(el("p", "mono", detailed ? "Ihr genauer Report" : "Ihr Ergebnis"));
    var head = el("div", "hc__head");
    head.appendChild(el("h1", "", level.name));
    head.appendChild(el("p", "hc__score", fmt(total) + " von 15 Punkten"));
    box.appendChild(head);
    box.appendChild(el("p", "hc__lead", level.text));

    // Kritische Bereiche (0 Punkte) zaehlen immer, auch bei hoher Gesamtstufe
    var critical = AREAS.filter(function (a, i) { return areaScore(i) < 1; });
    if (critical.length && total > 8) {
      var warn = el("p", "hc__warn");
      warn.textContent = "Trotz guter Gesamtstufe gibt es " + (critical.length === 1 ? "einen kritischen Bereich" : "kritische Bereiche") + ": " + critical.map(function (a) { return a.name; }).join(", ") + ". Das sollten Sie zuerst angehen.";
      box.appendChild(warn);
    }

    // Fuenf Balken
    var bars = el("div", "hc__bars");
    AREAS.forEach(function (a, i) {
      var s = areaScore(i);
      var row = el("div", "hc__bar hc__bar--" + tier(s));
      row.appendChild(el("span", "hc__bar__name", a.name));
      var seg = el("span", "hc__bar__seg");
      seg.setAttribute("role", "img");
      seg.setAttribute("aria-label", fmt(s) + " von 3 Punkten");
      for (var k = 0; k < 3; k++) seg.appendChild(el("i", s >= k + 1 ? "on" : (s >= k + 0.5 ? "half" : "")));
      row.appendChild(seg);
      row.appendChild(el("span", "hc__bar__label", tierLabel(s)));
      bars.appendChild(row);
    });
    box.appendChild(bars);

    // Hebel: schwaechste Bereiche zuerst
    var order = AREAS.map(function (a, i) { return { a: a, s: areaScore(i), i: i }; })
      .sort(function (x, y) { return x.s - y.s || x.i - y.i; });
    var weak = order.filter(function (o) { return o.s < 2.5; }).slice(0, 3);

    box.appendChild(el("h2", "", weak.length ? "Wo ich zuerst ansetzen würde" : "Ihre Lage"));
    if (!weak.length) {
      box.appendChild(el("p", "", "In allen fünf Bereichen sind Sie gut aufgestellt. Ein Austausch lohnt sich vor allem, wenn Kosten, Skalierung oder neue Datenquellen anstehen."));
    }
    weak.forEach(function (o, n) {
      var t = tier(o.s);
      var item = el("div", "hc__item");
      var h = el("h3", "", (n + 1) + ". " + o.a.name);
      item.appendChild(h);
      item.appendChild(el("p", "", o.a[t][0]));
      item.appendChild(el("p", "hc__do", o.a[t][1]));
      item.appendChild(el("p", "mono", "Station: " + o.a.station + " · " + PRICES[o.a.station]));
      box.appendChild(item);
    });

    // Empfehlung
    var rec = el("div", "hc__rec");
    rec.appendChild(el("h2", "", "Empfohlener nächster Schritt"));
    var recText = total <= 8
      ? "Bei Ihrer Ausgangslage lohnt sich zuerst ein Audit (Verstehen, 2.900 €). Es zeigt in kurzer Zeit, was wirklich los ist, und liefert einen Plan mit Prioritäten."
      : critical.length
        ? "Ein kritischer Bereich kann das Ganze gefährden, auch wenn der Rest gut aufgestellt ist. Ein Audit (Verstehen, 2.900 €) klärt gezielt, wie groß das Risiko ist und was zu tun ist."
        : "Sprechen wir 15 Minuten darüber, welche Lücken sich für Sie lohnen, anzugehen. Ein Audit ist optional.";
    rec.appendChild(el("p", "", recText));
    var notes = summaryText(total, level);
    var calUrl = CAL + "?notes=" + encodeURIComponent(notes);
    if (detailed && ctx) {
      if (ctx.name) calUrl += "&name=" + encodeURIComponent(ctx.name);
      if (ctx.email) calUrl += "&email=" + encodeURIComponent(ctx.email);
    }
    var actions = el("div", "hc__actions");
    var cal = el("a", "btn", "Erstgespräch buchen");
    cal.href = calUrl; cal.target = "_blank"; cal.rel = "noopener noreferrer";
    var mail = el("a", "btn btn--line", "Ergebnis per E-Mail senden");
    mail.href = "mailto:" + MAIL + "?subject=" + encodeURIComponent("Health Check Ergebnis") + "&body=" + encodeURIComponent(notes + "\n\nIhr Name / Unternehmen:\n");
    actions.appendChild(cal); actions.appendChild(mail);
    rec.appendChild(actions);
    rec.appendChild(el("p", "hc__fine", "Beim Buchen wird das Ergebnis in das Notizfeld des Termins übernommen. Sie können es dort vor dem Absenden ändern oder löschen."));
    box.appendChild(rec);

    if (!detailed && ENDPOINT) {
      var up = el("div", "hc__upsell");
      up.appendChild(el("h2", "", "Genauer Report"));
      up.appendChild(el("p", "", "Mit fünf vertiefenden Fragen und ein paar Angaben zu Ihrer Situation wird die Einschätzung genauer, und Sie erhalten einen Report mit konkreten Prioritäten. Dafür brauche ich Ihre E-Mail-Adresse. Dauer: etwa zwei Minuten."));
      var upb = el("button", "btn", "Genaueren Report anfordern");
      upb.type = "button";
      upb.addEventListener("click", function () { step = 0; deep = []; renderDeep(); window.scrollTo(0, 0); });
      up.appendChild(upb);
      box.appendChild(up);
    }

    var again = el("button", "btn btn--line", "Check wiederholen");
    again.type = "button";
    again.addEventListener("click", function () { answers = []; deep = []; ctx = null; step = 0; renderIntro(); window.scrollTo(0, 0); });
    box.appendChild(again);
    root.appendChild(box);
    window.scrollTo(0, 0);
    box.querySelector("h1").setAttribute("tabindex", "-1");
    box.querySelector("h1").focus({ preventScroll: true });
  }

  // ---------- Stufe 2 ----------
  function renderDeep() {
    clear(root);
    var area = AREAS[step];
    var q = DEEP[step];
    var box = el("div", "hc__card");
    var top = el("div", "hc__top");
    top.appendChild(el("p", "mono", "Vertiefung " + (step + 1) + " von " + DEEP.length + " · " + area.name));
    var bar = el("div", "hc__progress");
    var fill = el("span", "");
    fill.style.width = (step / (DEEP.length + 1) * 100) + "%";
    bar.appendChild(fill);
    top.appendChild(bar);
    box.appendChild(top);

    var fs = el("fieldset", "hc__q");
    fs.appendChild(el("legend", "", q.q));
    q.a.forEach(function (text, i) {
      var id = "d" + step + "a" + i;
      var lab = el("label", "hc__opt");
      lab.setAttribute("for", id);
      var inp = document.createElement("input");
      inp.type = "radio"; inp.name = "d" + step; inp.id = id; inp.value = String(i);
      if (deep[step] === i) inp.checked = true;
      inp.addEventListener("change", function () { deep[step] = i; next.disabled = false; });
      lab.appendChild(inp);
      lab.appendChild(el("span", "", text));
      fs.appendChild(lab);
    });
    box.appendChild(fs);

    var nav = el("div", "hc__nav");
    var back = el("button", "btn btn--line", "Zurück");
    back.type = "button";
    back.addEventListener("click", function () {
      if (step === 0) { deep = []; renderResult(); } else { step--; renderDeep(); }
    });
    var next = el("button", "btn", step === DEEP.length - 1 ? "Weiter" : "Weiter");
    next.type = "button";
    next.disabled = deep[step] === undefined;
    next.addEventListener("click", function () { if (step === DEEP.length - 1) renderForm(); else { step++; renderDeep(); } });
    nav.appendChild(back); nav.appendChild(next);
    box.appendChild(nav);
    root.appendChild(box);
    var first = fs.querySelector("input:checked") || fs.querySelector("input");
    if (first) first.focus({ preventScroll: true });
  }

  function field(label, control, hint) {
    var w = el("div", "hc__field");
    var l = el("label", "", label);
    if (control.id) l.setAttribute("for", control.id);
    w.appendChild(l);
    w.appendChild(control);
    if (hint) w.appendChild(el("p", "hc__fine", hint));
    return w;
  }
  function select(id, name, opts) {
    var s = document.createElement("select");
    s.id = id; s.name = name;
    var o0 = el("option", "", "Bitte wählen");
    o0.value = "";
    s.appendChild(o0);
    opts.forEach(function (o) { var op = el("option", "", o); op.value = o; s.appendChild(op); });
    return s;
  }

  function renderForm() {
    clear(root);
    var box = el("div", "hc__card");
    var top = el("div", "hc__top");
    top.appendChild(el("p", "mono", "Letzter Schritt · Ihre Situation"));
    var bar = el("div", "hc__progress");
    var fill = el("span", ""); fill.style.width = "85%";
    bar.appendChild(fill); top.appendChild(bar);
    box.appendChild(top);
    box.appendChild(el("h1", "", "Wohin darf ich den Report schicken?"));
    box.appendChild(el("p", "hc__lead", "Ein paar Angaben helfen mir, den Report auf Ihre Lage zuzuschneiden. Pflicht sind nur E-Mail-Adresse und Einverständnis."));

    var form = document.createElement("form");
    form.noValidate = true;
    var email = document.createElement("input"); email.type = "email"; email.id = "f-email"; email.name = "email"; email.autocomplete = "email"; email.maxLength = 254; email.required = true;
    var name = document.createElement("input"); name.type = "text"; name.id = "f-name"; name.name = "name"; name.autocomplete = "given-name"; name.maxLength = 80;
    var branche = select("f-branche", "branche", OPTIONS.branche);
    var groesse = select("f-groesse", "groesse", OPTIONS.groesse);
    var entscheider = select("f-entscheider", "entscheider", OPTIONS.entscheider);
    var zeitrahmen = select("f-zeitrahmen", "zeitrahmen", OPTIONS.zeitrahmen);
    var budget = select("f-budget", "budget", OPTIONS.budget);
    var text = document.createElement("textarea"); text.id = "f-text"; text.name = "freitext"; text.rows = 4; text.maxLength = 1000;

    form.appendChild(field("E-Mail-Adresse (Pflicht)", email));
    form.appendChild(field("Vorname (optional)", name));
    form.appendChild(field("Branche", branche));
    form.appendChild(field("Unternehmensgröße (Beschäftigte)", groesse));

    var sysSet = el("fieldset", "hc__checks");
    sysSet.appendChild(el("legend", "", "Welche Systeme sind im Einsatz?"));
    OPTIONS.systeme.forEach(function (s, i) {
      var lab = el("label", "hc__check");
      var c = document.createElement("input"); c.type = "checkbox"; c.value = s; c.name = "systeme";
      lab.appendChild(c); lab.appendChild(el("span", "", s));
      sysSet.appendChild(lab);
    });
    form.appendChild(sysSet);

    form.appendChild(field("Wer entscheidet über das Thema?", entscheider));
    form.appendChild(field("Wann soll sich etwas ändern?", zeitrahmen));
    form.appendChild(field("Gibt es für das Thema schon ein Budget?", budget));
    form.appendChild(field("Was ist Ihr größtes Problem mit den Daten? (optional)", text));

    // Bot-Feld: fuer Menschen unsichtbar
    var hp = document.createElement("input"); hp.type = "text"; hp.name = "website"; hp.tabIndex = -1; hp.autocomplete = "off";
    var hpw = el("div", "hc__hp"); hpw.setAttribute("aria-hidden", "true"); hpw.appendChild(hp);
    form.appendChild(hpw);

    var consent = el("label", "hc__check hc__consent");
    var cc = document.createElement("input"); cc.type = "checkbox"; cc.id = "f-consent"; cc.required = true;
    consent.appendChild(cc);
    var cs = el("span", "", "Ich bin einverstanden, dass Tobias Lewen meine Angaben speichert und mich per E-Mail zu meinem Ergebnis kontaktiert. Ich kann das jederzeit widerrufen. Mehr in der ");
    var dl = el("a", "", "Datenschutzerklärung"); dl.href = "datenschutz.html"; dl.target = "_blank"; dl.rel = "noopener noreferrer";
    cs.appendChild(dl); cs.appendChild(document.createTextNode("."));
    consent.appendChild(cs);
    form.appendChild(consent);

    var err = el("p", "hc__error"); err.setAttribute("role", "alert"); err.hidden = true;
    form.appendChild(err);

    var nav = el("div", "hc__nav");
    var back = el("button", "btn btn--line", "Zurück"); back.type = "button";
    back.addEventListener("click", function () { step = DEEP.length - 1; renderDeep(); });
    var send = el("button", "btn", "Report anzeigen"); send.type = "submit";
    nav.appendChild(back); nav.appendChild(send);
    form.appendChild(nav);

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      err.hidden = true;
      var v = email.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) { err.textContent = "Bitte geben Sie eine gültige E-Mail-Adresse ein."; err.hidden = false; email.focus(); return; }
      if (!cc.checked) { err.textContent = "Bitte bestätigen Sie das Einverständnis, damit ich Ihnen den Report schicken kann."; err.hidden = false; cc.focus(); return; }
      var systeme = [].slice.call(form.querySelectorAll('input[name="systeme"]:checked')).map(function (c) { return c.value; });
      ctx = { email: v, name: name.value.trim(), branche: branche.value, groesse: groesse.value, systeme: systeme, entscheider: entscheider.value, zeitrahmen: zeitrahmen.value, budget: budget.value, freitext: text.value.trim() };
      var scores = {};
      AREAS.forEach(function (a, i) { scores[a.id] = [answers[i], deep[i]]; });
      var payload = { v: 1, consent: true, website: hp.value, scores: scores, ctx: ctx };
      send.disabled = true; send.textContent = "Wird gesendet";
      var ctrl = typeof AbortController !== "undefined" ? new AbortController() : null;
      var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 15000);
      fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), signal: ctrl ? ctrl.signal : undefined })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok && j && j.ok, error: j && j.error }; }); })
        .then(function (res) {
          clearTimeout(timer);
          if (!res.ok) throw new Error(res.error || "Fehler");
          renderResult();
        })
        .catch(function () {
          clearTimeout(timer);
          send.disabled = false; send.textContent = "Report anzeigen";
          err.textContent = "Das hat leider nicht geklappt. Bitte versuchen Sie es noch einmal oder schreiben Sie mir direkt an " + MAIL + ".";
          err.hidden = false;
        });
    });

    box.appendChild(form);
    root.appendChild(box);
    window.scrollTo(0, 0);
    email.focus({ preventScroll: true });
  }

  renderIntro();
})();
