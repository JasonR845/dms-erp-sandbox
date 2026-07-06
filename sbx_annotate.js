/* DMS ERP SANDBOX — Markup Layer + Workbench side rail (all module pages)
   Draw, drop widgets (checkbox / dropdown / text), arrows, circles, rectangles,
   freehand, colors, fonts, images (upload or drag-drop), move/resize, undo,
   Save to sandbox (claude_annotations.json) + quick notes into the Claude Workbench. */
(function () {
  "use strict";
  var PAGE = (location.pathname.split("/").pop() || "index.html");
  var LSKEY = "dmssbx-annotations";
  var NOTEKEY = "dmssbx-claude-notes";
  var AFILE = "claude_annotations.json";

  /* ---------------- state ---------------- */
  var all = {};                    // page -> scene
  try { all = JSON.parse(localStorage.getItem(LSKEY) || "{}"); } catch (e) { all = {}; }
  var scene = all[PAGE] && all[PAGE].items ? all[PAGE] : { v: 1, items: [], updated: null };
  var undoStack = [];
  var cur = { tool: "browse", color: "#B3261E", width: 3, font: "Inter", size: 14, sel: null, hidden: false, open: false };
  var seq = 0;
  function nid() { return "A" + Date.now().toString(36) + (seq++) + Math.random().toString(36).slice(2, 4); }
  function now() { return new Date().toISOString(); }

  function snapshot() { undoStack.push(JSON.stringify(scene.items)); if (undoStack.length > 30) undoStack.shift(); }
  function undo() { if (!undoStack.length) return toast("Nothing to undo"); scene.items = JSON.parse(undoStack.pop()); cur.sel = null; persist(); render(); }
  function persist() {
    scene.updated = now(); all[PAGE] = scene;
    try { localStorage.setItem(LSKEY, JSON.stringify(all)); }
    catch (e) { toast("Browser storage is full — use Save to sandbox (file) instead", true); }
  }
  function byId(id) { for (var i = 0; i < scene.items.length; i++) if (scene.items[i].id === id) return scene.items[i]; return null; }

  /* ---------------- css ---------------- */
  var css = ""
  + ".sbxa-tab{position:fixed;right:0;top:45%;z-index:100000;background:#14253D;color:#fff;border:0;border-radius:10px 0 0 10px;padding:12px 9px;cursor:pointer;font:700 15px Inter,Arial,sans-serif;box-shadow:0 2px 10px rgba(20,37,61,.35);writing-mode:vertical-rl;letter-spacing:2px}"
  + ".sbxa-tab:hover{background:#1B3050}"
  + ".sbxa-panel{position:fixed;right:0;top:0;bottom:0;width:min(330px,94vw);z-index:100001;background:#fff;border-left:1px solid #DDE3EA;box-shadow:-6px 0 22px rgba(20,37,61,.18);transform:translateX(105%);transition:transform .18s ease;display:flex;flex-direction:column;font:13px Inter,Arial,sans-serif;color:#2E3338}"
  + ".sbxa-panel.on{transform:none}"
  + ".sbxa-head{background:#14253D;color:#fff;padding:12px 14px;display:flex;align-items:center;gap:8px}"
  + ".sbxa-head b{font-family:Archivo,Inter,Arial,sans-serif;font-size:13.5px;letter-spacing:.4px}"
  + ".sbxa-head .x{margin-left:auto;background:rgba(255,255,255,.12);border:0;color:#fff;border-radius:7px;width:26px;height:26px;cursor:pointer;font-size:13px}"
  + ".sbxa-body{flex:1;overflow-y:auto;padding:12px 14px}"
  + ".sbxa-sec{font-size:10px;font-weight:800;color:#5A6470;text-transform:uppercase;letter-spacing:.6px;margin:12px 0 6px}"
  + ".sbxa-sec:first-child{margin-top:0}"
  + ".sbxa-tools{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}"
  + ".sbxa-t{border:1px solid #DDE3EA;background:#fff;border-radius:8px;padding:7px 4px;cursor:pointer;font:600 11px Inter,Arial,sans-serif;color:#2E3338;display:flex;flex-direction:column;align-items:center;gap:3px}"
  + ".sbxa-t{font-size:15px;line-height:1.1}.sbxa-t span{font-size:10.5px;font-weight:600;display:block;margin-top:3px}"
  + ".sbxa-t.on{background:#14253D;color:#fff;border-color:#14253D}"
  + ".sbxa-sw{display:flex;gap:6px;flex-wrap:wrap;align-items:center}"
  + ".sbxa-c{width:22px;height:22px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 0 1px #DDE3EA;cursor:pointer}"
  + ".sbxa-c.on{box-shadow:0 0 0 2px #14253D}"
  + ".sbxa-row{display:flex;gap:8px;align-items:center;margin-top:6px}"
  + ".sbxa-row select,.sbxa-row input[type=range]{flex:1;border:1px solid #DDE3EA;border-radius:7px;padding:5px 7px;font:inherit;background:#fff}"
  + ".sbxa-btn{border-radius:8px;padding:8px 12px;font:600 12px Inter,Arial,sans-serif;border:1px solid transparent;cursor:pointer;width:100%;margin-top:6px}"
  + ".sbxa-p{background:#14253D;color:#fff}.sbxa-p:hover{background:#1B3050}"
  + ".sbxa-s{background:#fff;color:#14253D;border-color:#DDE3EA}.sbxa-s:hover{border-color:#14253D}"
  + ".sbxa-d{background:#fff;color:#B3261E;border-color:#EBD0CE}"
  + ".sbxa-note{width:100%;border:1px solid #DDE3EA;border-radius:8px;padding:8px;font:inherit;resize:vertical;min-height:54px;box-sizing:border-box}"
  + ".sbxa-hint{font-size:10.5px;color:#5A6470;line-height:1.5;margin-top:6px}"
  + ".sbxa-foot{border-top:1px solid #DDE3EA;padding:9px 14px;font-size:10.5px;color:#5A6470;display:flex;gap:6px;align-items:center}"
  + ".sbxa-dot{width:8px;height:8px;border-radius:50%;background:#8C97A4;flex:none}.sbxa-dot.on{background:#15803D}"
  + "#sbxa-layer{position:absolute;left:0;top:0;z-index:99990;overflow:visible}"
  + "#sbxa-layer.hidden{display:none}"
  + "#sbxa-svg{position:absolute;left:0;top:0;overflow:visible}"
  + "#sbxa-svg .shp{pointer-events:visiblePainted}"
  + "#sbxa-svg .shp.sel{filter:drop-shadow(0 0 3px #2563EB)}"
  + ".sbxa-w{position:absolute;pointer-events:auto;font-family:Inter,Arial,sans-serif}"
  + ".sbxa-w.sel{outline:2px dashed #2563EB;outline-offset:3px}"
  + ".sbxa-w .lbl{outline:none;min-width:30px}"
  + ".sbxa-w img{width:100%;height:100%;display:block;border-radius:4px;box-shadow:0 2px 10px rgba(20,37,61,.25)}"
  + ".sbxa-rh{position:absolute;right:-7px;bottom:-7px;width:14px;height:14px;border-radius:50%;background:#2563EB;border:2px solid #fff;cursor:nwse-resize;display:none}"
  + ".sbxa-w.sel .sbxa-rh{display:block}"
  + ".sbxa-del{position:absolute;top:-12px;right:-12px;width:20px;height:20px;border-radius:50%;background:#B3261E;color:#fff;border:2px solid #fff;cursor:pointer;display:none;font:700 11px/16px Arial;text-align:center}"
  + ".sbxa-w.sel .sbxa-del{display:block}"
  + "#sbxa-toasts{position:fixed;bottom:16px;left:16px;z-index:100002;display:flex;flex-direction:column;gap:6px}"
  + ".sbxa-toast{background:#14253D;color:#fff;border-radius:9px;padding:9px 13px;font:12px Inter,Arial,sans-serif;max-width:300px;box-shadow:0 4px 14px rgba(20,37,61,.3)}"
  + ".sbxa-toast.err{background:#B3261E}"
  + "body.sbxa-drawing,body.sbxa-drawing *{cursor:crosshair!important}"
  + "body.sbxa-erasing,body.sbxa-erasing *{cursor:not-allowed!important}"
  + ".sbxa-tools{margin-bottom:2px}"
  + ".sbxa-tgl{display:flex;align-items:center;gap:8px;background:rgba(255,255,255,.92);border:1px dashed #8C97A4;border-radius:7px;padding:6px 9px}"
  + ".sbxa-tgl .sw{width:34px;height:19px;border-radius:10px;background:#C6CDD6;position:relative;flex:none;cursor:pointer;transition:background .15s}"
  + ".sbxa-tgl .sw .kn{position:absolute;top:2px;left:2px;width:15px;height:15px;border-radius:50%;background:#fff;transition:left .15s;box-shadow:0 1px 2px rgba(20,37,61,.3)}"
  + ".sbxa-tgl .sw.on{background:#15803D}"
  + ".sbxa-tgl .sw.on .kn{left:17px}";
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  /* ---------------- toast ---------------- */
  function toast(m, isErr) {
    var h = document.getElementById("sbxa-toasts");
    if (!h) { h = document.createElement("div"); h.id = "sbxa-toasts"; document.body.appendChild(h); }
    var t = document.createElement("div"); t.className = "sbxa-toast" + (isErr ? " err" : ""); t.textContent = m;
    h.appendChild(t); setTimeout(function () { t.remove(); }, 3600);
  }

  /* ---------------- layer ---------------- */
  var layer = document.createElement("div"); layer.id = "sbxa-layer";
  var svgNS = "http://www.w3.org/2000/svg";
  var svg = document.createElementNS(svgNS, "svg"); svg.id = "sbxa-svg";
  layer.appendChild(svg); document.body.appendChild(layer);
  function sizeLayer() {
    var w = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
    var h = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
    layer.style.width = w + "px"; layer.style.height = h + "px";
    svg.setAttribute("width", w); svg.setAttribute("height", h);
  }
  sizeLayer(); window.addEventListener("resize", sizeLayer);
  setInterval(sizeLayer, 2500);
  function pt(e) { return { x: e.pageX, y: e.pageY }; }

  /* ---------------- render ---------------- */
  function arrowHead(x1, y1, x2, y2, w) {
    var a = Math.atan2(y2 - y1, x2 - x1), L = 9 + w * 2.2;
    var p1 = (x2 - L * Math.cos(a - 0.42)) + "," + (y2 - L * Math.sin(a - 0.42));
    var p2 = (x2 - L * Math.cos(a + 0.42)) + "," + (y2 - L * Math.sin(a + 0.42));
    return x2 + "," + y2 + " " + p1 + " " + p2;
  }
  function shapeSVG(it) {
    var t = 'transform="translate(' + (it.tx || 0) + ',' + (it.ty || 0) + ')"';
    var sel = cur.sel === it.id ? " sel" : "";
    if (it.type === "path") return '<path class="shp' + sel + '" data-id="' + it.id + '" ' + t + ' d="' + it.d + '" fill="none" stroke="' + it.color + '" stroke-width="' + it.w + '" stroke-linecap="round" stroke-linejoin="round"/>';
    if (it.type === "arrow") return '<g class="shp' + sel + '" data-id="' + it.id + '" ' + t + '><line x1="' + it.x1 + '" y1="' + it.y1 + '" x2="' + it.x2 + '" y2="' + it.y2 + '" stroke="' + it.color + '" stroke-width="' + it.w + '" stroke-linecap="round"/><polygon points="' + arrowHead(it.x1, it.y1, it.x2, it.y2, it.w) + '" fill="' + it.color + '"/></g>';
    if (it.type === "ellipse") return '<ellipse class="shp' + sel + '" data-id="' + it.id + '" ' + t + ' cx="' + it.cx + '" cy="' + it.cy + '" rx="' + it.rx + '" ry="' + it.ry + '" fill="none" stroke="' + it.color + '" stroke-width="' + it.w + '"/>';
    if (it.type === "rect") return '<rect class="shp' + sel + '" data-id="' + it.id + '" ' + t + ' x="' + it.x + '" y="' + it.y + '" width="' + it.w2 + '" height="' + it.h + '" rx="6" fill="none" stroke="' + it.color + '" stroke-width="' + it.w + '"/>';
    return "";
  }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  function widgetEl(it) {
    var d = document.createElement("div");
    d.className = "sbxa-w" + (cur.sel === it.id ? " sel" : ""); d.dataset.id = it.id;
    d.style.left = it.x + "px"; d.style.top = it.y + "px";
    if (it.type === "text") {
      d.style.width = (it.w || 240) + "px";
      d.innerHTML = '<div class="lbl" contenteditable="true" spellcheck="false"></div>';
      var lb = d.firstChild;
      lb.style.cssText = "font-family:" + it.font + ",Arial,sans-serif;font-size:" + it.size + "px;color:" + it.color + ";line-height:1.45;background:rgba(255,255,255,.85);border:1px dashed " + it.color + ";border-radius:6px;padding:6px 8px;white-space:pre-wrap";
      lb.textContent = it.text || "Type here…";
      lb.addEventListener("blur", function () { it.text = lb.innerText; it.updated = now(); persist(); });
    } else if (it.type === "check") {
      d.innerHTML = '<label style="display:flex;align-items:center;gap:7px;background:rgba(255,255,255,.92);border:1px dashed #8C97A4;border-radius:7px;padding:6px 9px"><input type="checkbox"' + (it.checked ? " checked" : "") + ' style="width:15px;height:15px;accent-color:' + it.color + '"><span class="lbl" contenteditable="true" spellcheck="false" style="font-family:' + it.font + ',Arial,sans-serif;font-size:' + it.size + 'px;color:#2E3338"></span></label>';
      d.querySelector(".lbl").textContent = it.label || "Checkbox label";
      d.querySelector("input").addEventListener("change", function (e) { it.checked = e.target.checked; it.updated = now(); persist(); });
      d.querySelector(".lbl").addEventListener("blur", function (e) { it.label = e.target.innerText; it.updated = now(); persist(); });
    } else if (it.type === "select") {
      var opts = (it.options && it.options.length ? it.options : ["Option 1", "Option 2", "Option 3"]);
      d.innerHTML = '<div style="background:rgba(255,255,255,.92);border:1px dashed #8C97A4;border-radius:7px;padding:6px 9px"><div class="lbl" contenteditable="true" spellcheck="false" style="font-size:10.5px;font-weight:700;color:#5A6470;text-transform:uppercase;letter-spacing:.4px;margin-bottom:4px;font-family:' + it.font + ',Arial,sans-serif"></div><select style="font-family:' + it.font + ',Arial,sans-serif;font-size:' + it.size + 'px;border:1px solid #DDE3EA;border-radius:6px;padding:4px 7px;min-width:150px;color:#2E3338">' + opts.map(function (o) { return "<option>" + esc(o) + "</option>"; }).join("") + '</select><div style="font-size:9.5px;color:#8C97A4;margin-top:3px">double-click to edit options</div></div>';
      d.querySelector(".lbl").textContent = it.label || "Dropdown label";
      d.querySelector(".lbl").addEventListener("blur", function (e) { it.label = e.target.innerText; it.updated = now(); persist(); });
      d.addEventListener("dblclick", function (ev) {
        if (ev.target.tagName === "SELECT" || ev.target.classList.contains("lbl")) return;
        var cur_ = (it.options || opts).join(", ");
        var v = prompt("Dropdown options (comma-separated):", cur_);
        if (v != null) { it.options = v.split(",").map(function (s) { return s.trim(); }).filter(Boolean); it.updated = now(); persist(); render(); }
      });
    } else if (it.type === "toggle") {
      d.innerHTML = '<div class="sbxa-tgl"><span class="sw' + (it.on ? " on" : "") + '"><span class="kn"></span></span><span class="lbl" contenteditable="true" spellcheck="false" style="font-family:' + it.font + ',Arial,sans-serif;font-size:' + it.size + 'px;color:#2E3338"></span></div>';
      d.querySelector(".lbl").textContent = it.label || "Toggle label";
      d.querySelector(".sw").addEventListener("click", function (e) { e.stopPropagation(); it.on = !it.on; it.updated = now(); persist(); render(); });
      d.querySelector(".lbl").addEventListener("blur", function (e) { it.label = e.target.innerText; it.updated = now(); persist(); });
    } else if (it.type === "img") {
      d.style.width = it.w + "px"; d.style.height = it.h + "px";
      var im = document.createElement("img"); im.src = it.src; im.draggable = false; d.appendChild(im);
      var rh = document.createElement("div"); rh.className = "sbxa-rh"; d.appendChild(rh);
      rh.addEventListener("pointerdown", function (e) {
        e.stopPropagation(); e.preventDefault(); snapshot();
        var sw = it.w, sx = e.pageX, ratio = it.h / it.w;
        function mv(ev) { it.w = Math.max(60, sw + (ev.pageX - sx)); it.h = Math.round(it.w * ratio); d.style.width = it.w + "px"; d.style.height = it.h + "px"; }
        function up() { document.removeEventListener("pointermove", mv); document.removeEventListener("pointerup", up); it.updated = now(); persist(); }
        document.addEventListener("pointermove", mv); document.addEventListener("pointerup", up);
      });
    }
    var del = document.createElement("button"); del.className = "sbxa-del"; del.textContent = "✕"; del.title = "Delete";
    del.addEventListener("click", function (e) { e.stopPropagation(); snapshot(); scene.items = scene.items.filter(function (x) { return x.id !== it.id; }); cur.sel = null; persist(); render(); });
    d.appendChild(del);
    /* drag to move (select tool or grab on border) */
    d.addEventListener("pointerdown", function (e) {
      if (cur.tool === "erase") { e.preventDefault(); e.stopPropagation(); snapshot(); scene.items = scene.items.filter(function (x) { return x.id !== it.id; }); cur.sel = null; persist(); render(); return; }
      if (e.target.closest(".sbxa-rh,.sbxa-del")) return;
      var editable = e.target.isContentEditable || e.target.tagName === "SELECT" || e.target.tagName === "INPUT";
      if (cur.tool !== "select" && editable) { cur.sel = it.id; refreshSel(); return; }
      if (editable && cur.tool === "select") { /* allow editing in select mode too when clicked twice */ }
      cur.sel = it.id; refreshSel();
      if (editable) return;
      e.preventDefault(); snapshot();
      var sx = e.pageX - it.x, sy = e.pageY - it.y;
      function mv(ev) { it.x = ev.pageX - sx; it.y = ev.pageY - sy; d.style.left = it.x + "px"; d.style.top = it.y + "px"; }
      function up() { document.removeEventListener("pointermove", mv); document.removeEventListener("pointerup", up); it.updated = now(); persist(); }
      document.addEventListener("pointermove", mv); document.addEventListener("pointerup", up);
    });
    return d;
  }

  function render() {
    sizeLayer();
    svg.innerHTML = scene.items.filter(function (i) { return ["path", "arrow", "ellipse", "rect"].indexOf(i.type) >= 0; }).map(shapeSVG).join("");
    Array.prototype.slice.call(layer.querySelectorAll(".sbxa-w")).forEach(function (n) { n.remove(); });
    scene.items.forEach(function (it) { if (["text", "check", "select", "toggle", "img"].indexOf(it.type) >= 0) layer.appendChild(widgetEl(it)); });
    /* shape selection + drag */
    Array.prototype.slice.call(svg.querySelectorAll(".shp")).forEach(function (el) {
      el.addEventListener("pointerdown", function (e) {
        if (cur.tool === "erase") { e.preventDefault(); e.stopPropagation(); snapshot(); scene.items = scene.items.filter(function (x) { return x.id !== el.dataset.id; }); cur.sel = null; persist(); render(); return; }
        if (cur.tool !== "select") return;
        e.preventDefault(); e.stopPropagation();
        var it = byId(el.dataset.id); if (!it) return;
        cur.sel = it.id; refreshSel(); snapshot();
        var sx = e.pageX - (it.tx || 0), sy = e.pageY - (it.ty || 0);
        function mv(ev) { it.tx = ev.pageX - sx; it.ty = ev.pageY - sy; el.setAttribute("transform", "translate(" + it.tx + "," + it.ty + ")"); }
        function up() { document.removeEventListener("pointermove", mv); document.removeEventListener("pointerup", up); it.updated = now(); persist(); }
        document.addEventListener("pointermove", mv); document.addEventListener("pointerup", up);
      });
    });
    countEl.textContent = scene.items.length + " item" + (scene.items.length === 1 ? "" : "s") + " on this page";
  }
  function refreshSel() {
    Array.prototype.slice.call(layer.querySelectorAll(".sbxa-w")).forEach(function (n) { n.classList.toggle("sel", n.dataset.id === cur.sel); });
    Array.prototype.slice.call(svg.querySelectorAll(".shp")).forEach(function (n) { n.classList.toggle("sel", n.dataset.id === cur.sel); });
  }

  /* ---------------- drawing interactions ---------------- */
  var drawing = null;
  layer.addEventListener("pointerdown", function (e) {
    if (cur.hidden) return;
    if (["draw", "arrow", "ellipse", "rect"].indexOf(cur.tool) < 0) return;
    if (e.target.closest(".sbxa-w")) return;
    e.preventDefault(); snapshot();
    var p = pt(e);
    if (cur.tool === "draw") drawing = { type: "path", id: nid(), d: "M" + p.x + " " + p.y, color: cur.color, w: cur.width, pts: 1 };
    if (cur.tool === "arrow") drawing = { type: "arrow", id: nid(), x1: p.x, y1: p.y, x2: p.x, y2: p.y, color: cur.color, w: cur.width };
    if (cur.tool === "ellipse") drawing = { type: "ellipse", id: nid(), cx: p.x, cy: p.y, rx: 1, ry: 1, sx: p.x, sy: p.y, color: cur.color, w: cur.width };
    if (cur.tool === "rect") drawing = { type: "rect", id: nid(), x: p.x, y: p.y, w2: 1, h: 1, sx: p.x, sy: p.y, color: cur.color, w: cur.width };
    scene.items.push(drawing); render();
  });
  document.addEventListener("pointermove", function (e) {
    if (!drawing) return;
    var p = pt(e);
    if (drawing.type === "path") { drawing.d += " L" + p.x + " " + p.y; drawing.pts++; }
    if (drawing.type === "arrow") { drawing.x2 = p.x; drawing.y2 = p.y; }
    if (drawing.type === "ellipse") { drawing.cx = (drawing.sx + p.x) / 2; drawing.cy = (drawing.sy + p.y) / 2; drawing.rx = Math.abs(p.x - drawing.sx) / 2 || 1; drawing.ry = Math.abs(p.y - drawing.sy) / 2 || 1; }
    if (drawing.type === "rect") { drawing.x = Math.min(drawing.sx, p.x); drawing.y = Math.min(drawing.sy, p.y); drawing.w2 = Math.abs(p.x - drawing.sx) || 1; drawing.h = Math.abs(p.y - drawing.sy) || 1; }
    render();
  });
  document.addEventListener("pointerup", function () {
    if (!drawing) return;
    delete drawing.sx; delete drawing.sy; delete drawing.pts;
    drawing.updated = now(); drawing = null; persist(); render();
  });
  /* click-to-place widgets */
  layer.addEventListener("click", function (e) {
    if (cur.hidden) return;
    if (e.target.closest(".sbxa-w")) return;
    var p = pt(e);
    if (cur.tool === "text") { snapshot(); scene.items.push({ type: "text", id: nid(), x: p.x, y: p.y, w: 240, text: "", color: cur.color, font: cur.font, size: cur.size, updated: now() }); afterPlace(); }
    if (cur.tool === "check") { snapshot(); scene.items.push({ type: "check", id: nid(), x: p.x, y: p.y, label: "Checkbox label", checked: false, color: cur.color, font: cur.font, size: cur.size, updated: now() }); afterPlace(); }
    if (cur.tool === "selectw") { snapshot(); scene.items.push({ type: "select", id: nid(), x: p.x, y: p.y, label: "Dropdown label", options: ["Option 1", "Option 2", "Option 3"], font: cur.font, size: cur.size, updated: now() }); afterPlace(); }
    if (cur.tool === "toggle") { snapshot(); scene.items.push({ type: "toggle", id: nid(), x: p.x, y: p.y, label: "Toggle label", on: true, font: cur.font, size: cur.size, updated: now() }); afterPlace(); }
  });
  function afterPlace() { persist(); render(); setTool("select"); var last = layer.querySelector('.sbxa-w[data-id="' + scene.items[scene.items.length - 1].id + '"] .lbl'); if (last) { last.focus(); document.execCommand && document.execCommand("selectAll", false, null); } }
  document.addEventListener("keydown", function (e) {
    if ((e.key === "Delete" || e.key === "Backspace") && cur.sel && !(e.target.isContentEditable || /INPUT|TEXTAREA|SELECT/.test(e.target.tagName))) {
      snapshot(); scene.items = scene.items.filter(function (x) { return x.id !== cur.sel; }); cur.sel = null; persist(); render();
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !(e.target.isContentEditable || /INPUT|TEXTAREA/.test(e.target.tagName))) { e.preventDefault(); undo(); }
  });

  /* ---------------- images ---------------- */
  function addImage(file, x, y) {
    if (!file || !/^image\//.test(file.type)) return;
    var rd = new FileReader();
    rd.onload = function () {
      var img = new Image();
      img.onload = function () {
        var maxW = 1100, w = img.width, h = img.height;
        if (w > maxW) { h = Math.round(h * maxW / w); w = maxW; }
        var cv = document.createElement("canvas"); cv.width = w; cv.height = h;
        cv.getContext("2d").drawImage(img, 0, 0, w, h);
        var src = cv.toDataURL("image/jpeg", 0.82);
        var dispW = Math.min(420, w), dispH = Math.round(dispW * h / w);
        snapshot();
        scene.items.push({ type: "img", id: nid(), x: (x != null ? x : window.scrollX + innerWidth / 2 - dispW / 2), y: (y != null ? y : window.scrollY + 140), w: dispW, h: dispH, src: src, updated: now() });
        persist(); render(); setTool("select"); toast("Picture added — drag to place, corner dot to resize");
      };
      img.src = rd.result;
    };
    rd.readAsDataURL(file);
  }
  var fileInp = document.createElement("input"); fileInp.type = "file"; fileInp.accept = "image/*"; fileInp.style.display = "none";
  document.body.appendChild(fileInp);
  fileInp.addEventListener("change", function () { addImage(fileInp.files[0]); fileInp.value = ""; });
  document.addEventListener("dragover", function (e) { if (e.dataTransfer && Array.prototype.some.call(e.dataTransfer.items || [], function (i) { return i.kind === "file"; })) e.preventDefault(); });
  document.addEventListener("drop", function (e) {
    var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (f && /^image\//.test(f.type)) { e.preventDefault(); addImage(f, e.pageX - 160, e.pageY - 60); }
  });

  /* ---------------- folder bridge (shared with Workbench) ---------------- */
  function idb() { return new Promise(function (res, rej) { var rq = indexedDB.open("dmssbx_fs", 1); rq.onupgradeneeded = function () { rq.result.createObjectStore("h"); }; rq.onsuccess = function () { res(rq.result); }; rq.onerror = function () { rej(rq.error); }; }); }
  function idbGet(k) { return idb().then(function (db) { return new Promise(function (res, rej) { var tx = db.transaction("h", "readonly"); var rq = tx.objectStore("h").get(k); rq.onsuccess = function () { res(rq.result); }; rq.onerror = function () { rej(rq.error); }; }); }); }
  function idbPut(k, v) { return idb().then(function (db) { return new Promise(function (res, rej) { var tx = db.transaction("h", "readwrite"); tx.objectStore("h").put(v, k); tx.oncomplete = res; tx.onerror = function () { rej(tx.error); }; }); }); }
  async function getDir(interactive) {
    var dir = await idbGet("dir").catch(function () { return null; });
    if (!dir && interactive && window.showDirectoryPicker) { dir = await window.showDirectoryPicker({ mode: "readwrite" }); await idbPut("dir", dir); }
    if (!dir) return null;
    var perm = await dir.queryPermission({ mode: "readwrite" });
    if (perm !== "granted") {
      if (!interactive) return null;
      perm = await dir.requestPermission({ mode: "readwrite" });
      if (perm !== "granted") return null;
    }
    return dir;
  }
  async function saveToSandbox() {
    if (!window.showDirectoryPicker) { downloadFallback(); return; }
    try {
      var dir = await getDir(true);
      if (!dir) { toast("Couldn't get folder access — using download instead", true); downloadFallback(); return; }
      var existing = {};
      try { var fh0 = await dir.getFileHandle(AFILE); var tx = await (await fh0.getFile()).text(); existing = tx.trim() ? JSON.parse(tx) : {}; } catch (e) { existing = {}; }
      var pages = (existing && existing.pages) || {};
      Object.keys(all).forEach(function (pg) {
        var loc = all[pg], fil = pages[pg];
        if (!fil || (loc.updated || "") >= (fil.updated || "")) pages[pg] = loc;
      });
      var out = { app: "DMS ERP v2 Sandbox — page markups", format: 1, updated: now(), pages: pages };
      var fh = await dir.getFileHandle(AFILE, { create: true });
      var w = await fh.createWritable(); await w.write(JSON.stringify(out)); await w.close();
      dot.classList.add("on"); dottxt.textContent = "Saved to sandbox · " + AFILE;
      toast("Markups saved to the sandbox — Claude will see them");
    } catch (e) { toast("Save failed — try again or use full-page mode", true); }
  }
  function downloadFallback() {
    var out = { app: "DMS ERP v2 Sandbox — page markups", format: 1, updated: now(), pages: all };
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(out)], { type: "application/json" }));
    a.download = AFILE; a.click();
    toast("Downloaded " + AFILE + " — put it in the sandbox folder");
  }
  /* silent load of newer file markups */
  (async function () {
    try {
      var dir = await getDir(false); if (!dir) return;
      var fh = await dir.getFileHandle(AFILE); var tx = await (await fh.getFile()).text();
      var data = tx.trim() ? JSON.parse(tx) : null; if (!data || !data.pages) return;
      var fil = data.pages[PAGE];
      if (fil && (fil.updated || "") > (scene.updated || "")) { scene = fil; all[PAGE] = scene; persist(); render(); toast("Loaded newer markups from the sandbox file"); }
      dot.classList.add("on"); dottxt.textContent = "Folder connected";
    } catch (e) { /* fine */ }
  })();

  /* ---------------- quick note (into Workbench store) ---------------- */
  function addQuickNote(text, pri) {
    var st_; try { st_ = JSON.parse(localStorage.getItem(NOTEKEY) || "null"); } catch (e) { st_ = null; }
    if (!st_) st_ = { app: "DMS ERP v2 Sandbox — Claude Workbench", format: 1, updated: now(), claudeMessage: null, notes: [], gamePlan: [] };
    var mod = (PAGE.match(/^(\d\d)_/) || [null, "general"])[1];
    st_.notes.unshift({ id: "N-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), ts: now(), updatedAt: now(), from: "jason", module: mod, priority: pri || "next", text: text, status: "inbox", reply: null });
    st_.updated = now();
    try { localStorage.setItem(NOTEKEY, JSON.stringify(st_)); } catch (e) {}
    /* push to file too if we can, silently */
    (async function () {
      try {
        var dir = await getDir(false); if (!dir) return;
        var fh = await dir.getFileHandle("claude_notes.json", { create: true });
        var w = await fh.createWritable(); await w.write(JSON.stringify(st_, null, 2)); await w.close();
      } catch (e) {}
    })();
  }

  /* ---------------- panel ---------------- */
  var tab = document.createElement("button"); tab.className = "sbxa-tab"; tab.textContent = "🧭 WORKBENCH"; tab.title = "Open the sandbox Workbench panel";
  document.body.appendChild(tab);
  var panel = document.createElement("div"); panel.className = "sbxa-panel";
  var COLORS = ["#B3261E", "#14253D", "#2563EB", "#15803D", "#B45309", "#B68A3A", "#2E3338", "#8C97A4"];
  var FONTS = ["Inter", "Archivo", "Arial", "Georgia", "Consolas", "Segoe UI"];
  panel.innerHTML =
    '<div class="sbxa-head"><b>🧭 CLAUDE WORKBENCH</b><button class="x" title="Close">✕</button></div>'
    + '<div class="sbxa-body">'
    + '<div class="sbxa-sec">Navigate</div><div class="sbxa-tools">'
    + '<button class="sbxa-t" data-tool="browse" title="Use the page normally — markups stay put">\u{1F5B1}\uFE0F<span>Browse</span></button>'
    + '<button class="sbxa-t" data-tool="select" title="Click a markup to select it, then drag to move">\u2725<span>Move</span></button>'
    + '<button class="sbxa-t" data-tool="erase" title="Click any markup to erase it (Undo brings it back)">\u{1F9FD}<span>Erase</span></button>'
    + "</div>"
    + '<div class="sbxa-sec">Draw</div><div class="sbxa-tools">'
    + '<button class="sbxa-t" data-tool="draw" title="Freehand pen — drag to draw">\u270F\uFE0F<span>Draw</span></button>'
    + '<button class="sbxa-t" data-tool="arrow" title="Drag from tail to tip">\u279C<span>Arrow</span></button>'
    + '<button class="sbxa-t" data-tool="ellipse" title="Drag to circle something">\u25EF<span>Circle</span></button>'
    + '<button class="sbxa-t" data-tool="rect" title="Drag to box a region">\u25AD<span>Box</span></button>'
    + "</div>"
    + '<div class="sbxa-sec">Place examples</div><div class="sbxa-tools">'
    + '<button class="sbxa-t" data-tool="text" title="Click the page, then type — uses the font below">\u{1F163}<span>Text</span></button>'
    + '<button class="sbxa-t" data-tool="check" title="Place an example checkbox — edit its label inline">\u2611\uFE0F<span>Checkbox</span></button>'
    + '<button class="sbxa-t" data-tool="toggle" title="Place an example on/off switch — click it to flip">\u{1F39A}\uFE0F<span>Toggle</span></button>'
    + '<button class="sbxa-t" data-tool="selectw" title="Place an example dropdown — double-click to edit options">\u25BE<span>Dropdown</span></button>'
    + '<button class="sbxa-t" data-act="img" title="Add a picture — or just drag an image file onto the page">\u{1F5BC}\uFE0F<span>Picture</span></button>'
    + "</div>"
    + '<div class="sbxa-sec">Actions</div><div class="sbxa-tools">'
    + '<button class="sbxa-t" data-act="undo" title="Undo the last step (Ctrl+Z)">\u21A9\uFE0F<span>Undo</span></button>'
    + '<button class="sbxa-t" data-act="hide" title="Hide markups without deleting them">\u{1F441}\uFE0F<span class="hlbl">Hide</span></button>'
    + "</div>"
    + '<div class="sbxa-sec">Color</div><div class="sbxa-sw">'
    + COLORS.map(function (c) { return '<button class="sbxa-c" data-c="' + c + '" style="background:' + c + '"></button>'; }).join("")
    + '<input type="color" id="sbxa-custom" value="#B3261E" title="Custom color" style="width:26px;height:26px;border:0;background:none;cursor:pointer">'
    + "</div>"
    + '<div class="sbxa-row"><span style="font-size:11px;color:#5A6470">Stroke</span><input type="range" id="sbxa-wd" min="1" max="10" value="3"></div>'
    + '<div class="sbxa-sec">Text font</div>'
    + '<div class="sbxa-row"><select id="sbxa-font">' + FONTS.map(function (f) { return '<option style="font-family:' + f + '">' + f + "</option>"; }).join("") + '</select>'
    + '<select id="sbxa-size">' + [11, 12, 13, 14, 16, 18, 20, 24, 28].map(function (s) { return "<option" + (s === 14 ? " selected" : "") + ">" + s + "</option>"; }).join("") + "</select></div>"
    + '<div class="sbxa-hint">Font + size apply to new Text / Checkbox / Dropdown items. Colors apply to new shapes — or to the selected item.</div>'
    + '<div class="sbxa-sec">Save</div>'
    + '<button class="sbxa-btn sbxa-p" id="sbxa-save">💾 Save markups to sandbox</button>'
    + '<button class="sbxa-btn sbxa-d" id="sbxa-clear">Clear this page\'s markups</button>'
    + '<div class="sbxa-hint" id="sbxa-count"></div>'
    + '<div class="sbxa-sec">Quick note to Claude</div>'
    + '<textarea class="sbxa-note" id="sbxa-qn" placeholder="e.g. Make this section collapsible…"></textarea>'
    + '<button class="sbxa-btn sbxa-s" id="sbxa-addnote">Add note (tagged: this page)</button>'
    + '<a href="19_Claude_Workbench.html" style="display:block;text-align:center;margin-top:8px;font-size:12px;color:#14253D;font-weight:600">Open the full Workbench (module 19) →</a>'
    + "</div>"
    + '<div class="sbxa-foot"><span class="sbxa-dot" id="sbxa-dot"></span><span id="sbxa-dottxt">Markups save in this browser; press Save to write them to the sandbox folder.</span></div>';
  document.body.appendChild(panel);
  var countEl = panel.querySelector("#sbxa-count");
  var dot = panel.querySelector("#sbxa-dot"), dottxt = panel.querySelector("#sbxa-dottxt");

  tab.addEventListener("click", function () { cur.open = !cur.open; panel.classList.toggle("on", cur.open); });
  panel.querySelector(".x").addEventListener("click", function () { cur.open = false; panel.classList.remove("on"); });

  function setTool(t) {
    cur.tool = t;
    Array.prototype.slice.call(panel.querySelectorAll("[data-tool]")).forEach(function (b) { b.classList.toggle("on", b.dataset.tool === t); });
    var drawingTool = ["draw", "arrow", "ellipse", "rect", "text", "check", "selectw", "toggle", "erase"].indexOf(t) >= 0;
    layer.style.pointerEvents = drawingTool ? "auto" : "none";
    document.body.classList.toggle("sbxa-drawing", drawingTool && t !== "erase");
    document.body.classList.toggle("sbxa-erasing", t === "erase");
    if (t === "browse") { cur.sel = null; refreshSel(); }
  }
  Array.prototype.slice.call(panel.querySelectorAll("[data-tool]")).forEach(function (b) {
    b.addEventListener("click", function () { setTool(b.dataset.tool); if (window.innerWidth < 700) { cur.open = false; panel.classList.remove("on"); } });
  });
  panel.querySelector('[data-act="img"]').addEventListener("click", function () { fileInp.click(); });
  panel.querySelector('[data-act="undo"]').addEventListener("click", undo);
  panel.querySelector('[data-act="hide"]').addEventListener("click", function () {
    cur.hidden = !cur.hidden; layer.classList.toggle("hidden", cur.hidden);
    this.querySelector(".hlbl").textContent = cur.hidden ? "Show" : "Hide";
    toast(cur.hidden ? "Markups hidden (still saved)" : "Markups visible");
  });
  Array.prototype.slice.call(panel.querySelectorAll(".sbxa-c")).forEach(function (b) {
    b.addEventListener("click", function () {
      cur.color = b.dataset.c;
      Array.prototype.slice.call(panel.querySelectorAll(".sbxa-c")).forEach(function (x) { x.classList.toggle("on", x === b); });
      if (cur.sel) { var it = byId(cur.sel); if (it && it.color) { snapshot(); it.color = cur.color; it.updated = now(); persist(); render(); } }
    });
  });
  panel.querySelector("#sbxa-custom").addEventListener("input", function () {
    cur.color = this.value;
    if (cur.sel) { var it = byId(cur.sel); if (it && it.color) { it.color = cur.color; it.updated = now(); persist(); render(); } }
  });
  panel.querySelector("#sbxa-wd").addEventListener("input", function () { cur.width = +this.value; });
  panel.querySelector("#sbxa-font").addEventListener("change", function () {
    cur.font = this.value;
    if (cur.sel) { var it = byId(cur.sel); if (it && it.font) { snapshot(); it.font = cur.font; it.updated = now(); persist(); render(); } }
  });
  panel.querySelector("#sbxa-size").addEventListener("change", function () {
    cur.size = +this.value;
    if (cur.sel) { var it = byId(cur.sel); if (it && it.size) { snapshot(); it.size = cur.size; it.updated = now(); persist(); render(); } }
  });
  panel.querySelector("#sbxa-save").addEventListener("click", saveToSandbox);
  panel.querySelector("#sbxa-clear").addEventListener("click", function () {
    if (!scene.items.length) return toast("Nothing on this page");
    if (confirm("Clear all markups on this page? (Undo can bring back the last steps)")) { snapshot(); scene.items = []; cur.sel = null; persist(); render(); }
  });
  panel.querySelector("#sbxa-addnote").addEventListener("click", function () {
    var v = panel.querySelector("#sbxa-qn").value.trim();
    if (!v) return toast("Write the note first", true);
    addQuickNote(v, "next"); panel.querySelector("#sbxa-qn").value = "";
    toast("Note added to the Workbench — tagged " + PAGE.slice(0, 2));
  });

  /* Shell (index.html): hide this tab while a module is open in the viewer — that module shows its own tab */
  var viewerEl = document.getElementById("viewer");
  if (PAGE === "index.html" && viewerEl) {
    setInterval(function () {
      var open_ = !viewerEl.hidden;
      tab.style.display = open_ ? "none" : "";
      if (open_ && cur.open) { cur.open = false; panel.classList.remove("on"); }
    }, 600);
  }

  setTool("browse"); render();
})();
