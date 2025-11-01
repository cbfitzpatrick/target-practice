(() => {
    const img = document.getElementById("note");
    const hud = document.getElementById("hud");
    let files = [];
    let last = null;
  
    // Debounce settings
    const DEBOUNCE_MS = 300;
    let lastTrigger = 0;
  
    function debounceShowRandom() {
      const now = Date.now();
      if (now - lastTrigger < DEBOUNCE_MS) return; // ignore rapid repeats
      lastTrigger = now;
      showRandom();
    }
  
    function notesUrl(filename) {
      // Files no longer contain '#' after rename
      return "notes/" + filename;
    }
  
    function pickRandom() {
      if (!files.length) return null;
      if (files.length === 1) return files[0];
      let f;
      do { f = files[(Math.random() * files.length) | 0]; } while (f === last);
      return f;
    }
  
    function showRandom() {
        const f = pickRandom();
        if (!f) return;
        last = f;
      
        const src = notesUrl(f);
        const tmp = new Image();
        tmp.onload = () => { img.src = src; };
        tmp.src = src;
      
        // no HUD filename text
    }
  
    function isSpace(e) {
      return (e.code === "Space") || (e.key === " " || e.key === "Spacebar") || (e.keyCode === 32);
    }
  
    // --- Event bindings with debounce ---
    window.addEventListener("keydown", (e) => {
      if (isSpace(e)) { e.preventDefault(); debounceShowRandom(); }
    });
  
    // Touch → use debounce; suppress subsequent click
    let touchHandled = false;
    window.addEventListener("touchstart", (e) => {
      touchHandled = true;
      debounceShowRandom();
    }, { passive: true });
  
    window.addEventListener("click", (e) => {
      // Ignore the click if it immediately followed a touch
      if (touchHandled) {
        touchHandled = false;
        return;
      }
      debounceShowRandom();
    }, { passive: true });
  
    // Load image list
    fetch("image_list.json", { cache: "no-cache" })
      .then(r => r.json())
      .then(list => {
        files = (Array.isArray(list) ? list : []).filter(f => typeof f === "string");
        if (!files.length) hud.textContent = "No images found.";
        else showRandom();
      })
      .catch(() => { hud.textContent = "Failed to load image_list.json"; });
  })();
  