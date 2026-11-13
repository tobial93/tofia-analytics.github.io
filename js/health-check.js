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

  var answers = [];
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
  function tier(score) { return score <= 1 ? "low" : (score === 2 ? "mid" : "high"); }
  function tierLabel(score) { return score <= 1 ? "Handlungsbedarf" : (score === 2 ? "Lücken" : "Stabil"); }

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
    b.addEventListener("click", function () { step = 0; answers = []; renderQuestion(); });
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

  function summaryText(total, level) {
    var lines = ["Health Check tofia analytics", "Gesamtstufe: " + level.name + " (" + total + " von 15 Punkten)", ""];
    AREAS.forEach(function (a, i) { lines.push(a.name + ": " + answers[i] + " von 3 (" + tierLabel(answers[i]) + ")"); });
    return lines.join("\n");
  }

  function renderResult() {
    clear(root);
    var total = answers.reduce(function (s, v) { return s + v; }, 0);
    var level = LEVELS.filter(function (l) { return total <= l.max; })[0];
    var box = el("div", "hc__card hc__card--wide");

    box.appendChild(el("p", "mono", "Ihr Ergebnis"));
    var head = el("div", "hc__head");
    head.appendChild(el("h1", "", level.name));
    head.appendChild(el("p", "hc__score", total + " von 15 Punkten"));
    box.appendChild(head);
    box.appendChild(el("p", "hc__lead", level.text));

    // Fuenf Balken
    var bars = el("div", "hc__bars");
    AREAS.forEach(function (a, i) {
      var s = answers[i];
      var row = el("div", "hc__bar hc__bar--" + tier(s));
      row.appendChild(el("span", "hc__bar__name", a.name));
      var seg = el("span", "hc__bar__seg");
      seg.setAttribute("role", "img");
      seg.setAttribute("aria-label", s + " von 3 Punkten");
      for (var k = 0; k < 3; k++) seg.appendChild(el("i", k < s ? "on" : ""));
      row.appendChild(seg);
      row.appendChild(el("span", "hc__bar__label", tierLabel(s)));
      bars.appendChild(row);
    });
    box.appendChild(bars);

    // Hebel: schwaechste Bereiche zuerst
    var order = AREAS.map(function (a, i) { return { a: a, s: answers[i], i: i }; })
      .sort(function (x, y) { return x.s - y.s || x.i - y.i; });
    var weak = order.filter(function (o) { return o.s <= 2; }).slice(0, 3);

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
      : "Sprechen wir 15 Minuten darüber, welche Lücken sich für Sie lohnen, anzugehen. Ein Audit ist optional.";
    rec.appendChild(el("p", "", recText));
    var notes = summaryText(total, level);
    var calUrl = CAL + "?notes=" + encodeURIComponent(notes);
    var actions = el("div", "hc__actions");
    var cal = el("a", "btn", "Erstgespräch buchen");
    cal.href = calUrl; cal.target = "_blank"; cal.rel = "noopener noreferrer";
    var mail = el("a", "btn btn--line", "Ergebnis per E-Mail senden");
    mail.href = "mailto:" + MAIL + "?subject=" + encodeURIComponent("Health Check Ergebnis") + "&body=" + encodeURIComponent(notes + "\n\nIhr Name / Unternehmen:\n");
    actions.appendChild(cal); actions.appendChild(mail);
    rec.appendChild(actions);
    rec.appendChild(el("p", "hc__fine", "Beim Buchen wird das Ergebnis in das Notizfeld des Termins übernommen. Sie können es dort vor dem Absenden ändern oder löschen."));
    box.appendChild(rec);

    var again = el("button", "btn btn--line", "Check wiederholen");
    again.type = "button";
    again.addEventListener("click", function () { answers = []; step = 0; renderIntro(); window.scrollTo(0, 0); });
    box.appendChild(again);
    root.appendChild(box);
    window.scrollTo(0, 0);
    box.querySelector("h1").setAttribute("tabindex", "-1");
    box.querySelector("h1").focus({ preventScroll: true });
  }

  renderIntro();
})();
