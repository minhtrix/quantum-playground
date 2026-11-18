# Quantum Field · Jury-Audit

**17. November 2026 · Meta VR Start Developer Competition · Projektstand vor dem Umbau**

Geprüft wurde die WebXR-App im Ordner `quantum-playground`, die sich im Build „Quantum Playground“ nennt. Das Urteil stützt sich auf den Spielcode, die räumliche Bedienoberfläche, Szene und Einstieg sowie die offiziellen Regeln und veröffentlichten Gewinnerbeschreibungen. Die Punktwerte sind meine Einschätzung als simulierte Jury. Der physische Sitztest und die Bildrate auf Quest sind offene Prüfungen.

## Juryurteil

**4,9 von 10 im Ausgangsstand.** Ein winziges Labor auf meinem Tisch, in dem ich eine gefährliche Kiste anhand eines einzelnen Lichtsignals identifiziere, ist eine vorführbare Spielidee. Der bisherige Einstieg verwässert sie. Ich sehe fünf Modi, ein Punktesystem und mehrere gleichzeitig bedienbare Aktionen. Ich kann gleich auf „Defuse“ drücken und zufällig gewinnen. Dann erfahre ich weder, warum das Signal überraschend war, noch wofür ich das Labor räumlich bedienen sollte.

| Offizielles Kriterium | Gewicht | Einschätzung | Begründung |
| --- | --- | --- | --- |
| Innovation & Creativity | 25 % | 7/10 | Interaktionsfreie Messung als spielbare Deduktion ist ungewöhnlich. Der Zusammenhang zwischen der realen Tischplatte und dem Spiel besteht vor allem aus Platzierung und Verdeckung. |
| Experience Design | 25 % | 3,5/10 | Das Onboarding markiert den nächsten Schritt, während die Regeln ungültige Aktionen zulassen. Die erste Runde kann früh zufällig explodieren. Der Einstieg verlangt zugleich Physikvokabular und Gestenlernen. |
| Technical Implementation | 25 % | 5/10 | Eigenes lokales Modell, räumliche Eingaben und ein reproduzierbarer Test für die Grundwahrscheinlichkeiten. Der bisherige Code bindet D0 nicht zuverlässig an einen gültigen Beweis, erlaubt Wiederholung nach Rundenende und setzt Tiefenerkennung zum Sessionstart voraus. Gerätewerte fehlen. |
| Polish & Presentation | 25 % | 4/10 | Leuchtende Signalwege und akustische Treffer bieten gute Rohsubstanz. Menü, Punktestand, Pfeil und Texthinweise konkurrieren visuell. Das 2D-Demo-Dokument dient als Begleitmaterial, während Devpost repräsentative Aufnahme der echten App verlangt. |

[Offizielle Bewertungskriterien und Einreichungsregeln](https://start-developer-competition-26.devpost.com/rules)

## Was die Gewinner von 2025 für diese App zeigen

| Gewinner | Beobachtung in der veröffentlichten Beschreibung | Folgerung für Quantum Field |
| --- | --- | --- |
| Tiny Golf · Casual Game | Ein Pinch setzt eine allgemein verständliche Handlung in Gang. Die räumlichen Kurse geben der Bewegung ein sichtbares Ziel. | Die Kiste ist der erste erkennbare Spielgegenstand. Eine leuchtende Aufnahme erklärt, wohin sie gehört. Der erste erfolgreiche Pinch braucht sichtbare Bestätigung. |
| Pocket Lands · Hand Interactions | Meta zeichnet das Projekt ausdrücklich für Handinteraktion aus. | Der Kernablauf verdient einen durchgehenden Handtest. Ein Controller-Test oder das Vorhandensein einer Handtracking-Konfiguration liefert dafür keine Evidenz. |
| DreamSpace · Entertainment | Die Verwandlung des realen Zimmers ist der unmittelbar verständliche Effekt. | Zeig den echten Tisch als Teil der Inszenierung. Wenn die Tischhöhe erkannt wird, braucht die Platzierung eine glaubwürdige Auflage und eine nutzbare Standardhöhe als Ausweichweg. |
| Inkphony · Lifestyle | Vertraute Gegenstände aus der Umgebung bekommen eine neue Funktion als Instrumente. | Der Spieler sollte erst eine Kiste einsetzen und einen Effekt auslösen. Das Vokabular zur Interferenz kann anschließend die Beobachtung erklären. |
| The Nanauts und Dun Jun · IWSDK | Meta hat 2025 beide Projekte für immersive Web-Erlebnisse ausgezeichnet. | Der Browser ist ein plausibler Vertriebsweg. Für 2026 zählen die Kriterien und Preise der aktuellen Ausschreibung. |

[Offizielle Gewinnerübersicht 2025](https://developers.meta.com/vr/blog/meta-horizon-start-developer-competition-meet-the-winners/) · [Metas Leitfaden für Hand-Onboarding](https://developers.meta.com/vr/blog/hands-onboarding-101-how-to-teach-hand-interations/)

## Konkrete Befunde

1. **Die Schlussfolgerung ist als Spielregel unvollständig.** `defuseCrate()` bewertet die richtige Kiste unabhängig vom Messverlauf. D0 kann auch bei veränderter Optik leuchten, wird im Onboarding aber als Beweis präsentiert. Treffer, Detonation und Punktestand können weiter mutieren, obwohl die Runde abgeschlossen sein sollte. Eine gültige Messung muss unter Standardoptik an der aktuell eingesetzten Kiste passiert sein. Danach ist genau eine Bestätigung zulässig. `src/simulation/lab-controller.ts`, `src/simulation/quantum-physics.ts`
2. **Der Spieler bekommt keine sichere erste Lernerfahrung.** Das Ergebnis einer Live-Kiste kann mit 50 % Wahrscheinlichkeit beim ersten Photon explodieren. D1 ist mehrdeutig. Der bisherige Wechselhinweis nach drei D1-Treffern zählt über Kistenwechsel hinweg. Das fühlt sich gerade beim Erlernen wie willkürliche Rückmeldung an. Eine klar gekennzeichnete Trainingsmessung zeigt zuerst D1 bei leerer Bahn, dann einen möglichen D0-Treffer an einer Übungskiste. `src/simulation/quantum-physics.ts`
3. **Hinweis und Aktion sind räumlich entkoppelt.** Der Pfeil weist zum Emitter oder Detektor, während „Fire“ und „Defuse“ auf dem separaten Paneel liegen. Das Spiel verwendet zudem Auswahl per Strahl und Greifen derselben Kisten. Das Einrasten sollte erst beim Loslassen im Ziel passieren, mit sichtbarer Rückmeldung und einer bedienbaren Alternative auf dem Paneel. `src/systems/quantum-lab-system.ts`, `src/systems/lab-panel-system.ts`
4. **Das reale Zimmer ist noch wenig spielentscheidend.** Der Tischabgleich verwendet eine Höhe in der Nähe der Laborposition. Daraus folgt noch keine Zusicherung, dass die Platte die Bank wirklich trägt, horizontal ist oder im Sitzbereich liegt. Prüfe Tischgröße, Position, Höhe und Sichtbarkeit in zwei Räumen. Ein sitzender Tester muss ohne vorhandene Tischfläche weiterspielen können. `iwsdk.config.json`, `src/systems/quantum-lab-system.ts`
5. **Die Experimente ergeben noch keine klare Wiederkehr.** Tether, Box, Slits und Bell liefern jeweils einen Demonstrationseffekt. Das Abenteuer verspricht noch kein zusammenhängendes Ziel über eine Sitzung hinaus. Der stärkste Kandidat für Wiederspielwert ist die Live-Runde. D1 erzwingt eine Wahl zwischen erneutem Messen und Kistenwechsel. D0 erlaubt eine sichere Entscheidung. Ein Set aus nachvollziehbaren Erfolgen wäre der nächste Ausbau nach einem erfolgreichen Ersttest. `src/simulation/lab-controller.ts`, `src/ui/quantum-hud.ts`

## Entscheidung für die Umsetzung

**Gaming · sitzendes Hands-first-Puzzle.** Die Zuordnung zur Division hängt davon ab, ob ein Build oder Prototyp vor dem 24. September 2026 existierte. In diesem Fall gilt die Adapted-Division und Meta beurteilt, ob das Update erheblich genug ist. „Best First Five Minutes“ passt zur Gestaltung des Einstiegs. Den Physik-Tutor brauche ich für den Kernablauf nicht. [Offizielle Track-, Divisions- und Award-Regeln](https://start-developer-competition-26.devpost.com/rules)

| Priorität | Änderung | Abnahme |
| --- | --- | --- |
| P0 | Geführte Mission mit leerer Kalibrierung, Einsetzen einer Kiste, Photon, Messbeleg und Entschärfung. Danach startet eine neue Live-Runde. | Ein neuer Spieler versteht Aktion und Ziel aus der App. Angestrebter erster Erfolg in 60–90 Sekunden ohne Erklärung von außen. |
| P0 | Gültige Aktionen, klares Signal und stabile Ergebnisse. Während des Photonenflugs bleibt die Probe gesperrt. Nach einer Detonation folgt eine eindeutige Aktion für den nächsten Fall. | Direkte Eingabe und UI dürfen fehlenden Beleg, veralteten oder falsch kalibrierten D0 sowie Doppelaktionen nicht in einen Gewinn umwandeln. |
| P0 | Eine dominante Aktion pro Missionsphase im räumlichen Paneel und Desktop. Vorhandene Kiste und Ring für das Lernen verwenden. | Kistenwahl, Photon, D0 und Abschluss lassen sich mit Hands-only im Sitzen demonstrieren. Fortschritt und Resultat sind ohne Farbunterscheidung verständlich. |
| P1 | Physischer Quest-3-Test mit beiden Händen, zwei Raumkonfigurationen, einem Kaltstart und einer Unterbrechung. | Keine Controller zum Abschluss, keine großen Reichbewegungen, stabile Darstellung und mindestens 60 fps gemäß den Regeln. |
| P1 | Echtes Demo-Video mit der leeren Referenz, physischem Einsetzen und D0. Die Live-Runde zeigt die Wahl nach D1. | Erster Interaktionsmoment in den ersten 15 Sekunden. Video unter drei Minuten, englische Materialien und zugänglicher WebXR-Link für die Jury. |
| P2 | Nach dem Spieltest weitere Fälle mit unterschiedlichen Versuchsanordnungen gestalten. | Ein neuer Fall verändert die Entscheidung oder den Beweis. An derselben Optik eingeführte Regeln bleiben nachvollziehbar. |

**Abgabefrist laut Devpost:** 18. November 2026, 21:00 Uhr in Berlin. [Wettbewerbsseite](https://start-developer-competition-26.devpost.com/)


## Umgesetzt und geprüft am 18. November

- **Geführter Bombentest.** Der Einstieg zeigt eine leere D1-Referenz, ein klar markiertes D0-Trainingsbeispiel, Entschärfung und danach einen zufälligen Live-Fall. Training vergibt keine Live-Punkte. Der Spielcontroller sperrt Entschärfung ohne gültigen D0-Beleg, weitere Schüsse im Flug und weitere Aktionen nach Rundenabschluss. Geänderte Optik macht den vorherigen Beleg ungültig.
- **Räumliche Bedienung.** Die Kiste lässt sich mit einer Hand greifen und beim Loslassen in den Ring einsetzen. Der Auswahlknopf bietet eine Alternative. Die Konsole steht mittig und näher an der sitzenden Person. Sie zeigt pro Phase eine Hauptaktion und bietet nach einem unklaren D1-Live-Treffer den Wechsel zur anderen Kiste an. Der Browser nutzt denselben Spielzustand.
- **Technisch geprüft.** Beide Typechecks, 13 automatisierte Tests und der Produktionsbuild liefen erfolgreich. Im browserbasierten Quest-3-Emulator IWER habe ich D1, direkten Pinch-Griff und Einrasten, D0, Abschluss und Live-Fall beobachtet. Der Ablauf wurde in Einzeltests mit emulierten Händen geprüft. Einige wiederholte Touches am selben Ziel brauchten einen zweiten Versuch mit der anderen Hand. Der Moduswechsel zu Tether war ebenfalls sichtbar. [IWSDK-Leitfaden zum Testen](https://iwsdk.dev/guides/02-testing-experience.html)
- **Offen für die Einreichung.** Auf einer echten Quest 3 die Mission im Sitzen mit derselben Hand durchspielen, die Reichweite für kleinere Personen prüfen und das Einrasten in zwei Räumen testen. Die Bildrate vor Ort messen und echte App-Aufnahmen ins englische Devpost-Video übernehmen. Die Zielzeit für Erstspieler wurde bisher nicht gemessen. [Offizielle Einreichungsregeln](https://start-developer-competition-26.devpost.com/rules)

