# Alltag Hub

Persönliche Single-Page-PWA (Vanilla JS, kein Build-Schritt) für Training,
Budget, Content-Pipeline und Habits. Alle Daten leben in `localStorage` auf
dem jeweiligen Gerät - es gibt keinen Server und aktuell kein Cloud-Backup.

## Struktur

- `index.html` – die komplette App (Markup, CSS, JS in einer Datei)
- `sw.js` – Service Worker (Offline-Cache, siehe Versionshinweis unten)
- `manifest.json` – PWA-Manifest (Name, Icon, Display-Modus)
- `icon.png` – App-Icon (aus dem ursprünglichen Apple-Touch-Icon extrahiert)
- `tests/logic.test.js` – Regressionstests, siehe unten

## Tests laufen lassen

```
node tests/logic.test.js
```

Führt das Inline-`<script>` von `index.html` in einer minimalen `vm`-Sandbox
aus (kein echtes DOM, nur genug Stubs zum Booten/Rendern) und prüft gezielt
die historischen Bugs, die schon mal aufgetreten sind. Vor jedem Deploy
laufen lassen. Bei neuen Bugs: erst einen Test schreiben, der ihn zeigt,
dann fixen, dann prüfen dass der Test grün wird.

## Deployen

Aktuell manuell über Netlify: den kompletten Ordnerinhalt (alle 4 Dateien
zusammen, relative Pfade zueinander müssen stimmen) auf
https://app.netlify.com/drop ziehen, oder über ein bestehendes verknüpftes
Netlify-Projekt neu deployen. Netlify behält die Deploy-Historie, ein
Rollback auf eine ältere Version ist darüber jederzeit möglich.

Vor jedem Deploy: `node tests/logic.test.js` muss grün sein.

## Versionierung

Zwei unabhängige Versionsnummern im Code:

- `APP_VERSION` (in `index.html`) – die Release-Version der App, sichtbar in
  Einstellungen → Version, zusammen mit einem kurzen Changelog. Bei jedem
  Release hochzählen und eine Zeile zu `CHANGELOG` hinzufügen.
- `BLANK.version` – die Version des *Datenschemas* in `localStorage`.
  Nur hochzählen, wenn sich die Struktur der gespeicherten Daten ändert.
  Migrationen laufen über `migrate()` (Dispatcher) und
  `migrateV1toV2()` etc. - für jeden neuen Schema-Sprung eine eigene
  `migrateVXtoVY()`-Funktion ergänzen, siehe Kommentar dort im Code.

Diese beiden haben nichts miteinander zu tun: man kann die App-Version
bumpen ohne das Datenschema anzufassen, und umgekehrt.

## Bekannte, bewusst nicht behobene Baustellen

- Kein echtes Cloud-Backup/Sync – nur manueller Export/Import und ein
  Erinnerungs-Banner. Größere Produktentscheidung, siehe Chat-Historie.
- Keine Custom-Kategorien (Training/Budget-Kategorien sind hart codiert).
- Keine Barrierefreiheit (ARIA-Labels, Kontrastprüfung) umgesetzt.
- Architektur ist ein kompletter Re-Render bei jeder Interaktion
  (String-Concat-HTML, kein Virtual DOM) - für die App-Größe okay, aber
  nicht beliebig skalierbar.

## Sicherheits-relevante Mechanismen (bitte beim Weiterbauen erhalten)

- `render()` fängt Exceptions ab und zeigt einen Recovery-Screen statt
  weiß zu bleiben. `commit()` rendert vor dem Speichern, damit ein kaputter
  Zustand nicht persistiert wird, wenn das Rendern fehlschlägt.
- `withUndo()` snapshottet den kompletten State vor jeder destruktiven
  Aktion in einen Stack (`UN`), jede Aktion hat ihr eigenes 9s-Zeitfenster.
  Jede neue destruktive Aktion (Löschen o.ä.) sollte darüber laufen, nicht
  direkt `S.xxx = S.xxx.filter(...)` ohne `withUndo`.
- `importJSON()` validiert Struktur und Versionsnummer, bevor irgendwas
  übernommen wird, und lehnt Backups aus einer neueren, unbekannten
  Schema-Version explizit ab statt zu raten.
