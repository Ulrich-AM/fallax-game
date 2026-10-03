import {
  createSpriteAsset,
  normalizeSpriteAsset,
  compileSpriteAsset,
  listSpriteMaterials,
  getSpriteMaterial,
  serializeSpriteAsset,
  parseSpriteAsset,
} from './SpriteAssets.js?v=72da';
import {
  rasterize,
} from './pixelShapes.js?v=49';
import {
  mirrorShapeAcrossLocalX,
  shouldFlipWeaponSprite,
} from './WeaponSpriteRenderer.js?v=63a';
import {
  normalizeAnimations,
  evaluateAnimation,
  applyAnimationPose,
  upsertKeyframe,
} from './SpriteAnimation.js?v=55';

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
    trueSizeInput,
    spinInput,
    glowInput,
    glowStrengthInput,
    glowLabel,
    scaleInput,
    pixelSizeInput,
    importFileInput,
    snapInput,
    symmetryInput,
    weaponToolsRoot,
    weaponMarkerInfo,
    weaponTestControls,
    flipOnReverseInput,
    bossToolsRoot,
    bossMarkerNameInput,
    bossMarkerInfo,
    hitboxNameInput,
    hitboxTypeInput,
    hitboxSizeXInput,
    hitboxSizeYInput,
    hitboxListRoot,
    animationPanelRoot,
    animationClipInput,
    animationClipNameInput,
    animationPropertyInput,
    animationEasingInput,
    animationValueInput,
    animationDurationInput,
    animationLoopInput,
    animationTimeInput,
    animationTimeLabel,
    animationTargetRoot,
    animationKeysRoot,
    selectionSummary,
    selectionXInput,
    selectionYInput,
    selectionRotationInput,
    store,
    onClose = null,
    onSaved = null,
    onTestWeapon = null,
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
    this.trueSizeInput =
      trueSizeInput;
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
    this.pixelSizeInput =
      pixelSizeInput;
    this.importFileInput =
      importFileInput;
    this.snapInput = snapInput;
    this.symmetryInput =
      symmetryInput;
    this.weaponToolsRoot =
      weaponToolsRoot;
    this.weaponMarkerInfo =
      weaponMarkerInfo;
    this.weaponTestControls =
      weaponTestControls;
    this.flipOnReverseInput =
      flipOnReverseInput;
    this.bossToolsRoot =
      bossToolsRoot;
    this.bossMarkerNameInput =
      bossMarkerNameInput;
    this.bossMarkerInfo =
      bossMarkerInfo;
    this.hitboxNameInput =
      hitboxNameInput;
    this.hitboxTypeInput =
      hitboxTypeInput;
    this.hitboxSizeXInput =
      hitboxSizeXInput;
    this.hitboxSizeYInput =
      hitboxSizeYInput;
    this.hitboxListRoot =
      hitboxListRoot;
    this.animationPanelRoot =
      animationPanelRoot;
    this.animationClipInput =
      animationClipInput;
    this.animationClipNameInput =
      animationClipNameInput;
    this.animationPropertyInput =
      animationPropertyInput;
    this.animationEasingInput =
      animationEasingInput;
    this.animationValueInput =
      animationValueInput;
    this.animationDurationInput =
      animationDurationInput;
    this.animationLoopInput =
      animationLoopInput;
    this.animationTimeInput =
      animationTimeInput;
    this.animationTimeLabel =
      animationTimeLabel;
    this.animationTargetRoot =
      animationTargetRoot;
    this.animationKeysRoot =
      animationKeysRoot;
    this.selectionSummary =
      selectionSummary;
    this.selectionXInput =
      selectionXInput;
    this.selectionYInput =
      selectionYInput;
    this.selectionRotationInput =
      selectionRotationInput;

    this.store = store;
    this.onClose = onClose;
    this.onSaved = onSaved;
    this.onTestWeapon =
      onTestWeapon;

    this.asset =
      createSpriteAsset({
        name: 'untitled',
        type: 'generic',
      });

    this.selectedPartId = null;
    this.selectedPartIds =
      new Set();
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
    this.currentClipName = 'idle';
    this.animationTime = 0;
    this.animationPlaying = false;
    this.selectedHitboxId = null;

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

    this.trueSizeInput?.addEventListener(
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

    this.flipOnReverseInput?.addEventListener(
      'change',
      () => {
        this.pushHistory();
        this.future.length = 0;

        this.asset.render ??= {};
        this.asset.render.flipOnReverse =
          !!this.flipOnReverseInput.checked;

        this.renderPreview();
      },
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

    this.pixelSizeInput?.addEventListener(
      'change',
      () => {
        const next =
          Math.round(
            clamp(
              Number(
                this.pixelSizeInput.value,
              ) || 4,
              1,
              8,
            ) *
            4,
          ) /
          4;

        this.pushHistory();
        this.future.length = 0;
        this.asset.render ??= {};
        this.asset.render.artPixelSize =
          next;
        this.pixelSizeInput.value =
          String(next);
        this.renderPreview();
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
        this.updateModeUi();
        this.renderAll();
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
      '[data-editor-tool="pivot"]',
    )?.addEventListener(
      'click',
      () => this.setTool('pivot'),
    );

    this.root.querySelector(
      '[data-editor-tool="muzzle"]',
    )?.addEventListener(
      'click',
      () => this.setTool('muzzle'),
    );

    this.root.querySelector(
      '[data-editor-tool="group-pivot"]',
    )?.addEventListener(
      'click',
      () => this.setTool('group-pivot'),
    );

    this.root.querySelector(
      '[data-editor-tool="marker"]',
    )?.addEventListener(
      'click',
      () => this.setTool('marker'),
    );

    this.root.querySelector(
      '[data-editor-tool="hitbox"]',
    )?.addEventListener(
      'click',
      () => this.setTool('hitbox'),
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
      '[data-editor-action="center-pivot"]',
    )?.addEventListener(
      'click',
      () => {
        if (!this.isWeaponMode()) {
          return;
        }

        this.pushHistory();
        this.future.length = 0;
        this.asset.pivot = [0, 0];
        this.setStatus(
          'Weapon pivot centered on the player.',
        );
        this.renderAll();
      },
    );

    this.root.querySelector(
      '[data-editor-action="group"]',
    )?.addEventListener(
      'click',
      () => this.groupSelected(),
    );

    this.root.querySelector(
      '[data-editor-action="ungroup"]',
    )?.addEventListener(
      'click',
      () => this.ungroupSelected(),
    );

    this.root.querySelector(
      '[data-editor-action="mirror-selected"]',
    )?.addEventListener(
      'click',
      () => this.mirrorSelected(),
    );

    this.root.querySelector(
      '[data-editor-action="anim-play"]',
    )?.addEventListener(
      'click',
      () => {
        this.animationPlaying =
          !this.animationPlaying;
        this.previewLastTime =
          performance.now();
        this.renderAll();
      },
    );

    this.root.querySelector(
      '[data-editor-action="anim-key"]',
    )?.addEventListener(
      'click',
      () => this.addAnimationKeyframe(),
    );

    this.root.querySelector(
      '[data-editor-action="anim-new"]',
    )?.addEventListener(
      'click',
      () => this.createAnimationClip(),
    );

    this.root.querySelector(
      '[data-editor-action="anim-rename"]',
    )?.addEventListener(
      'click',
      () => this.renameAnimationClip(),
    );

    this.root.querySelector(
      '[data-editor-action="anim-delete"]',
    )?.addEventListener(
      'click',
      () => this.deleteAnimationClip(),
    );

    this.root.querySelector(
      '[data-editor-action="delete-marker"]',
    )?.addEventListener(
      'click',
      () => this.deleteBossMarker(),
    );

    this.root.querySelector(
      '[data-editor-action="delete-hitbox"]',
    )?.addEventListener(
      'click',
      () => this.deleteBossHitbox(),
    );

    this.hitboxTypeInput?.addEventListener(
      'change',
      () => this.syncBossToolUi(),
    );

    this.animationClipInput?.addEventListener(
      'change',
      () => {
        this.currentClipName =
          this.animationClipInput.value;

        if (this.animationClipNameInput) {
          this.animationClipNameInput.value =
            this.currentClipName;
        }

        this.animationTime = 0;
        this.animationPlaying = false;
        this.syncAnimationUi();
        this.renderPreview();
      },
    );

    this.animationPropertyInput?.addEventListener(
      'change',
      () => {
        this.syncAnimationValueFromSelection();
        this.syncAnimationUi();
      },
    );

    this.animationDurationInput?.addEventListener(
      'change',
      () => {
        const clip =
          this.currentAnimationClip();
        if (!clip) return;

        clip.duration = clamp(
          Number(
            this.animationDurationInput.value,
          ) || 1,
          0.05,
          60,
        );

        this.animationTime =
          Math.min(
            this.animationTime,
            clip.duration,
          );

        this.future.length = 0;
        this.syncAnimationUi();
        this.renderPreview();
      },
    );

    this.animationLoopInput?.addEventListener(
      'change',
      () => {
        const clip =
          this.currentAnimationClip();
        if (!clip) return;
        clip.loop =
          this.animationLoopInput.checked;
        this.future.length = 0;
      },
    );

    this.animationTimeInput?.addEventListener(
      'input',
      () => {
        this.animationTime =
          Number(
            this.animationTimeInput.value,
          ) || 0;
        this.animationPlaying = false;
        this.syncAnimationUi();
        this.renderPreview();
      },
    );

    const bindSelectionTransform = (
      input,
      property,
    ) => {
      input?.addEventListener(
        'change',
        () => {
          const parts =
            this.getSelectedParts();

          if (
            parts.length !== 1
          ) {
            return;
          }

          const value =
            Number(input.value);

          if (!Number.isFinite(value)) {
            this.updateSelectionInspector();
            return;
          }

          this.pushHistory();
          this.future.length = 0;

          parts[0][property] = value;

          if (
            this.animationPropertyInput
              ?.value === property
          ) {
            this.animationValueInput.value =
              String(value);
          }

          this.renderAll();
        },
      );
    };

    bindSelectionTransform(
      this.selectionXInput,
      'x',
    );

    bindSelectionTransform(
      this.selectionYInput,
      'y',
    );

    bindSelectionTransform(
      this.selectionRotationInput,
      'rotation',
    );

    this.root.querySelector(
      '[data-editor-action="test-weapon"]',
    )?.addEventListener(
      'click',
      () => {
        if (!this.isWeaponMode()) {
          return;
        }

        try {
          this.onTestWeapon?.(
            this.currentCandidate(),
          );
        } catch (error) {
          this.setStatus(
            error?.message ?? String(error),
            true,
          );
        }
      },
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
    this.selectedPartIds.clear();
    this.tool = 'select';
    this.material = 'gray';
    this.draftPoints = [];
    this.history.length = 0;
    this.future.length = 0;
    this.panX = 0;
    this.panY = 0;
    this.zoom = 12;
    this.currentClipName = 'idle';
    this.animationTime = 0;
    this.animationPlaying = false;
    this.selectedHitboxId = null;

    if (
      this.asset.type === 'weapon' &&
      this.asset.parts.length === 0
    ) {
      this.asset.pivot = [0, 0];
      this.asset.markers ??= {};

      if (!this.asset.markers.muzzle) {
        this.asset.markers.muzzle = {
          x: 12,
          y: 0,
          rotation: 0,
        };
      }
    }

    this.asset.animations =
      normalizeAnimations(
        this.asset.animations,
      );

    this.nameInput.value =
      this.asset.displayName ??
      this.asset.name;

    this.typeSelect.value =
      this.asset.type;

    if (this.scaleInput) {
      this.scaleInput.value =
        String(this.asset.scale ?? 1);
    }

    if (this.pixelSizeInput) {
      this.pixelSizeInput.value =
        String(
          this.asset.render
            ?.artPixelSize ??
          4,
        );
    }

    if (this.flipOnReverseInput) {
      this.flipOnReverseInput.checked =
        this.asset.render?.flipOnReverse === true;
    }

    this.opened = true;
    this.updateModeUi();
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

    candidate.render ??= {};
    candidate.render.flipOnReverse =
      !!this.flipOnReverseInput?.checked;

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
    this.asset.animations =
      normalizeAnimations(
        this.asset.animations,
      );
    this.selectedPartId = null;
    this.selectedPartIds.clear();
    this.animationTime = 0;
    this.animationPlaying = false;
    this.selectedHitboxId = null;
    this.draftPoints = [];

    this.nameInput.value =
      imported.displayName;

    this.typeSelect.value =
      imported.type;

    if (this.scaleInput) {
      this.scaleInput.value =
        String(imported.scale ?? 1);
    }

    if (this.pixelSizeInput) {
      this.pixelSizeInput.value =
        String(
          imported.render
            ?.artPixelSize ??
          4,
        );
    }

    if (this.flipOnReverseInput) {
      this.flipOnReverseInput.checked =
        imported.render?.flipOnReverse === true;
    }

    this.setTool('select');
    this.updateModeUi();

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

      let previewDirty = false;

      if (
        this.animationPlaying
      ) {
        const clip =
          this.currentAnimationClip();

        if (clip) {
          this.animationTime += dt;

          if (clip.loop) {
            this.animationTime =
              (
                this.animationTime %
                clip.duration
              );
          } else if (
            this.animationTime >=
            clip.duration
          ) {
            this.animationTime =
              clip.duration;
            this.animationPlaying =
              false;
          }

          this.syncAnimationUi();
          previewDirty = true;
        }
      }

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

        previewDirty = true;
      }

      if (previewDirty) {
        this.renderPreview();
      }

      this.previewFrame =
        requestAnimationFrame(tick);
    };

    this.previewFrame =
      requestAnimationFrame(tick);
  }

  isWeaponMode() {
    return (
      this.typeSelect?.value ===
        'weapon' ||
      this.asset.type === 'weapon'
    );
  }

  isBossMode() {
    return (
      this.typeSelect?.value ===
        'boss' ||
      this.asset.type === 'boss'
    );
  }

  sanitizeEditorName(
    value,
    fallback = 'item',
  ) {
    const cleaned =
      String(value ?? '')
        .trim()
        .toLowerCase()
        .replace(
          /[^a-z0-9-_ ]+/g,
          '',
        )
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

    return cleaned || fallback;
  }

  updateModeUi() {
    const weapon =
      this.isWeaponMode();

    const boss =
      this.isBossMode();

    this.weaponToolsRoot
      ?.classList.toggle(
        'hidden',
        !weapon,
      );

    this.weaponTestControls
      ?.classList.toggle(
        'hidden',
        !weapon,
      );

    this.bossToolsRoot
      ?.classList.toggle(
        'hidden',
        !boss,
      );

    // Animation clips are useful for every sprite type. Bosses especially
    // need arbitrary named clips that can later be bound to attacks.
    this.animationPanelRoot
      ?.classList.remove(
        'hidden',
      );

    this.root?.classList.toggle(
      'weapon-editor-mode',
      weapon,
    );

    this.root?.classList.toggle(
      'boss-editor-mode',
      boss,
    );

    this.updateWeaponMarkerInfo();
    this.syncBossToolUi();
    this.syncAnimationUi();
  }

  updateWeaponMarkerInfo() {
    if (!this.weaponMarkerInfo) {
      return;
    }

    const pivot =
      this.asset.pivot ?? [0, 0];

    const muzzle =
      this.asset.markers?.muzzle;

    const format = value =>
      Number(value)
        .toFixed(2)
        .replace(/\.00$/, '');

    this.weaponMarkerInfo.innerHTML =
      `<span>pivot: ${format(pivot[0])}, ${format(pivot[1])}</span>` +
      (
        muzzle
          ? `<span>muzzle: ${format(muzzle.x)}, ${format(muzzle.y)}</span>`
          : '<span>muzzle: not set</span>'
      );
  }

  syncBossToolUi() {
    if (
      this.hitboxSizeYInput
    ) {
      this.hitboxSizeYInput.disabled =
        this.hitboxTypeInput?.value !==
        'rect';
    }

    this.updateBossMarkerInfo();
    this.renderHitboxList();
  }

  updateBossMarkerInfo() {
    if (!this.bossMarkerInfo) {
      return;
    }

    const entries =
      Object.entries(
        this.asset.markers ?? {},
      );

    if (!entries.length) {
      this.bossMarkerInfo.innerHTML =
        '<span>no boss markers</span>';
      return;
    }

    const format = value =>
      Number(value)
        .toFixed(2)
        .replace(/\.00$/, '');

    this.bossMarkerInfo.innerHTML =
      entries
        .map(
          ([name, marker]) =>
            `<span>${name}: ${format(marker.x)}, ${format(marker.y)}</span>`,
        )
        .join('');
  }

  renderHitboxList() {
    if (!this.hitboxListRoot) {
      return;
    }

    const hitboxes =
      this.asset.hitboxes ?? [];

    if (!hitboxes.length) {
      this.hitboxListRoot.innerHTML =
        '<span>no hitboxes</span>';
      return;
    }

    this.hitboxListRoot.innerHTML =
      hitboxes
        .map(hitbox => {
          const size =
            hitbox.type === 'rect'
              ? `${hitbox.width}×${hitbox.height}`
              : `r${hitbox.radius}`;

          return (
            `<span>${hitbox.name || hitbox.id}: ${hitbox.type} ${size} @ ${hitbox.x}, ${hitbox.y}</span>`
          );
        })
        .join('');
  }

  deleteBossMarker() {
    if (!this.isBossMode()) return;

    const name =
      this.sanitizeEditorName(
        this.bossMarkerNameInput
          ?.value,
        'core',
      );

    if (
      !this.asset.markers?.[name]
    ) {
      this.setStatus(
        `Marker "${name}" does not exist.`,
        true,
      );
      return;
    }

    this.pushHistory();
    this.future.length = 0;
    delete this.asset.markers[name];

    this.setStatus(
      `Deleted marker "${name}".`,
    );

    this.renderAll();
  }

  deleteBossHitbox() {
    if (!this.isBossMode()) return;

    const name =
      this.sanitizeEditorName(
        this.hitboxNameInput?.value,
        'body',
      );

    const before =
      this.asset.hitboxes?.length ?? 0;

    const remaining =
      (this.asset.hitboxes ?? [])
        .filter(
          hitbox =>
            hitbox.id !== name &&
            hitbox.name !== name,
        );

    if (
      remaining.length ===
      before
    ) {
      this.setStatus(
        `Hitbox "${name}" does not exist.`,
        true,
      );
      return;
    }

    this.pushHistory();
    this.future.length = 0;
    this.asset.hitboxes =
      remaining;

    this.setStatus(
      `Deleted hitbox "${name}".`,
    );

    this.renderAll();
  }

  currentSelectedGroup() {
    const target =
      this.currentAnimationTarget();

    if (
      target?.targetType !==
      'group'
    ) {
      return null;
    }

    return this.getGroup(
      target.targetId,
    );
  }

  drawWeaponConstructionGuide(ctx) {
    if (!this.isWeaponMode()) {
      return;
    }

    const pivot =
      this.asset.pivot ?? [0, 0];

    const scale = Math.max(
      0.1,
      Number(
        this.scaleInput?.value ??
        this.asset.scale ??
        1,
      ) || 1,
    );

    const playerWidth =
      8 / scale;

    const playerHeight =
      14 / scale;

    // The player reference is anchored at the sprite-space origin.
    // The editable weapon pivot starts at this exact center, but can be moved
    // independently (for example upward toward a shoulder/hand mount).
    const playerCenter = [
      0,
      0,
    ];

    const [
      playerLeft,
      playerTop,
    ] = this.worldToScreen([
      playerCenter[0] -
        playerWidth / 2,
      playerCenter[1] -
        playerHeight / 2,
    ]);

    const playerScreenW =
      playerWidth * this.zoom;

    const playerScreenH =
      playerHeight * this.zoom;

    const [px, py] =
      this.worldToScreen(pivot);

    ctx.save();

    ctx.globalAlpha = 0.20;
    ctx.fillStyle = '#8a8e95';
    ctx.fillRect(
      playerLeft,
      playerTop,
      playerScreenW,
      playerScreenH,
    );

    ctx.globalAlpha = 0.42;
    ctx.strokeStyle = '#7c8490';
    ctx.lineWidth = 1;
    ctx.strokeRect(
      playerLeft + 0.5,
      playerTop + 0.5,
      playerScreenW,
      playerScreenH,
    );

    ctx.globalAlpha = 0.34;
    ctx.strokeStyle = '#aeb8c5';
    ctx.setLineDash([8, 8]);
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(
      px + 38 * this.zoom,
      py,
    );
    ctx.stroke();

    ctx.setLineDash([]);

    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = '#c9d1dc';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(
      px,
      py,
      6,
      0,
      Math.PI * 2,
    );
    ctx.stroke();

    ctx.fillStyle = '#c9d1dc';
    ctx.font =
      "10px 'Pixel Arial 11', Arial, sans-serif";
    ctx.fillText(
      'pivot',
      px + 9,
      py - 8,
    );

    const muzzle =
      this.asset.markers?.muzzle;

    if (muzzle) {
      const [mx, my] =
        this.worldToScreen([
          muzzle.x,
          muzzle.y,
        ]);

      ctx.strokeStyle = '#ff7777';
      ctx.fillStyle = '#ff7777';

      ctx.beginPath();
      ctx.arc(
        mx,
        my,
        6,
        0,
        Math.PI * 2,
      );
      ctx.stroke();

      ctx.fillText(
        'muzzle',
        mx + 9,
        my - 8,
      );
    }

    ctx.restore();
  }

  drawBossConstructionGuide(ctx) {
    if (!this.isBossMode()) {
      return;
    }

    ctx.save();
    ctx.font =
      "10px 'Pixel Arial 11', Arial, sans-serif";

    for (
      const group
      of this.asset.groups ?? []
    ) {
      const [gx, gy] =
        this.worldToScreen(
          group.pivot ?? [0, 0],
        );

      ctx.strokeStyle = '#75b7ff';
      ctx.fillStyle = '#75b7ff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(
        gx,
        gy,
        6,
        0,
        Math.PI * 2,
      );
      ctx.stroke();

      ctx.fillText(
        group.id,
        gx + 9,
        gy - 7,
      );
    }

    for (
      const [name, marker]
      of Object.entries(
        this.asset.markers ?? {},
      )
    ) {
      const [mx, my] =
        this.worldToScreen([
          marker.x,
          marker.y,
        ]);

      ctx.strokeStyle = '#ffd66b';
      ctx.fillStyle = '#ffd66b';
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.moveTo(mx - 6, my);
      ctx.lineTo(mx + 6, my);
      ctx.moveTo(mx, my - 6);
      ctx.lineTo(mx, my + 6);
      ctx.stroke();

      ctx.fillText(
        name,
        mx + 8,
        my - 8,
      );
    }

    ctx.setLineDash([7, 5]);
    ctx.strokeStyle = '#ff78d7';
    ctx.fillStyle = '#ff78d7';

    for (
      const hitbox
      of this.asset.hitboxes ?? []
    ) {
      const [hx, hy] =
        this.worldToScreen([
          hitbox.x,
          hitbox.y,
        ]);

      if (hitbox.type === 'rect') {
        const w =
          hitbox.width *
          this.zoom;

        const h =
          hitbox.height *
          this.zoom;

        ctx.strokeRect(
          hx - w / 2,
          hy - h / 2,
          w,
          h,
        );
      } else {
        ctx.beginPath();
        ctx.arc(
          hx,
          hy,
          hitbox.radius *
            this.zoom,
          0,
          Math.PI * 2,
        );
        ctx.stroke();
      }

      ctx.fillText(
        hitbox.name ||
          hitbox.id,
        hx + 8,
        hy + 12,
      );
    }

    ctx.restore();
  }

  setTool(tool) {
    const allowed =
      new Set([
        'select',
        'polygon',
        'pivot',
        'muzzle',
        'group-pivot',
        'marker',
        'hitbox',
      ]);

    if (!allowed.has(tool)) {
      return;
    }

    if (
      (
        tool === 'pivot' ||
        tool === 'muzzle'
      ) &&
      !this.isWeaponMode()
    ) {
      return;
    }

    if (
      (
        tool === 'marker' ||
        tool === 'hitbox'
      ) &&
      !this.isBossMode()
    ) {
      return;
    }

    if (
      tool === 'group-pivot' &&
      !this.currentSelectedGroup()
    ) {
      this.setStatus(
        'Select one complete group before setting its pivot.',
        true,
      );
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

    const markerName =
      this.sanitizeEditorName(
        this.bossMarkerNameInput?.value,
        'core',
      );

    const hitboxName =
      this.sanitizeEditorName(
        this.hitboxNameInput?.value,
        'body',
      );

    const statusByTool = {
      polygon:
        'Polygon: click vertices, click the first point or press Enter to close, Esc to cancel.',
      pivot:
        'Set pivot: click the weapon hand / rotation point.',
      muzzle:
        'Set muzzle: click where shots should originate.',
      'group-pivot':
        'Set group pivot: click the point this selected group should rotate around.',
      marker:
        `Place marker "${markerName}": click its boss-space position.`,
      hitbox:
        `Place hitbox "${hitboxName}": click its center. Reusing the name updates it.`,
      select:
        'Select: click a shape; drag vertices or the whole shape.',
    };

    this.setStatus(
      statusByTool[tool] ??
        statusByTool.select,
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
      selectedPartIds:
        [...this.selectedPartIds],
    };
  }

  restore(snapshot) {
    this.asset =
      normalizeSpriteAsset(
        snapshot.asset,
      );

    this.selectedPartId =
      snapshot.selectedPartId;
    this.selectedPartIds =
      new Set(
        snapshot.selectedPartIds ??
        (
          snapshot.selectedPartId
            ? [snapshot.selectedPartId]
            : []
        ),
      );

    if (
      this.selectedPartId &&
      !this.getSelectedPart()
    ) {
      this.selectedPartId = null;
      this.selectedPartIds.clear();
    }

    this.nameInput.value =
      this.asset.displayName;

    this.typeSelect.value =
      this.asset.type;

    if (this.scaleInput) {
      this.scaleInput.value =
        String(this.asset.scale ?? 1);
    }

    if (this.pixelSizeInput) {
      this.pixelSizeInput.value =
        String(
          this.asset.render
            ?.artPixelSize ??
          4,
        );
    }

    if (this.flipOnReverseInput) {
      this.flipOnReverseInput.checked =
        this.asset.render?.flipOnReverse === true;
    }

    this.updateModeUi();
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

  getSelectedParts() {
    return this.asset.parts.filter(
      part =>
        this.selectedPartIds.has(
          part.id,
        ),
    );
  }

  getGroup(groupId) {
    return (
      this.asset.groups?.find(
        group =>
          group.id === groupId,
      ) ?? null
    );
  }

  groupSelected() {
    const parts =
      this.getSelectedParts();

    if (parts.length < 2) {
      this.setStatus(
        'Shift-click at least two parts to group them.',
        true,
      );
      return;
    }

    this.pushHistory();
    this.future.length = 0;

    const previousGroupIds =
      new Set(
        parts
          .map(part => part.groupId)
          .filter(Boolean),
      );

    const existingIds =
      new Set(
        (this.asset.groups ?? [])
          .map(group => group.id),
      );

    let index =
      (this.asset.groups?.length ?? 0) + 1;

    let id = `group-${index}`;

    while (existingIds.has(id)) {
      id =
        `group-${++index}`;
    }

    const pivot = [
      parts.reduce(
        (sum, part) =>
          sum + part.x,
        0,
      ) / parts.length,
      parts.reduce(
        (sum, part) =>
          sum + part.y,
        0,
      ) / parts.length,
    ];

    this.asset.groups ??= [];

    this.asset.groups.push({
      id,
      name: id,
      pivot,
    });

    for (const part of parts) {
      part.groupId = id;
    }

    this.asset.groups =
      (this.asset.groups ?? [])
        .filter(group => {
          if (
            !previousGroupIds.has(
              group.id,
            )
          ) {
            return true;
          }

          return this.asset.parts.some(
            part =>
              part.groupId ===
              group.id,
          );
        });

    this.setStatus(
      `Grouped ${parts.length} parts as ${id}.`,
    );

    this.syncAnimationUi();
    this.renderAll();
  }

  ungroupSelected() {
    const parts =
      this.getSelectedParts();

    const groupIds =
      new Set(
        parts
          .map(part => part.groupId)
          .filter(Boolean),
      );

    if (!groupIds.size) {
      this.setStatus(
        'The selected parts are not grouped.',
        true,
      );
      return;
    }

    this.pushHistory();
    this.future.length = 0;

    for (const part of this.asset.parts) {
      if (
        groupIds.has(
          part.groupId,
        )
      ) {
        part.groupId = null;
      }
    }

    this.asset.groups =
      (this.asset.groups ?? [])
        .filter(
          group =>
            !groupIds.has(
              group.id,
            ),
        );

    this.setStatus(
      `Ungrouped ${groupIds.size} group${groupIds.size === 1 ? '' : 's'}.`,
    );

    this.syncAnimationUi();
    this.renderAll();
  }

  mirrorSelected() {
    const mode =
      this.getSymmetryMode();

    if (mode === 'off') {
      this.setStatus(
        'Choose vertical or horizontal symmetry before mirroring.',
        true,
      );
      return;
    }

    const parts =
      this.getSelectedParts();

    if (!parts.length) {
      this.setStatus(
        'Select at least one part to mirror.',
        true,
      );
      return;
    }

    this.pushHistory();
    this.future.length = 0;

    const created = [];

    for (const part of parts) {
      const copy = clone(part);
      copy.id =
        this.uniquePartId(
          'mirror',
        );

      copy.name =
        `${part.name || part.id} mirror`;

      copy.groupId = null;

      if (mode === 'vertical') {
        copy.x = -copy.x;

        if (
          copy.type === 'polygon'
        ) {
          copy.points =
            copy.points
              .map(
                ([x, y]) =>
                  [-x, y],
              )
              .reverse();
        }
      } else {
        copy.y = -copy.y;

        if (
          copy.type === 'polygon'
        ) {
          copy.points =
            copy.points
              .map(
                ([x, y]) =>
                  [x, -y],
              )
              .reverse();
        }
      }

      copy.rotation =
        -(copy.rotation ?? 0);

      this.asset.parts.push(copy);
      created.push(copy.id);
    }

    this.selectedPartIds =
      new Set(created);

    this.selectedPartId =
      created[0] ?? null;

    this.setStatus(
      `Mirrored ${created.length} part${created.length === 1 ? '' : 's'} across the ${mode} axis.`,
    );

    this.renderAll();
  }

  currentAnimationClip() {
    this.asset.animations =
      normalizeAnimations(
        this.asset.animations,
      );

    const clips =
      this.asset.animations.clips;

    if (
      !clips[
        this.currentClipName
      ]
    ) {
      const first =
        Object.keys(clips)[0];

      if (first) {
        this.currentClipName =
          first;
      }
    }

    return (
      clips[
        this.currentClipName
      ] ?? null
    );
  }

  syncAnimationClipOptions() {
    if (!this.animationClipInput) {
      return;
    }

    this.asset.animations =
      normalizeAnimations(
        this.asset.animations,
      );

    const names =
      Object.keys(
        this.asset.animations.clips,
      );

    this.animationClipInput.innerHTML =
      '';

    for (const name of names) {
      const option =
        document.createElement(
          'option',
        );

      option.value = name;
      option.textContent = name;
      this.animationClipInput
        .appendChild(option);
    }

    if (
      names.length &&
      !names.includes(
        this.currentClipName,
      )
    ) {
      this.currentClipName =
        names[0];
    }

    if (names.length) {
      this.animationClipInput.value =
        this.currentClipName;
    }

    if (
      this.animationClipNameInput
    ) {
      this.animationClipNameInput.value =
        this.currentClipName ??
        '';
    }
  }

  createAnimationClip() {
    const requested =
      this.animationClipNameInput
        ?.value;

    const name =
      this.sanitizeEditorName(
        requested,
        `animation-${
          Object.keys(
            this.asset.animations
              ?.clips ?? {},
          ).length + 1
        }`,
      );

    this.asset.animations =
      normalizeAnimations(
        this.asset.animations,
      );

    if (
      this.asset.animations
        .clips[name]
    ) {
      this.setStatus(
        `Animation clip "${name}" already exists.`,
        true,
      );
      return;
    }

    this.pushHistory();
    this.future.length = 0;

    this.asset.animations
      .clips[name] = {
        name,
        duration: 1,
        loop: false,
        tracks: [],
      };

    this.currentClipName = name;
    this.animationTime = 0;
    this.animationPlaying = false;

    this.setStatus(
      `Created animation clip "${name}".`,
    );

    this.syncAnimationUi();
    this.renderPreview();
  }

  renameAnimationClip() {
    const clip =
      this.currentAnimationClip();

    if (!clip) return;

    const nextName =
      this.sanitizeEditorName(
        this.animationClipNameInput
          ?.value,
        this.currentClipName,
      );

    if (
      nextName ===
      this.currentClipName
    ) {
      return;
    }

    if (
      this.asset.animations
        .clips[nextName]
    ) {
      this.setStatus(
        `Animation clip "${nextName}" already exists.`,
        true,
      );
      return;
    }

    this.pushHistory();
    this.future.length = 0;

    const previous =
      this.currentClipName;

    delete this.asset.animations
      .clips[previous];

    clip.name = nextName;

    this.asset.animations
      .clips[nextName] = clip;

    this.currentClipName =
      nextName;

    this.setStatus(
      `Renamed "${previous}" to "${nextName}".`,
    );

    this.syncAnimationUi();
  }

  deleteAnimationClip() {
    const clip =
      this.currentAnimationClip();

    if (!clip) return;

    this.pushHistory();
    this.future.length = 0;

    const removed =
      this.currentClipName;

    delete this.asset.animations
      .clips[removed];

    let names =
      Object.keys(
        this.asset.animations.clips,
      );

    if (!names.length) {
      const fallback =
        'animation-1';

      this.asset.animations
        .clips[fallback] = {
          name: fallback,
          duration: 1,
          loop: false,
          tracks: [],
        };

      names = [fallback];
    }

    this.currentClipName =
      names[0];

    this.animationTime = 0;
    this.animationPlaying = false;

    this.setStatus(
      `Deleted animation clip "${removed}".`,
    );

    this.syncAnimationUi();
    this.renderPreview();
  }

  currentAnimationTarget() {
    const parts =
      this.getSelectedParts();

    if (!parts.length) {
      return null;
    }

    const groupIds =
      new Set(
        parts
          .map(part => part.groupId)
          .filter(Boolean),
      );

    if (
      groupIds.size === 1
    ) {
      const groupId =
        [...groupIds][0];

      const groupParts =
        this.asset.parts.filter(
          part =>
            part.groupId ===
            groupId,
        );

      const allSelected =
        groupParts.every(
          part =>
            this.selectedPartIds.has(
              part.id,
            ),
        );

      if (
        allSelected ||
        parts.length === 1
      ) {
        return {
          targetType: 'group',
          targetId: groupId,
        };
      }
    }

    if (parts.length === 1) {
      return {
        targetType: 'part',
        targetId: parts[0].id,
      };
    }

    return null;
  }

  syncAnimationValueFromSelection() {
    if (!this.animationValueInput) {
      return;
    }

    const target =
      this.currentAnimationTarget();

    const property =
      this.animationPropertyInput
        ?.value ?? 'x';

    if (!target) {
      this.animationValueInput.value =
        '0';
      return;
    }

    if (
      target.targetType === 'group'
    ) {
      this.animationValueInput.value =
        '0';
      return;
    }

    const part =
      this.asset.parts.find(
        item =>
          item.id ===
          target.targetId,
      );

    this.animationValueInput.value =
      String(
        Number(
          part?.[property] ?? 0,
        ),
      );
  }

  syncAnimationUi() {
    this.syncAnimationClipOptions();

    const clip =
      this.currentAnimationClip();

    if (!clip) return;

    if (this.animationClipInput) {
      this.animationClipInput.value =
        this.currentClipName;
    }

    if (this.animationDurationInput) {
      this.animationDurationInput.value =
        String(clip.duration);
    }

    if (this.animationLoopInput) {
      this.animationLoopInput.checked =
        !!clip.loop;
    }

    if (this.animationTimeInput) {
      this.animationTimeInput.max =
        String(clip.duration);

      this.animationTimeInput.value =
        String(
          clamp(
            this.animationTime,
            0,
            clip.duration,
          ),
        );
    }

    if (this.animationTimeLabel) {
      this.animationTimeLabel.textContent =
        `${this.animationTime.toFixed(2)}s`;
    }

    const target =
      this.currentAnimationTarget();

    if (this.animationTargetRoot) {
      const property =
        this.animationPropertyInput
          ?.value ?? 'x';

      this.animationTargetRoot.innerHTML =
        target
          ? (
              `<span>target: ${target.targetType} ${target.targetId}</span>` +
              `<span>keying: ${property} at ${this.animationTime.toFixed(2)}s</span>`
            )
          : (
              '<span>target: select one part or one complete group</span>' +
              '<span>Grouped parts animate together automatically.</span>'
            );
    }

    this.renderAnimationKeys();
  }

  renderAnimationKeys() {
    if (!this.animationKeysRoot) {
      return;
    }

    const clip =
      this.currentAnimationClip();

    const target =
      this.currentAnimationTarget();

    const property =
      this.animationPropertyInput
        ?.value ?? 'x';

    if (!clip || !target) {
      this.animationKeysRoot.innerHTML =
        '<span>no keyframes</span>';
      return;
    }

    const track =
      clip.tracks.find(
        item =>
          item.targetType ===
            target.targetType &&
          item.targetId ===
            target.targetId &&
          item.property ===
            property,
      );

    if (
      !track ||
      !track.keyframes.length
    ) {
      this.animationKeysRoot.innerHTML =
        '<span>no keyframes</span>';
      return;
    }

    this.animationKeysRoot.innerHTML =
      '';

    for (
      const key
      of track.keyframes
    ) {
      const row =
        document.createElement(
          'div',
        );

      row.className =
        'sprite-animation-key-row';

      const seek =
        document.createElement(
          'button',
        );

      seek.className =
        'sprite-animation-key-seek';

      seek.textContent =
        `${key.time.toFixed(2)}s → ${key.value.toFixed(2)} · ${key.easing}`;

      seek.addEventListener(
        'click',
        () => {
          this.animationTime =
            key.time;

          this.animationPlaying =
            false;

          if (
            this.animationValueInput
          ) {
            this.animationValueInput.value =
              String(key.value);
          }

          this.syncAnimationUi();
          this.renderPreview();
        },
      );

      const remove =
        document.createElement(
          'button',
        );

      remove.className =
        'sprite-animation-key-delete';

      remove.textContent = '×';
      remove.title =
        'delete keyframe';

      remove.addEventListener(
        'click',
        () => {
          this.pushHistory();
          this.future.length = 0;

          track.keyframes =
            track.keyframes.filter(
              entry =>
                entry !== key,
            );

          if (
            !track.keyframes.length
          ) {
            clip.tracks =
              clip.tracks.filter(
                entry =>
                  entry !== track,
              );
          }

          this.setStatus(
            `Deleted keyframe at ${key.time.toFixed(2)}s.`,
          );

          this.syncAnimationUi();
          this.renderPreview();
        },
      );

      row.append(
        seek,
        remove,
      );

      this.animationKeysRoot
        .appendChild(row);
    }
  }

  addAnimationKeyframe() {
    const clip =
      this.currentAnimationClip();

    const target =
      this.currentAnimationTarget();

    if (!clip || !target) {
      this.setStatus(
        'Select one part or one complete group before adding a keyframe.',
        true,
      );
      return;
    }

    const property =
      this.animationPropertyInput
        ?.value ?? 'x';

    let value =
      Number(
        this.animationValueInput
          ?.value,
      );

    if (!Number.isFinite(value)) {
      value = 0;
    }

    this.pushHistory();
    this.future.length = 0;

    upsertKeyframe(
      clip,
      {
        targetType:
          target.targetType,
        targetId:
          target.targetId,
        property,
        time:
          this.animationTime,
        value,
        easing:
          this.animationEasingInput
            ?.value ??
          'easeInOutSine',
      },
    );

    this.setStatus(
      `Keyed ${property} at ${this.animationTime.toFixed(2)}s.`,
    );

    this.syncAnimationUi();
    this.renderPreview();
  }

  getAnimationPreviewAsset() {
    const candidate =
      this.currentCandidate();

    return applyAnimationPose(
      candidate,
      evaluateAnimation(
        candidate.animations,
        this.currentClipName,
        this.animationTime,
      ),
    );
  }

  updateSelectionInspector() {
    const parts =
      this.getSelectedParts();

    if (!this.selectionSummary) {
      return;
    }

    const inputs = [
      this.selectionXInput,
      this.selectionYInput,
      this.selectionRotationInput,
    ];

    if (!parts.length) {
      this.selectionSummary.textContent =
        'nothing selected';

      for (const input of inputs) {
        if (!input) continue;
        input.value = '';
        input.disabled = true;
      }

      return;
    }

    if (parts.length > 1) {
      const groupIds =
        new Set(
          parts
            .map(part => part.groupId)
            .filter(Boolean),
        );

      this.selectionSummary.textContent =
        groupIds.size === 1
          ? `${parts.length} parts selected · ${[...groupIds][0]}`
          : `${parts.length} parts selected`;

      for (const input of inputs) {
        if (!input) continue;
        input.value = '';
        input.disabled = true;
      }

      return;
    }

    const part = parts[0];

    this.selectionSummary.textContent =
      part.groupId
        ? `${part.name || part.id} · ${part.groupId}`
        : part.name || part.id;

    const values = [
      [this.selectionXInput, part.x],
      [this.selectionYInput, part.y],
      [
        this.selectionRotationInput,
        part.rotation ?? 0,
      ],
    ];

    for (
      const [input, value]
      of values
    ) {
      if (!input) continue;
      input.disabled = false;
      input.value =
        String(
          Number(value ?? 0),
        );
    }
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
    this.selectedPartIds =
      new Set([copy.id]);
    this.material =
      copy.material;

    this.renderAll();
  }

  deleteSelected() {
    const ids =
      this.selectedPartIds.size
        ? new Set(
            this.selectedPartIds,
          )
        : this.selectedPartId
          ? new Set([
              this.selectedPartId,
            ])
          : new Set();

    if (!ids.size) return;

    this.pushHistory();
    this.future.length = 0;

    const removedGroupIds =
      new Set(
        this.asset.parts
          .filter(part =>
            ids.has(part.id),
          )
          .map(part => part.groupId)
          .filter(Boolean),
      );

    this.asset.parts =
      this.asset.parts.filter(
        part =>
          !ids.has(part.id),
      );

    for (
      const groupId
      of removedGroupIds
    ) {
      const remaining =
        this.asset.parts.some(
          part =>
            part.groupId ===
            groupId,
        );

      if (!remaining) {
        this.asset.groups =
          (this.asset.groups ?? [])
            .filter(
              group =>
                group.id !== groupId,
            );
      }
    }

    this.selectedPartId = null;
    this.selectedPartIds.clear();
    this.syncAnimationUi();
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

  distanceToSegment(
    px,
    py,
    ax,
    ay,
    bx,
    by,
  ) {
    const abx = bx - ax;
    const aby = by - ay;
    const apx = px - ax;
    const apy = py - ay;

    const lengthSquared =
      abx * abx +
      aby * aby ||
      0.000001;

    const t = clamp(
      (
        apx * abx +
        apy * aby
      ) /
      lengthSquared,
      0,
      1,
    );

    return Math.hypot(
      px - (ax + abx * t),
      py - (ay + aby * t),
    );
  }

  polygonEdgeDistance(
    local,
    points,
  ) {
    let best = Infinity;

    for (
      let i = 0;
      i < points.length;
      i++
    ) {
      const a = points[i];
      const b =
        points[
          (i + 1) %
          points.length
        ];

      best = Math.min(
        best,
        this.distanceToSegment(
          local[0],
          local[1],
          a[0],
          a[1],
          b[0],
          b[1],
        ),
      );
    }

    return best;
  }

  hitPart(worldPoint) {
    const tolerance =
      Math.max(
        0.55,
        10 / this.zoom,
      );

    let nearest = null;

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

      let exact = false;
      let distance = Infinity;

      if (part.type === 'rectangle') {
        exact =
          Math.abs(local[0]) <=
            part.width / 2 &&
          Math.abs(local[1]) <=
            part.height / 2;

        if (!exact) {
          const dx = Math.max(
            0,
            Math.abs(local[0]) -
              part.width / 2,
          );

          const dy = Math.max(
            0,
            Math.abs(local[1]) -
              part.height / 2,
          );

          distance =
            Math.hypot(dx, dy);
        }
      } else {
        exact =
          pointInPolygon(
            local[0],
            local[1],
            part.points,
          );

        if (!exact) {
          distance =
            this.polygonEdgeDistance(
              local,
              part.points,
            );
        }
      }

      if (exact) {
        return part;
      }

      if (
        distance <= tolerance &&
        (
          !nearest ||
          distance <
            nearest.distance
        )
      ) {
        nearest = {
          part,
          distance,
          z: i,
        };
      }
    }

    return nearest?.part ?? null;
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

    if (
      this.tool === 'pivot' ||
      this.tool === 'muzzle' ||
      this.tool === 'group-pivot' ||
      this.tool === 'marker' ||
      this.tool === 'hitbox'
    ) {
      this.pushHistory();
      this.future.length = 0;

      if (this.tool === 'pivot') {
        this.asset.pivot = [
          world[0],
          world[1],
        ];

        this.setStatus(
          `Pivot set to ${world[0]}, ${world[1]}.`,
        );
      } else if (
        this.tool === 'muzzle'
      ) {
        this.asset.markers = {
          ...(this.asset.markers ?? {}),
          muzzle: {
            x: world[0],
            y: world[1],
            rotation: 0,
          },
        };

        this.setStatus(
          `Muzzle set to ${world[0]}, ${world[1]}.`,
        );
      } else if (
        this.tool === 'group-pivot'
      ) {
        const group =
          this.currentSelectedGroup();

        if (!group) {
          this.setStatus(
            'Select one complete group before setting its pivot.',
            true,
          );
        } else {
          group.pivot = [
            world[0],
            world[1],
          ];

          this.setStatus(
            `Group pivot "${group.id}" set to ${world[0]}, ${world[1]}.`,
          );
        }
      } else if (
        this.tool === 'marker'
      ) {
        const name =
          this.sanitizeEditorName(
            this.bossMarkerNameInput
              ?.value,
            'core',
          );

        this.asset.markers ??= {};

        this.asset.markers[name] = {
          x: world[0],
          y: world[1],
          rotation: 0,
        };

        if (
          this.bossMarkerNameInput
        ) {
          this.bossMarkerNameInput.value =
            name;
        }

        this.setStatus(
          `Marker "${name}" set to ${world[0]}, ${world[1]}.`,
        );
      } else {
        const name =
          this.sanitizeEditorName(
            this.hitboxNameInput?.value,
            'body',
          );

        const type =
          this.hitboxTypeInput?.value ===
          'rect'
            ? 'rect'
            : 'circle';

        const sizeX =
          Math.max(
            0.25,
            Number(
              this.hitboxSizeXInput
                ?.value,
            ) || 16,
          );

        const sizeY =
          Math.max(
            0.25,
            Number(
              this.hitboxSizeYInput
                ?.value,
            ) || sizeX,
          );

        this.asset.hitboxes ??= [];

        const existing =
          this.asset.hitboxes.find(
            hitbox =>
              hitbox.id === name ||
              hitbox.name === name,
          );

        const next = {
          id: name,
          name,
          type,
          x: world[0],
          y: world[1],
        };

        if (type === 'rect') {
          next.width = sizeX;
          next.height = sizeY;
        } else {
          next.radius = sizeX;
        }

        if (existing) {
          Object.assign(
            existing,
            next,
          );
        } else {
          this.asset.hitboxes.push(
            next,
          );
        }

        this.selectedHitboxId =
          name;

        if (this.hitboxNameInput) {
          this.hitboxNameInput.value =
            name;
        }

        this.setStatus(
          `Hitbox "${name}" placed at ${world[0]}, ${world[1]}.`,
        );
      }

      this.setTool('select');
      this.updateWeaponMarkerInfo();
      this.syncBossToolUi();
      this.renderAll();
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
      if (event.shiftKey) {
        if (
          this.selectedPartIds.has(
            hit.id,
          )
        ) {
          this.selectedPartIds.delete(
            hit.id,
          );
        } else {
          this.selectedPartIds.add(
            hit.id,
          );
        }

        if (
          !this.selectedPartIds.size
        ) {
          this.selectedPartId = null;
          this.renderAll();
          return;
        }
      } else if (
        !this.selectedPartIds.has(
          hit.id,
        )
      ) {
        this.selectedPartIds.clear();
        this.selectedPartIds.add(
          hit.id,
        );
      }

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

      this.syncAnimationValueFromSelection();
      this.renderAll();
    } else {
      if (!event.shiftKey) {
        this.selectedPartId = null;
        this.selectedPartIds.clear();
      }

      this.syncAnimationUi();
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

      let targets = [part];
      let movedGroup = null;

      if (part.groupId) {
        targets =
          this.asset.parts.filter(
            item =>
              item.groupId ===
              part.groupId,
          );

        movedGroup =
          this.getGroup(
            part.groupId,
          );
      } else if (
        this.selectedPartIds.size > 1 &&
        this.selectedPartIds.has(
          part.id,
        )
      ) {
        targets =
          this.asset.parts.filter(
            item =>
              this.selectedPartIds.has(
                item.id,
              ),
          );
      }

      for (const target of targets) {
        target.x += dx;
        target.y += dy;

        if (this.snapInput?.checked) {
          target.x =
            Math.round(target.x);
          target.y =
            Math.round(target.y);
        }
      }

      if (movedGroup) {
        movedGroup.pivot[0] += dx;
        movedGroup.pivot[1] += dy;

        if (this.snapInput?.checked) {
          movedGroup.pivot[0] =
            Math.round(
              movedGroup.pivot[0],
            );

          movedGroup.pivot[1] =
            Math.round(
              movedGroup.pivot[1],
            );
        }
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
    this.syncAnimationValueFromSelection();
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
    this.selectedPartIds =
      new Set([id]);
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
        this.selectedPartIds.has(
          part.id,
        ) ||
        part.id ===
          this.selectedPartId,
      );

      row.classList.toggle(
        'multi',
        this.selectedPartIds.has(
          part.id,
        ),
      );

      row.classList.toggle(
        'grouped',
        !!part.groupId,
      );

      const select =
        document.createElement('button');

      select.className =
        'sprite-layer-select';

      select.textContent =
        part.groupId
          ? `${part.name || part.id} [${part.groupId}]`
          : part.name || part.id;

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
        event => {
          if (event.shiftKey) {
            if (
              this.selectedPartIds.has(
                part.id,
              )
            ) {
              this.selectedPartIds.delete(
                part.id,
              );
            } else {
              this.selectedPartIds.add(
                part.id,
              );
            }
          } else {
            this.selectedPartIds.clear();
            this.selectedPartIds.add(
              part.id,
            );
          }

          this.selectedPartId =
            this.selectedPartIds.size
              ? part.id
              : null;

          this.material =
            part.material;

          this.setTool('select');
          this.syncAnimationValueFromSelection();
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

    this.drawWeaponConstructionGuide(
      ctx,
    );

    for (const part of this.asset.parts) {
      this.drawPart(
        ctx,
        part,
        part.id ===
          this.selectedPartId,
      );
    }

    this.drawBossConstructionGuide(
      ctx,
    );

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

  renderWeaponPreview(
    ctx,
    w,
    h,
    compiled,
    angle,
    glowStrength,
  ) {
    const angleRadians =
      angle *
      Math.PI /
      180;

    const flipped =
      shouldFlipWeaponSprite(
        compiled.asset,
        angleRadians,
      );

    const previewShape =
      flipped
        ? mirrorShapeAcrossLocalX(
            compiled.shape,
          )
        : compiled.shape;

    const raster =
      rasterize(
        previewShape,
        angle,
      );

    const artPixel =
      clamp(
        Number(
          compiled.asset.render
            ?.artPixelSize,
        ) || 4,
        1,
        8,
      );

    const bounds =
      raster.shapeBounds ?? {
        minX:
          -raster.width / 2,
        minY:
          -raster.height / 2,
        maxX:
          raster.width / 2,
        maxY:
          raster.height / 2,
      };

    const hasPlayer =
      !!this.showPlayerInput?.checked;

    const pivot =
      compiled.asset.pivot ?? [0, 0];

    const assetScale =
      compiled.asset.scale ?? 1;

    const playerCenterX =
      -pivot[0] *
      assetScale *
      artPixel;

    const playerCenterY =
      -pivot[1] *
      assetScale *
      artPixel;

    const playerBounds = {
      minX:
        playerCenterX - 16,
      minY:
        playerCenterY - 28,
      maxX:
        playerCenterX + 16,
      maxY:
        playerCenterY + 28,
    };

    let minX =
      bounds.minX * artPixel;
    let minY =
      bounds.minY * artPixel;
    let maxX =
      bounds.maxX * artPixel;
    let maxY =
      bounds.maxY * artPixel;

    if (hasPlayer) {
      minX = Math.min(
        minX,
        playerBounds.minX,
      );

      minY = Math.min(
        minY,
        playerBounds.minY,
      );

      maxX = Math.max(
        maxX,
        playerBounds.maxX,
      );

      maxY = Math.max(
        maxY,
        playerBounds.maxY,
      );
    }

    const marker =
      compiled.markers?.muzzle;

    if (marker) {
      const [mx, my] =
        rotatePoint(
          marker.x,
          flipped
            ? -marker.y
            : marker.y,
          angle,
        );

      minX = Math.min(
        minX,
        mx * artPixel - 7,
      );

      maxX = Math.max(
        maxX,
        mx * artPixel + 7,
      );

      minY = Math.min(
        minY,
        my * artPixel - 7,
      );

      maxY = Math.max(
        maxY,
        my * artPixel + 7,
      );
    }

    const padding = 18;

    const naturalW =
      Math.max(
        1,
        maxX - minX,
      );

    const naturalH =
      Math.max(
        1,
        maxY - minY,
      );

    const trueSize =
      !!this.trueSizeInput?.checked;

    const fit =
      trueSize
        ? 1
        : Math.min(
            1,
            (w - padding * 2) /
              naturalW,
            (h - padding * 2) /
              naturalH,
          );

    const contentW =
      naturalW * fit;

    const contentH =
      naturalH * fit;

    const originX =
      (w - contentW) / 2 -
      minX * fit;

    const originY =
      (h - contentH) / 2 -
      minY * fit;

    if (hasPlayer) {
      ctx.save();
      ctx.globalAlpha = 0.36;
      ctx.fillStyle = '#8a8e95';

      ctx.fillRect(
        originX +
          playerBounds.minX *
          fit,
        originY +
          playerBounds.minY *
          fit,
        (
          playerBounds.maxX -
          playerBounds.minX
        ) * fit,
        (
          playerBounds.maxY -
          playerBounds.minY
        ) * fit,
      );

      ctx.strokeStyle =
        '#6a7079';

      ctx.strokeRect(
        originX +
          playerBounds.minX *
          fit +
          0.5,
        originY +
          playerBounds.minY *
          fit +
          0.5,
        (
          playerBounds.maxX -
          playerBounds.minX
        ) * fit,
        (
          playerBounds.maxY -
          playerBounds.minY
        ) * fit,
      );

      ctx.restore();
    }

    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.strokeStyle = '#b6c0cc';
    ctx.setLineDash([6, 7]);
    ctx.lineWidth = 1;

    const aim =
      angle *
      Math.PI /
      180;

    ctx.beginPath();
    ctx.moveTo(
      originX,
      originY,
    );

    ctx.lineTo(
      originX +
        Math.cos(aim) *
        90 *
        fit,
      originY +
        Math.sin(aim) *
        90 *
        fit,
    );

    ctx.stroke();
    ctx.restore();

    if (
      this.glowInput?.checked &&
      glowStrength > 0
    ) {
      for (
        const glowPart
        of compiled.glowParts
      ) {
        const glowShape =
          flipped
            ? mirrorShapeAcrossLocalX(
                glowPart.shape,
              )
            : glowPart.shape;

        const glowRaster =
          rasterize(
            glowShape,
            angle,
          );

        const glowBounds =
          glowRaster.shapeBounds ?? {
            minX: 0,
            minY: 0,
          };

        ctx.save();
        ctx.imageSmoothingEnabled = false;
        ctx.globalAlpha =
          0.78 *
          glowStrength;

        ctx.shadowColor =
          glowPart.glow.color;

        ctx.shadowBlur =
          glowPart.glow.radius *
          glowStrength *
          fit;

        ctx.drawImage(
          glowRaster,
          Math.round(
            originX +
            glowBounds.minX *
              artPixel *
              fit,
          ),
          Math.round(
            originY +
            glowBounds.minY *
              artPixel *
              fit,
          ),
          glowRaster.width *
            artPixel *
            fit,
          glowRaster.height *
            artPixel *
            fit,
        );

        ctx.restore();
      }
    }

    ctx.imageSmoothingEnabled = false;

    ctx.drawImage(
      raster,
      Math.round(
        originX +
        bounds.minX *
          artPixel *
          fit,
      ),
      Math.round(
        originY +
        bounds.minY *
          artPixel *
          fit,
      ),
      raster.width *
        artPixel *
        fit,
      raster.height *
        artPixel *
        fit,
    );

    ctx.save();

    ctx.strokeStyle = '#d4dae3';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.arc(
      originX,
      originY,
      4,
      0,
      Math.PI * 2,
    );
    ctx.stroke();

    if (marker) {
      const [mx, my] =
        rotatePoint(
          marker.x,
          flipped
            ? -marker.y
            : marker.y,
          angle,
        );

      const sx =
        originX +
        mx *
        artPixel *
        fit;

      const sy =
        originY +
        my *
        artPixel *
        fit;

      ctx.strokeStyle = '#ff7777';
      ctx.beginPath();
      ctx.arc(
        sx,
        sy,
        5,
        0,
        Math.PI * 2,
      );
      ctx.stroke();
    }

    ctx.restore();

    if (
      trueSize ||
      fit < 0.999
    ) {
      ctx.fillStyle = '#68717e';
      ctx.font =
        "10px 'Pixel Arial 11', Arial, sans-serif";
      ctx.textAlign = 'right';

      ctx.fillText(
        trueSize
          ? 'preview 1:1 game size'
          : `preview fit ${Math.round(
              fit * 100,
            )}%`,
        w - 8,
        h - 8,
      );
    }
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
        this.getAnimationPreviewAsset();

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
        "12px 'Pixel Arial 11', Arial, sans-serif";
      ctx.textAlign = 'center';
      ctx.fillText(
        'add a polygon to preview it',
        w / 2,
        h / 2,
      );
      return;
    }

    if (
      compiled.asset.type ===
      'weapon'
    ) {
      this.renderWeaponPreview(
        ctx,
        w,
        h,
        compiled,
        angle,
        glowStrength,
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

    const trueSize =
      !!this.trueSizeInput?.checked;

    const fit =
      trueSize
        ? 1
        : Math.min(
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

    if (
      compiled.asset.type ===
      'boss'
    ) {
      const pivotX =
        spriteLeft -
        baseBounds.minX *
        rasterScale;

      const pivotY =
        spriteTop -
        baseBounds.minY *
        rasterScale;

      ctx.save();
      ctx.font =
        "9px 'Pixel Arial 11', Arial, sans-serif";

      for (
        const [name, marker]
        of Object.entries(
          compiled.markers ?? {},
        )
      ) {
        const [mx, my] =
          rotatePoint(
            marker.x,
            marker.y,
            angle,
          );

        const x =
          pivotX +
          mx * rasterScale;

        const y =
          pivotY +
          my * rasterScale;

        ctx.strokeStyle = '#ffd66b';
        ctx.fillStyle = '#ffd66b';
        ctx.beginPath();
        ctx.moveTo(x - 5, y);
        ctx.lineTo(x + 5, y);
        ctx.moveTo(x, y - 5);
        ctx.lineTo(x, y + 5);
        ctx.stroke();

        ctx.fillText(
          name,
          x + 7,
          y - 7,
        );
      }

      ctx.strokeStyle = '#ff78d7';
      ctx.fillStyle = '#ff78d7';
      ctx.setLineDash([5, 4]);

      for (
        const hitbox
        of compiled.hitboxes ?? []
      ) {
        const [hx, hy] =
          rotatePoint(
            hitbox.x,
            hitbox.y,
            angle,
          );

        const x =
          pivotX +
          hx * rasterScale;

        const y =
          pivotY +
          hy * rasterScale;

        if (
          hitbox.type === 'rect'
        ) {
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(
            angle *
            Math.PI /
            180,
          );

          ctx.strokeRect(
            -hitbox.width *
              rasterScale /
              2,
            -hitbox.height *
              rasterScale /
              2,
            hitbox.width *
              rasterScale,
            hitbox.height *
              rasterScale,
          );

          ctx.restore();
        } else {
          ctx.beginPath();
          ctx.arc(
            x,
            y,
            hitbox.radius *
              rasterScale,
            0,
            Math.PI * 2,
          );
          ctx.stroke();
        }
      }

      ctx.restore();
    }

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
        )}px 'Pixel Arial 11', Arial, sans-serif`;

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
        "10px 'Pixel Arial 11', Arial, sans-serif";
      ctx.textAlign = 'right';

      ctx.fillText(
        trueSize
          ? 'preview 1:1 game size'
          : `preview fit ${Math.round(
              fit * 100,
            )}%`,
        w - 8,
        h - 8,
      );
    }
  }

  renderAll() {
    this.updateWeaponMarkerInfo();
    this.syncBossToolUi();
    this.updateSelectionInspector();
    this.syncAnimationUi();
    this.renderMaterialState();
    this.renderLayers();
    this.renderCanvas();
    this.renderPreview();
  }
}
