// ── Image lightbox (injected into exported HTML) ────────────────────────────────
// Self-contained CSS + markup + script. Clicking any document image opens it
// full-size with zoom in/out, wheel zoom, drag-to-pan and close (Esc / backdrop).

export const LIGHTBOX_CSS = `
.doc img { cursor: zoom-in; }
.de-lightbox { position: fixed; inset: 0; z-index: 99999; display: none; align-items: center; justify-content: center; background: rgba(0,0,0,0.88); -webkit-backdrop-filter: blur(4px); backdrop-filter: blur(4px); overflow: hidden; }
.de-lightbox.open { display: flex; }
.de-lightbox-img { max-width: 92vw; max-height: 88vh; transform-origin: center center; transition: transform 0.12s ease; cursor: grab; user-select: none; -webkit-user-drag: none; border-radius: 4px; box-shadow: 0 12px 48px rgba(0,0,0,0.6); }
.de-lightbox-img.grabbing { cursor: grabbing; transition: none; }
.de-lb-toolbar { position: fixed; top: 18px; right: 18px; display: flex; gap: 8px; z-index: 100000; }
.de-lb-btn { width: 40px; height: 40px; border-radius: 8px; border: none; background: rgba(255,255,255,0.12); color: #fff; font-size: 22px; line-height: 1; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.15s; font-family: -apple-system, system-ui, sans-serif; }
.de-lb-btn:hover { background: rgba(255,255,255,0.26); }
.de-lb-zoom { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); color: rgba(255,255,255,0.7); font-family: ui-monospace, monospace; font-size: 12px; z-index: 100000; pointer-events: none; }`;

export const LIGHTBOX_HTML = `<div class="de-lightbox" id="de-lightbox" aria-hidden="true">
<div class="de-lb-toolbar">
<button class="de-lb-btn" data-act="out" title="Уменьшить" aria-label="Уменьшить">−</button>
<button class="de-lb-btn" data-act="in" title="Увеличить" aria-label="Увеличить">+</button>
<button class="de-lb-btn" data-act="close" title="Закрыть" aria-label="Закрыть">×</button>
</div>
<img class="de-lightbox-img" id="de-lightbox-img" src="" alt="">
<div class="de-lb-zoom" id="de-lb-zoom">100%</div>
</div>`;

export const LIGHTBOX_JS = `<script>
(function(){
  var lb = document.getElementById('de-lightbox');
  if (!lb) return;
  var img = document.getElementById('de-lightbox-img');
  var zoomLabel = document.getElementById('de-lb-zoom');
  var scale = 1, tx = 0, ty = 0;
  var MIN = 0.25, MAX = 6, STEP = 0.25;
  var dragging = false, sx = 0, sy = 0;

  function apply(){
    img.style.transform = 'translate(' + tx + 'px,' + ty + 'px) scale(' + scale + ')';
    img.style.cursor = scale > 1 ? 'grab' : 'default';
    zoomLabel.textContent = Math.round(scale * 100) + '%';
  }
  function open(src, alt){
    img.src = src; img.alt = alt || '';
    scale = 1; tx = 0; ty = 0; apply();
    lb.classList.add('open');
    lb.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function close(){
    lb.classList.remove('open');
    lb.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    img.src = '';
  }
  function zoom(dir){
    scale = Math.min(MAX, Math.max(MIN, +(scale + dir * STEP).toFixed(2)));
    if (scale <= 1) { tx = 0; ty = 0; }
    apply();
  }

  document.querySelectorAll('.doc img').forEach(function(el){
    el.addEventListener('click', function(){ open(el.currentSrc || el.src, el.alt); });
  });

  lb.querySelectorAll('.de-lb-btn').forEach(function(btn){
    btn.addEventListener('click', function(e){
      e.stopPropagation();
      var act = btn.getAttribute('data-act');
      if (act === 'in') zoom(1);
      else if (act === 'out') zoom(-1);
      else close();
    });
  });

  lb.addEventListener('click', function(e){ if (e.target === lb) close(); });
  img.addEventListener('click', function(e){ e.stopPropagation(); });
  lb.addEventListener('wheel', function(e){ e.preventDefault(); zoom(e.deltaY < 0 ? 1 : -1); }, { passive: false });

  img.addEventListener('mousedown', function(e){
    if (scale <= 1) return;
    dragging = true; img.classList.add('grabbing');
    sx = e.clientX - tx; sy = e.clientY - ty; e.preventDefault();
  });
  window.addEventListener('mousemove', function(e){
    if (!dragging) return;
    tx = e.clientX - sx; ty = e.clientY - sy; apply();
  });
  window.addEventListener('mouseup', function(){ dragging = false; img.classList.remove('grabbing'); });

  document.addEventListener('keydown', function(e){
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    else if (e.key === '+' || e.key === '=') zoom(1);
    else if (e.key === '-' || e.key === '_') zoom(-1);
  });
})();
</script>`;
