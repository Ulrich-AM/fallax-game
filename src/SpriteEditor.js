import {
  createSpriteAsset,
  normalizeSpriteAsset,
  compileSpriteAsset,
  listSpriteMaterials,
  getSpriteMaterial,
  serializeSpriteAsset,
  parseSpriteAsset,
} from './SpriteAssets.js?v=43';
import {
  rasterize,
} from './pixelShapes.js?v=43';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function rotatePoint(x, y, degrees) {
  const r = degrees * Math.PI / 180;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return [
    x * c - y * s,
    x * s + y * c,
  ];
}

function pointInPolygon(x, y, points) {
  let inside = false;

  for (
    let i = 0, j = points.length - 1;
    i < points.length;
    j = i++
  ) {
    const xi = points[i][0];
    const yi = points[i][1];
    const xj = points[j][0];
    const yj = points[j][1];

    const intersects =
      ((yi > y) !== (yj > y)) &&
      (
        x <
        (xj - xi) *
          (y - yi) /
          ((yj - yi) || Number.EPSILON) +
        xi
      );

    if (intersects) inside = !inside;
  }

  return inside;
}

function localToWorld(part, point) {
  const [x, y] = rotatePoint(
    point[0],
    point[1],
    part.rotation ?? 0,
  );

  return [
    x + (part.x ?? 0),
    y + (part.y ?? 0),
  ];
}

function worldToLocal(part, point) {
  return rotatePoint(
    point[0] - (part.x ?? 0),
    point[1] - (part.y ?? 0),
    -(part.rotation ?? 0),
  );
}

export class SpriteEditor {
  constructor({
    root,
    canvas,
    previewCanvas,
    nameInput,
    typeSelect,
    materialContainer,
    layersContainer,
    status,
    rotationInput,
    rotationLabel,
    showPlayerInput,
    spinInput,
    glowInput,
    glowStrengthInput,
    glowLabel,
    scaleInput,
    importFileInput,
    snapInput,
    symmetryInput,
    store,
    onClose = null,
    onSaved = null,
  }) {
    this.root = root;
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.previewCanvas = previewCanvas;
    this.previewCtx =
      previewCanvas.getContext('2d');

    this.nameInput = nameInput;
    this.typeSelect = typeSelect;
    this.materialContainer =
      materialContainer;
    this.layersContainer =
      layersContainer;
    this.status = status;
    this.rotationInput =
      rotationInput;
    this.rotationLabel =
      rotationLabel;
    this.showPlayerInput =
      showPlayerInput;
    this.spinInput =
      spinInput;
    this.glowInput =
      glowInput;
    this.glowStrengthInput =
      glowStrengthInput;
    this.glowLabel =
      glowLabel;
    this.scaleInput =
      scaleInput;
    this.importFileInput =
      importFileInput;
    this.snapInput = snapInput;
    this.symmetryInput =
      symmetryInput;

    this.store = store;
    this.onClose = onClose;
    this.onSaved = onSaved;

    this.asset =
      createSpriteAsset({
        name: 'untitled',
        type: 'generic',
      });

    this.selectedPartId = null;
    this.tool = 'select';
    this.material = 'gray';
    this.draftPoints = [];
    this.history = [];
    this.future = [];

    this.zoom = 12;
    this.panX = 0;
    this.panY = 0;

    this.pointerMode = null;
    this.dragPartId = null;
    this.dragVertexIndex = -1;
    this.lastPointerWorld = null;
    this.dragSnapshotTaken = false;

    this.opened = false;
    this.previewFrame = 0;
    this.previewLastTime = 0;

    this.buildMaterialButtons();
    this.bindUi();
    this.renderAll();
  }

  get isOpen() {
    return this.opened;
  }

  bindUi() {
    this.canvas.addEventListener(
      'pointerdown',
      event => this.onPointerDown(event),
    );

    this.canvas.addEventListener(
      'pointermove',
      event => this.onPointerMove(event),
    );

    this.canvas.addEventListener(
      'pointerup',
      event => this.onPointerUp(event),
    );

    this.canvas.addEventListener(
      'pointercancel',
      event => this.onPointerUp(event),
    );

    this.canvas.addEventListener(
      'wheel',
      event => this.onWheel(event),
      { passive: false },
    );

    this.canvas.addEventListener(
      'contextmenu',
      event => event.preventDefault(),
    );

    this.root.addEventListener(
      'keydown',
      event => this.onKeyDown(event),
    );

    this.rotationInput?.addEventListener(
      'input',
      () => {
        this.renderPreview();
      },
    );

    this.showPlayerInput?.addEventListener(
      'change',
      () => this.renderPreview(),
    );

    this.spinInput?.addEventListener(
      'change',
      () => this.renderPreview(),
    );

    this.glowInput?.addEventListener(
      'change',
      () => this.renderPreview(),
    );

    this.glowStrengthInput?.addEventListener(
      'input',
      () => this.renderPreview(),
    );

    this.symmetryInput?.addEventListener(
      'change',
      () => this.renderCanvas(),
    );

    this.scaleInput?.addEventListener(
      'change',
      () => {
        const next = clamp(
          Number(this.scaleInput.value) || 1,
          0.1,
          8,
        );

        this.pushHistory();
        this.future.length = 0;
        this.asset.scale = next;
        this.scaleInput.value =
          String(next);
        this.renderAll();
      },
    );

    this.nameInput?.addEventListener(
      'input',
      () => {
        this.asset.displayName =
          this.nameInput.value;
      },
    );

    this.typeSelect?.addEventListener(
      'change',
      () => {
        this.asset.type =
          this.typeSelect.value;
      },
    );

    this.root.querySelector(
      '[data-editor-tool="select"]',
    )?.addEventListener(
      'click',
      () => this.setTool('select'),
    );

    this.root.querySelector(
      '[data-editor-tool="polygon"]',
    )?.addEventListener(
      'click',
      () => this.setTool('polygon'),
    );

    this.root.querySelector(
      '[data-editor-action="save"]',
    )?.addEventListener(
      'click',
      () => this.save(),
    );

    this.root.querySelector(
      '[data-editor-action="close"]',
    )?.addEventListener(
      'click',
      () => this.close(),
    );

    this.root.querySelector(
      '[data-editor-action="undo"]',
    )?.addEventListener(
      'click',
      () => this.undo(),
    );

    this.root.querySelector(
      '[data-editor-action="redo"]',
    )?.addEventListener(
      'click',
      () => this.redo(),
    );

    this.root.querySelector(
      '[data-editor-action="duplicate"]',
    )?.addEventListener(
      'click',
      () => this.duplicateSelected(),
    );

    this.root.querySelector(
      '[data-editor-action="delete"]',
    )?.addEventListener(
      'click',
      () => this.deleteSelected(),
    );

    this.root.querySelector(
      '[data-editor-action="export"]',
    )?.addEventListener(
      'click',
      () => this.exportJson(),
    );

    this.root.querySelector(
      '[data-editor-action="import"]',
    )?.addEventListener(
      'click',
      () => this.importFileInput?.click(),
    );

    this.importFileInput?.addEventListener(
      'change',
      async () => {
        const file =
          this.importFileInput.files?.[0];

        if (!file) return;

        try {
          const text =
            await file.text();

          this.importJson(text);
        } catch (error) {
          this.setStatus(
            error?.message ?? String(error),
            true,
          );
        } finally {
          this.importFileInput.value = '';
        }
      },
    );
  }

  buildMaterialButtons() {
    if (!this.materialContainer) return;

    this.materialContainer.innerHTML = '';

    for (
      const material
      of listSpriteMaterials()
    ) {
      const button =
        document.createElement('button');

      button.type = 'button';
      button.className =
        'sprite-material-button';

      button.dataset.material =
        material.id;

      button.title = material.label;

      const swatch =
        document.createElement('span');

      swatch.className =
        'sprite-material-swatch';

      swatch.style.background =
        material.color;

      if (material.glow) {
        swatch.style.boxShadow =
          `0 0 12px ${material.glow.color}`;
      }

      const label =
        document.createElement('span');

      label.textContent =
        material.label;

      button.append(
        swatch,
        label,
      );

      button.addEventListener(
        'click',
        () => {
          this.material =
            material.id;

          if (this.selectedPartId) {
            this.pushHistory();

            const part =
              this.getSelectedPart();

            if (part) {
              part.material =
                material.id;

              this.future.length = 0;
              this.renderAll();
            }
          } else {
            this.renderMaterialState();
          }
        },
      );

      this.materialContainer
        .appendChild(button);
    }

    this.renderMaterialState();
  }

  renderMaterialState() {
    for (
      const button
      of this.materialContainer?.querySelectorAll(
        '.sprite-material-button',
      ) ?? []
    ) {
      button.classList.toggle(
        'active',
        button.dataset.material ===
          this.material,
      );
    }
  }

  open({
    asset = null,
    type = 'generic',
  } = {}) {
    if (asset) {
      this.asset =
        normalizeSpriteAsset(asset);
    } else {
      this.asset =
        createSpriteAsset({
          name:
            type === 'generic'
              ? 'untitled'
              : `untitled-${type}`,
          type,
        });
    }

    this.selectedPartId = null;
    this.tool = 'select';
    this.material = 'gray';
    this.draftPoints = [];
    this.history.length = 0;
    this.future.length = 0;
    this.panX = 0;
    this.panY = 0;
    this.zoom = 12;

    this.nameInput.value =
      this.asset.displayName ??
      this.asset.name;

    this.typeSelect.value =
      this.asset.type;

    if (this.scaleInput) {
      this.scaleInput.value =
        String(this.asset.scale ?? 1);
    }

    this.opened = true;
    this.root.classList.remove('hidden');
    this.root.tabIndex = -1;
    this.root.focus();

    this.setStatus(
      'Select a part, or choose Polygon and click points. Click the first point or press Enter to close.',
    );

    this.renderAll();
    this.startPreviewLoop();
  }

  close() {
    if (!this.opened) return;

    this.cancelPolygon();
    this.opened = false;

    if (this.previewFrame) {
      cancelAnimationFrame(
        this.previewFrame,
      );
      this.previewFrame = 0;
    }

    this.root.classList.add('hidden');
    this.onClose?.();
  }

  save() {
    const rawName =
      this.nameInput.value.trim();

    if (!rawName) {
      this.setStatus(
        'Give the sprite a name before saving.',
        true,
      );
      return null;
    }

    const candidate = clone(this.asset);
    candidate.name = rawName;
    candidate.displayName = rawName;
    candidate.type = this.typeSelect.value;
    candidate.scale = clamp(
      Number(this.scaleInput?.value) || 1,
      0.1,
      8,
    );

    try {
      const saved =
        this.store.save(candidate);

      this.asset = saved;
      this.nameInput.value =
        saved.displayName;

      this.setStatus(
        `Saved "${saved.name}" with ${saved.parts.length} parts.`,
      );

      this.onSaved?.(saved);
      this.renderAll();
      return saved;
    } catch (error) {
      this.setStatus(
        error?.message ?? String(error),
        true,
      );
      return null;
    }
  }

  currentCandidate() {
    const candidate = clone(this.asset);
    const rawName =
      this.nameInput.value.trim();

    candidate.name =
      rawName || candidate.name || 'untitled';

    candidate.displayName =
      rawName ||
      candidate.displayName ||
      'untitled';

    candidate.type =
      this.typeSelect.value;

    candidate.scale = clamp(
      Number(this.scaleInput?.value) || 1,
      0.1,
      8,
    );

    return normalizeSpriteAsset(
      candidate,
    );
  }

  exportJson() {
    try {
      const asset =
        this.currentCandidate();

      const json =
        serializeSpriteAsset(asset);

      const blob =
        new Blob(
          [json],
          {
            type: 'application/json',
          },
        );

      const url =
        URL.createObjectURL(blob);

      const anchor =
        document.createElement('a');

      anchor.href = url;
      anchor.download =
        `${asset.name}.sprite.json`;

      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      setTimeout(
        () => URL.revokeObjectURL(url),
        0,
      );

      this.setStatus(
        `Exported "${asset.name}".`,
      );
    } catch (error) {
      this.setStatus(
        error?.message ?? String(error),
        true,
      );
    }
  }

  importJson(text) {
    const imported =
      parseSpriteAsset(text);

    this.pushHistory();
    this.future.length = 0;
    this.asset = imported;
    this.selectedPartId = null;
    this.draftPoints = [];

    this.nameInput.value =
      imported.displayName;

    this.typeSelect.value =
      imported.type;

    if (this.scaleInput) {
      this.scaleInput.value =
        String(imported.scale ?? 1);
    }

    this.setTool('select');

    this.setStatus(
      `Imported "${imported.name}". Save Draft to keep it locally.`,
    );

    this.renderAll();
  }

  startPreviewLoop() {
    if (this.previewFrame) {
      cancelAnimationFrame(
        this.previewFrame,
      );
    }

    this.previewLastTime =
      performance.now();

    const tick = now => {
      if (!this.opened) {
        this.previewFrame = 0;
        return;
      }

      const dt = Math.min(
        0.05,
        Math.max(
          0,
          (now - this.previewLastTime) /
            1000,
        ),
      );

      this.previewLastTime = now;

      if (this.spinInput?.checked) {
        let angle =
          Number(
            this.rotationInput?.value ??
            0,
          );

        angle =
          (angle + dt * 55) % 360;

        if (this.rotationInput) {
          this.rotationInput.value =
            String(angle);
        }

        this.renderPreview();
      }

      this.previewFrame =
        requestAnimationFrame(tick);
    };

    this.previewFrame =
      requestAnimationFrame(tick);
  }

  setTool(tool) {
    if (
      tool !== 'select' &&
      tool !== 'polygon'
    ) {
      return;
    }

    if (
      this.tool === 'polygon' &&
      tool !== 'polygon'
    ) {
      this.cancelPolygon();
    }

    this.tool = tool;

    for (
      const button
      of this.root.querySelectorAll(
        '[data-editor-tool]',
      )
    ) {
      button.classList.toggle(
        'active',
        button.dataset.editorTool === tool,
      );
    }

    this.setStatus(
      tool === 'polygon'
        ? 'Polygon: click vertices, click the first point or press Enter to close, Esc to cancel.'
        : 'Select: click a shape; drag vertices or the whole shape.',
    );

    this.renderCanvas();
  }

  setStatus(text, error = false) {
    if (!this.status) return;

    this.status.textContent = text;
    this.status.classList.toggle(
      'error',
      error,
    );
  }

  snapshot() {
    return {
      asset: clone(this.asset),
      selectedPartId:
        this.selectedPartId,
    };
  }

  restore(snapshot) {
    this.asset =
      normalizeSpriteAsset(
        snapshot.asset,
      );

    this.selectedPartId =
      snapshot.selectedPartId;

    if (
      this.selectedPartId &&
      !this.getSelectedPart()
    ) {
      this.selectedPartId = null;
    }

    this.nameInput.value =
      this.asset.displayName;

    this.typeSelect.value =
      this.asset.type;

    if (this.scaleInput) {
      this.scaleInput.value =
        String(this.asset.scale ?? 1);
    }

    this.renderAll();
  }

  pushHistory() {
    this.history.push(this.snapshot());

    if (this.history.length > 80) {
      this.history.shift();
    }
  }

  undo() {
    const previous =
      this.history.pop();

    if (!previous) return;

    this.future.push(this.snapshot());
    this.restore(previous);
  }

  redo() {
    const next =
      this.future.pop();

    if (!next) return;

    this.history.push(this.snapshot());
    this.restore(next);
  }

  getSelectedPart() {
    return this.asset.parts.find(
      part =>
        part.id ===
        this.selectedPartId,
    ) ?? null;
  }

  uniquePartId(base = 'part') {
    const used = new Set(
      this.asset.parts.map(
        part => part.id,
      ),
    );

    let index =
      this.asset.parts.length + 1;

    let id =
      `${base}-${index}`;

    while (used.has(id)) {
      index++;
      id =
        `${base}-${index}`;
    }

    return id;
  }

  duplicateSelected() {
    const part =
      this.getSelectedPart();

    if (!part) return;

    this.pushHistory();
    this.future.length = 0;

    const copy = clone(part);
    copy.id =
      this.uniquePartId('part');
    copy.name =
      `${part.name} copy`;
    copy.x += 2;
    copy.y += 2;

    this.asset.parts.push(copy);
    this.selectedPartId =
      copy.id;
    this.material =
      copy.material;

    this.renderAll();
  }

  deleteSelected() {
    if (!this.selectedPartId) return;

    const index =
      this.asset.parts.findIndex(
        part =>
          part.id ===
          this.selectedPartId,
      );

    if (index < 0) return;

    this.pushHistory();
    this.future.length = 0;
    this.asset.parts.splice(index, 1);
    this.selectedPartId = null;
    this.renderAll();
  }

  moveLayer(partId, direction) {
    const index =
      this.asset.parts.findIndex(
        part => part.id === partId,
      );

    if (index < 0) return;

    const nextIndex =
      clamp(
        index + direction,
        0,
        this.asset.parts.length - 1,
      );

    if (nextIndex === index) return;

    this.pushHistory();
    this.future.length = 0;

    const [part] =
      this.asset.parts.splice(index, 1);

    this.asset.parts.splice(
      nextIndex,
      0,
      part,
    );

    this.renderAll();
  }

  getSymmetryMode() {
    const mode =
      this.symmetryInput?.value ??
      'off';

    return (
      mode === 'vertical' ||
      mode === 'horizontal'
    )
      ? mode
      : 'off';
  }

  mirrorPoint(point) {
    const mode =
      this.getSymmetryMode();

    if (mode === 'vertical') {
      return [-point[0], point[1]];
    }

    if (mode === 'horizontal') {
      return [point[0], -point[1]];
    }

    return [...point];
  }

  pointsApproximatelyEqual(
    a,
    b,
    epsilon = 0.0001,
  ) {
    return (
      Math.abs(a[0] - b[0]) <= epsilon &&
      Math.abs(a[1] - b[1]) <= epsilon
    );
  }

  mirroredPolygonIsDistinct(points) {
    const mode =
      this.getSymmetryMode();

    if (
      mode === 'off' ||
      points.length < 3
    ) {
      return false;
    }

    const mirrored =
      points.map(
        point => this.mirrorPoint(point),
      );

    const directMatch =
      points.every(
        (point, index) =>
          this.pointsApproximatelyEqual(
            point,
            mirrored[index],
          ),
      );

    if (directMatch) return false;

    const reversed =
      [...mirrored].reverse();

    return !points.every(
      (point, index) =>
        this.pointsApproximatelyEqual(
          point,
          reversed[index],
        ),
    );
  }

  screenPoint(event) {
    const rect =
      this.canvas.getBoundingClientRect();

    return {
      x:
        (event.clientX - rect.left) *
        (this.canvas.width / rect.width),
      y:
        (event.clientY - rect.top) *
        (this.canvas.height / rect.height),
    };
  }

  canvasOrigin() {
    return {
      x:
        this.canvas.width / 2 +
        this.panX,
      y:
        this.canvas.height / 2 +
        this.panY,
    };
  }

  screenToWorld(point) {
    const origin =
      this.canvasOrigin();

    let x =
      (point.x - origin.x) /
      this.zoom;

    let y =
      (point.y - origin.y) /
      this.zoom;

    if (this.snapInput?.checked) {
      x = Math.round(x);
      y = Math.round(y);
    }

    return [x, y];
  }

  worldToScreen(point) {
    const origin =
      this.canvasOrigin();

    return [
      origin.x +
        point[0] * this.zoom,
      origin.y +
        point[1] * this.zoom,
    ];
  }

  findVertexAt(worldPoint) {
    const part =
      this.getSelectedPart();

    if (
      !part ||
      part.type !== 'polygon'
    ) {
      return -1;
    }

    const threshold =
      9 / this.zoom;

    for (
      let i = 0;
      i < part.points.length;
      i++
    ) {
      const point =
        localToWorld(
          part,
          part.points[i],
        );

      if (
        Math.hypot(
          point[0] - worldPoint[0],
          point[1] - worldPoint[1],
        ) <= threshold
      ) {
        return i;
      }
    }

    return -1;
  }

  hitPart(worldPoint) {
    for (
      let i =
        this.asset.parts.length - 1;
      i >= 0;
      i--
    ) {
      const part =
        this.asset.parts[i];

      const local =
        worldToLocal(
          part,
          worldPoint,
        );

      if (part.type === 'rectangle') {
        if (
          Math.abs(local[0]) <=
            part.width / 2 &&
          Math.abs(local[1]) <=
            part.height / 2
        ) {
          return part;
        }
      } else if (
        pointInPolygon(
          local[0],
          local[1],
          part.points,
        )
      ) {
        return part;
      }
    }

    return null;
  }

  onPointerDown(event) {
    this.root.focus();

    const screen =
      this.screenPoint(event);

    const world =
      this.screenToWorld(screen);

    if (
      event.button === 1 ||
      event.button === 2
    ) {
      this.pointerMode = 'pan';
      this.lastPointerWorld =
        screen;
      this.canvas.setPointerCapture(
        event.pointerId,
      );
      event.preventDefault();
      return;
    }

    if (event.button !== 0) return;

    if (this.tool === 'polygon') {
      if (this.draftPoints.length >= 3) {
        const firstScreen =
          this.worldToScreen(
            this.draftPoints[0],
          );

        const closeDistance =
          Math.hypot(
            screen.x - firstScreen[0],
            screen.y - firstScreen[1],
          );

        if (closeDistance <= 13) {
          this.commitPolygon();
          event.preventDefault();
          return;
        }
      }

      this.draftPoints.push(world);
      this.renderCanvas();
      event.preventDefault();
      return;
    }

    const vertexIndex =
      this.findVertexAt(world);

    if (vertexIndex >= 0) {
      this.pushHistory();
      this.future.length = 0;
      this.pointerMode = 'vertex';
      this.dragPartId =
        this.selectedPartId;
      this.dragVertexIndex =
        vertexIndex;
      this.lastPointerWorld =
        world;
      this.canvas.setPointerCapture(
        event.pointerId,
      );
      return;
    }

    const hit =
      this.hitPart(world);

    if (hit) {
      this.selectedPartId =
        hit.id;
      this.material =
        hit.material;

      this.pushHistory();
      this.future.length = 0;
      this.pointerMode = 'part';
      this.dragPartId = hit.id;
      this.lastPointerWorld =
        world;

      this.canvas.setPointerCapture(
        event.pointerId,
      );

      this.renderAll();
    } else {
      this.selectedPartId = null;
      this.renderAll();
    }
  }

  onPointerMove(event) {
    if (!this.pointerMode) return;

    const screen =
      this.screenPoint(event);

    if (this.pointerMode === 'pan') {
      const dx =
        screen.x -
        this.lastPointerWorld.x;

      const dy =
        screen.y -
        this.lastPointerWorld.y;

      this.panX += dx;
      this.panY += dy;
      this.lastPointerWorld =
        screen;
      this.renderCanvas();
      return;
    }

    const world =
      this.screenToWorld(screen);

    const part =
      this.asset.parts.find(
        item =>
          item.id ===
          this.dragPartId,
      );

    if (!part) return;

    if (
      this.pointerMode === 'vertex' &&
      part.type === 'polygon'
    ) {
      const local =
        worldToLocal(part, world);

      part.points[
        this.dragVertexIndex
      ] = local;
    } else if (
      this.pointerMode === 'part'
    ) {
      const dx =
        world[0] -
        this.lastPointerWorld[0];

      const dy =
        world[1] -
        this.lastPointerWorld[1];

      part.x += dx;
      part.y += dy;

      if (this.snapInput?.checked) {
        part.x = Math.round(part.x);
        part.y = Math.round(part.y);
      }

      this.lastPointerWorld =
        world;
    }

    this.renderAll();
  }

  onPointerUp(event) {
    if (!this.pointerMode) return;

    try {
      this.canvas.releasePointerCapture(
        event.pointerId,
      );
    } catch {
      // Pointer may already be released.
    }

    this.pointerMode = null;
    this.dragPartId = null;
    this.dragVertexIndex = -1;
    this.lastPointerWorld = null;
    this.renderAll();
  }

  onWheel(event) {
    event.preventDefault();

    const before =
      this.screenToWorld(
        this.screenPoint(event),
      );

    const factor =
      event.deltaY < 0
        ? 1.12
        : 1 / 1.12;

    this.zoom =
      clamp(
        this.zoom * factor,
        4,
        40,
      );

    const screen =
      this.screenPoint(event);

    const origin =
      this.canvasOrigin();

    this.panX +=
      screen.x -
      (
        origin.x +
        before[0] * this.zoom
      );

    this.panY +=
      screen.y -
      (
        origin.y +
        before[1] * this.zoom
      );

    this.renderCanvas();
  }

  onKeyDown(event) {
    const tag =
      event.target?.tagName;

    if (
      tag === 'INPUT' ||
      tag === 'SELECT' ||
      tag === 'TEXTAREA'
    ) {
      return;
    }

    if (
      event.ctrlKey &&
      event.code === 'KeyZ'
    ) {
      event.preventDefault();
      event.stopPropagation();

      if (event.shiftKey) {
        this.redo();
      } else {
        this.undo();
      }

      return;
    }

    if (
      event.ctrlKey &&
      event.code === 'KeyY'
    ) {
      event.preventDefault();
      event.stopPropagation();
      this.redo();
      return;
    }

    if (event.code === 'Enter') {
      if (this.tool === 'polygon') {
        event.preventDefault();
        event.stopPropagation();
        this.commitPolygon();
      }
      return;
    }

    if (event.code === 'Escape') {
      event.preventDefault();
      event.stopPropagation();

      if (
        this.tool === 'polygon' &&
        this.draftPoints.length
      ) {
        this.cancelPolygon();
      } else {
        this.close();
      }
      return;
    }

    if (
      event.code === 'Delete' ||
      event.code === 'Backspace'
    ) {
      event.preventDefault();
      event.stopPropagation();
      this.deleteSelected();
    }
  }

  commitPolygon() {
    if (this.draftPoints.length < 3) {
      this.setStatus(
        'A polygon needs at least three vertices.',
        true,
      );
      return false;
    }

    this.pushHistory();
    this.future.length = 0;

    const id =
      this.uniquePartId('polygon');

    const basePart = {
      id,
      name: id,
      type: 'polygon',
      material: this.material,
      groupId: null,
      x: 0,
      y: 0,
      rotation: 0,
      outline: null,
      points:
        this.draftPoints.map(
          point => [...point],
        ),
    };

    this.asset.parts.push(basePart);

    let mirrorId = null;

    if (
      this.mirroredPolygonIsDistinct(
        this.draftPoints,
      )
    ) {
      mirrorId =
        this.uniquePartId(
          'polygon-mirror',
        );

      this.asset.parts.push({
        ...clone(basePart),
        id: mirrorId,
        name:
          `${id} mirror`,
        points:
          this.draftPoints
            .map(
              point =>
                this.mirrorPoint(point),
            )
            .reverse(),
      });
    }

    this.selectedPartId = id;
    this.draftPoints = [];
    this.setTool('select');

    this.setStatus(
      mirrorId
        ? `Created ${id} + symmetric mirror.`
        : `Created ${id}.`,
    );

    this.renderAll();
    return true;
  }

  cancelPolygon() {
    if (!this.draftPoints.length) return;

    this.draftPoints = [];
    this.renderCanvas();
    this.setStatus(
      'Polygon cancelled.',
    );
  }

  renderLayers() {
    if (!this.layersContainer) return;

    this.layersContainer.innerHTML = '';

    const reversed =
      [...this.asset.parts]
        .reverse();

    for (const part of reversed) {
      const row =
        document.createElement('div');

      row.className =
        'sprite-layer-row';

      row.classList.toggle(
        'active',
        part.id ===
          this.selectedPartId,
      );

      const select =
        document.createElement('button');

      select.className =
        'sprite-layer-select';

      select.textContent =
        part.name || part.id;

      const material =
        getSpriteMaterial(
          part.material,
        );

      if (material) {
        select.style.setProperty(
          '--layer-color',
          material.color,
        );
      }

      select.addEventListener(
        'click',
        () => {
          this.selectedPartId =
            part.id;
          this.material =
            part.material;
          this.setTool('select');
          this.renderAll();
        },
      );

      const up =
        document.createElement('button');

      up.textContent = '↑';
      up.title = 'bring forward';
      up.addEventListener(
        'click',
        () => {
          const index =
            this.asset.parts.findIndex(
              item =>
                item.id === part.id,
            );

          this.moveLayer(
            part.id,
            1,
          );
        },
      );

      const down =
        document.createElement('button');

      down.textContent = '↓';
      down.title = 'send backward';
      down.addEventListener(
        'click',
        () => {
          this.moveLayer(
            part.id,
            -1,
          );
        },
      );

      row.append(
        select,
        up,
        down,
      );

      this.layersContainer
        .appendChild(row);
    }

    if (!this.asset.parts.length) {
      const empty =
        document.createElement('div');

      empty.className =
        'sprite-layer-empty';

      empty.textContent =
        'No parts yet.';

      this.layersContainer
        .appendChild(empty);
    }
  }

  renderCanvas() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const origin =
      this.canvasOrigin();

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#090b0f';
    ctx.fillRect(0, 0, w, h);

    const gridStep =
      Math.max(1, this.zoom);

    ctx.lineWidth = 1;

    const startX =
      ((origin.x % gridStep) +
        gridStep) %
      gridStep;

    const startY =
      ((origin.y % gridStep) +
        gridStep) %
      gridStep;

    for (
      let x = startX;
      x < w;
      x += gridStep
    ) {
      const major =
        Math.round(
          (x - origin.x) /
          gridStep,
        ) % 5 === 0;

      ctx.strokeStyle =
        major
          ? '#1d232d'
          : '#131820';

      ctx.beginPath();
      ctx.moveTo(
        Math.round(x) + 0.5,
        0,
      );
      ctx.lineTo(
        Math.round(x) + 0.5,
        h,
      );
      ctx.stroke();
    }

    for (
      let y = startY;
      y < h;
      y += gridStep
    ) {
      const major =
        Math.round(
          (y - origin.y) /
          gridStep,
        ) % 5 === 0;

      ctx.strokeStyle =
        major
          ? '#1d232d'
          : '#131820';

      ctx.beginPath();
      ctx.moveTo(
        0,
        Math.round(y) + 0.5,
      );
      ctx.lineTo(
        w,
        Math.round(y) + 0.5,
      );
      ctx.stroke();
    }

    ctx.strokeStyle = '#59616d';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(origin.x, 0);
    ctx.lineTo(origin.x, h);
    ctx.moveTo(0, origin.y);
    ctx.lineTo(w, origin.y);
    ctx.stroke();

    for (const part of this.asset.parts) {
      this.drawPart(
        ctx,
        part,
        part.id ===
          this.selectedPartId,
      );
    }

    if (this.draftPoints.length) {
      const drawDraftPath = (
        points,
        {
          color = '#ffffff',
          alpha = 1,
          handles = false,
        } = {},
      ) => {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();

        points.forEach(
          (point, index) => {
            const [x, y] =
              this.worldToScreen(point);

            if (index === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }

            if (handles) {
              ctx.fillRect(
                Math.round(x - 3),
                Math.round(y - 3),
                6,
                6,
              );
            }
          },
        );

        ctx.stroke();
        ctx.restore();
      };

      drawDraftPath(
        this.draftPoints,
        {
          color: '#ffffff',
          handles: true,
        },
      );

      if (
        this.getSymmetryMode() !== 'off'
      ) {
        drawDraftPath(
          this.draftPoints.map(
            point => this.mirrorPoint(point),
          ),
          {
            color: '#8ea7c7',
            alpha: 0.7,
            handles: false,
          },
        );
      }

      if (
        this.draftPoints.length >= 3
      ) {
        const [sx, sy] =
          this.worldToScreen(
            this.draftPoints[0],
          );

        ctx.save();
        ctx.strokeStyle = '#9fd5a7';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(
          sx,
          sy,
          8,
          0,
          Math.PI * 2,
        );
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  drawPart(ctx, part, selected) {
    const material =
      getSpriteMaterial(
        part.material,
      );

    const color =
      material?.color ??
      '#777b82';

    ctx.save();

    if (material?.glow) {
      ctx.shadowColor =
        material.glow.color;
      ctx.shadowBlur =
        12 *
        material.glow.intensity;
    }

    ctx.fillStyle = color;
    ctx.strokeStyle =
      selected
        ? '#ffffff'
        : '#424954';

    ctx.lineWidth =
      selected ? 2 : 1;

    if (part.type === 'rectangle') {
      const corners = [
        [-part.width / 2, -part.height / 2],
        [part.width / 2, -part.height / 2],
        [part.width / 2, part.height / 2],
        [-part.width / 2, part.height / 2],
      ].map(point =>
        this.worldToScreen(
          localToWorld(part, point),
        ),
      );

      ctx.beginPath();
      corners.forEach(
        ([x, y], index) => {
          if (index === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        },
      );
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      const points =
        part.points.map(
          point =>
            this.worldToScreen(
              localToWorld(
                part,
                point,
              ),
            ),
        );

      ctx.beginPath();
      points.forEach(
        ([x, y], index) => {
          if (index === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        },
      );
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      if (selected) {
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';

        for (const [x, y] of points) {
          ctx.fillRect(
            Math.round(x - 4),
            Math.round(y - 4),
            8,
            8,
          );
        }
      }
    }

    ctx.restore();
  }

  renderPreview() {
    const ctx =
      this.previewCtx;

    const w =
      this.previewCanvas.width;

    const h =
      this.previewCanvas.height;

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#08090c';
    ctx.fillRect(0, 0, w, h);

    const angle =
      Number(
        this.rotationInput?.value ??
        0,
      );

    if (this.rotationLabel) {
      this.rotationLabel.textContent =
        `${Math.round(angle)}°`;
    }

    const glowStrength = clamp(
      Number(
        this.glowStrengthInput?.value ??
        1,
      ),
      0,
      2,
    );

    if (this.glowLabel) {
      this.glowLabel.textContent =
        `${glowStrength.toFixed(1)}×`;
    }

    let compiled;

    try {
      const candidate =
        this.currentCandidate();

      compiled =
        compileSpriteAsset(
          candidate,
        );
    } catch {
      return;
    }

    if (!compiled.asset.parts.length) {
      ctx.fillStyle = '#737b87';
      ctx.font =
        '12px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(
        'add a polygon to preview it',
        w / 2,
        h / 2,
      );
      return;
    }

    const raster =
      rasterize(
        compiled.shape,
        angle,
      );

    const naturalGameScale = 4;
    const naturalSpriteW =
      raster.width *
      naturalGameScale;

    const naturalSpriteH =
      raster.height *
      naturalGameScale;

    const naturalPlayerW = 32;
    const naturalPlayerH = 56;
    const hasPlayer =
      !!this.showPlayerInput?.checked;

    const naturalGap =
      hasPlayer ? 24 : 0;

    const totalNaturalW =
      naturalSpriteW +
      (hasPlayer
        ? naturalPlayerW +
          naturalGap
        : 0);

    const totalNaturalH =
      Math.max(
        naturalSpriteH,
        hasPlayer
          ? naturalPlayerH + 18
          : 0,
      );

    const padding = 18;

    const fit =
      Math.min(
        1,
        (w - padding * 2) /
          Math.max(
            1,
            totalNaturalW,
          ),
        (h - padding * 2) /
          Math.max(
            1,
            totalNaturalH,
          ),
      );

    const rasterScale =
      naturalGameScale * fit;

    const spriteW =
      raster.width *
      rasterScale;

    const spriteH =
      raster.height *
      rasterScale;

    const playerW =
      naturalPlayerW * fit;

    const playerH =
      naturalPlayerH * fit;

    const gap =
      naturalGap * fit;

    const combinedW =
      spriteW +
      (hasPlayer
        ? playerW + gap
        : 0);

    const groupLeft =
      (w - combinedW) / 2;

    const centerY =
      h * 0.5;

    const playerX =
      groupLeft;

    const spriteLeft =
      hasPlayer
        ? groupLeft +
          playerW +
          gap
        : groupLeft;

    const spriteTop =
      centerY -
      spriteH / 2;

    const baseBounds =
      raster.shapeBounds ?? {
        minX: 0,
        minY: 0,
      };

    if (
      this.glowInput?.checked &&
      glowStrength > 0
    ) {
      for (
        const glowPart
        of compiled.glowParts
      ) {
        const glowRaster =
          rasterize(
            glowPart.shape,
            angle,
          );

        const glowBounds =
          glowRaster.shapeBounds ?? {
            minX: 0,
            minY: 0,
          };

        const gx =
          spriteLeft +
          (
            glowBounds.minX -
            baseBounds.minX
          ) *
          rasterScale;

        const gy =
          spriteTop +
          (
            glowBounds.minY -
            baseBounds.minY
          ) *
          rasterScale;

        ctx.save();
        ctx.imageSmoothingEnabled = false;
        ctx.globalAlpha =
          0.82 * glowStrength;

        ctx.shadowColor =
          glowPart.glow.color;

        ctx.shadowBlur =
          glowPart.glow.radius *
          glowStrength *
          fit;

        ctx.drawImage(
          glowRaster,
          Math.round(gx),
          Math.round(gy),
          glowRaster.width *
            rasterScale,
          glowRaster.height *
            rasterScale,
        );

        ctx.restore();
      }
    }

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      raster,
      Math.round(spriteLeft),
      Math.round(spriteTop),
      spriteW,
      spriteH,
    );

    if (hasPlayer) {
      const playerY =
        centerY -
        playerH / 2;

      ctx.fillStyle = '#8a8e95';
      ctx.fillRect(
        playerX,
        playerY,
        playerW,
        playerH,
      );

      ctx.strokeStyle = '#4b4f57';
      ctx.lineWidth = Math.max(
        1,
        fit,
      );

      ctx.strokeRect(
        playerX + 0.5,
        playerY + 0.5,
        playerW,
        playerH,
      );

      ctx.fillStyle = '#8b929d';
      ctx.font =
        `${Math.max(
          8,
          11 * fit,
        )}px Arial, sans-serif`;

      ctx.textAlign = 'center';

      ctx.fillText(
        'player',
        playerX +
          playerW / 2,
        playerY +
          playerH +
          Math.max(
            10,
            14 * fit,
          ),
      );
    }

    if (fit < 0.999) {
      ctx.fillStyle = '#68717e';
      ctx.font =
        '10px Arial, sans-serif';
      ctx.textAlign = 'right';

      ctx.fillText(
        `preview fit ${Math.round(
          fit * 100,
        )}%`,
        w - 8,
        h - 8,
      );
    }
  }

  renderAll() {
    this.renderMaterialState();
    this.renderLayers();
    this.renderCanvas();
    this.renderPreview();
  }
}
