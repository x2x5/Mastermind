"use strict";

const CanvasApp = (() => {
  const CANVAS_STORAGE_KEY = "prompt-card-canvas-v1";
  const CANVAS_PAD = 200;

  function mergePromptAndInput(promptTemplate, inputText) {
    const template = (promptTemplate || "").trim();
    const userText = (inputText || "").trim();
    if (!userText) return template;
    const placeholderRegex = /\[在此处粘贴[^\]]*\]/g;
    if (placeholderRegex.test(template)) return template.replace(placeholderRegex, userText);
    return `${template}\n\n${userText}`;
  }

  const canvasEl = document.getElementById("canvasArea");
  const arrowsEl = document.getElementById("canvasArrows");
  const nodesEl = document.getElementById("canvasNodes");
  const drawerRoot = document.getElementById("canvasDrawer");

  let nodes = [];
  let edges = [];
  let selectedNodeId = null;
  let selectedEdgeId = null;
  let nextId = 1;
  let inited = false;

  // Drag state (node move / edge draw)
  let dragState = null;
  // Drawer drag state
  let drawerDrag = null;

  // Undo / Redo
  const undoStack = [];
  const redoStack = [];
  const MAX_UNDO = 50;

  // Clipboard for card copy/paste
  let clipboard = null;

  function saveUndo() {
    undoStack.push(JSON.stringify({ nodes, edges, nextId }));
    if (undoStack.length > MAX_UNDO) undoStack.shift();
    redoStack.length = 0;
    updateUndoRedoBtns();
  }

  function undo() {
    if (!undoStack.length) return;
    redoStack.push(JSON.stringify({ nodes, edges, nextId }));
    const snap = JSON.parse(undoStack.pop());
    nodes = snap.nodes; edges = snap.edges; nextId = snap.nextId;
    selectedNodeId = null; selectedEdgeId = null;
    render(); write();
    updateUndoRedoBtns();
  }

  function redo() {
    if (!redoStack.length) return;
    undoStack.push(JSON.stringify({ nodes, edges, nextId }));
    const snap = JSON.parse(redoStack.pop());
    nodes = snap.nodes; edges = snap.edges; nextId = snap.nextId;
    selectedNodeId = null; selectedEdgeId = null;
    render(); write();
    updateUndoRedoBtns();
  }

  function updateUndoRedoBtns() {
    const ub = document.getElementById("undoBtn");
    const rb = document.getElementById("redoBtn");
    const ubadge = document.getElementById("undoBadge");
    const rbadge = document.getElementById("redoBadge");
    if (ub) ub.disabled = !undoStack.length;
    if (rb) rb.disabled = !redoStack.length;
    if (ubadge) {
      ubadge.textContent = undoStack.length || "";
      ubadge.classList.toggle("visible", undoStack.length > 0);
    }
    if (rbadge) {
      rbadge.textContent = redoStack.length || "";
      rbadge.classList.toggle("visible", redoStack.length > 0);
    }
  }

  // ── Init ──

  function init(cardsByCategory, onReorder, onAddCard, onAddStage, onDeleteStage, trashData, onRestoreStage, onEmptyTrash, onRenameStage, onRenameCard) {
    if (!canvasEl) return;
    const firstInit = !inited;
    if (!inited) {
      const saved = read();
      nodes = saved.nodes || [];
      edges = saved.edges || [];
      nextId = saved.nextId || 1;
      bindCanvasInteraction();
      bindDrawerDrag();
      bindKeyboard();
      // Wire up undo/redo buttons
      const undoBtn = document.getElementById("undoBtn");
      const redoBtn = document.getElementById("redoBtn");
      if (undoBtn) undoBtn.addEventListener("click", undo);
      if (redoBtn) redoBtn.addEventListener("click", redo);
      inited = true;
    }
    ensureStartEndNodes();
    buildDrawer(cardsByCategory, onReorder, onAddCard, onAddStage, onDeleteStage, trashData, onRestoreStage, onEmptyTrash, onRenameStage, onRenameCard);
    render();
  }

  // ── State ──

  function read() {
    try {
      const raw = localStorage.getItem(CANVAS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (_) {
      return {};
    }
  }

  function write() {
    try {
      localStorage.setItem(CANVAS_STORAGE_KEY, JSON.stringify({ nodes, edges, nextId }));
    } catch (_) {}
  }

  // ── Render ──

  function render() {
    if (!nodesEl || !arrowsEl) return;
    nodesEl.innerHTML = "";
    clearEdgeEls();
    nodes.forEach((n) => nodesEl.appendChild(buildNodeEl(n)));
    resizeCanvas(); // may shift node positions to keep them in positive coords
    edges.forEach((e) => arrowsEl.appendChild(buildEdgeEl(e)));
  }

  function clearEdgeEls() {
    if (!arrowsEl) return;
    arrowsEl.querySelectorAll("g[data-edge-id], .ctemp-line").forEach((el) => el.remove());
  }

  function resizeCanvas() {
    if (!canvasEl) return;
    const scrollEl = canvasEl.closest(".layout2-canvas-scroll");
    const vw = scrollEl ? scrollEl.clientWidth : 800;
    const vh = scrollEl ? scrollEl.clientHeight : 600;

    if (nodes.length === 0) {
      canvasEl.style.width = vw + "px";
      canvasEl.style.height = vh + "px";
      return { shiftX: 0, shiftY: 0 };
    }

    // Find bounding box using actual DOM dimensions
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    nodes.forEach((n) => {
      const el = nodesEl.querySelector(`[data-node-id="${n.id}"]`);
      const w = el ? el.offsetWidth : 200;
      const h = el ? el.offsetHeight : 120;
      if (n.x < minX) minX = n.x;
      if (n.y < minY) minY = n.y;
      if (n.x + w > maxX) maxX = n.x + w;
      if (n.y + h > maxY) maxY = n.y + h;
    });

    // Shift non-start nodes only if they go negative
    let shiftX = 0, shiftY = 0;
    const nonStartNodes = nodes.filter((n) => n.cardId !== "__start__");
    const nsMinX = nonStartNodes.length > 0 ? Math.min(...nonStartNodes.map((n) => n.x)) : Infinity;
    const nsMinY = nonStartNodes.length > 0 ? Math.min(...nonStartNodes.map((n) => n.y)) : Infinity;
    if (nsMinX < 0 || nsMinY < 0) {
      shiftX = nsMinX < 0 ? -nsMinX : 0;
      shiftY = nsMinY < 0 ? -nsMinY : 0;
      nonStartNodes.forEach((n) => { n.x += shiftX; n.y += shiftY; });
      nonStartNodes.forEach((n) => {
        const el = nodesEl.querySelector(`[data-node-id="${n.id}"]`);
        if (el) { el.style.left = n.x + "px"; el.style.top = n.y + "px"; }
      });
      maxX += shiftX;
      maxY += shiftY;
      write();
    }

    const pad = 40;
    const w = Math.max(vw, maxX + pad);
    const h = Math.max(vh, maxY + pad);
    canvasEl.style.width = w + "px";
    canvasEl.style.height = h + "px";
    return { shiftX, shiftY };
  }

  const STAGE_COLORS = [
    "#1f8f78", "#2f82b8", "#7c5cbf", "#c47a20",
    "#be4458", "#3a8f5c", "#5a7fa8"
  ];

  function getStageColor(category) {
    if (!category) return null;
    const m = category.match(/阶段\s*(\d)/);
    if (m) return STAGE_COLORS[parseInt(m[1], 10) - 1] || null;
    return null;
  }

  function buildNodeEl(n) {
    // Start node: lightbulb with play button
    if (n.cardId === "__start__") {
      const el = document.createElement("div");
      el.className = "cnode cnode-start";
      if (n.id === selectedNodeId) el.classList.add("selected");
      el.dataset.nodeId = n.id;
      el.style.cssText = `left:${n.x}px;top:${n.y}px;`;

      // Connectors (bottom only — start only goes downward)
      const c = document.createElement("div");
      c.className = "cnode-connector cnode-conn-bottom";
      c.dataset.nodeId = n.id;
      c.dataset.side = "bottom";
      el.appendChild(c);

      // Lightbulb icon
      const bulb = document.createElement("div");
      bulb.className = "cnode-bulb";
      bulb.innerHTML = `<svg viewBox="0 0 24 24" class="bulb-svg"><path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z"/></svg>`;
      el.appendChild(bulb);

      // Play button (top-right corner)
      const playBtn = document.createElement("button");
      playBtn.className = "cnode-start-play";
      playBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';
      playBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (typeof runPipelineFromStart === "function") runPipelineFromStart();
      });
      el.appendChild(playBtn);

      // Click to select start node
      el.addEventListener("click", (e) => {
        if (e.target.closest(".cnode-start-play")) return; // Don't select when clicking play button
        e.stopPropagation();
        selectNode(n.id);
      });

      return el;
    }

    // End node: skip (removed)
    if (n.cardId === "__end__") {
      const el = document.createElement("div");
      el.style.display = "none";
      el.dataset.nodeId = n.id;
      return el;
    }

    const card = allItemsMap.get(n.cardId);
    const rawTitle = card ? card.title : n.cardId;
    const title = typeof translateCardTitle === "function" ? translateCardTitle(rawTitle) : rawTitle;
    const category = card ? (card.category || "") : "";
    const stageColor = getStageColor(category);
    const prompt = card ? card.prompt : "";
    const inputValue = n.inputValue || "";
    const outputValue = n.outputValue || "";

    const el = document.createElement("div");
    el.className = "cnode" + (n.id === selectedNodeId ? " selected" : "");
    el.dataset.nodeId = n.id;
    el.style.cssText = `left:${n.x}px;top:${n.y}px;`;

    // Connectors (top and bottom only — vertical flow)
    ["top", "bottom"].forEach((side) => {
      const c = document.createElement("div");
      c.className = "cnode-connector cnode-conn-" + side;
      c.dataset.nodeId = n.id;
      c.dataset.side = side;
      el.appendChild(c);
    });

    // Stage number badge — bottom-right corner
    const stageBadgeWrap = document.createElement("div");
    stageBadgeWrap.className = "cnode-stage-badge-wrap";
    const stageBadge = document.createElement("span");
    stageBadge.className = "cnode-stage-badge";
    const stageNum = category ? category.match(/阶段\s*(\d)/) : null;
    stageBadge.textContent = stageNum ? stageNum[1] : "";
    if (stageColor) {
      stageBadge.style.background = stageColor;
    }
    stageBadgeWrap.append(stageBadge);

    // Title row (title + subtitle inline)
    const titleRow = document.createElement("div");
    titleRow.className = "cnode-title-row";

    const titleEl = document.createElement("div");
    titleEl.className = "cnode-title";
    titleEl.textContent = title;

    // Error message next to title
    const titleError = document.createElement("span");
    titleError.className = "cnode-title-error";

    // Subtitle (editable note)
    const subtitleEl = document.createElement("div");
    subtitleEl.className = "cnode-subtitle" + (n.subtitle ? " has-value" : "");
    subtitleEl.textContent = n.subtitle || t("subtitlePlaceholder");
    subtitleEl.addEventListener("mousedown", (e) => e.stopPropagation());
    subtitleEl.addEventListener("click", (e) => {
      e.stopPropagation();
      const input = document.createElement("input");
      input.type = "text";
      input.className = "cnode-subtitle-input";
      input.value = n.subtitle || "";
      input.placeholder = t("subtitleInputPlaceholder");
      subtitleEl.replaceWith(input);
      input.focus();
      input.select();
      function finish() {
        const val = input.value.trim();
        n.subtitle = val;
        write();
        subtitleEl.textContent = val || t("subtitlePlaceholder");
        subtitleEl.className = "cnode-subtitle" + (val ? " has-value" : "");
        input.replaceWith(subtitleEl);
      }
      input.addEventListener("blur", finish);
      input.addEventListener("keydown", (ev) => {
        if (ev.key === "Enter") input.blur();
        if (ev.key === "Escape") { input.value = n.subtitle || ""; input.blur(); }
      });
    });

    // Input textarea
    const textarea = document.createElement("textarea");
    textarea.className = "cnode-textarea";
    textarea.placeholder = t("inputPlaceholder");
    textarea.value = inputValue;
    textarea.addEventListener("input", () => {
      n.inputValue = textarea.value;
      write();
    });
    textarea.addEventListener("mousedown", (e) => e.stopPropagation());

    // Template preview (collapsible)
    const preview = document.createElement("div");
    preview.className = "cnode-preview";
    const pre = document.createElement("pre");
    pre.textContent = prompt;
    preview.appendChild(pre);
    preview.addEventListener("mousedown", (e) => e.stopPropagation());

    const previewToggle = document.createElement("button");
    previewToggle.className = "cnode-copy-btn cnode-preview-toggle";
    previewToggle.type = "button";
    previewToggle.textContent = t("viewTemplate");
    previewToggle.addEventListener("mousedown", (e) => e.stopPropagation());
    previewToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = preview.classList.toggle("open");
      el.style.zIndex = isOpen ? 50 : "";
    });

    // Row 1: [▷ Play] [复制输入] [查看模板]
    const inputActions = document.createElement("div");
    inputActions.className = "cnode-actions";

    // Play / generate button (corner badge, top-right)
    const playBtn = document.createElement("button");
    playBtn.className = "cnode-play-badge";
    playBtn.type = "button";
    playBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';
    playBtn.addEventListener("mousedown", (e) => e.stopPropagation());
    playBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      if (playBtn.classList.contains("running")) return;
      // Collect outputs from parent cards
      const parentEdges = edges.filter((ed) => ed.to === n.id);
      if (parentEdges.length > 0) {
        const parts = [];
        for (const pe of parentEdges) {
          const parentNode = nodes.find((nd) => nd.id === pe.from);
          if (parentNode && parentNode.outputValue) {
            const parentCard = allItemsMap.get(parentNode.cardId);
            const parentTitle = parentCard ? parentCard.title : parentNode.cardId;
            const outLabel = typeof t === "function" ? `【${parentTitle}】的输出：\n` : `Output from [${parentTitle}]:\n`;
            parts.push(`${outLabel}${parentNode.outputValue}`);
          }
        }
        if (parts.length > 0) {
          textarea.value = parts.join("\n\n" + "─".repeat(30) + "\n\n");
          n.inputValue = textarea.value;
          write();
        }
      }
      // Check if input is empty
      if (!textarea.value.trim()) {
        titleError.textContent = typeof t === "function" ? t("inputEmpty") : "输入为空";
        titleError.className = "cnode-title-error visible";
        setTimeout(() => { titleError.className = "cnode-title-error"; }, 3000);
        return;
      }
      titleError.className = "cnode-title-error";
      await handleNodeApiCall(n, prompt, textarea, outputArea, playBtn, statusEl, copyOutIcon);
    });

    const copyInputBtn = document.createElement("button");
    copyInputBtn.className = "cnode-copy-btn cnode-copy-input-btn";
    copyInputBtn.type = "button";
    copyInputBtn.textContent = t("copyInput");
    copyInputBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const merged = mergePromptAndInput(prompt, textarea.value);
      navigator.clipboard.writeText(merged).then(() => {
        copyInputBtn.textContent = t("copied");
        setTimeout(() => { copyInputBtn.textContent = t("copyInput"); }, 1500);
      }).catch(() => {
        copyInputBtn.textContent = t("copyFailed");
        setTimeout(() => { copyInputBtn.textContent = t("copyInput"); }, 1500);
      });
    });
    copyInputBtn.addEventListener("mousedown", (e) => e.stopPropagation());

    inputActions.append(previewToggle, copyInputBtn);

    // Output area (wrapper for positioning copy icon)
    const outputWrap = document.createElement("div");
    outputWrap.className = "cnode-output-wrap";

    const outputArea = document.createElement("textarea");
    outputArea.className = "cnode-textarea cnode-output";
    outputArea.placeholder = t("outputPlaceholder");
    outputArea.value = outputValue;
    outputArea.addEventListener("input", () => {
      n.outputValue = outputArea.value;
      write();
    });
    outputArea.addEventListener("mousedown", (e) => e.stopPropagation());

    // Copy output icon (appears after generation)
    const copyOutIcon = document.createElement("button");
    copyOutIcon.className = "cnode-copy-out-icon" + (outputValue ? " visible" : "");
    copyOutIcon.type = "button";
    copyOutIcon.innerHTML = '<svg viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>';
    copyOutIcon.addEventListener("mousedown", (e) => e.stopPropagation());
    copyOutIcon.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!outputArea.value) return;
      navigator.clipboard.writeText(outputArea.value).then(() => {
        copyOutIcon.classList.add("copied");
        setTimeout(() => copyOutIcon.classList.remove("copied"), 1500);
      });
    });

    outputWrap.append(outputArea, copyOutIcon);

    // Status
    const statusEl = document.createElement("div");
    statusEl.className = "cnode-status";

    titleRow.append(titleEl, titleError);
    el.append(titleRow, subtitleEl, textarea, inputActions, preview, outputWrap, statusEl, stageBadgeWrap, playBtn);

    // Click to select the node (backup for cases where mousedown handler is bypassed)
    el.addEventListener("click", (e) => {
      if (e.target.closest("button") || e.target.closest("textarea") || e.target.closest("input")) {
        // Still select the node; child handlers that want to avoid this should call stopPropagation
        selectNode(n.id);
        return;
      }
      selectNode(n.id);
    });

    return el;
  }

  function buildEdgeEl(e) {
    const from = nodes.find((n) => n.id === e.from);
    const to = nodes.find((n) => n.id === e.to);
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    if (!from || !to) return g;
    const d = arrowPath(from, to, e.fromSide, e.toSide);
    const isSelected = e.id === selectedEdgeId;
    // Hit area (wide invisible path for easy clicking)
    const hit = document.createElementNS("http://www.w3.org/2000/svg", "path");
    hit.setAttribute("d", d);
    hit.setAttribute("class", "cedge-hit");
    hit.dataset.edgeId = e.id;
    // Visible path
    const p = document.createElementNS("http://www.w3.org/2000/svg", "path");
    p.setAttribute("d", d);
    p.setAttribute("class", "cedge" + (isSelected ? " selected" : ""));
    p.setAttribute("marker-end", "url(#arrowhead)");
    p.dataset.edgeId = e.id;
    g.append(hit, p);
    // Endpoint handles (always present, shown on hover via CSS)
    const p1 = getConnectorPos(from, e.fromSide || "bottom");
    const p2 = getConnectorPos(to, e.toSide || "top");
    const hFrom = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    hFrom.setAttribute("cx", p1.x); hFrom.setAttribute("cy", p1.y); hFrom.setAttribute("r", 7);
    hFrom.setAttribute("class", "cedge-handle"); hFrom.dataset.edgeId = e.id; hFrom.dataset.end = "from";
    const hTo = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    hTo.setAttribute("cx", p2.x); hTo.setAttribute("cy", p2.y); hTo.setAttribute("r", 7);
    hTo.setAttribute("class", "cedge-handle"); hTo.dataset.edgeId = e.id; hTo.dataset.end = "to";
    g.append(hFrom, hTo);
    g.dataset.edgeId = e.id;
    return g;
  }

  function refreshEdges() {
    if (!arrowsEl) return;
    clearEdgeEls();
    edges.forEach((e) => arrowsEl.appendChild(buildEdgeEl(e)));
  }

  // ── Arrow path ──

  function arrowPath(from, to, fromSide, toSide) {
    const p1 = getConnectorPos(from, fromSide || "bottom");
    const p2 = getConnectorPos(to, toSide || "top");
    const dx = Math.abs(p2.x - p1.x);
    const dy = Math.abs(p2.y - p1.y);
    const offset = Math.max(40, Math.min(dx, dy) * 0.5);

    const dir = { top: { x: 0, y: -1 }, bottom: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
    const d1 = dir[fromSide || "bottom"] || dir.bottom;
    const d2 = dir[toSide || "top"] || dir.top;

    const c1x = p1.x + d1.x * offset;
    const c1y = p1.y + d1.y * offset;
    const c2x = p2.x + d2.x * offset;
    const c2y = p2.y + d2.y * offset;

    return `M ${p1.x} ${p1.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }

  // ── Canvas interaction (node drag + edge draw) ──

  function bindCanvasInteraction() {
    if (!canvasEl) return;

    canvasEl.addEventListener("mousedown", (e) => {
      // Check for connector — use elementsFromPoint to find it even behind SVG layer
      const allEls = document.elementsFromPoint(e.clientX, e.clientY);
      const conn = allEls.find((el) => el.closest(".cnode-connector"));
      if (conn) {
        startEdgeDraw(conn.closest(".cnode-connector"), e);
        return;
      }
      // Don't start drag when clicking on interactive elements inside nodes,
      // but still select the node.
      const nodeEl = e.target.closest(".cnode");
      if (nodeEl) {
        const isInteractive = e.target.closest("textarea") || e.target.closest("input") || e.target.closest("button");
        if (!isInteractive) {
          startNodeDrag(nodeEl, e);
        } else {
          selectNode(nodeEl.dataset.nodeId);
        }
        return;
      }
      // Edge handle drag
      const handle = e.target.closest(".cedge-handle");
      if (handle) {
        startEdgeHandleDrag(handle, e);
        return;
      }
      // Edge path drag — grab anywhere on the edge to drag nearest endpoint
      const edgeHit = e.target.closest(".cedge-hit");
      if (edgeHit) {
        startEdgePathDrag(edgeHit, e);
        return;
      }
    });

    document.addEventListener("mousemove", (e) => {
      if (dragState && dragState.type === "node") nodeDragMove(e);
      if (dragState && dragState.type === "edge") edgeDrawMove(e);
      if (dragState && dragState.type === "edgeHandle") edgeHandleDragMove(e);
      if (drawerDrag) drawerDragMove(e);
    });

    document.addEventListener("mouseup", (e) => {
      if (dragState && dragState.type === "node") nodeDragEnd(e);
      if (dragState && dragState.type === "edge") edgeDrawEnd(e);
      if (dragState && dragState.type === "edgeHandle") edgeHandleDragEnd(e);
      if (drawerDrag) drawerDragEnd(e);
    });

    // SVG has pointer-events: auto (z-index 2), so it intercepts all canvas clicks.
    // Handle edges directly; for nodes/empty canvas, use elementFromPoint.
    function findElementBelow(x, y) {
      arrowsEl.style.pointerEvents = "none";
      const el = document.elementFromPoint(x, y);
      arrowsEl.style.pointerEvents = "";
      return el;
    }

    arrowsEl.addEventListener("click", (e) => {
      if (e.target.closest("textarea") || e.target.closest("input") || e.target.closest("button")) return;

      // Check if clicking an edge
      const edgeEl = e.target.closest("[data-edge-id]");
      if (edgeEl && arrowsEl.contains(edgeEl)) {
        e.stopPropagation();
        selectEdge(edgeEl.dataset.edgeId);
        return;
      }

      // Not an edge — find what's beneath the SVG
      const below = findElementBelow(e.clientX, e.clientY);
      if (!below) { clearSelection(); return; }

      const nodeEl = below.closest(".cnode");
      if (nodeEl) {
        e.stopPropagation();
        selectNode(nodeEl.dataset.nodeId);
        canvasEl.focus();
        return;
      }
      if (below.closest(".cedge-handle")) return;
      clearSelection();
    });

    // Mousedown for focus — also needs to check through SVG
    canvasEl.addEventListener("mousedown", (e) => {
      if (e.target.closest("textarea") || e.target.closest("input") || e.target.closest("button")) return;
      canvasEl.focus();
    });
  }

  // ── Node drag ──

  function startNodeDrag(nodeEl, e) {
    const n = nodes.find((nd) => nd.id === nodeEl.dataset.nodeId);
    if (!n || n.cardId === "__start__") return;
    e.preventDefault();
    selectNode(n.id);
    dragState = {
      type: "node",
      nodeId: n.id,
      el: nodeEl,
      sx: e.clientX,
      sy: e.clientY,
      ox: n.x,
      oy: n.y,
      moved: false,
    };
    nodeEl.classList.add("dragging");
  }

  function nodeDragMove(e) {
    const d = dragState;
    if (!d || d.type !== "node") return;
    const dx = e.clientX - d.sx;
    const dy = e.clientY - d.sy;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) d.moved = true;
    const nx = d.ox + dx;
    const ny = d.oy + dy;
    const n = nodes.find((nd) => nd.id === d.nodeId);
    if (n) { n.x = nx; n.y = ny; }
    d.el.style.left = nx + "px";
    d.el.style.top = ny + "px";
    refreshEdges();
    const { shiftX, shiftY } = resizeCanvas();
    // Compensate drag origin for auto-shift so the node doesn't slide away
    if (shiftX || shiftY) {
      d.ox += shiftX;
      d.oy += shiftY;
    }
  }

  function nodeDragEnd(e) {
    const d = dragState;
    if (!d || d.type !== "node") return;
    d.el.classList.remove("dragging");

    // Auto-insert card into start→end edge when dropped nearby
    if (d.moved) {
      const dropped = nodes.find((nd) => nd.id === d.nodeId);
      if (dropped && dropped.cardId !== "__start__" && dropped.cardId !== "__end__") {
        tryAutoInsertOnEdge(dropped);
      }
    }

    write();
    resizeCanvas();
    dragState = null;
  }

  function tryAutoInsertOnEdge(dropped) {
    const startNode = nodes.find((n) => n.cardId === "__start__");
    if (!startNode) return;

    // Find an edge from start to a regular card
    const seIdx = edges.findIndex((e) => e.from === startNode.id);
    if (seIdx < 0) return;
    const targetNode = nodes.find((n) => n.id === edges[seIdx].to);
    if (!targetNode) return;

    const getPos = (node, side) => {
      const el = nodesEl.querySelector(`[data-node-id="${node.id}"]`);
      const w = el ? el.offsetWidth : 260;
      const h = el ? el.offsetHeight : 60;
      if (side === "bottom") return { x: node.x + w / 2, y: node.y + h };
      return { x: node.x + w / 2, y: node.y };
    };

    const p1 = getPos(startNode, "bottom");
    const p2 = getPos(targetNode, "top");

    // Dropped card center
    const el = nodesEl.querySelector(`[data-node-id="${dropped.id}"]`);
    const dw = el ? el.offsetWidth : 200;
    const dh = el ? el.offsetHeight : 80;
    const cx = dropped.x + dw / 2;
    const cy = dropped.y + dh / 2;

    // Point-to-segment distance
    const dx = p2.x - p1.x, dy = p2.y - p1.y;
    const lenSq = dx * dx + dy * dy;
    let t = lenSq > 0 ? ((cx - p1.x) * dx + (cy - p1.y) * dy) / lenSq : 0;
    t = Math.max(0, Math.min(1, t));
    const nearX = p1.x + t * dx, nearY = p1.y + t * dy;
    const dist = Math.hypot(cx - nearX, cy - nearY);

    if (dist < 80) {
      edges.splice(seIdx, 1);
      edges.push({ id: "e" + nextId++, from: startNode.id, fromSide: "bottom", to: dropped.id, toSide: "top" });
      edges.push({ id: "e" + nextId++, from: dropped.id, fromSide: "bottom", to: targetNode.id, toSide: "top" });
      refreshEdges();
    }
  }

  // ── Edge draw ──

  function getConnectorPos(node, side) {
    const el = nodesEl.querySelector(`[data-node-id="${node.id}"]`);
    const w = el ? el.offsetWidth : 180;
    const h = el ? el.offsetHeight : 64;
    switch (side) {
      case "top":    return { x: node.x + w / 2, y: node.y };
      case "bottom": return { x: node.x + w / 2, y: node.y + h };
      case "left":   return { x: node.x, y: node.y + h / 2 };
      case "right":  return { x: node.x + w, y: node.y + h / 2 };
      default:       return { x: node.x + w / 2, y: node.y + h };
    }
  }

  function startEdgeDraw(conn, e) {
    const fromId = conn.dataset.nodeId;
    const fromSide = conn.dataset.side || "bottom";
    if (!fromId || fromSide !== "bottom") return; // only bottom can emit
    e.preventDefault();
    e.stopPropagation();
    const from = nodes.find((n) => n.id === fromId);
    if (!from) return;
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    const pos = getConnectorPos(from, fromSide);
    line.setAttribute("x1", pos.x);
    line.setAttribute("y1", pos.y);
    line.setAttribute("x2", pos.x);
    line.setAttribute("y2", pos.y);
    line.setAttribute("class", "ctemp-line");
    arrowsEl.appendChild(line);
    dragState = { type: "edge", fromId, fromSide, line };
  }

  const SNAP_RADIUS = 50;

  function findSnapTarget(excludeId, cursorX, cursorY) {
    let best = null, bestDist = SNAP_RADIUS;
    nodes.forEach((n) => {
      if (n.id === excludeId) return;
      const pos = getConnectorPos(n, "top");
      const dist = Math.hypot(cursorX - pos.x, cursorY - pos.y);
      if (dist < bestDist) { bestDist = dist; best = n; }
    });
    return best;
  }

  function clearSnapHighlight() {
    if (!nodesEl) return;
    nodesEl.querySelectorAll(".cnode-conn-snap").forEach((el) => el.classList.remove("cnode-conn-snap"));
  }

  function edgeDrawMove(e) {
    const d = dragState;
    if (!d || d.type !== "edge") return;
    const rect = canvasEl.getBoundingClientRect();
    const x = e.clientX - rect.left + canvasEl.scrollLeft;
    const y = e.clientY - rect.top + canvasEl.scrollTop;
    d.line.setAttribute("x2", x);
    d.line.setAttribute("y2", y);

    // Magnetic snap
    clearSnapHighlight();
    const snap = findSnapTarget(d.fromId, x, y);
    d.snapTarget = snap;
    if (snap) {
      const el = nodesEl.querySelector(`[data-node-id="${snap.id}"] .cnode-conn-top`);
      if (el) el.classList.add("cnode-conn-snap");
      const pos = getConnectorPos(snap, "top");
      d.line.setAttribute("x2", pos.x);
      d.line.setAttribute("y2", pos.y);
    }
  }

  function edgeDrawEnd(e) {
    const d = dragState;
    if (!d || d.type !== "edge") return;
    d.line.remove();
    clearSnapHighlight();

    // Prefer magnetic snap target, otherwise use elementFromPoint
    let conn = null;
    if (d.snapTarget) {
      const el = nodesEl.querySelector(`[data-node-id="${d.snapTarget.id}"] .cnode-conn-top`);
      if (el) conn = el;
    }
    if (!conn) {
      const elUnder = document.elementFromPoint(e.clientX, e.clientY);
      conn = elUnder ? elUnder.closest(".cnode-connector") : null;
    }
    if (!conn) { dragState = null; return; }
    const toId = conn.dataset.nodeId;
    const toSide = conn.dataset.side || "top";
    if (!toId || toId === d.fromId || toSide !== "top") { dragState = null; return; }
    if (edges.some((ed) => ed.from === d.fromId && ed.to === toId)) {
      dragState = null;
      return;
    }
    const edge = { id: "e" + nextId++, from: d.fromId, fromSide: d.fromSide, to: toId, toSide };
    saveUndo();
    edges.push(edge);
    write();
    refreshEdges();
    dragState = null;
  }

  // ── Edge path drag (grab anywhere on edge) ──

  function startEdgePathDrag(hitEl, e) {
    const edgeId = hitEl.dataset.edgeId;
    if (!edgeId) return;
    const edge = edges.find((ed) => ed.id === edgeId);
    if (!edge) return;

    // Determine which endpoint is closer to cursor
    const rect = canvasEl.getBoundingClientRect();
    const cx = e.clientX - rect.left + canvasEl.scrollLeft;
    const cy = e.clientY - rect.top + canvasEl.scrollTop;
    const from = nodes.find((n) => n.id === edge.from);
    const to = nodes.find((n) => n.id === edge.to);
    if (!from || !to) return;
    const pFrom = getConnectorPos(from, edge.fromSide || "bottom");
    const pTo = getConnectorPos(to, edge.toSide || "top");
    const distFrom = Math.hypot(cx - pFrom.x, cy - pFrom.y);
    const distTo = Math.hypot(cx - pTo.x, cy - pTo.y);
    const end = distFrom <= distTo ? "from" : "to";

    // Reuse the same drag logic as handle drag
    e.preventDefault();
    e.stopPropagation();

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    const fixedNode = end === "from" ? to : from;
    const fixedSide = end === "from" ? (edge.toSide || "top") : (edge.fromSide || "bottom");
    const fp = getConnectorPos(fixedNode, fixedSide);
    line.setAttribute("x1", fp.x); line.setAttribute("y1", fp.y);
    line.setAttribute("x2", fp.x); line.setAttribute("y2", fp.y);
    line.setAttribute("class", "ctemp-handle-line");
    arrowsEl.appendChild(line);

    dragState = { type: "edgeHandle", edgeId, end, line, origEdge: { ...edge }, moved: false, startX: e.clientX, startY: e.clientY };
  }

  // ── Edge handle drag (reconnect endpoints) ──

  function startEdgeHandleDrag(handle, e) {
    const edgeId = handle.dataset.edgeId;
    const end = handle.dataset.end; // "from" or "to"
    if (!edgeId || !end) return;
    const edge = edges.find((ed) => ed.id === edgeId);
    if (!edge) return;
    e.preventDefault();
    e.stopPropagation();

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    const fixedNode = end === "from"
      ? nodes.find((n) => n.id === edge.to)
      : nodes.find((n) => n.id === edge.from);
    const fixedSide = end === "from" ? (edge.toSide || "top") : (edge.fromSide || "bottom");
    if (!fixedNode) return;
    const fp = getConnectorPos(fixedNode, fixedSide);
    line.setAttribute("x1", fp.x);
    line.setAttribute("y1", fp.y);
    line.setAttribute("x2", fp.x);
    line.setAttribute("y2", fp.y);
    line.setAttribute("class", "ctemp-handle-line");
    arrowsEl.appendChild(line);

    dragState = { type: "edgeHandle", edgeId, end, line, origEdge: { ...edge }, moved: false, startX: e.clientX, startY: e.clientY };
  }

  function edgeHandleDragMove(e) {
    const d = dragState;
    if (!d || d.type !== "edgeHandle") return;

    // Hide original edge group on first real move so pure clicks still work
    if (!d.moved) {
      d.moved = true;
      const edgeGroup = arrowsEl.querySelector(`g[data-edge-id="${d.edgeId}"]`);
      if (edgeGroup) edgeGroup.style.display = "none";
    }

    const rect = canvasEl.getBoundingClientRect();
    const x = e.clientX - rect.left + canvasEl.scrollLeft;
    const y = e.clientY - rect.top + canvasEl.scrollTop;
    d.line.setAttribute("x2", x);
    d.line.setAttribute("y2", y);

    // Magnetic snap to connectors
    clearSnapHighlight();
    const targetSide = d.end === "from" ? "bottom" : "top";
    const excludeNodeId = d.end === "from"
      ? (d.origEdge ? d.origEdge.to : null)
      : (d.origEdge ? d.origEdge.from : null);
    let best = null, bestDist = SNAP_RADIUS;
    nodes.forEach((n) => {
      if (n.id === excludeNodeId) return;
      const pos = getConnectorPos(n, targetSide);
      const dist = Math.hypot(x - pos.x, y - pos.y);
      if (dist < bestDist) { bestDist = dist; best = n; }
    });
    d.snapTarget = best;
    if (best) {
      const connEl = nodesEl.querySelector(`[data-node-id="${best.id}"] .cnode-conn-${targetSide}`);
      if (connEl) connEl.classList.add("cnode-conn-snap");
      const pos = getConnectorPos(best, targetSide);
      d.line.setAttribute("x2", pos.x);
      d.line.setAttribute("y2", pos.y);
    }
  }

  function edgeHandleDragEnd(e) {
    const d = dragState;
    if (!d || d.type !== "edgeHandle") return;
    d.line.remove();
    clearSnapHighlight();

    const edge = edges.find((ed) => ed.id === d.edgeId);
    if (!edge) { dragState = null; return; }

    // If it was just a click (barely moved), select the edge instead of dragging
    const dx = e.clientX - (d.startX || e.clientX);
    const dy = e.clientY - (d.startY || e.clientY);
    if (!d.moved || Math.hypot(dx, dy) < 3) {
      selectEdge(d.edgeId);
      dragState = null;
      return;
    }

    // Prefer magnetic snap target, otherwise elementFromPoint
    let targetNode = d.snapTarget || null;
    if (!targetNode) {
      const elUnder = document.elementFromPoint(e.clientX, e.clientY);
      const conn = elUnder ? elUnder.closest(".cnode-connector") : null;
      if (conn) {
        targetNode = nodes.find((n) => n.id === conn.dataset.nodeId);
      }
    }

    if (targetNode) {
      saveUndo();
      if (d.end === "from" && targetNode.id !== edge.to) {
        if (!edges.some((ed) => ed.id !== d.edgeId && ed.from === targetNode.id && ed.to === edge.to)) {
          edge.from = targetNode.id;
          edge.fromSide = "bottom";
        }
      } else if (d.end === "to" && targetNode.id !== edge.from) {
        if (!edges.some((ed) => ed.id !== d.edgeId && ed.from === edge.from && ed.to === targetNode.id)) {
          edge.to = targetNode.id;
          edge.toSide = "top";
        }
      }
    }
    // If dropped on empty space, edge stays as-is (no reconnect)

    write();
    refreshEdges();
    dragState = null;
  }

  // ── Drawer drag ──

  function getVisibleCanvasCenter() {
    const rect = canvasEl.getBoundingClientRect();
    const cx = rect.width / 2 + canvasEl.scrollLeft;
    const cy = rect.height / 2 + canvasEl.scrollTop;
    return { x: cx - 90, y: cy - 32 };
  }

  function bindDrawerDrag() {
    if (!drawerRoot) return;
    drawerRoot.addEventListener("mousedown", (e) => {
      if (e.target.closest(".cdrawer-item-edit")) return;
      if (e.target.closest("[contenteditable='true']")) return;
      const item = e.target.closest(".cdrawer-item");
      if (!item) return;
      e.preventDefault();
      const cardId = item.dataset.cardId;
      const ghost = item.cloneNode(true);
      ghost.className = "cdrawer-ghost";
      ghost.style.cssText = `position:fixed;left:${e.clientX - 60}px;top:${e.clientY - 16}px;pointer-events:none;z-index:9999;`;
      document.body.appendChild(ghost);
      drawerDrag = { cardId, ghost, overCanvas: false, moved: false, startX: e.clientX, startY: e.clientY };
    });
  }

  function drawerDragMove(e) {
    const d = drawerDrag;
    if (!d) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) d.moved = true;
    d.ghost.style.left = (e.clientX - 60) + "px";
    d.ghost.style.top = (e.clientY - 16) + "px";
    const rect = canvasEl.getBoundingClientRect();
    d.overCanvas = e.clientX >= rect.left && e.clientX <= rect.right &&
                   e.clientY >= rect.top && e.clientY <= rect.bottom;
  }

  function drawerDragEnd(e) {
    const d = drawerDrag;
    if (!d) return;
    d.ghost.remove();
    if (d.moved && d.overCanvas) {
      const rect = canvasEl.getBoundingClientRect();
      const x = e.clientX - rect.left + canvasEl.scrollLeft - 90;
      const y = e.clientY - rect.top + canvasEl.scrollTop - 32;
      addNode(d.cardId, x, y);
    } else {
      spawnCardNode(d.cardId);
    }
    drawerDrag = null;
  }

  function spawnCardNode(cardId) {
    saveUndo();

    let fromNode = null;
    if (selectedNodeId) {
      fromNode = nodes.find((n) => n.id === selectedNodeId);
    }
    if (!fromNode) {
      const otherNodes = nodes.filter((n) => n.cardId !== "__start__" && n.cardId !== "__end__");
      if (otherNodes.length > 0) {
        fromNode = otherNodes[0];
        otherNodes.forEach((n) => { if (n.y > fromNode.y) fromNode = n; });
      }
    }
    if (!fromNode) {
      fromNode = nodes.find((n) => n.cardId === "__start__");
    }

    const pos = computeSpawnPosition(fromNode);
    const newNode = { id: "n" + nextId++, cardId, x: pos.x, y: pos.y, subtitle: "" };
    nodes.push(newNode);
    nodesEl.appendChild(buildNodeEl(newNode));

    if (fromNode) {
      edges.push({ id: "e" + nextId++, from: fromNode.id, fromSide: "bottom", to: newNode.id, toSide: "top" });
    }

    write();
    resizeCanvas();
    refreshEdges();
  }

  function computeSpawnPosition(fromNode) {
    const GAP_X = 60;
    const GAP_Y = 80;
    const NODE_W = 260;
    const NODE_H = 180;

    if (!fromNode) {
      return { x: 100, y: 100 };
    }

    const fromEl = nodesEl.querySelector(`[data-node-id="${fromNode.id}"]`);
    const fromW = fromEl ? fromEl.offsetWidth : NODE_W;
    const fromH = fromEl ? fromEl.offsetHeight : NODE_H;

    const childEdges = edges.filter((e) => e.from === fromNode.id);
    const childIds = childEdges.map((e) => e.to);

    if (childIds.length === 0) {
      return { x: fromNode.x, y: fromNode.y + fromH + GAP_Y };
    }

    let rightmostNode = null;
    let rightmostRight = -Infinity;
    for (const childId of childIds) {
      const child = nodes.find((n) => n.id === childId);
      if (!child) continue;
      const childEl = nodesEl.querySelector(`[data-node-id="${childId}"]`);
      const childW = childEl ? childEl.offsetWidth : NODE_W;
      const childRight = child.x + childW;
      if (childRight > rightmostRight) {
        rightmostRight = childRight;
        rightmostNode = child;
      }
    }

    if (!rightmostNode) {
      return { x: fromNode.x, y: fromNode.y + fromH + GAP_Y };
    }

    const rightmostEl = nodesEl.querySelector(`[data-node-id="${rightmostNode.id}"]`);
    const rightmostW = rightmostEl ? rightmostEl.offsetWidth : NODE_W;
    return { x: rightmostNode.x + rightmostW + GAP_X, y: rightmostNode.y };
  }

  // ── Selection ──

  function selectNode(id) {
    selectedNodeId = id;
    selectedEdgeId = null;
    nodesEl.querySelectorAll(".cnode.selected").forEach((el) => el.classList.remove("selected"));
    const el = nodesEl.querySelector(`[data-node-id="${id}"]`);
    if (el) el.classList.add("selected");
  }

  function selectEdge(id) {
    selectedEdgeId = id;
    selectedNodeId = null;
    nodesEl.querySelectorAll(".cnode.selected").forEach((el) => el.classList.remove("selected"));
    refreshEdges();
  }

  function clearSelection() {
    selectedNodeId = null;
    selectedEdgeId = null;
    nodesEl.querySelectorAll(".cnode.selected").forEach((el) => el.classList.remove("selected"));
    refreshEdges();
  }

  function removeEdgeHandles() {
    if (!arrowsEl) return;
    arrowsEl.querySelectorAll(".cedge-handle").forEach((el) => el.remove());
    arrowsEl.querySelectorAll(".ctemp-handle-line").forEach((el) => el.remove());
  }

  function showEdgeHandles(edgeId) {
    removeEdgeHandles();
    const edge = edges.find((ed) => ed.id === edgeId);
    if (!edge) return;
    const from = nodes.find((n) => n.id === edge.from);
    const to = nodes.find((n) => n.id === edge.to);
    if (!from || !to) return;
    const p1 = getConnectorPos(from, edge.fromSide || "bottom");
    const p2 = getConnectorPos(to, edge.toSide || "top");
    const fromHandle = createEdgeHandle(p1.x, p1.y, edgeId, "from");
    const toHandle = createEdgeHandle(p2.x, p2.y, edgeId, "to");
    arrowsEl.appendChild(fromHandle);
    arrowsEl.appendChild(toHandle);
  }

  function createEdgeHandle(cx, cy, edgeId, end) {
    const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    c.setAttribute("cx", cx);
    c.setAttribute("cy", cy);
    c.setAttribute("r", 7);
    c.setAttribute("class", "cedge-handle");
    c.dataset.edgeId = edgeId;
    c.dataset.end = end;
    return c;
  }

  // ── Keyboard ──

  function bindKeyboard() {
    document.addEventListener("keydown", (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (document.getElementById("layout2").classList.contains("hidden")) return;

      const mod = e.metaKey || e.ctrlKey;

      // Cmd+Z = undo, Cmd+Shift+Z = redo
      if (mod && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) redo(); else undo();
        return;
      }

      // Cmd+C = copy selected card
      if (mod && e.key === "c" && selectedNodeId) {
        const n = nodes.find((nd) => nd.id === selectedNodeId);
        if (n && n.cardId !== "__start__" && n.cardId !== "__end__") {
          clipboard = { cardId: n.cardId, subtitle: n.subtitle, inputValue: n.inputValue, outputValue: n.outputValue };
        }
        return;
      }

      // Cmd+V = paste card
      if (mod && e.key === "v" && clipboard) {
        e.preventDefault();
        saveUndo();
        // Position near the original copied card, offset by 30px
        const orig = nodes.find((nd) => nd.cardId === clipboard.cardId);
        const x = orig ? orig.x + 30 : 100;
        const y = orig ? orig.y + 30 : 100;
        const node = { id: "n" + nextId++, cardId: clipboard.cardId, x, y, subtitle: clipboard.subtitle, inputValue: clipboard.inputValue, outputValue: clipboard.outputValue };
        nodes.push(node);
        nodesEl.appendChild(buildNodeEl(node));
        selectNode(node.id);
        write();
        render();
        return;
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedNodeId) {
          const n = nodes.find((nd) => nd.id === selectedNodeId);
          if (n && (n.cardId === "__start__" || n.cardId === "__end__")) return; // protect start/end
          e.preventDefault();
          saveUndo();
          nodes = nodes.filter((nd) => nd.id !== selectedNodeId);
          edges = edges.filter((ed) => ed.from !== selectedNodeId && ed.to !== selectedNodeId);
          const el = nodesEl.querySelector(`[data-node-id="${selectedNodeId}"]`);
          if (el) el.remove();
          selectedNodeId = null;
          write();
          refreshEdges();
        } else if (selectedEdgeId) {
          e.preventDefault();
          saveUndo();
          edges = edges.filter((ed) => ed.id !== selectedEdgeId);
          selectedEdgeId = null;
          write();
          refreshEdges();
        }
      }
    });
  }

  // ── Start / End Nodes ──

  function ensureStartEndNodes() {
    const hasStart = nodes.some((n) => n.cardId === "__start__");

    if (!hasStart) {
      nodes.push({ id: "n" + nextId++, cardId: "__start__", x: 16, y: 16, subtitle: "" });
    }

    // Remove any legacy end nodes and edges to them
    const endNodes = nodes.filter((n) => n.cardId === "__end__");
    if (endNodes.length > 0) {
      const endIds = new Set(endNodes.map((n) => n.id));
      edges = edges.filter((e) => !endIds.has(e.to));
      nodes = nodes.filter((n) => n.cardId !== "__end__");
    }
  }

  // ── Add / Clear ──

  function addNode(cardId, x, y) {
    saveUndo();
    const node = { id: "n" + nextId++, cardId, x: x || 100, y: y || 100, subtitle: "" };
    nodes.push(node);
    nodesEl.appendChild(buildNodeEl(node));
    write();
    resizeCanvas();
  }

  function clear() {
    saveUndo();
    nodes = [];
    edges = [];
    nextId = 1;
    selectedNodeId = null;
    selectedEdgeId = null;
    if (nodesEl) nodesEl.innerHTML = "";
    clearEdgeEls();
    ensureStartEndNodes();
    render();
    write();
    resizeCanvas();
  }

  // ── Drawer ──

  let drawerReorderCallback = null;
  let drawerAddCardCallback = null;
  let drawerAddStageCallback = null;
  let drawerDeleteStageCallback = null;
  let drawerRestoreStageCallback = null;
  let drawerEmptyTrashCallback = null;
  let drawerRenameStageCallback = null;
  let drawerRenameCardCallback = null;

  function buildDrawer(cardsByCategory, onReorder, onAddCard, onAddStage, onDeleteStage, trashData, onRestoreStage, onEmptyTrash, onRenameStage, onRenameCard) {
    if (!drawerRoot) return;
    // Save which stages are open
    const openStages = new Set();
    drawerRoot.querySelectorAll("details[open]").forEach((det) => {
      if (det.dataset.stageId) openStages.add(det.dataset.stageId);
      else {
        const sum = det.querySelector("summary span");
        if (sum) openStages.add(sum.textContent);
      }
    });
    drawerRoot.innerHTML = "";
    drawerReorderCallback = onReorder || null;
    drawerAddCardCallback = onAddCard || null;
    drawerAddStageCallback = onAddStage || null;
    drawerDeleteStageCallback = onDeleteStage || null;
    drawerRestoreStageCallback = onRestoreStage || null;
    drawerEmptyTrashCallback = onEmptyTrash || null;
    drawerRenameStageCallback = onRenameStage || null;
    drawerRenameCardCallback = onRenameCard || null;

    for (const group of cardsByCategory) {
      const cat = group.name;
      const cards = group.cards;
      const stageId = group.stageId || null;

      const det = document.createElement("details");
      det.className = "cdrawer-group" + (stageId ? " cdrawer-custom" : "");
      if (stageId) det.dataset.stageId = stageId;

      const sum = document.createElement("summary");
      sum.className = "cdrawer-summary";

      const nameSpan = document.createElement("span");
      nameSpan.textContent = cat;

      if (stageId) {
        nameSpan.className = "cdrawer-stage-name";
        nameSpan.addEventListener("dblclick", (e) => {
          e.preventDefault();
          e.stopPropagation();
          nameSpan.contentEditable = "true";
          nameSpan.focus();
          // Select all text
          const range = document.createRange();
          range.selectNodeContents(nameSpan);
          const sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
        });
        nameSpan.addEventListener("blur", () => {
          nameSpan.contentEditable = "false";
          const newName = nameSpan.textContent.trim();
          if (newName && newName !== cat && drawerRenameStageCallback) {
            drawerRenameStageCallback(stageId, newName);
          } else {
            nameSpan.textContent = cat;
          }
        });
        nameSpan.addEventListener("keydown", (e) => {
          if (e.key === "Enter") { e.preventDefault(); nameSpan.blur(); }
          if (e.key === "Escape") { nameSpan.textContent = cat; nameSpan.blur(); }
        });
      }

      sum.appendChild(nameSpan);

      if (stageId) {
        const delBtn = document.createElement("button");
        delBtn.className = "cdrawer-del-btn";
        delBtn.type = "button";
        delBtn.textContent = "×";
        delBtn.title = t("deleteStageTooltip");
        delBtn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (drawerDeleteStageCallback) drawerDeleteStageCallback(stageId);
        });
        sum.appendChild(delBtn);
      }

      const addBtn = document.createElement("button");
      addBtn.className = "cdrawer-add-btn";
      addBtn.type = "button";
      addBtn.textContent = "+";
      addBtn.title = t("addCardTooltip");
      addBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (drawerAddCardCallback) drawerAddCardCallback(stageId || ("builtin:" + cat));
      });

      sum.appendChild(addBtn);

      if (stageId) {
        sum.draggable = true;
        sum.addEventListener("dragstart", (e) => {
          e.dataTransfer.setData("text/plain", stageId);
          e.dataTransfer.effectAllowed = "move";
          det.classList.add("cdrawer-dragging");
        });
        sum.addEventListener("dragend", () => {
          det.classList.remove("cdrawer-dragging");
          drawerRoot.querySelectorAll(".cdrawer-drop-over").forEach((el) => el.classList.remove("cdrawer-drop-over"));
        });
      }

      det.appendChild(sum);

      if (stageId) {
        det.addEventListener("dragover", (e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
          det.classList.add("cdrawer-drop-over");
        });
        det.addEventListener("dragleave", () => {
          det.classList.remove("cdrawer-drop-over");
        });
        det.addEventListener("drop", (e) => {
          e.preventDefault();
          det.classList.remove("cdrawer-drop-over");
          const draggedId = e.dataTransfer.getData("text/plain");
          if (!draggedId || draggedId === stageId) return;
          if (drawerReorderCallback) drawerReorderCallback(draggedId, stageId);
        });
      }

      cards.forEach((card) => {
        const item = document.createElement("div");
        item.className = "cdrawer-item";
        item.dataset.cardId = card.id;
        const translatedTitle = typeof translateCardTitle === "function" ? translateCardTitle(card.title) : card.title;
        const nameSpan = document.createElement("span");
        nameSpan.textContent = translatedTitle;
        item.appendChild(nameSpan);

        // Pencil button to rename card (custom stages only)
        if (stageId) {
          const editBtn = document.createElement("button");
          editBtn.className = "cdrawer-item-edit";
          editBtn.type = "button";
          editBtn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" fill="currentColor"/></svg>';
          editBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            nameSpan.contentEditable = "true";
            nameSpan.focus();
            const range = document.createRange();
            range.selectNodeContents(nameSpan);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
          });
          nameSpan.addEventListener("blur", () => {
            nameSpan.contentEditable = "false";
            const newName = nameSpan.textContent.trim();
            if (newName && newName !== translatedTitle && drawerRenameCardCallback) {
              drawerRenameCardCallback(card.id, newName);
            } else {
              nameSpan.textContent = translatedTitle;
            }
          });
          nameSpan.addEventListener("keydown", (ev) => {
            if (ev.key === "Enter") { ev.preventDefault(); nameSpan.blur(); }
            if (ev.key === "Escape") { nameSpan.textContent = translatedTitle; nameSpan.blur(); }
          });
          item.appendChild(editBtn);
        }

        det.appendChild(item);
      });
      // Restore open state
      const key = stageId || cat;
      if (openStages.has(key)) det.open = true;

      drawerRoot.appendChild(det);
    }

    // Add "新增阶段" button at bottom of drawer
    const addStageBtn = document.createElement("button");
    addStageBtn.className = "cdrawer-add-stage-btn";
    addStageBtn.type = "button";
    addStageBtn.textContent = "+ " + t("addStage").replace("+ ", "");
    addStageBtn.addEventListener("click", () => {
      if (drawerAddStageCallback) drawerAddStageCallback();
    });
    drawerRoot.appendChild(addStageBtn);

    // 回收站 section
    if (trashData && trashData.length > 0) {
      const trashDet = document.createElement("details");
      trashDet.className = "cdrawer-group cdrawer-trash";
      const trashSum = document.createElement("summary");
      trashSum.className = "cdrawer-summary";
      const trashNameSpan = document.createElement("span");
      trashNameSpan.textContent = t("trashWithCount").replace("{count}", trashData.length);
      trashSum.appendChild(trashNameSpan);

      const emptyBtn = document.createElement("button");
      emptyBtn.className = "cdrawer-trash-empty-btn";
      emptyBtn.type = "button";
      emptyBtn.textContent = t("empty");
      emptyBtn.title = t("emptyTrash");
      emptyBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (drawerEmptyTrashCallback) drawerEmptyTrashCallback();
      });
      trashSum.appendChild(emptyBtn);
      trashDet.appendChild(trashSum);

      trashData.forEach((entry) => {
        const row = document.createElement("div");
        row.className = "cdrawer-trash-item";
        const nameSpan = document.createElement("span");
        nameSpan.textContent = entry.name + (entry.cardCount > 0 ? ` (${entry.cardCount})` : "");
        const restoreBtn = document.createElement("button");
        restoreBtn.className = "cdrawer-trash-restore-btn";
        restoreBtn.type = "button";
        restoreBtn.textContent = t("restore");
        restoreBtn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (drawerRestoreStageCallback) drawerRestoreStageCallback(entry.trashIndex);
        });
        row.append(nameSpan, restoreBtn);
        trashDet.appendChild(row);
      });

      drawerRoot.appendChild(trashDet);
    }
  }

  // ── AllItems map (set from outside) ──

  let allItemsMap = new Map();

  function setAllItems(items) {
    allItemsMap = new Map(items.map((i) => [i.id, i]));
  }

  // ── Node API call ──

  let nodeAbortController = null;

  async function handleNodeApiCall(node, promptTemplate, inputEl, outputEl, btn, statusEl, copyOutIcon) {
    const cfg = typeof getApiConfig === "function" ? getApiConfig() : null;
    if (!cfg || !cfg.apiKey) {
      statusEl.textContent = t("configApiInPanel");
      statusEl.className = "cnode-status error";
      return;
    }

    let userText = inputEl.value.trim();

    // Set running state on play button
    btn.classList.add("running");
    btn.innerHTML = '<span class="spinner"></span>';
    btn.disabled = true;
    outputEl.value = "";
    if (copyOutIcon) copyOutIcon.classList.remove("visible");

    // Step 1: Detect URL and fetch page content
    let fetchError = null;
    const urlMatch = userText.match(/https?:\/\/[^\s]+/);
    const hasUrl = urlMatch && typeof fetchPageText === "function";
    if (hasUrl) {
      statusEl.textContent = "① 正在读取网页...";
      statusEl.className = "cnode-status";
      try {
        const pageText = await fetchPageText(urlMatch[0]);
        userText = userText + "\n\n以下是网页内容:\n" + pageText;
        statusEl.textContent = "① 读取完成 (" + pageText.length + "字)";
        statusEl.className = "cnode-status success";
      } catch (e) {
        fetchError = e.message;
        statusEl.textContent = "① 读取失败: " + fetchError;
        statusEl.className = "cnode-status error";
      }
    }

    // Step 2: Send to AI
    const merged = mergePromptAndInput(promptTemplate, userText);

    if (nodeAbortController) nodeAbortController.abort();
    nodeAbortController = new AbortController();

    if (hasUrl && !fetchError) {
      statusEl.textContent = "② 正在发送给 AI...";
    } else if (!hasUrl) {
      statusEl.textContent = t("connecting");
    }
    statusEl.className = "cnode-status";

    try {
      let fullText = "";
      let charCount = 0;
      let systemMsg = typeof t === "function" && t("nodeApiSystemMsg") !== "nodeApiSystemMsg"
        ? t("nodeApiSystemMsg")
        : "你是一位专业的科研助手。根据用户提供的模板和输入内容，直接输出结果。不要加任何多余解释。";
      // Add output language instruction
      const outLang = typeof getOutputLang === "function" ? getOutputLang() : "zh";
      if (outLang === "en") {
        systemMsg += "\n\nIMPORTANT: Your final output must be written entirely in English.";
      } else if (outLang === "zh") {
        systemMsg += "\n\n重要：你的最终输出必须完全使用中文书写。";
      }
      await callApi(cfg, systemMsg, merged, (text) => {
        fullText += text;
        charCount += text.length;
        outputEl.value = fullText;
        const prefix = hasUrl ? "② " : "";
        statusEl.textContent = prefix + t("generatingWithCount").replace("{count}", charCount);
        statusEl.className = "cnode-status";
      }, nodeAbortController.signal);
      node.outputValue = fullText;
      write();
      statusEl.textContent = t("doneWithCount").replace("{count}", charCount);
      statusEl.className = "cnode-status success";
      if (copyOutIcon) copyOutIcon.classList.add("visible");
    } catch (err) {
      if (err.name === "AbortError") {
        statusEl.textContent = t("cancelled");
        statusEl.className = "cnode-status";
      } else {
        let errMsg = err.message || String(err);
        if (errMsg.includes("Failed to fetch") || errMsg.includes("Load failed") || errMsg.includes("NetworkError")) {
          errMsg = "网络连接失败，请检查网络或 API 地址是否正确";
        }
        statusEl.textContent = t("genFailed") + errMsg;
        statusEl.className = "cnode-status error";
      }
    } finally {
      // Restore play button
      btn.classList.remove("running");
      btn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';
      btn.disabled = false;
      nodeAbortController = null;
    }
  }

  // ── Auto layout ──

  function autoLayout() {
    if (nodes.length === 0) return;

    const sampleEl = nodesEl.querySelector(".cnode:not(.cnode-start):not(.cnode-end)");
    const NODE_W = sampleEl ? sampleEl.offsetWidth : 260;
    const NODE_H = sampleEl ? sampleEl.offsetHeight : 180;
    const GAP_X = 50;
    const GAP_Y = 30;
    const PAD = CANVAS_PAD;

    const startNode = nodes.find((n) => n.cardId === "__start__");
    const regularNodes = nodes.filter((n) => n.cardId !== "__start__" && n.cardId !== "__end__");

    // Topological sort for regular nodes
    const childrenOf = new Map();
    const parentCount = new Map();
    regularNodes.forEach((n) => { childrenOf.set(n.id, []); parentCount.set(n.id, 0); });
    edges.forEach((e) => {
      if (childrenOf.has(e.from) && parentCount.has(e.to)) {
        childrenOf.get(e.from).push(e.to);
        parentCount.set(e.to, parentCount.get(e.to) + 1);
      }
    });

    const layerOf = new Map();
    const queue = [];
    regularNodes.forEach((n) => {
      if (parentCount.get(n.id) === 0) { queue.push(n.id); layerOf.set(n.id, 0); }
    });
    while (queue.length > 0) {
      const cur = queue.shift();
      const curLayer = layerOf.get(cur);
      for (const childId of (childrenOf.get(cur) || [])) {
        const newLayer = curLayer + 1;
        const prev = layerOf.get(childId);
        if (prev === undefined || newLayer > prev) layerOf.set(childId, newLayer);
        const remaining = parentCount.get(childId) - 1;
        parentCount.set(childId, remaining);
        if (remaining === 0) queue.push(childId);
      }
    }
    regularNodes.forEach((n) => { if (!layerOf.has(n.id)) layerOf.set(n.id, 0); });

    // Group regular nodes by layer
    let maxRegLayer = 0;
    layerOf.forEach((l) => { if (l > maxRegLayer) maxRegLayer = l; });
    const regLayers = new Map();
    for (let i = 0; i <= maxRegLayer; i++) regLayers.set(i, []);
    regularNodes.forEach((n) => regLayers.get(layerOf.get(n.id)).push(n));

    // Sort nodes within each layer by parent x position
    const childParentXs = new Map();
    edges.forEach((e) => {
      if (!layerOf.has(e.from) || !layerOf.has(e.to)) return;
      const fromNode = nodes.find((n) => n.id === e.from);
      if (!fromNode) return;
      if (!childParentXs.has(e.to)) childParentXs.set(e.to, []);
      childParentXs.get(e.to).push(fromNode.x);
    });
    for (let i = 0; i <= maxRegLayer; i++) {
      regLayers.get(i).sort((a, b) => {
        const ax = childParentXs.has(a.id) ? childParentXs.get(a.id).reduce((s, v) => s + v, 0) / childParentXs.get(a.id).length : a.x;
        const bx = childParentXs.has(b.id) ? childParentXs.get(b.id).reduce((s, v) => s + v, 0) / childParentXs.get(b.id).length : b.x;
        return ax - bx;
      });
    }

    // Position regular nodes — left-aligned with start node
    const startX = startNode ? startNode.x : 16;
    const startY = startNode ? startNode.y : 16;
    const startH = 56;
    const startGap = GAP_Y;
    for (let i = 0; i <= maxRegLayer; i++) {
      const row = regLayers.get(i);
      if (row.length === 0) continue;
      const y = startY + startH + startGap + i * (NODE_H + GAP_Y);
      const z = (maxRegLayer + 1 - i) * 10;
      row.forEach((n, col) => {
        n.x = startX + col * (NODE_W + GAP_X);
        n.y = y;
        const el = nodesEl.querySelector(`[data-node-id="${n.id}"]`);
        if (el) el.style.zIndex = z;
      });
    }

    // Position start node: above first row, centered
    if (startNode) {
      startNode.x = 16;
      startNode.y = 16;
      const startEl = nodesEl.querySelector(`[data-node-id="${startNode.id}"]`);
      if (startEl) startEl.style.zIndex = (maxRegLayer + 2) * 10;
    }

    // Rebuild edges: remove old start edges, create clean connections
    if (startNode) {
      edges = edges.filter((e) => e.from !== startNode.id);

      if (regularNodes.length > 0) {
        // Compute root nodes (no incoming from regular nodes)
        const regHasIncoming = new Set();
        edges.forEach((e) => {
          if (regularNodes.some((n) => n.id === e.to)) regHasIncoming.add(e.to);
        });

        // Start → root nodes
        regularNodes.forEach((n) => {
          if (!regHasIncoming.has(n.id)) {
            edges.push({ id: "e" + nextId++, from: startNode.id, fromSide: "bottom", to: n.id, toSide: "top" });
          }
        });
      }
    }

    write();
    render(); // render() calls resizeCanvas()
  }

  function layoutPipeline(pipelineNodes, titleToId, startNode) {
    const sampleEl = nodesEl ? nodesEl.querySelector(".cnode:not(.cnode-start)") : null;
    const NODE_W = sampleEl ? sampleEl.offsetWidth : 260;
    const NODE_H = sampleEl ? sampleEl.offsetHeight : 180;
    const GAP_X = 60;
    const GAP_Y = 100;
    const START_Y = CANVAS_PAD + 30;

    const levels = new Map();
    pipelineNodes.forEach(({ node, step }) => {
      const lv = step.level != null ? step.level : 0;
      if (!levels.has(lv)) levels.set(lv, []);
      levels.get(lv).push(node);
    });

    const sortedLevels = [...levels.keys()].sort((a, b) => a - b);
    const maxW = sortedLevels.length > 0
      ? Math.max(...sortedLevels.map(lv => levels.get(lv).length * NODE_W + (levels.get(lv).length - 1) * GAP_X))
      : NODE_W;

    sortedLevels.forEach((lv, i) => {
      const row = levels.get(lv);
      const rowW = row.length * NODE_W + (row.length - 1) * GAP_X;
      const startX = CANVAS_PAD + (maxW - rowW) / 2;
      row.forEach((n, col) => {
        n.x = startX + col * (NODE_W + GAP_X);
        n.y = START_Y + i * (NODE_H + GAP_Y);
      });
    });

    const centerX = CANVAS_PAD + maxW / 2;
    const SE_W = 56;
    const SE_H = 56;
    if (startNode) {
      startNode.x = centerX - SE_W / 2;
      startNode.y = START_Y - GAP_Y - SE_H;
    }
  }

  function buildPipelineEdges(pipeline, nodeMap, titleToId) {
    pipeline.forEach((step, i) => {
      const nodeId = nodeMap[i];
      if (!nodeId) return;

      if (step.dependsOn && step.dependsOn.length > 0) {
        step.dependsOn.forEach((ref) => {
          let parentId = null;
          if (typeof ref === "number") {
            parentId = nodeMap[ref];
          } else {
            const parentCardId = titleToId.get(ref) || ref;
            for (const [idx, nid] of nodeMap.entries()) {
              const card = nodes.find(n => n.id === nid);
              if (card && card.cardId === parentCardId) { parentId = nid; break; }
            }
          }
          if (parentId && parentId !== nodeId) {
            edges.push({ id: "e" + nextId++, from: parentId, fromSide: "bottom", to: nodeId, toSide: "top" });
          }
        });
      } else if (i > 0) {
        edges.push({ id: "e" + nextId++, from: nodeMap[i - 1], fromSide: "bottom", to: nodeId, toSide: "top" });
      }
    });
  }

  function addPipeline(pipeline) {
    saveUndo();
    const titleToId = new Map();
    allItemsMap.forEach((card, id) => {
      if (card && card.title) titleToId.set(card.title, id);
    });

    // Reuse existing start/end nodes (created by clear → ensureStartEndNodes)
    let startNode = nodes.find((n) => n.cardId === "__start__");

    // Remove old edges from start
    if (startNode) edges = edges.filter((e) => e.from !== startNode.id);

    const pipelineNodes = [];
    const nodeMap = [];

    pipeline.forEach((step, i) => {
      const cardId = titleToId.get(step.title) || step.title;
      const node = { id: "n" + nextId++, cardId, x: 0, y: 0, subtitle: step.label };
      nodes.push(node);
      nodesEl.appendChild(buildNodeEl(node));
      pipelineNodes.push({ node, step });
      nodeMap.push(node.id);
    });

    // Build edges between pipeline cards
    buildPipelineEdges(pipeline, nodeMap, titleToId);

    // Connect start to root nodes (no incoming edges)
    if (startNode) {
      const hasIncoming = new Set();
      edges.forEach((e) => hasIncoming.add(e.to));
      nodeMap.forEach((nid) => {
        if (!hasIncoming.has(nid)) {
          edges.push({ id: "e" + nextId++, from: startNode.id, fromSide: "bottom", to: nid, toSide: "top" });
        }
      });
    }

    // Compute levels from DAG
    const allNodeIds = [startNode?.id, ...nodeMap].filter(Boolean);
    const childrenOf = new Map();
    const parentCount = new Map();
    allNodeIds.forEach((id) => { childrenOf.set(id, []); parentCount.set(id, 0); });
    edges.forEach((e) => {
      if (childrenOf.has(e.from) && parentCount.has(e.to)) {
        childrenOf.get(e.from).push(e.to);
        parentCount.set(e.to, parentCount.get(e.to) + 1);
      }
    });
    const levelMap = new Map();
    const queue = [];
    allNodeIds.forEach((id) => {
      if (parentCount.get(id) === 0) { queue.push(id); levelMap.set(id, 0); }
    });
    while (queue.length > 0) {
      const cur = queue.shift();
      const curLevel = levelMap.get(cur);
      for (const childId of (childrenOf.get(cur) || [])) {
        const newLevel = curLevel + 1;
        const prev = levelMap.get(childId);
        if (prev === undefined || newLevel > prev) levelMap.set(childId, newLevel);
        const remaining = parentCount.get(childId) - 1;
        parentCount.set(childId, remaining);
        if (remaining === 0) queue.push(childId);
      }
    }

    pipelineNodes.forEach(({ node, step }) => {
      step.level = levelMap.get(node.id) || 0;
    });
    if (startNode) startNode._level = levelMap.get(startNode.id) || 0;

    layoutPipeline(pipelineNodes, titleToId, startNode);

    write();
    render();
  }

  function addPipelineAnimated(pipeline, onDone) {
    const titleToId = new Map();
    allItemsMap.forEach((card, id) => {
      if (card && card.title) titleToId.set(card.title, id);
    });

    // Reuse existing start/end nodes
    let startNode = nodes.find((n) => n.cardId === "__start__");

    // Remove old edges from start
    if (startNode) edges = edges.filter((e) => e.from !== startNode.id);

    // Create all pipeline nodes
    const nodeMap = [];
    const pipelineNodes = [];
    pipeline.forEach((step, i) => {
      const cardId = titleToId.get(step.title) || step.title;
      const node = { id: "n" + nextId++, cardId, x: 0, y: 0, subtitle: step.label };
      nodes.push(node);
      nodeMap.push(node.id);
      pipelineNodes.push({ node, step });
    });

    // Build edges
    const animEdges = [];
    pipeline.forEach((step, i) => {
      const nodeId = nodeMap[i];
      if (!nodeId) return;
      if (step.dependsOn && step.dependsOn.length > 0) {
        step.dependsOn.forEach((ref) => {
          let parentId = typeof ref === "number" ? nodeMap[ref] : null;
          if (parentId && parentId !== nodeId) {
            animEdges.push({ id: "e" + nextId++, from: parentId, fromSide: "bottom", to: nodeId, toSide: "top" });
          }
        });
      } else if (i > 0) {
        animEdges.push({ id: "e" + nextId++, from: nodeMap[i - 1], fromSide: "bottom", to: nodeId, toSide: "top" });
      }
    });

    // Connect start to root nodes
    if (startNode) {
      const hasIncoming = new Set();
      animEdges.forEach((e) => hasIncoming.add(e.to));
      nodeMap.forEach((nid) => {
        if (!hasIncoming.has(nid)) {
          animEdges.push({ id: "e" + nextId++, from: startNode.id, fromSide: "bottom", to: nid, toSide: "top" });
        }
      });
    }

    // Compute levels from DAG
    const allNodeIds = [startNode?.id, ...nodeMap].filter(Boolean);
    const childrenOf = new Map();
    const parentCount = new Map();
    allNodeIds.forEach((id) => { childrenOf.set(id, []); parentCount.set(id, 0); });
    animEdges.forEach((e) => {
      if (childrenOf.has(e.from) && parentCount.has(e.to)) {
        childrenOf.get(e.from).push(e.to);
        parentCount.set(e.to, parentCount.get(e.to) + 1);
      }
    });
    const levelMap = new Map();
    const queue = [];
    allNodeIds.forEach((id) => {
      if (parentCount.get(id) === 0) { queue.push(id); levelMap.set(id, 0); }
    });
    while (queue.length > 0) {
      const cur = queue.shift();
      const curLevel = levelMap.get(cur);
      for (const childId of (childrenOf.get(cur) || [])) {
        const newLevel = curLevel + 1;
        const prev = levelMap.get(childId);
        if (prev === undefined || newLevel > prev) levelMap.set(childId, newLevel);
        const remaining = parentCount.get(childId) - 1;
        parentCount.set(childId, remaining);
        if (remaining === 0) queue.push(childId);
      }
    }

    // Apply computed levels
    if (startNode) startNode._level = levelMap.get(startNode.id) || 0;
    pipelineNodes.forEach(({ node, step }) => {
      step.level = levelMap.get(node.id) || 0;
    });

    layoutPipeline(pipelineNodes, titleToId, startNode);

    // Animation order: start node, then pipeline nodes by level, then end node
    const levelGroups = new Map();
    pipelineNodes.forEach(({ node, step }, i) => {
      const lv = step.level;
      if (!levelGroups.has(lv)) levelGroups.set(lv, []);
      levelGroups.get(lv).push(i);
    });
    const sortedLevels = [...levelGroups.keys()].sort((a, b) => a - b);
    const animOrder = sortedLevels.flatMap(lv => levelGroups.get(lv));

    // Save full state immediately
    write();

    // Animate: start → pipeline nodes by level → end
    const shownNodes = new Set();
    let idx = -1; // -1 = start node
    function showNext() {
      if (idx === -1) {
        nodesEl.appendChild(buildNodeEl(startNode));
        shownNodes.add(startNode.id);
        resizeCanvas();
        idx++;
        setTimeout(showNext, 200);
        return;
      }
      if (idx >= animOrder.length) {
        animEdges.forEach((e) => edges.push(e));
        resizeCanvas();
        render();
        if (onDone) onDone();
        return;
      }
      const origIdx = animOrder[idx];
      const node = pipelineNodes[origIdx].node;
      nodesEl.appendChild(buildNodeEl(node));
      shownNodes.add(node.id);

      animEdges.forEach((e) => {
        if (shownNodes.has(e.from) && shownNodes.has(e.to)) {
          const existing = arrowsEl.querySelector(`[data-edge-id="${e.id}"]`);
          if (!existing) arrowsEl.appendChild(buildEdgeEl(e));
        }
      });

      resizeCanvas();
      idx++;
      setTimeout(showNext, 350);
    }
    showNext();
  }

  function getState() {
    return { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)), nextId };
  }

  function loadState(saved) {
    nodes = saved.nodes || [];
    edges = saved.edges || [];
    nextId = saved.nextId || 1;
    selectedNodeId = null;
    selectedEdgeId = null;
    write();
    render();
  }

  function getNodeById(id) {
    return nodes.find((n) => n.id === id) || null;
  }

  function updateNodeOutput(nodeId, output) {
    const node = nodes.find((n) => n.id === nodeId);
    if (node) {
      node.outputValue = output;
      write();
    }
  }

  function lightBulb() {
    const startNode = nodes.find((n) => n.cardId === "__start__");
    if (!startNode) return;
    const el = nodesEl.querySelector(`[data-node-id="${startNode.id}"]`);
    if (el) { el.classList.remove("bulb-pulsing"); el.classList.add("bulb-lit"); }
  }

  function dimBulb() {
    const startNode = nodes.find((n) => n.cardId === "__start__");
    if (!startNode) return;
    const el = nodesEl.querySelector(`[data-node-id="${startNode.id}"]`);
    if (el) { el.classList.remove("bulb-lit", "bulb-pulsing"); }
  }

  function pulseBulb() {
    const startNode = nodes.find((n) => n.cardId === "__start__");
    if (!startNode) return;
    const el = nodesEl.querySelector(`[data-node-id="${startNode.id}"]`);
    if (el) { el.classList.remove("bulb-lit"); el.classList.add("bulb-pulsing"); }
  }

  function setEdgeClass(edgeId, cls) {
    if (!arrowsEl) return;
    arrowsEl.querySelectorAll(`[data-edge-id="${edgeId}"] .cedge`).forEach((p) => {
      p.classList.remove("running", "done");
      if (cls) p.classList.add(cls);
    });
  }

  function clearEdgeClasses() {
    if (!arrowsEl) return;
    arrowsEl.querySelectorAll(".cedge.running, .cedge.done").forEach((p) => {
      p.classList.remove("running", "done");
    });
  }

  return { init, addNode, clear, setAllItems, autoLayout, addPipeline, addPipelineAnimated, getState, loadState, getNodeById, updateNodeOutput, render, lightBulb, dimBulb, pulseBulb, setEdgeClass, clearEdgeClasses };
})();
