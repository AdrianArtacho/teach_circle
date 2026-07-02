var supportsES6 = function() {
  // https://gist.github.com/bendc/d7f3dbc83d0f65ca0433caf90378cd95
  try {
    new Function("(a = 0) => a");
    return true;
  }
  catch (err) {
    return false;
  }
}();


var supportsPointerEvents = function() {
  if (window.PointerEvent) {
    document.documentElement.className += " hasPointerEvents"
  } else {
    document.documentElement.className += " noPointerEvents"
  }
  return (window.PointerEvent);
}




// Click any chord to rotate the chord wheel.
// Or drag the wheel left, or right, by 32px or more.
// Drag uses pointer events, so unavailable in Safari.
// Version 5 01/10/2019

(function (window, document) {

  // 12 semitones across 360deg.
  // 1 semitone rotation is a 30deg step 

  "use strict";
  if (!supportsES6) return false;

  const config = {
    clickSelect : '.clickLayer',
    dragLayerSelect : '[data-drag]',
    rotationSelect : '.rotationLayer',
    rotationVar : '--rotation',
    rotationAttr : 'data-rotate',
    durationVar : '--transitionDuration',
    durationAttr : 'data-duration',
    durationDefault : '0.3',
    minDrag : 32
  };
  
  // Get the required control and data elements.
  // Exit if unavailable.

  const clickLayer = document.querySelector(config.clickSelect);
  if (!clickLayer) return false;

  const paths = clickLayer.querySelectorAll(`[${config.rotationAttr}]`);
  if (!paths) return false;

  const dragLayer = document.querySelector(config.dragLayerSelect);
  if (!dragLayer) return false;

  const rotationLayer = document.querySelector(config.rotationSelect);
  if (!rotationLayer) return false;

  const positionX = {
    start : 0,
    end : 0
  };

  const _setCssVars = (duration, rotation) => {
    
    // V3a - Also rotates a mirrored version
    const rotationLayers = document.querySelectorAll(config.rotationSelect);
    if (!rotationLayers) return false;
    for (const rotationLayer of rotationLayers) {
      window.requestAnimationFrame(_ => {
        rotationLayer.style.setProperty(config.durationVar, duration + 's');
        rotationLayer.style.setProperty(config.rotationVar, rotation + 'deg');
      });
    }
  };

  const _getCurrentRotation = _ => {
    const currentRotation = getComputedStyle(rotationLayer)
        .getPropertyValue(config.rotationVar)
        .replace('deg', '');
    return parseInt(currentRotation || 0);
  };

  const _getClickedRotateTo = (element, current) => {
    const rotate = element.getAttribute(config.rotationAttr);
    return current - (rotate || 0) * -1;
  };

  const _getDuration = element => {
    const duration = element.getAttribute(config.durationAttr);
    return duration || config.durationDefault;
  };
  
  const _resetRotation = _ => {
    // Keeps rotation value within +/-360 degrees
    const current = _getCurrentRotation();
    if (current >= -360 && current <= 360) return;

    const rotation = Math.floor(current % 360);
    _setCssVars(0, rotation);
  }

  const _chordClicked = event => {
    const current = _getCurrentRotation();
    const rotation = _getClickedRotateTo(event.target, current);
    const duration = _getDuration(event.target);
    _setCssVars(duration, rotation);
  };


  // Dragging the wheel left or right using pointer events (sorry Safari)

  const _hasDraggedEnough = _ => {
    // Has the cursor travelled far enough?
    const isEndMore = positionX.end > (positionX.start + config.minDrag);
    const isEndLess = positionX.end < (positionX.start - config.minDrag);
    return isEndMore || isEndLess;
  };

  const _getDraggedRotateTo = current => {
    // 30 (deg) is a twelth of 360 degrees = 1 chord (semitone)
    const rotateBy = positionX.end > positionX.start ? 30 : -30;
    return current + rotateBy;
  };

  const _dragMove = event => {
    positionX.end = event.clientX;
    if (!_hasDraggedEnough()) return;

    const current = _getCurrentRotation();
    const rotation = _getDraggedRotateTo(current);
    _setCssVars(config.durationDefault, rotation);
    positionX.start = event.clientX;
  };

  const _dragEnd = event => {
    dragLayer.removeEventListener('pointerup', _dragEnd);
    dragLayer.removeEventListener('pointermove', _dragMove);
  };

  const _dragStart = event => {
    event.preventDefault();
    positionX.start = event.clientX;
    dragLayer.addEventListener('pointerup', _dragEnd);
    dragLayer.addEventListener('pointermove', _dragMove);
  };
  
  const initEvents = (_ => {

    // Clicking on a chord moves it to the top of the wheel.
    clickLayer.addEventListener('click', _chordClicked);

    // Dragging the wheel incrementally rotates the wheel
    // Currently unsupported in Safari, though I'm certain they'll get around to it.
    if (window.PointerEvent) {
      dragLayer.addEventListener('pointerdown', _dragStart);
    }

    // Resets the rotation angle to be within +/- 360deg - Tidy like.
    rotationLayer.addEventListener('transitionend', _resetRotation);
    
  })();

}(window, document));






// Add a full-screen toggle button where supported.
// https://codepen.io/2kool2/pen/ZEzgQRx
// Version 1.5 06/10/2019
// Prefixes would be required for production.

function launchFullWindow(config) {

  "use strict";
  if (!supportsES6) return false;
  if (!document.fullscreenEnabled) return false;

  let cfg = {
    launchObjSelect : '[data-fullScreen]',
    launchBtnClass : 'fullScreen_btn',
    svgClass : 'fullScreen_svg',
    open : {
      icon : 'icon-fullScreen-open',
      extension : '-open',
      label : 'Launch into full screen',
      title : 'Full screen [f, f11]'
    },
    exit : {
      icon : 'icon-fullScreen-exit',
      extension : '-exit',
      label : 'Exit full screen',
      title : 'Exit full screen [f, f11, esc]'
    }
  };

  // Blend the parameter config into the default cfg
  Object.assign(cfg, config);
  
  const svgData = {
    open : {},
    exit : {}   
  }


  // Get symbol from the SVG definitions in the HTML
  const setSvgData = (_ => {

    const getData = param => {
      const symbol = document.getElementById(cfg[param].icon);
      if (!symbol) return false;
      svgData[param].class = cfg.svgClass;
      svgData[param].icon = cfg[param].icon;
      svgData[param].symbol = symbol.innerHTML;
      svgData[param].viewBox = symbol.getAttribute('viewBox');
    };

    getData('open');
    getData('exit');
  })();


  const _instantiateLaunchObj = launchObj => {

    const _getCfg = (param, toOpen) => cfg[toOpen ? 'open' : 'exit'][param];


    const _getSvgString = toOpen => {
      const param = _getCfg('extension', toOpen).substr(1);
      return `<svg class="${svgData[param].class}" aria-hidden="true" viewbox="${svgData[param].viewBox}">${svgData[param].symbol}</svg>`;
    }

    const _setBtnAttr = toOpen => {
      btn.className = cfg.launchBtnClass + _getCfg('extension', toOpen);
      btn.title = _getCfg('title', toOpen);
      btn.setAttribute('aria-label', _getCfg('label', toOpen));
      btn.innerHTML = _getSvgString(toOpen);
    }

    // Check to see if a button already exists in the html
    let btn = launchObj.querySelector('.' + cfg.launchBtnClass);
    if (!btn) {

      // If not, create one
      btn = document.createElement('button');
      launchObj.prepend(btn);
    }
    _setBtnAttr(true);

    const _toggleFullScreen = _ => {
      if (!document.fullscreenElement) {
        launchObj.requestFullscreen();
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
      btn.focus();
    }

    const _onFullscreenChange = _ => _setBtnAttr(!document.fullscreenElement);

    {
      btn.addEventListener('click', _toggleFullScreen);

      // Toggle attr this way because esc key is not detected but change is!
      document.addEventListener('fullscreenchange', _onFullscreenChange);

      // Toggle if the f, or f11, key is pressed
      document.addEventListener('keydown', event => {
        if (event.keyCode === 70 || event.keyCode === 112) {
          _toggleFullScreen();
        }
      });
    }
    
  }

  // Multiple objects to launch
  const objs = document.querySelectorAll(cfg.launchObjSelect);
  for (const obj of objs) {
    _instantiateLaunchObj(obj);
  }

}

// Any object with data-fullScreen attribute by default
launchFullWindow();



// Web MIDI chord tracking + circle highlighting.
// Works on HTTPS pages (GitHub Pages) in browsers that support Web MIDI
// such as Chrome and Edge. Keeps the original click/drag behavior intact.
(function (window, document) {

  "use strict";
  if (!supportsES6) return false;

  const NOTE_NAMES = ['C', 'C# / Db', 'D', 'Eb', 'E', 'F', 'F# / Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
  const CIRCLE_MAJOR_PCS = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5];
  const CIRCLE_MINOR_PCS = [9, 4, 11, 6, 1, 8, 3, 10, 5, 0, 7, 2];

  const CHORD_TEMPLATES = [
    { suffix: 'maj7', label: 'major seventh', intervals: [0, 4, 7, 11] },
    { suffix: '7', label: 'dominant seventh', intervals: [0, 4, 7, 10] },
    { suffix: 'm7', label: 'minor seventh', intervals: [0, 3, 7, 10] },
    { suffix: 'ø7', label: 'half-diminished seventh', intervals: [0, 3, 6, 10] },
    { suffix: 'dim7', label: 'diminished seventh', intervals: [0, 3, 6, 9] },
    { suffix: '', label: 'major triad', intervals: [0, 4, 7] },
    { suffix: 'm', label: 'minor triad', intervals: [0, 3, 7] },
    { suffix: 'dim', label: 'diminished triad', intervals: [0, 3, 6] },
    { suffix: 'aug', label: 'augmented triad', intervals: [0, 4, 8] },
    { suffix: 'sus4', label: 'suspended fourth', intervals: [0, 5, 7] },
    { suffix: 'sus2', label: 'suspended second', intervals: [0, 2, 7] }
  ];

  const activeNotes = new Set();
  let midiAccess = null;
  let selectedInputId = '';

  const circle = document.querySelector('[data-fullScreen]') || document.body;
  const rotationLayer = document.querySelector('.rotationLayer');
  const majorPaths = Array.from(document.querySelectorAll('.clickLayer_major [data-rotate]'));
  const minorPaths = Array.from(document.querySelectorAll('.clickLayer_minor [data-rotate]'));
  const majorVisualPaths = Array.from(document.querySelectorAll('.rotationLayer_major path'));
  const minorVisualPaths = Array.from(document.querySelectorAll('.rotationLayer_minor path'));
  const allClickablePaths = Array.from(document.querySelectorAll('.clickLayer [data-rotate]'));
  const allHighlightPaths = allClickablePaths.concat(majorVisualPaths, minorVisualPaths);

  const normalisePc = value => ((value % 12) + 12) % 12;
  const pcName = pc => NOTE_NAMES[normalisePc(pc)];
  const pcsFromActiveNotes = _ => Array.from(new Set(Array.from(activeNotes).map(note => normalisePc(note)))).sort((a, b) => a - b);

  const annotateCirclePaths = _ => {
    const annotate = (paths, pcs, mode, suffix) => {
      paths.forEach((path, index) => {
        const pc = pcs[index];
        path.dataset.pc = pc;
        path.dataset.mode = mode;
        path.dataset.chord = pcName(pc) + suffix;
      });
    };
    annotate(majorPaths, CIRCLE_MAJOR_PCS, 'major', '');
    annotate(majorVisualPaths, CIRCLE_MAJOR_PCS, 'major', '');
    annotate(minorPaths, CIRCLE_MINOR_PCS, 'minor', 'm');
    annotate(minorVisualPaths, CIRCLE_MINOR_PCS, 'minor', 'm');
  };

  const createMidiPanel = _ => {
    const panel = document.createElement('section');
    panel.className = 'midiPanel';
    panel.innerHTML = `
      <div class="midiPanel_row">
        <strong>Live MIDI</strong>
        <button class="midiPanel_btn" type="button" data-midi-enable>Enable</button>
      </div>
      <label class="midiPanel_label">
        Input
        <select class="midiPanel_select" data-midi-input disabled>
          <option value="">No MIDI input selected</option>
        </select>
      </label>
      <div class="midiPanel_status" data-midi-status>Use Chrome/Edge and connect a MIDI keyboard.</div>
      <div class="midiPanel_result" data-midi-result>Play a chord…</div>
      <div class="midiPanel_pcs" data-midi-pcs></div>
    `;
    circle.prepend(panel);
    return panel;
  };

  const panel = createMidiPanel();
  const enableBtn = panel.querySelector('[data-midi-enable]');
  const inputSelect = panel.querySelector('[data-midi-input]');
  const statusEl = panel.querySelector('[data-midi-status]');
  const resultEl = panel.querySelector('[data-midi-result]');
  const pcsEl = panel.querySelector('[data-midi-pcs]');

  const setStatus = message => {
    statusEl.textContent = message;
  };

  const getCurrentRotation = _ => {
    if (!rotationLayer) return 0;
    const currentRotation = getComputedStyle(rotationLayer)
      .getPropertyValue('--rotation')
      .replace('deg', '');
    return parseInt(currentRotation || 0);
  };

  const shortestRotationToIndex = index => {
    // Use the nearest equivalent angle instead of jumping to a fixed absolute
    // position. This keeps harmonic motion visually local: C -> Em only moves
    // one fifth-step, because Em lives in the neighbouring G-major area.
    const current = getCurrentRotation();
    const target = index * -30;
    const diff = ((target - current + 540) % 360) - 180;
    return current + diff;
  };

  const setRotationForCircleIndex = index => {
    if (!rotationLayer || index < 0) return;
    const rotation = shortestRotationToIndex(index);
    const rotationLayers = document.querySelectorAll('.rotationLayer');
    for (const layer of rotationLayers) {
      window.requestAnimationFrame(_ => {
        layer.style.setProperty('--transitionDuration', '0.3s');
        layer.style.setProperty('--rotation', rotation + 'deg');
      });
    }
  };

  const setRotationForRoot = rootPc => {
    const index = CIRCLE_MAJOR_PCS.indexOf(normalisePc(rootPc));
    setRotationForCircleIndex(index);
  };

  const clearHighlights = _ => {
    allHighlightPaths.forEach(path => path.classList.remove('is-active', 'is-root', 'is-chord-tone'));
  };

  const highlightPcs = (pcs, rootPc, mode) => {
    // Pitch-class highlighting is only used before a chord has been detected:
    // a single G may reasonably light several G-related places. Once there is
    // a chord, use highlightChord() instead.
    clearHighlights();
    const root = normalisePc(rootPc);
    const pcSet = new Set(pcs.map(normalisePc));
    allHighlightPaths.forEach(path => {
      const pc = Number(path.dataset.pc);
      if (!pcSet.has(pc)) return;
      path.classList.add('is-active', 'is-chord-tone');

      const isRootInCorrectLayer = pc === root && (
        (mode === 'minor' && path.dataset.mode === 'minor') ||
        (mode !== 'minor' && path.dataset.mode === 'major')
      );
      if (isRootInCorrectLayer) path.classList.add('is-root');
    });
  };

  const chordLayerForChord = chord => (chord.mode === 'minor' || chord.mode === 'diminished') ? 'minor' : 'major';

  const focusIndexForChord = chord => {
    // Major chords focus their own major area. Minor chords focus the wedge
    // where their relative major and their minor form coexist on this wheel:
    // A minor -> C major area, D minor -> F major area, E minor -> G major area.
    if (chord.mode === 'minor') {
      return CIRCLE_MINOR_PCS.indexOf(normalisePc(chord.root));
    }
    if (chord.mode === 'diminished') {
      // A leading-tone diminished triad belongs visually to the major key
      // a semitone above it: B° -> C major area, F#° -> G major area.
      return CIRCLE_MAJOR_PCS.indexOf(normalisePc(chord.root + 1));
    }
    return CIRCLE_MAJOR_PCS.indexOf(normalisePc(chord.root));
  };

  const focusPcForChord = chord => CIRCLE_MAJOR_PCS[focusIndexForChord(chord)];



  const currentFocusIndex = _ => {
    // The major-key area currently at the top of the wheel. This lets MIDI
    // playing behave like harmonic motion inside the visible key universe
    // rather than always recentering every chord as an isolated object.
    const current = getCurrentRotation();
    return normalisePc(Math.round(-current / 30));
  };

  const chordDegreeInMajorKey = (chord, keyPc) => {
    const degree = normalisePc(chord.root - keyPc);
    const suffix = chord.suffix;

    if ((degree === 0 || degree === 5) && (suffix === '' || suffix === 'maj7')) return degree;
    if (degree === 7 && (suffix === '' || suffix === '7')) return degree;
    if ((degree === 2 || degree === 4 || degree === 9) && (suffix === 'm' || suffix === 'm7')) return degree;
    if (degree === 11 && (suffix === 'dim' || suffix === 'ø7' || suffix === 'dim7')) return degree;

    return null;
  };

  const chordBelongsToCurrentMajorUniverse = chord => {
    const index = currentFocusIndex();
    const keyPc = CIRCLE_MAJOR_PCS[index];
    return chordDegreeInMajorKey(chord, keyPc) !== null;
  };

  const highlightLocalDiatonicChord = chord => {
    // In a local key universe, most chords already have their own neighbouring
    // major/minor path. The leading-tone diminished chord is represented as the
    // outer/top part of the current key area, so we highlight that area without
    // forcing a rotation.
    if (chord.mode !== 'diminished') {
      highlightChord(chord);
      return;
    }

    clearHighlights();
    const index = currentFocusIndex();
    const paths = [minorPaths[index], minorVisualPaths[index]].filter(Boolean);
    paths.forEach(path => path.classList.add('is-active', 'is-root'));
  };

  const highlightChord = chord => {
    clearHighlights();
    const layer = chordLayerForChord(chord);
    const root = normalisePc(chord.root);

    // Highlight one harmonic object, not every pitch class contained in it.
    // This prevents C major from lighting unrelated E/G regions elsewhere.
    allHighlightPaths.forEach(path => {
      const pc = Number(path.dataset.pc);
      if (pc !== root || path.dataset.mode !== layer) return;
      path.classList.add('is-active', 'is-root');
    });
  };

  const detectChord = pcs => {
    if (pcs.length < 2) return null;
    const pcSet = new Set(pcs.map(normalisePc));
    const candidates = [];

    for (const root of pcSet) {
      for (const template of CHORD_TEMPLATES) {
        const chordPcs = template.intervals.map(interval => normalisePc(root + interval));
        const matches = chordPcs.every(pc => pcSet.has(pc));
        if (!matches) continue;
        const extraNotes = pcs.length - chordPcs.length;
        candidates.push({
          root,
          suffix: template.suffix,
          label: template.label,
          pcs: chordPcs,
          mode: (template.suffix === 'm' || template.suffix === 'm7') ? 'minor' : ((template.suffix === 'dim' || template.suffix === 'ø7' || template.suffix === 'dim7') ? 'diminished' : 'major'),
          score: chordPcs.length * 10 - Math.max(0, extraNotes)
        });
      }
    }

    candidates.sort((a, b) => b.score - a.score || b.pcs.length - a.pcs.length);
    return candidates[0] || null;
  };

  const updateDisplay = _ => {
    const pcs = pcsFromActiveNotes();
    pcsEl.textContent = pcs.length ? 'Pitch classes: ' + pcs.map(pcName).join(', ') : '';

    if (!pcs.length) {
      resultEl.textContent = 'Play a chord…';
      clearHighlights();
      return;
    }

    const chord = detectChord(pcs);
    if (!chord) {
      resultEl.textContent = pcs.length === 1 ? pcName(pcs[0]) : 'No simple chord detected';
      highlightPcs(pcs, pcs[0], 'major');
      return;
    }

    const focusIndex = focusIndexForChord(chord);
    const focusPc = focusPcForChord(chord);
    const isLocal = chordBelongsToCurrentMajorUniverse(chord);
    const focusLabel = isLocal
      ? ' · inside current key area'
      : ((chord.mode === 'minor' || chord.mode === 'diminished') ? ' · focus: ' + pcName(focusPc) + ' major area' : '');
    resultEl.textContent = pcName(chord.root) + chord.suffix + ' — ' + chord.label + focusLabel;

    if (isLocal) {
      highlightLocalDiatonicChord(chord);
    } else {
      highlightChord(chord);
      setRotationForCircleIndex(focusIndex);
    }
  };

  const handleMidiMessage = event => {
    const [status, note, velocity] = event.data;
    const command = status & 0xf0;

    if (command === 0x90 && velocity > 0) {
      activeNotes.add(note);
    } else if (command === 0x80 || (command === 0x90 && velocity === 0)) {
      activeNotes.delete(note);
    } else {
      return;
    }

    updateDisplay();
  };

  const disconnectInputs = _ => {
    if (!midiAccess) return;
    for (const input of midiAccess.inputs.values()) {
      input.onmidimessage = null;
    }
  };

  const connectSelectedInput = _ => {
    disconnectInputs();
    activeNotes.clear();
    updateDisplay();

    if (!midiAccess || !selectedInputId) return;
    const input = midiAccess.inputs.get(selectedInputId);
    if (!input) return;
    input.onmidimessage = handleMidiMessage;
    setStatus('Listening to ' + input.name + '.');
  };

  const populateInputs = _ => {
    if (!midiAccess) return;
    const inputs = Array.from(midiAccess.inputs.values());
    inputSelect.innerHTML = '';

    if (!inputs.length) {
      inputSelect.disabled = true;
      inputSelect.innerHTML = '<option value="">No MIDI inputs found</option>';
      setStatus('No MIDI inputs found. Connect a device, then try again.');
      return;
    }

    inputSelect.disabled = false;
    inputs.forEach((input, index) => {
      const option = document.createElement('option');
      option.value = input.id;
      option.textContent = input.name || ('MIDI input ' + (index + 1));
      inputSelect.appendChild(option);
    });

    selectedInputId = selectedInputId && midiAccess.inputs.has(selectedInputId)
      ? selectedInputId
      : inputs[0].id;
    inputSelect.value = selectedInputId;
    connectSelectedInput();
  };

  const enableMidi = async _ => {
    if (!navigator.requestMIDIAccess) {
      setStatus('Web MIDI is not available in this browser. Try Chrome or Edge.');
      return;
    }

    try {
      setStatus('Requesting MIDI permission…');
      midiAccess = await navigator.requestMIDIAccess({ sysex: false });
      midiAccess.onstatechange = populateInputs;
      populateInputs();
      enableBtn.textContent = 'MIDI enabled';
      enableBtn.disabled = true;
    } catch (err) {
      setStatus('MIDI permission was denied or unavailable.');
    }
  };

  annotateCirclePaths();

  enableBtn.addEventListener('click', enableMidi);
  inputSelect.addEventListener('change', event => {
    selectedInputId = event.target.value;
    connectSelectedInput();
  });

  // Small debugging hook: from the browser console, run e.g.
  // window.circleMidiTest([60, 64, 67]) to simulate C major.
  window.circleMidiTest = notes => {
    activeNotes.clear();
    notes.forEach(note => activeNotes.add(Number(note)));
    updateDisplay();
  };

}(window, document));
