(() => {
    const img = document.getElementById("note");
    const hud = document.getElementById("hud");
    let files = [];
    let last = null;
  
    // Safely build a URL to a file in /notes, taking care of '#' in filenames.
    function notesUrl(filename) {
      // encode just the filename; keep the "notes/" path readable
      return "notes/" + encodeURIComponent(filename);
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
      // Preload for a nicer swap
      const tmp = new Image();
      tmp.onload = () => { img.src = src; };
      tmp.src = src;
  
      hud.textContent = f; // show filename as a tiny HUD
    }
  
    // Events: tap/click/space
    function isSpace(e) {
      return (e.code === "Space") || (e.key === " " || e.key === "Spacebar") || (e.keyCode === 32);
    }
    window.addEventListener("keydown", (e) => { if (isSpace(e)) { e.preventDefault(); showRandom(); } });
    window.addEventListener("click", showRandom, { passive: true });
    window.addEventListener("touchstart", showRandom, { passive: true });
  
    // Load the image list
    fetch("image_list.json", { cache: "no-cache" })
      .then(r => r.json())
      .then(list => {
        // Expecting simple array of filenames like ["F#3.png","Gb3.png",...]
        files = (Array.isArray(list) ? list : []).filter(f => typeof f === "string");
        if (!files.length) hud.textContent = "No images found. Did you create image_list.json?";
        else showRandom();
      })
      .catch(() => { hud.textContent = "Failed to load image_list.json"; });
  })();
  