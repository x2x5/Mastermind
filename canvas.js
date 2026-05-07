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

  // ── Init ──

  function init(cardsByCategory, onReorder, onAddCard, onAddStage, onDeleteStage, trashData, onRestoreStage, onEmptyTrash) {
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
      inited = true;
    }
    ensureStartEndNodes();
    buildDrawer(cardsByCategory, onReorder, onAddCard, onAddStage, onDeleteStage, trashData, onRestoreStage, onEmptyTrash);
    render();
    if (firstInit && nodes.length > 0) {
      autoLayout();
    }
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

    // Shift all nodes if any have negative coordinates
    let shiftX = 0, shiftY = 0;
    if (minX < CANVAS_PAD || minY < CANVAS_PAD) {
      shiftX = minX < CANVAS_PAD ? CANVAS_PAD - minX : 0;
      shiftY = minY < CANVAS_PAD ? CANVAS_PAD - minY : 0;
      nodes.forEach((n) => { n.x += shiftX; n.y += shiftY; });
      // Update DOM positions
      nodes.forEach((n) => {
        const el = nodesEl.querySelector(`[data-node-id="${n.id}"]`);
        if (el) { el.style.left = n.x + "px"; el.style.top = n.y + "px"; }
      });
      maxX += shiftX;
      maxY += shiftY;
      write();
    }

    const w = Math.max(vw, maxX + CANVAS_PAD);
    const h = Math.max(vh, maxY + CANVAS_PAD);
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
    // Start/End nodes: card-shaped with title
    if (n.cardId === "__start__" || n.cardId === "__end__") {
      const isStart = n.cardId === "__start__";
      const el = document.createElement("div");
      el.className = "cnode " + (isStart ? "cnode-start" : "cnode-end");
      if (n.id === selectedNodeId) el.classList.add("selected");
      el.dataset.nodeId = n.id;
      el.style.cssText = `left:${n.x}px;top:${n.y}px;`;

      // Connectors
      ["top", "bottom"].forEach((side) => {
        const c = document.createElement("div");
        c.className = "cnode-connector cnode-conn-" + side;
        c.dataset.nodeId = n.id;
        c.dataset.side = side;
        el.appendChild(c);
      });

      // Title
      const title = document.createElement("div");
      title.className = "cnode-se-title";
      title.textContent = isStart ? t("startNode") : t("endNode");
      el.appendChild(title);

      // Play button (start only)
      if (isStart) {
        const playBtn = document.createElement("button");
        playBtn.className = "cnode-start-play";
        playBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';
        playBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          if (typeof runPipelineFromStart === "function") runPipelineFromStart();
        });
        el.appendChild(playBtn);
      }

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
    const usageCount = (typeof getUsageCount === "function") ? getUsageCount(n.cardId) : 0;

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

    // Top bar: stage label on bottom border
    const topBar = document.createElement("div");
    topBar.className = "cnode-topbar";
    if (stageColor) {
      topBar.style.setProperty("--stage-color", stageColor);
    }
    const stageLabel = document.createElement("span");
    stageLabel.className = "cnode-stage-label";
    // Translate stage name if it's a known stage
    const stageI18nMap = {
      "阶段 1：调研选题": "stage1",
      "阶段 2：构思 Idea": "stage2",
      "阶段 3：设计方法": "stage3",
      "阶段 4：执行实验": "stage4",
      "阶段 5：写论文": "stage5",
      "阶段 6：审稿修改": "stage6",
      "阶段 7：准备投稿": "stage7",
    };
    const i18nKey = stageI18nMap[category];
    stageLabel.textContent = i18nKey ? t(i18nKey) : (category || t("uncategorized"));
    if (stageColor) {
      stageLabel.style.color = stageColor;
    }
    topBar.append(stageLabel);

    // Usage badge — top-right corner
    const usageBadge = document.createElement("span");
    usageBadge.className = "cnode-usage";
    if (usageCount > 0) {
      usageBadge.textContent = usageCount;
    } else {
      usageBadge.style.display = "none";
    }

    // Title
    const titleEl = document.createElement("div");
    titleEl.className = "cnode-title";
    titleEl.textContent = title;

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

    // Row 1: [查看模板] [复制输入]
    const inputActions = document.createElement("div");
    inputActions.className = "cnode-actions";

    const copyInputBtn = document.createElement("button");
    copyInputBtn.className = "cnode-copy-btn";
    copyInputBtn.type = "button";
    copyInputBtn.textContent = t("copyInput");
    copyInputBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const merged = mergePromptAndInput(prompt, textarea.value);
      if (textarea.value.trim()) {
        const nextCount = incrementUsageCount(n.cardId, { skipRender: true });
        usageBadge.textContent = nextCount;
        usageBadge.style.display = "";
      }
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

    // Output area
    const outputLabel = document.createElement("div");
    outputLabel.className = "cnode-output-label";
    outputLabel.textContent = t("outputLabel");

    const outputArea = document.createElement("textarea");
    outputArea.className = "cnode-textarea cnode-output";
    outputArea.placeholder = t("outputPlaceholder");
    outputArea.value = outputValue;
    outputArea.addEventListener("input", () => {
      n.outputValue = outputArea.value;
      write();
    });
    outputArea.addEventListener("mousedown", (e) => e.stopPropagation());

    // Row 2: [生成输出] [复制输出]
    const outputActions = document.createElement("div");
    outputActions.className = "cnode-actions";

    const apiBtn = document.createElement("button");
    apiBtn.className = "cnode-copy-btn cnode-api-btn";
    apiBtn.type = "button";
    apiBtn.textContent = t("genOutput");
    apiBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      await handleNodeApiCall(n, prompt, textarea, outputArea, apiBtn, statusEl);
    });
    apiBtn.addEventListener("mousedown", (e) => e.stopPropagation());

    const copyOutputBtn = document.createElement("button");
    copyOutputBtn.className = "cnode-copy-btn";
    copyOutputBtn.type = "button";
    copyOutputBtn.textContent = t("copyOutput");
    copyOutputBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      navigator.clipboard.writeText(outputArea.value).then(() => {
        copyOutputBtn.textContent = t("copied");
        setTimeout(() => { copyOutputBtn.textContent = t("copyOutput"); }, 1500);
      }).catch(() => {
        copyOutputBtn.textContent = t("copyFailed");
        setTimeout(() => { copyOutputBtn.textContent = t("copyOutput"); }, 1500);
      });
    });
    copyOutputBtn.addEventListener("mousedown", (e) => e.stopPropagation());

    outputActions.append(apiBtn, copyOutputBtn);

    // Status
    const statusEl = document.createElement("div");
    statusEl.className = "cnode-status";

    el.append(titleEl, subtitleEl, textarea, inputActions, preview, outputLabel, outputArea, outputActions, statusEl, topBar, usageBadge);

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
      const conn = e.target.closest(".cnode-connector");
      if (conn) {
        startEdgeDraw(conn, e);
        return;
      }
      // Don't start drag when clicking on interactive elements inside nodes
      if (e.target.closest("textarea") || e.target.closest("input") || e.target.closest("button")) {
        return;
      }
      const nodeEl = e.target.closest(".cnode");
      if (nodeEl) {
        startNodeDrag(nodeEl, e);
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

    // Edge click / canvas click
    canvasEl.addEventListener("click", (e) => {
      // Don't steal focus from interactive elements inside nodes
      if (e.target.closest("textarea") || e.target.closest("input") || e.target.closest("button")) {
        return;
      }

      const rect = canvasEl.getBoundingClientRect();
      const cx = e.clientX - rect.left + canvasEl.scrollLeft;
      const cy = e.clientY - rect.top + canvasEl.scrollTop;

      // Check if click is near any edge line (prioritize edge over node)
      const EDGE_SNAP = 12;
      let closestEdge = null, closestEdgeDist = Infinity;
      edges.forEach((ed) => {
        const from = nodes.find((n) => n.id === ed.from);
        const to = nodes.find((n) => n.id === ed.to);
        if (!from || !to) return;
        const p1 = getConnectorPos(from, ed.fromSide || "bottom");
        const p2 = getConnectorPos(to, ed.toSide || "top");
        // Approximate: distance to line segment
        const dx = p2.x - p1.x, dy = p2.y - p1.y;
        const lenSq = dx * dx + dy * dy;
        let t = lenSq > 0 ? ((cx - p1.x) * dx + (cy - p1.y) * dy) / lenSq : 0;
        t = Math.max(0, Math.min(1, t));
        const px = p1.x + t * dx, py = p1.y + t * dy;
        const dist = Math.hypot(cx - px, cy - py);
        if (dist < closestEdgeDist) { closestEdgeDist = dist; closestEdge = ed; }
      });

      // Also check if directly on an SVG edge element
      const edgeEl = e.target.closest("[data-edge-id]");
      const onSvgEdge = edgeEl && arrowsEl.contains(edgeEl);

      if (onSvgEdge || (closestEdge && closestEdgeDist < EDGE_SNAP)) {
        e.stopPropagation();
        selectEdge(onSvgEdge ? edgeEl.dataset.edgeId : closestEdge.id);
        return;
      }

      const nodeEl = e.target.closest(".cnode");
      if (nodeEl) {
        e.stopPropagation();
        selectNode(nodeEl.dataset.nodeId);
        canvasEl.focus();
        return;
      }
      if (e.target.closest(".cedge-handle")) return; // don't clear when clicking handles
      // Click on empty canvas → clear selection
      clearSelection();
    });

    // Canvas focus
    canvasEl.addEventListener("mousedown", (e) => {
      if (!e.target.closest(".cnode")) canvasEl.focus();
    });
  }

  // ── Node drag ──

  function startNodeDrag(nodeEl, e) {
    const n = nodes.find((nd) => nd.id === nodeEl.dataset.nodeId);
    if (!n) return;
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
    const endNode = nodes.find((n) => n.cardId === "__end__");
    if (!startNode || !endNode) return;

    // Find start→end edge
    const seIdx = edges.findIndex((e) => e.from === startNode.id && e.to === endNode.id);
    if (seIdx < 0) return;

    const getPos = (node, side) => {
      const el = nodesEl.querySelector(`[data-node-id="${node.id}"]`);
      const w = el ? el.offsetWidth : 260;
      const h = el ? el.offsetHeight : 60;
      if (side === "bottom") return { x: node.x + w / 2, y: node.y + h };
      return { x: node.x + w / 2, y: node.y };
    };

    const p1 = getPos(startNode, "bottom");
    const p2 = getPos(endNode, "top");

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
      edges.push({ id: "e" + nextId++, from: dropped.id, fromSide: "bottom", to: endNode.id, toSide: "top" });
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

    const edgeGroup = arrowsEl.querySelector(`g[data-edge-id="${edgeId}"]`);
    if (edgeGroup) edgeGroup.style.display = "none";

    dragState = { type: "edgeHandle", edgeId, end, line, origEdge: { ...edge } };
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

    // Hide the edge group being dragged
    const edgeGroup = arrowsEl.querySelector(`g[data-edge-id="${edgeId}"]`);
    if (edgeGroup) edgeGroup.style.display = "none";

    dragState = { type: "edgeHandle", edgeId, end, line, origEdge: { ...edge } };
  }

  function edgeHandleDragMove(e) {
    const d = dragState;
    if (!d || d.type !== "edgeHandle") return;
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
      // Click without drag → spawn at visible canvas center
      const pos = getVisibleCanvasCenter();
      addNode(d.cardId, pos.x, pos.y);
    }
    drawerDrag = null;
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
      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedNodeId) {
          e.preventDefault();
          nodes = nodes.filter((n) => n.id !== selectedNodeId);
          edges = edges.filter((ed) => ed.from !== selectedNodeId && ed.to !== selectedNodeId);
          const el = nodesEl.querySelector(`[data-node-id="${selectedNodeId}"]`);
          if (el) el.remove();
          selectedNodeId = null;
          write();
          refreshEdges();
        } else if (selectedEdgeId) {
          e.preventDefault();
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
    const hasEnd = nodes.some((n) => n.cardId === "__end__");

    if (!hasStart) {
      nodes.push({ id: "n" + nextId++, cardId: "__start__", x: CANVAS_PAD, y: CANVAS_PAD, subtitle: "" });
    }
    if (!hasEnd) {
      nodes.push({ id: "n" + nextId++, cardId: "__end__", x: CANVAS_PAD, y: CANVAS_PAD + 180, subtitle: "" });
    }

    const startNode = nodes.find((n) => n.cardId === "__start__");
    const endNode = nodes.find((n) => n.cardId === "__end__");
    if (!startNode || !endNode) return;

    const hasEdge = (fromId, toId) => edges.some((e) => e.from === fromId && e.to === toId);
    const hasOutgoing = new Set();
    edges.forEach((e) => hasOutgoing.add(e.from));

    // Connect leaf nodes (no outgoing) to end
    nodes.forEach((n) => {
      if (n.cardId === "__start__" || n.cardId === "__end__") return;
      if (!hasOutgoing.has(n.id) && !hasEdge(n.id, endNode.id)) {
        edges.push({ id: "e" + nextId++, from: n.id, fromSide: "bottom", to: endNode.id, toSide: "top" });
      }
    });

    // If start has no outgoing edges, connect to end
    if (!hasOutgoing.has(startNode.id) && !hasEdge(startNode.id, endNode.id)) {
      edges.push({ id: "e" + nextId++, from: startNode.id, fromSide: "bottom", to: endNode.id, toSide: "top" });
    }
  }

  // ── Add / Clear ──

  function addNode(cardId, x, y) {
    const node = { id: "n" + nextId++, cardId, x: x || 100, y: y || 100, subtitle: "" };
    nodes.push(node);
    nodesEl.appendChild(buildNodeEl(node));
    write();
    resizeCanvas();
  }

  function clear() {
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

  function buildDrawer(cardsByCategory, onReorder, onAddCard, onAddStage, onDeleteStage, trashData, onRestoreStage, onEmptyTrash) {
    if (!drawerRoot) return;
    drawerRoot.innerHTML = "";
    drawerReorderCallback = onReorder || null;
    drawerAddCardCallback = onAddCard || null;
    drawerAddStageCallback = onAddStage || null;
    drawerDeleteStageCallback = onDeleteStage || null;
    drawerRestoreStageCallback = onRestoreStage || null;
    drawerEmptyTrashCallback = onEmptyTrash || null;

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
        item.textContent = translatedTitle;
        det.appendChild(item);
      });
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

  async function handleNodeApiCall(node, promptTemplate, inputEl, outputEl, btn, statusEl) {
    const cfg = typeof getApiConfig === "function" ? getApiConfig() : null;
    if (!cfg || !cfg.apiKey) {
      statusEl.textContent = t("configApiInPanel");
      statusEl.className = "cnode-status error";
      return;
    }

    const userText = inputEl.value.trim();
    const merged = mergePromptAndInput(promptTemplate, userText);

    if (nodeAbortController) nodeAbortController.abort();
    nodeAbortController = new AbortController();

    btn.innerHTML = '<span class="spinner"></span>' + t("generatingSpinner");
    btn.disabled = true;
    outputEl.value = "";
    statusEl.textContent = t("connecting");
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
        statusEl.textContent = t("generatingWithCount").replace("{count}", charCount);
        statusEl.className = "cnode-status";
      }, nodeAbortController.signal);
      node.outputValue = fullText;
      write();
      statusEl.textContent = t("doneWithCount").replace("{count}", charCount);
      statusEl.className = "cnode-status success";
    } catch (err) {
      if (err.name === "AbortError") {
        statusEl.textContent = t("cancelled");
        statusEl.className = "cnode-status";
      } else {
        statusEl.textContent = t("genFailed") + err.message;
        statusEl.className = "cnode-status error";
      }
    } finally {
      btn.textContent = t("genOutput");
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
    const GAP_Y = 100;
    const PAD = CANVAS_PAD;

    const startNode = nodes.find((n) => n.cardId === "__start__");
    const endNode = nodes.find((n) => n.cardId === "__end__");
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

    // Position regular nodes
    const maxRowW = Math.max(...[...regLayers.values()].map(r => r.length * NODE_W + (r.length - 1) * GAP_X), NODE_W);
    const centerX = PAD + maxRowW / 2;
    for (let i = 0; i <= maxRegLayer; i++) {
      const row = regLayers.get(i);
      if (row.length === 0) continue;
      const rowW = row.length * NODE_W + (row.length - 1) * GAP_X;
      const ox = centerX - rowW / 2;
      const y = PAD + i * (NODE_H + GAP_Y);
      row.forEach((n, col) => { n.x = ox + col * (NODE_W + GAP_X); n.y = y; });
    }

    // Position start node: above first row, centered
    const SE_W = 120;
    const startEl = startNode ? nodesEl.querySelector(`[data-node-id="${startNode.id}"]`) : null;
    const SE_H = startEl ? startEl.offsetHeight : 50;
    if (startNode) {
      startNode.x = centerX - SE_W / 2;
      startNode.y = PAD - GAP_Y - SE_H;
    }

    // Position end node: below last row, centered
    if (endNode) {
      const lastRowY = maxRegLayer >= 0 ? PAD + maxRegLayer * (NODE_H + GAP_Y) + NODE_H : PAD;
      endNode.x = centerX - SE_W / 2;
      endNode.y = lastRowY + GAP_Y;
    }

    // Rebuild edges: remove old start/end edges, create clean connections
    if (startNode || endNode) {
      edges = edges.filter((e) => {
        if (startNode && e.from === startNode.id) return false;
        if (endNode && e.to === endNode.id) return false;
        return true;
      });

      if (regularNodes.length === 0) {
        // No cards: just start → end
        if (startNode && endNode) {
          edges.push({ id: "e" + nextId++, from: startNode.id, fromSide: "bottom", to: endNode.id, toSide: "top" });
        }
      } else {
        // Compute root/leaf from regular-to-regular edges only
        const regHasIncoming = new Set();
        const regHasOutgoing = new Set();
        edges.forEach((e) => {
          const fromReg = regularNodes.some((n) => n.id === e.from);
          const toReg = regularNodes.some((n) => n.id === e.to);
          if (fromReg) regHasOutgoing.add(e.from);
          if (toReg) regHasIncoming.add(e.to);
        });

        // Start → root nodes (no incoming from regular nodes)
        if (startNode) {
          regularNodes.forEach((n) => {
            if (!regHasIncoming.has(n.id)) {
              edges.push({ id: "e" + nextId++, from: startNode.id, fromSide: "bottom", to: n.id, toSide: "top" });
            }
          });
        }
        // Leaf nodes (no outgoing to regular nodes) → end
        if (endNode) {
          regularNodes.forEach((n) => {
            if (!regHasOutgoing.has(n.id)) {
              edges.push({ id: "e" + nextId++, from: n.id, fromSide: "bottom", to: endNode.id, toSide: "top" });
            }
          });
        }
      }
    }

    write();
    render(); // render() calls resizeCanvas()

    // Scroll so first row is near the top, left edge visible
    const scrollEl = canvasEl ? canvasEl.closest(".layout2-canvas-scroll") : null;
    if (scrollEl && startNode) {
      scrollEl.scrollTo(
        Math.max(0, startNode.x - 40),
        Math.max(0, startNode.y - 40)
      );
    }
  }

  function layoutPipeline(pipelineNodes, titleToId, startNode, endNode) {
    const sampleEl = nodesEl ? nodesEl.querySelector(".cnode") : null;
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
    const lastLevelY = sortedLevels.length > 0
      ? START_Y + (sortedLevels.length - 1) * (NODE_H + GAP_Y)
      : START_Y;
    const SE_W = 120;

    const startEl = startNode ? nodesEl.querySelector(`[data-node-id="${startNode.id}"]`) : null;
    const SE_H = startEl ? startEl.offsetHeight : 50;
    if (startNode) {
      startNode.x = centerX - SE_W / 2;
      startNode.y = START_Y - GAP_Y - SE_H;
    }
    if (endNode) {
      endNode.x = centerX - SE_W / 2;
      endNode.y = lastLevelY + NODE_H + GAP_Y;
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
    const titleToId = new Map();
    allItemsMap.forEach((card, id) => {
      if (card && card.title) titleToId.set(card.title, id);
    });

    // Reuse existing start/end nodes (created by clear → ensureStartEndNodes)
    let startNode = nodes.find((n) => n.cardId === "__start__");
    let endNode = nodes.find((n) => n.cardId === "__end__");

    // Remove old edges connected to start/end
    edges = edges.filter((e) => {
      if (startNode && e.from === startNode.id) return false;
      if (endNode && e.to === endNode.id) return false;
      return true;
    });

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

    // Connect leaf nodes (no outgoing edges) to end
    if (endNode) {
      const hasOutgoing = new Set();
      edges.forEach((e) => hasOutgoing.add(e.from));
      nodeMap.forEach((nid) => {
        if (!hasOutgoing.has(nid)) {
          edges.push({ id: "e" + nextId++, from: nid, fromSide: "bottom", to: endNode.id, toSide: "top" });
        }
      });
    }

    // Compute levels from DAG
    const allNodeIds = [startNode?.id, ...nodeMap, endNode?.id].filter(Boolean);
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
    if (endNode) endNode._level = levelMap.get(endNode.id) || 0;

    layoutPipeline(pipelineNodes, titleToId, startNode, endNode);

    write();
    render();

    const scrollEl = canvasEl ? canvasEl.closest(".layout2-canvas-scroll") : null;
    if (scrollEl && startNode) {
      scrollEl.scrollTo(Math.max(0, startNode.x - 40), Math.max(0, startNode.y - 40));
    }
  }

  function addPipelineAnimated(pipeline, onDone) {
    const titleToId = new Map();
    allItemsMap.forEach((card, id) => {
      if (card && card.title) titleToId.set(card.title, id);
    });

    // Reuse existing start/end nodes
    let startNode = nodes.find((n) => n.cardId === "__start__");
    let endNode = nodes.find((n) => n.cardId === "__end__");

    // Remove old edges connected to start/end
    edges = edges.filter((e) => {
      if (startNode && e.from === startNode.id) return false;
      if (endNode && e.to === endNode.id) return false;
      return true;
    });

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

    // Connect leaf nodes to end
    if (endNode) {
      const hasOutgoing = new Set();
      animEdges.forEach((e) => hasOutgoing.add(e.from));
      nodeMap.forEach((nid) => {
        if (!hasOutgoing.has(nid)) {
          animEdges.push({ id: "e" + nextId++, from: nid, fromSide: "bottom", to: endNode.id, toSide: "top" });
        }
      });
    }

    // Compute levels from DAG
    const allNodeIds = [startNode?.id, ...nodeMap, endNode?.id].filter(Boolean);
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
    if (endNode) endNode._level = levelMap.get(endNode.id) || 0;
    pipelineNodes.forEach(({ node, step }) => {
      step.level = levelMap.get(node.id) || 0;
    });

    layoutPipeline(pipelineNodes, titleToId, startNode, endNode);

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
        // Show end node
        nodesEl.appendChild(buildNodeEl(endNode));
        shownNodes.add(endNode.id);
        animEdges.forEach((e) => {
          if (shownNodes.has(e.from) && shownNodes.has(e.to)) {
            const existing = arrowsEl.querySelector(`[data-edge-id="${e.id}"]`);
            if (!existing) arrowsEl.appendChild(buildEdgeEl(e));
          }
        });
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
    autoLayout();
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

  return { init, addNode, clear, setAllItems, autoLayout, addPipeline, addPipelineAnimated, getState, loadState, getNodeById, updateNodeOutput, render };
})();
