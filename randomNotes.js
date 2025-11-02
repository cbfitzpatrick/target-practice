(() => {
    // --- Elements ---
    const img = document.getElementById("note");
    const hud = document.getElementById("hud");
    const lowSel = document.getElementById("lowNote");
    const highSel = document.getElementById("highNote");
    const startBtn = document.getElementById("startBtn");
    const beginnerBtn = document.getElementById("beginnerBtn");
    const proBtn = document.getElementById("proBtn");
    const naturalsBtn = document.getElementById("naturalsBtn");
  
    // --- State ---
    let allItems = [];   // [{file, midi, label, acc}] acc: -1 flat, 0 natural, 1 sharp
    let active = [];     // filtered by chosen range (+ naturals filter if enabled)
    let last = null;
    let started = false;
    let naturalsOnly = false;
  
    // Debounce to avoid double fire on mobile taps
    const DEBOUNCE_MS = 300;
    let lastTrigger = 0;
    function debouncedShowRandom() {
      const now = Date.now();
      if (now - lastTrigger < DEBOUNCE_MS) return;
      lastTrigger = now;
      showRandom();
    }
  
    // Parse filename → pitch info
    // Accept "Cs4.png", "Db5-1.png", "F#3-1.png", "A4.png", "Fs4.png"
    function parseFileToPitch(fileName) {
      const m = /^([A-G])([sb#]?)(\d)(?:[-_].*)?\.png$/i.exec(fileName);
      if (!m) return null;
      const letter = m[1].toUpperCase();
      const accRaw = m[2];
      const oct = parseInt(m[3], 10);
  
      let acc = 0;
      if (accRaw === "s" || accRaw === "#") acc = 1;   // sharp
      else if (accRaw === "b") acc = -1;               // flat
  
      const baseMap = { C:0, D:2, E:4, F:5, G:7, A:9, B:11 };
      const pc = (baseMap[letter] + acc + 12) % 12;
      const midi = (oct + 1) * 12 + pc;
  
      const unicodeAcc = acc === 1 ? "♯" : acc === -1 ? "♭" : "";
      const label = `${letter}${unicodeAcc}${oct}`;
      return { file: fileName, midi, label, acc };
    }
  
    function notesUrl(filename) {
      // Files were renamed web-safe; if any still contain '#', encode
      return "notes/" + (filename.includes("#") ? encodeURIComponent(filename) : filename);
    }
  
    function pickRandom() {
      if (!active.length) return null;
      if (active.length === 1) return active[0];
      let item;
      do { item = active[(Math.random() * active.length) | 0]; } while (last && item.file === last.file);
      return item;
    }
  
    function showRandom() {
      const item = pickRandom();
      if (!item) return;
      last = item;
  
      const src = notesUrl(item.file);
      const tmp = new Image();
      tmp.onload = () => { img.src = src; };
      tmp.src = src;
    }
  
    function isSpace(e) {
      return (e.code === "Space") || (e.key === " " || e.key === "Spacebar") || (e.keyCode === 32);
    }
  
    // --- Build selectors from available files ---
    function populateRangeSelectors(items) {
      const byMidi = new Map(); // midi -> representative label
      for (const it of items) if (!byMidi.has(it.midi)) byMidi.set(it.midi, it.label);
  
      const mids = [...byMidi.keys()].sort((a,b) => a-b);
  
      const mkOption = (m) => {
        const opt = document.createElement("option");
        opt.value = String(m);
        opt.textContent = byMidi.get(m);
        return opt;
      };
  
      lowSel.innerHTML = "";
      highSel.innerHTML = "";
      mids.forEach(m => {
        lowSel.appendChild(mkOption(m));
        highSel.appendChild(mkOption(m));
      });
  
      // default to full available range
      lowSel.value = String(mids[0]);
      highSel.value = String(mids[mids.length - 1]);
    }
  
    // --- Helpers for presets ---
    function midiOf(name) {
      // name like "C4", "G5", "F#3", "Fs3"
      const m = /^([A-G])([sb#]?)(\d)$/.exec(name);
      if (!m) return null;
      const L = m[1].toUpperCase();
      const accRaw = m[2];
      const oct = parseInt(m[3], 10);
      let acc = 0;
      if (accRaw === "s" || accRaw === "#") acc = 1;
      else if (accRaw === "b") acc = -1;
      const baseMap = { C:0, D:2, E:4, F:5, G:7, A:9, B:11 };
      const pc = (baseMap[L] + acc + 12) % 12;
      return (oct + 1) * 12 + pc;
    }
  
    function setSelectorsToRange(lowMidi, highMidi) {
      // Clamp to available values present in selectors
      const optsLow = [...lowSel.options].map(o => Number(o.value));
      const optsHigh = [...highSel.options].map(o => Number(o.value));
      const lowVal = optsLow.reduce((best, v) => (v <= lowMidi && v > best ? v : best), -Infinity);
      const highVal = optsHigh.reduce((best, v) => (v >= highMidi && v < best ? v : best), Infinity);
  
      // If exact not found, fallback to closest available
      lowSel.value = String(Number.isFinite(lowVal) ? lowVal : optsLow[0]);
      highSel.value = String(Number.isFinite(highVal) ? highVal : optsHigh[optsHigh.length - 1]);
    }
  
    function applyRange() {
      const lo = Number(lowSel.value);
      const hi = Number(highSel.value);
      if (!(Number.isFinite(lo) && Number.isFinite(hi))) return;
  
      const low = Math.min(lo, hi);
      const high = Math.max(lo, hi);
  
      active = allItems.filter(it =>
        it.midi >= low && it.midi <= high && (!naturalsOnly || it.acc === 0)
      );
  
      started = true;
      showRandom();
      startBtn.textContent = "Apply";
    }
  
    // --- Events ---
    window.addEventListener("keydown", (e) => {
      if (!started) return;
      if (isSpace(e)) { e.preventDefault(); debouncedShowRandom(); }
    });
  
    let touchHandled = false;
    window.addEventListener("touchstart", (e) => {
      if (!started) return;
      touchHandled = true;
      debouncedShowRandom();
    }, { passive: true });
  
    window.addEventListener("click", (e) => {
      if (!started) return;
      if (touchHandled) { touchHandled = false; return; }
      debouncedShowRandom();
    }, { passive: true });
  
    startBtn.addEventListener("click", applyRange);
  
    // Preset buttons
    beginnerBtn.addEventListener("click", () => {
      const low = midiOf("C4");     // 60
      const high = midiOf("G5");    // 79
      setSelectorsToRange(low, high);
      applyRange();
    });
  
    proBtn.addEventListener("click", () => {
      const low = midiOf("F#3");    // 54
      const high = midiOf("C6");    // 84
      setSelectorsToRange(low, high);
      applyRange();
    });
  
    naturalsBtn.addEventListener("click", () => {
      naturalsOnly = !naturalsOnly;
      naturalsBtn.setAttribute("aria-pressed", String(naturalsOnly));
      if (started) applyRange(); // re-filter current range
    });
  
    // --- Load list and initialize UI ---
    fetch("image_list.json", { cache: "no-store" })
      .then(r => r.json())
      .then(list => {
        const files = (Array.isArray(list) ? list : []).filter(f => typeof f === "string");
        allItems = files.map(parseFileToPitch).filter(Boolean).sort((a,b) => a.midi - b.midi);
        if (!allItems.length) {
          hud.style.display = "block";
          hud.textContent = "No images found.";
          startBtn.disabled = true;
          beginnerBtn.disabled = true;
          proBtn.disabled = true;
          naturalsBtn.disabled = true;
          return;
        }
        populateRangeSelectors(allItems);
        // Wait for user to press Start or a preset
      })
      .catch(() => {
        hud.style.display = "block";
        hud.textContent = "Failed to load image_list.json";
        startBtn.disabled = true;
        beginnerBtn.disabled = true;
        proBtn.disabled = true;
        naturalsBtn.disabled = true;
      });
  })();
  