# Access 1 – Workbook Audios

Eine einfache Webseite für Schülerinnen und Schüler der 5. Klasse. Sie zeigt alle Hörübungen
zum **Access Workbook, Band 1** (Cornelsen, ISBN 978-3-06-032581-8), sortiert nach Bereichen
(MyBook, Here we go!, Unit 1–5) und innerhalb davon nach **Workbook-Seite**.

- Jeder Bereich lässt sich auf- und zuklappen. Das iPad merkt sich, welche Bereiche offen sind.
- Die Bereiche haben dieselben Farben wie im Inhaltsverzeichnis des Schülerbuchs
  (MyBook hat dort keine eigene Farbe und ist deshalb grau).
- Ein Tipp auf eine Übung spielt das Audio direkt auf der Seite ab, ohne Weiterleitung.
- Unten erscheint eine Leiste mit großen Knöpfen: 10 s zurück, Abspielen/Pause, 10 s vor,
  dazu ein Schieberegler. Die Wiedergabegeschwindigkeit ist absichtlich nicht einstellbar.
- Tippt man irgendwo neben den Player, stoppt das Audio und der Player verschwindet.
- Die Audiodateien liegen **nicht** in diesem Repository. Sie werden direkt von
  [codes.cornelsen.de](https://codes.cornelsen.de/codes/products/9783060325818) geladen.

## Veröffentlichen (GitHub Pages)

1. Auf GitHub im Repository: **Settings → Pages**.
2. Unter *Build and deployment* bei *Source* „Deploy from a branch“ wählen,
   dann den Branch (z. B. `main`) und den Ordner `/ (root)` auswählen und speichern.
3. Nach ein bis zwei Minuten ist die Seite unter
   `https://<benutzername>.github.io/WorkbookAudios/` erreichbar.

## Auf dem iPad als WebApp ablegen

1. Die Seite in **Safari** öffnen.
2. Auf das **Teilen**-Symbol tippen (Quadrat mit Pfeil nach oben).
3. **„Zum Home-Bildschirm“** wählen und bestätigen.

Die Seite erscheint dann mit eigenem Symbol und öffnet sich ohne Browserleiste.
Zum Abspielen braucht das iPad eine Internetverbindung.

## Dateien

| Datei | Inhalt |
|---|---|
| `index.html` | Grundgerüst der Seite |
| `data.js` | Liste aller Übungen mit Seite, Titel und Audio-Link (aus den Cornelsen-Webcodes) |
| `app.js` | Aufbau der Liste und Abspielen |
| `style.css` | Gestaltung |
| `manifest.webmanifest`, `icons/` | WebApp-Einstellungen und App-Symbol |

### Eine Übung korrigieren oder ergänzen

In `data.js` einen Eintrag nach diesem Muster bearbeiten oder hinzufügen:

```js
{
  "page": 16,
  "title": "SPELLING The alphabet",
  "exercise": "Exercise 19 a)",
  "url": "https://codes.cornelsen.de/codes/assetfiles/…/SPELLING_The_alphabet.mp3"
}
```

Den Audio-Link finden Sie auf der Cornelsen-Seite über „Audio herunterladen“
(Rechtsklick bzw. lange tippen → Link kopieren).

## Hinweis zu den Daten

Cornelsen listet in Unit 2 zusätzlich die Übung „SPELLING Letters, S. 16, Ex. 20 a)“.
Das ist dieselbe Datei wie in Unit 1. Sie erscheint hier deshalb nur in Unit 1.

## Hinweis zur entfernten Offline-Funktion

Eine Offline-Speicherung der Audios wurde getestet, funktionierte auf iPad und Android aber nicht
und wurde wieder entfernt. `sw.js` ist nur noch dafür da, auf Geräten mit der Testversion die
gespeicherten Daten zu löschen. Die Datei kann nach einigen Wochen gelöscht werden.
