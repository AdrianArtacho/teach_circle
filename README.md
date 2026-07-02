# teach_circle

Interactive circle of fifths (adapted from [Mike Foskett](https://websemantics.uk/tools/circle-of-fifths-chord-wheel/)'s)

![img/gui.png](img/gui.png)

---

## Serve it locally

python3 -m http.server 8000

and open http://localhost:8000

---

## Use it online 

https://AdrianArtacho.github.io/teach_circle/

---

## [ToDo](https://trello.com/c/e0NGh9hL/264-circleoffifths)


---

## Live MIDI chord detection

This version can listen directly to a MIDI keyboard in browsers with Web MIDI support, such as Chrome or Edge.

1. Serve locally or open the GitHub Pages version.
2. Connect a MIDI keyboard/controller.
3. Click **Enable** in the Live MIDI panel.
4. Choose the MIDI input.
5. Play notes: the page detects simple triads/seventh chords and highlights/rotates the circle.

For quick testing without a MIDI device, open the browser console and run:

```js
circleMidiTest([60, 64, 67]) // C major
circleMidiTest([57, 60, 64]) // A minor
circleMidiTest([62, 65, 69, 72]) // D minor seventh
```

Web MIDI usually requires HTTPS, so GitHub Pages is suitable. Some browsers, especially Safari/iOS, may not support it.


## Background image

The wheel uses `img/keys.jpg` as its SVG background image. Keep that file in the `img/` folder when deploying to GitHub Pages.
