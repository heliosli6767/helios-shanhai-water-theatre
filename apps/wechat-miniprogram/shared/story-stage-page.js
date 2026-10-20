'use strict';

const storyService = require('../services/story');
const performance = require('./performance-data');
const stageLayouts = require('./stage-layout-data');
const WechatHandInference = require('./wechat-hand-inference');
const MiniWater = require('./mini-water');
const BUILD = require('./build-info');
const { failure } = require('./vision-diagnostics');

const THEMES = [
  { name: '漆木飞檐', image: '/assets/images/stages/stage-1.jpg', openingStyle: 'left:18%;top:24%;width:64%;height:46%' },
  { name: '竹编水亭', image: '/assets/images/stages/stage-2.jpg', openingStyle: 'left:22%;top:28%;width:56%;height:41%' },
  { name: '月白石台', image: '/assets/images/stages/stage-3.jpg', openingStyle: 'left:24%;top:26%;width:51%;height:40%' },
  { name: '彩灯庙台', image: '/assets/images/stages/stage-4.jpg', openingStyle: 'left:19%;top:31%;width:62%;height:43%' },
  { name: '玉石水门', image: '/assets/images/stages/stage-5.jpg', openingStyle: 'left:24%;top:15%;width:52%;height:47%' }
];

const PICKUP_PROPS = {
  A010: 'A013', A011: 'A013', A051: 'A055', A081: 'A083', A092: 'A095', A103: 'A105'
};

function cleanHint(value) {
  return String(value || '')
    .replace(/^在预览框(?:中央|内)?/, '')
    .replace(/，保持约一秒。$/, '，保持约一秒')
    .replace(/，停留约一秒。$/, '，停留约一秒')
    .replace(/。$/, '');
}

function fallbackCue(scene, stepIndex) {
  const step = scene.steps[stepIndex] || scene.steps[0];
  return {
    label: step.label,
    motion: step.motion,
    effect: step.result || step.instruction || '水上戏台会回应你的动作。',
    automatic: false,
    requirements: [{ side: 'left', gesture: step.motion === 'pickup' ? 'pinch' : 'open', focusName: '', hint: step.instruction || step.label }]
  };
}

function isOpenHand(hand) {
  return hand && (hand.gesture.key === 'open' || hand.gesture.key === 'pose');
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function layerStyle(layer) {
  const offsetY = Number(layer.offsetY || 0);
  const scale = Number(layer.scale == null ? 1 : layer.scale);
  const rotate = Number(layer.rotate || 0);
  return `left:${layer.x}%;bottom:${layer.bottom}%;width:${layer.width}%;opacity:${layer.opacity};transform:translate3d(-50%,${offsetY}%,0) scale(${scale}) rotate(${rotate}deg)`;
}

function buildLayers(storyId, actIndex, packageRoot) {
  const storyLayout = stageLayouts[String(storyId)];
  const act = storyLayout && storyLayout.acts[actIndex];
  if (!act) return [];
  return act.cast.concat(act.props).map(function(item) {
    const layer = Object.assign({}, item, {
      baseX: item.x,
      baseBottom: item.bottom,
      baseWidth: item.width,
      opacity: item.opacity == null ? 1 : item.opacity,
      bottom: clamp(item.bottom + 18, 27, 42),
      scale: item.type === 'actor' ? .68 : .58,
      rotate: 0,
      offsetY: 0,
      src: `${packageRoot}/assets/sprites/${item.id}.webp`,
      attached: false
    });
    layer.style = layerStyle(layer);
    return layer;
  });
}

function requirementMet(hand, requirement, tracker) {
  if (!hand) return false;
  const gesture = requirement.gesture;
  const key = hand.gesture.key;
  if (!tracker.origin) tracker.origin = { x: hand.center.x, y: hand.center.y };

  if (gesture === 'pinch') return key === 'pinch';
  if (gesture === 'release') {
    if (key === 'pinch') tracker.primed = true;
    return !!tracker.primed && isOpenHand(hand);
  }
  if (gesture === 'open') return key === 'open';
  if (gesture === 'raise') return isOpenHand(hand) && (hand.center.y < .44 || tracker.origin.y - hand.center.y > .1);
  if (gesture === 'lower') return isOpenHand(hand) && (hand.center.y > .56 || hand.center.y - tracker.origin.y > .1);
  if (gesture === 'sway') return isOpenHand(hand) && Math.abs(hand.center.x - tracker.origin.x) > .08;
  if (gesture === 'tap') {
    tracker.minY = Math.min(tracker.minY == null ? hand.center.y : tracker.minY, hand.center.y);
    tracker.maxY = Math.max(tracker.maxY == null ? hand.center.y : tracker.maxY, hand.center.y);
    if (tracker.maxY - tracker.minY > .075) tracker.motionReached = true;
    return isOpenHand(hand) && !!tracker.motionReached;
  }
  if (gesture === 'turn') return isOpenHand(hand);
  return isOpenHand(hand) || key === 'pinch' || key === 'fist';
}

module.exports = function createStagePage(storyId, packageRoot) {
  return {
    data: {
      story: null,
      loading: true,
      error: '',
      actIndex: 0,
      stepIndex: 0,
      currentScene: null,
      currentCue: null,
      sceneImage: `${packageRoot}/assets/act-1.jpg`,
      guideRows: [{ label: '', text: '请先开启摄像头' }],
      resultText: '允许摄像头后，跟随故事完成手势。',
      cameraOn: false,
      cameraReady: false,
      cameraError: '',
      cameraErrorCode: '',
      cameraErrorHelp: '',
      cameraErrorSettings: '',
      buildId: BUILD.id,
      inferenceStatus: '未开启',
      hands: [],
      completed: false,
      isLandscape: false,
      themes: THEMES,
      currentThemeIndex: 0,
      currentTheme: THEMES[0],
      themeMenuOpen: false,
      previewOverride: false,
      puppetLayers: [],
      activeFocusId: '',
      stageMotion: 'idle',
      actionRippleVisible: false,
      actionRippleStyle: ''
    },

    onLoad: function() {
      this._alive = true;
      this.resetGestureProgress();
      const savedTheme = Number(wx.getStorageSync && wx.getStorageSync('shanhai-water-theme'));
      if (Number.isInteger(savedTheme) && THEMES[savedTheme]) {
        this.setData({ currentThemeIndex: savedTheme, currentTheme: THEMES[savedTheme] });
      }
      const self = this;
      this._resizeHandler = function(event) { self.syncOrientation(event && event.size ? event.size : event); };
      if (wx.onWindowResize) wx.onWindowResize(this._resizeHandler);
      this.syncOrientation(wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync());
      this.loadStory();
    },

    onReady: function() {
      this._ready = true;
      this.syncOrientation(wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync());
      this.mountWater();
    },

    onResize: function(size) { this.syncOrientation(size); },
    onHide: function() {
      this.stopInference();
      this.setData({ cameraOn: false, cameraReady: false, hands: [], inferenceStatus: '已暂停 · 可重新开启' });
    },
    onUnload: function() {
      this._alive = false;
      clearTimeout(this._automaticTimer);
      clearTimeout(this._entranceTimer);
      if (wx.offWindowResize && this._resizeHandler) wx.offWindowResize(this._resizeHandler);
      if (this._request) this._request.abort();
      this.stopInference();
      if (this._water) this._water.destroy();
    },

    syncOrientation: function(info) {
      const width = Number(info && (info.windowWidth || info.width)) || 0;
      const height = Number(info && (info.windowHeight || info.height)) || 0;
      const isLandscape = width > height;
      if (isLandscape === this.data.isLandscape) return;
      const self = this;
      this.setData({ isLandscape }, function() {
        if (isLandscape) self.mountWater();
        else {
          self.stopInference();
          self.setData({ cameraOn: false, cameraReady: false, hands: [] });
          if (self._water) self._water.destroy();
          self._water = null;
        }
      });
    },

    loadStory: function() {
      const self = this;
      const request = this._request = storyService.requestStory(storyId);
      request.promise.then(function(response) {
        if (!self._alive) return;
        const story = response.data;
        self.setData({
          loading: false,
          story,
          currentScene: story.scenes[0],
          puppetLayers: buildLayers(storyId, 0, packageRoot)
        }, function() {
          self.syncGuide();
          self.mountWater();
          self._entranceTimer = setTimeout(function() { if (self._alive) self.enterFrontStage(); }, 650);
        });
      }).catch(function(error) {
        if (self._alive) self.setData({ loading: false, error: error.message });
      });
    },

    currentPerformanceCue: function() {
      const record = performance[String(storyId)];
      return record && record.scenes[this.data.actIndex] && record.scenes[this.data.actIndex].cues[this.data.stepIndex];
    },

    mountWater: function() {
      if (!this._ready || !this.data.currentScene || !this.data.isLandscape) return;
      if (this._water) this._water.destroy();
      // Do not slide the entire painted sea (and shoreline) under the puppets.
      // Keep the stage stable; only a story action adds a local water response.
      this._water = new MiniWater(this, this.data.sceneImage, { ambient: false });
      this._water.mount();
    },

    resetGestureProgress: function() {
      this._trackers = {};
      this._completedRequirements = {};
    },

    syncGuide: function() {
      const scene = this.data.currentScene;
      if (!scene) return;
      clearTimeout(this._automaticTimer);
      this.resetGestureProgress();
      const cue = this.currentPerformanceCue() || fallbackCue(scene, this.data.stepIndex);
      const paired = cue.requirements.length > 1;
      const rows = cue.automatic ? [{ label: '自动演绎', text: cue.label }] : cue.requirements.map(function(requirement) {
        const side = paired ? (requirement.side === 'left' ? '预览左侧的手' : '预览右侧的手') : '任意一只手';
        const label = requirement.focusName ? `${side} · ${requirement.focusName}` : side;
        return { label, text: cleanHint(requirement.hint || cue.gestureHint || cue.instruction) };
      });
      this.setData({
        currentCue: cue,
        guideRows: rows,
        resultText: cue.effect || cue.result,
        completed: false,
        activeFocusId: cue.driver || cue.focus || '',
        stageMotion: 'idle'
      });
      if (cue.automatic && this.data.cameraReady) {
        const self = this;
        this.setInferenceStatus('剧情自动推进');
        this._automaticTimer = setTimeout(function() { if (self._alive && !self._advancing) self.completeStep(); }, 700);
      }
    },

    toggleThemeMenu: function() { this.setData({ themeMenuOpen: !this.data.themeMenuOpen }); },
    selectTheme: function(event) {
      const index = Number(event.currentTarget.dataset.index);
      if (!THEMES[index]) return;
      const self = this;
      if (wx.setStorageSync) wx.setStorageSync('shanhai-water-theme', index);
      this.setData({ currentThemeIndex: index, currentTheme: THEMES[index], themeMenuOpen: false }, function() { self.mountWater(); });
    },

    backReader: function() { wx.navigateBack(); },
    previewStage: function() { this.setData({ previewOverride: true }); },
    toggleCamera: function() {
      if (this.data.cameraOn && !this.data.cameraError) {
        this.stopInference();
        this.setData({ cameraOn: false, cameraReady: false, hands: [], inferenceStatus: '已关闭' });
        return;
      }
      const self = this;
      this.stopInference();
      this.setData({ cameraOn: true, cameraReady: false, cameraError: '', cameraErrorCode: '', cameraErrorHelp: '', cameraErrorSettings: '', inferenceStatus: '等待摄像头权限…' }, function() {
        self.startInference();
      });
    },

    startInference: function() {
      if (!this.data.cameraOn || this._inference || this._startingInference || this._devtoolsCameraPreview) return;
      const self = this;
      this._startingInference = true;
      const attempt = this._cameraAttempt = (this._cameraAttempt || 0) + 1;
      const active = () => self._alive && self.data.cameraOn && self._cameraAttempt === attempt;
      const device = wx.getDeviceInfo ? wx.getDeviceInfo() : wx.getSystemInfoSync();
      const app = wx.getAppBaseInfo ? wx.getAppBaseInfo() : wx.getSystemInfoSync();
      this._diagnostic = {
        build: BUILD,
        device: { brand: device.brand, model: device.model, platform: device.platform, system: device.system },
        wechatVersion: app.version, SDKVersion: app.SDKVersion,
        phase: 'permission', pipeline: 'VisionKit v1 realtime hand mode 1 · 同画布校准',
        storyId, act: this.data.actIndex + 1
      };
      if (device && device.platform === 'devtools') {
        this._startingInference = false;
        this._devtoolsCameraPreview = true;
        this.setData({ cameraReady: false, cameraError: '', inferenceStatus: '模拟器不运行识别 · 请在真机测试' });
        return;
      }
      const fail = error => { if (active()) self.onInferenceError(error); };
      let tries = 0;
      const findCanvas = function() {
        if (!active()) return;
        self._diagnostic.phase = 'canvas';
        self.setInferenceStatus('正在准备摄像头画布…');
        wx.createSelectorQuery().select('#visionCanvas').fields({ node: true, size: true }).exec(function(result) {
        if (!active()) return;
        const field = result && result[0];
        if (!field || !field.node || !field.width || !field.height) {
          // Android can return an unmounted conditional canvas immediately
          // after setData. Wait a bounded interval, not a permanent retry loop.
          if (++tries < 10) self._canvasRetry = setTimeout(findCanvas, 100);
          else fail(failure('canvas', 'CANVAS_NOT_READY', '摄像头画布尚未就绪，请横屏后重试'));
          return;
        }
        const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
        self._diagnostic.canvas = { width: field.width, height: field.height, pixelRatio: info.pixelRatio || 1 };
        self._startingInference = false;
        self._inference = new WechatHandInference({
          canvas: field.node,
          width: field.width,
          height: field.height,
          pixelRatio: info.pixelRatio || 1,
          onStatus: function(text, phase) {
            if (!active()) return;
            self._diagnostic.phase = phase;
            self.setInferenceStatus(text);
          },
          onReady: function() {
            if (!active()) return;
            self.setData({ cameraReady: true }, function() { self.syncGuide(); });
          },
          onResult: function(hands) {
            if (!active()) return;
            self._diagnostic.lastHands = hands.length;
            self.onHandResult(hands);
          },
          onError: fail
        });
        self._inference.start();
      });
      };
      const mount = () => {
        if (!active()) return;
        if (wx.nextTick) wx.nextTick(findCanvas);
        else self._canvasRetry = setTimeout(findCanvas, 50);
      };
      try {
        if (!wx.createVKSession) {
          fail(failure('capability', 'API_MISSING', '此微信版本没有 VisionKit 接口，请更新微信'));
          return;
        }
        const auth = wx.getAppAuthorizeSetting ? wx.getAppAuthorizeSetting() : {};
        self._diagnostic.systemCamera = auth.cameraAuthorized || 'unknown';
        if (auth.cameraAuthorized === 'denied') {
          fail(failure('session-start', 2003001));
          return;
        }
        // Explicitly request permission only in response to the camera button.
        // VisionKit still checks its own privacy declaration during start().
        wx.authorize({
          scope: 'scope.camera',
          success: mount,
          fail: error => {
            const result = failure('permission', error, '摄像头授权未完成');
            result.help = '请检查小程序相机权限；若已经允许，请复制诊断信息。';
            result.settings = 'mini';
            fail(result);
          }
        });
      } catch (error) { fail(failure('permission', error, '摄像头准备失败')); }
    },

    openSettings: function() {
      if (this.data.cameraErrorSettings === 'system' && wx.openAppAuthorizeSetting) wx.openAppAuthorizeSetting({});
      else wx.openSetting({});
    },
    copyCameraDiagnostic: function() {
      this.refreshCameraDiagnostic();
      wx.setClipboardData({ data: JSON.stringify(this._diagnostic || { build: BUILD, status: this.data.inferenceStatus }, null, 2) });
    },
    refreshCameraDiagnostic: function() {
      if (!this._diagnostic) this._diagnostic = { build: BUILD };
      if (this._inference) {
        this._diagnostic.frameCount = this._inference.frameCount;
        this._diagnostic.anchorCount = this._inference.anchorCount;
        this._diagnostic.preview = '同一 WebGL 画布 · SDK 原生方向 · 无额外镜像';
      }
    },
    showBuildInfo: function() {
      this.refreshCameraDiagnostic();
      const info = this._diagnostic || {};
      const self = this;
      wx.showModal({
        title: '手势校准版 · 检测信息',
        content: `${BUILD.id}\n画面帧：${info.frameCount || 0} · 手部结果：${info.anchorCount || 0}\n当前状态：${this.data.inferenceStatus}\n摄像头与骨架使用同一画布。`,
        confirmText: '复制诊断', cancelText: '关闭',
        success: result => { if (result.confirm) self.copyCameraDiagnostic(); }
      });
    },
    onInferenceError: function(error) {
      this._diagnostic = Object.assign({}, this._diagnostic, {
        phase: error.phase || 'unknown', code: error.code || 'UNKNOWN',
        message: error.message || String(error), detail: error.detail || '',
        frameCount: error.frameCount || 0, anchorCount: error.anchorCount || 0
      });
      // Only diagnostic metadata; no camera images, account IDs or hand points.
      console.warn('[VisionKit]', JSON.stringify(this._diagnostic));
      this.stopInference();
      this.setData({
        cameraReady: false, hands: [], inferenceStatus: '识别未启动 · 请查看错误详情',
        cameraError: error.message || String(error),
        cameraErrorCode: `${error.phase || 'unknown'} / ${error.code || 'UNKNOWN'}`,
        cameraErrorHelp: error.help || '请复制诊断信息。',
        cameraErrorSettings: error.settings || ''
      });
    },
    stopInference: function() {
      this._hands = [];
      clearTimeout(this._automaticTimer);
      clearTimeout(this._cueTimer);
      this._advancing = false;
      clearTimeout(this._canvasRetry);
      this._cameraAttempt = (this._cameraAttempt || 0) + 1;
      this._startingInference = false;
      if (this._inference) this._inference.stop();
      this._inference = null;
      this._devtoolsCameraPreview = false;
    },
    setInferenceStatus: function(value) {
      if (value !== this.data.inferenceStatus) this.setData({ inferenceStatus: value });
    },

    updatePuppetLayers: function(mutator, extraData) {
      const layers = this.data.puppetLayers.map(function(layer) { return Object.assign({}, layer); });
      mutator(layers);
      layers.forEach(function(layer) { layer.style = layerStyle(layer); });
      this.setData(Object.assign({ puppetLayers: layers }, extraData || {}));
    },

    enterFrontStage: function() {
      if (this._frontStageEntered) return;
      this._frontStageEntered = true;
      this.updatePuppetLayers(function(layers) {
        layers.forEach(function(layer) {
          layer.bottom = layer.baseBottom;
          layer.scale = 1;
          layer.rotate = 0;
          layer.offsetY = 0;
        });
      }, { stageMotion: 'approach' });
      const self = this;
      setTimeout(function() { if (self._alive) self.setData({ stageMotion: 'idle' }); }, 1250);
    },

    applyLiveMotion: function(hands) {
      if (this._advancing || !hands.length || !this.data.currentCue) return;
      const now = Date.now();
      if (this._lastPuppetUpdate && now - this._lastPuppetUpdate < 70) return;
      this._lastPuppetUpdate = now;
      const cue = this.data.currentCue;
      const hand = hands[0];
      const focusId = cue.driver || cue.focus;
      const motion = cue.motion;
      const heldId = this._heldPropId;
      this.updatePuppetLayers(function(layers) {
        const actor = layers.find(layer => layer.id === focusId);
        if (!actor) return;
        const dx = (hand.center.x - .5) * 48;
        const lift = Math.max(0, (.62 - hand.center.y) * 65);
        const lower = Math.max(0, (hand.center.y - .38) * 34);
        actor.scale = 1 + Math.max(0, (.58 - hand.center.y) * .18);
        actor.rotate = clamp((hand.center.x - .5) * 12, -6, 6);
        if (['approach', 'run', 'sway', 'storm', 'command', 'turn'].includes(motion)) actor.x = clamp(actor.baseX + dx, 10, 90);
        else if (['fly', 'rise', 'ascend'].includes(motion)) {
          actor.x = clamp(actor.baseX + dx * .55, 10, 90);
          actor.bottom = clamp(actor.baseBottom + lift, 8, 64);
        } else if (['lower', 'drink', 'bath', 'fall'].includes(motion)) {
          actor.bottom = clamp(actor.baseBottom - lower, 2, 55);
        } else if (motion === 'pickup') {
          const progress = hand.gesture.key === 'pinch' ? 1 : (hand.gesture.pinchStrength || 0);
          actor.x = clamp(actor.baseX + dx * .22, 10, 90);
          actor.bottom = actor.baseBottom - progress * 3;
          actor.rotate = -8 * progress;
          const wantedProp = PICKUP_PROPS[actor.id];
          const pickupProp = layers.find(layer => layer.id === wantedProp) || layers.find(layer => layer.type === 'prop');
          if (pickupProp) {
            pickupProp.x = pickupProp.baseX + (actor.x + (actor.id === 'A011' ? 7 : 5) - pickupProp.baseX) * progress;
            pickupProp.bottom = pickupProp.baseBottom + (actor.bottom + (actor.id === 'A011' ? 17 : 14) - pickupProp.baseBottom) * progress;
            pickupProp.scale = .8 + progress * .25;
          }
        } else if (motion === 'transform') {
          const bird = layers.find(layer => layer.id === 'A011');
          actor.scale = hand.gesture.key === 'open' ? 1.14 : 1;
          actor.opacity = hand.gesture.key === 'open' ? .72 : 1;
          if (bird) {
            bird.opacity = hand.gesture.key === 'open' ? .45 : 0;
            bird.scale = hand.gesture.key === 'open' ? .7 : .3;
            bird.bottom = actor.bottom + 5;
          }
        } else {
          actor.x = clamp(actor.baseX + dx * .3, 10, 90);
        }
        if (heldId) {
          const prop = layers.find(layer => layer.id === heldId);
          if (prop) {
            prop.x = actor.x + (actor.id === 'A011' ? 7 : 5);
            prop.bottom = actor.bottom + (actor.id === 'A011' ? 15 : 13);
          }
        }
      });
    },

    playCueAnimation: function(cue) {
      const self = this;
      let duration = 1250;
      this.updatePuppetLayers(function(layers) {
        const focusId = cue.driver || cue.focus;
        const actor = layers.find(layer => layer.id === focusId) || layers.find(layer => layer.id === cue.focus);
        const props = layers.filter(layer => layer.type === 'prop');
        if (cue.motion === 'pickup' && actor) {
          const wantedProp = PICKUP_PROPS[actor.id];
          const prop = layers.find(layer => layer.id === self._heldPropId) || layers.find(layer => layer.id === wantedProp) || props.find(layer => layer.opacity > 0);
          if (prop) {
            self._heldPropId = prop.id;
            prop.attached = true;
            prop.x = actor.x + (actor.id === 'A011' ? 7 : 5);
            prop.bottom = actor.bottom + (actor.id === 'A011' ? 15 : 13);
            prop.width = actor.id === 'A011' ? 5.5 : 6.5;
            prop.opacity = 1;
          }
          actor.offsetY = -4;
          actor.rotate = -5;
        } else if (['approach', 'run'].includes(cue.motion) && actor) {
          actor.x = clamp(actor.x + 18, 16, 84);
          if (self._heldPropId) {
            const prop = layers.find(layer => layer.id === self._heldPropId);
            if (prop) prop.x = actor.x + (actor.id === 'A011' ? 7 : 5);
          }
        } else if (['fly', 'rise', 'ascend'].includes(cue.motion) && actor) {
          actor.bottom = clamp(actor.bottom + 25, 12, 58);
          if (self._heldPropId) {
            const prop = layers.find(layer => layer.id === self._heldPropId);
            if (prop) prop.bottom = actor.bottom + 15;
          }
        } else if (cue.motion === 'transform') {
          duration = 1750;
          const girl = layers.find(layer => layer.id === 'A010');
          const bird = layers.find(layer => layer.id === 'A011');
          if (girl) { girl.opacity = 0; girl.offsetY = 12; girl.scale = .35; }
          if (bird) { bird.opacity = 1; bird.bottom = 20; bird.offsetY = -8; bird.scale = 1.08; }
        } else if (['throw', 'shoot'].includes(cue.motion)) {
          duration = 1500;
          const prop = layers.find(layer => layer.id === self._heldPropId) || props[0];
          if (prop) {
            prop.attached = false;
            prop.throwing = true;
            prop.x = clamp(prop.x + 22, 15, 90);
            prop.bottom = 2;
            prop.opacity = 0;
            self.setData({ actionRippleVisible: true, actionRippleStyle: `left:${prop.x}%;bottom:8%` });
            if (self._water) self._water.ripple(prop.x / 100, .83, .8);
          }
          self._heldPropId = '';
        } else if (['lower', 'drink', 'bath', 'fall'].includes(cue.motion) && actor) {
          actor.bottom = clamp(actor.bottom - 12, 2, 52);
        } else if (actor) {
          actor.offsetY = -6;
          actor.scale = 1.06;
        }
      }, { stageMotion: cue.motion, activeFocusId: cue.driver || cue.focus || '', completed: true });
      if (this._water) {
        if (['storm', 'rain'].includes(cue.motion)) this._water.pulse(1.16);
        else if (!['throw', 'shoot'].includes(cue.motion)) this._water.pulse(1.06);
      }
      setTimeout(function() {
        if (self._alive) self.setData({ actionRippleVisible: false });
      }, 1700);
      return duration;
    },

    handForRequirement: function(hands, requirement, paired) {
      if (!paired) return hands[0];
      return hands.find(function(hand) { return hand.screenSide === requirement.side; });
    },

    onHandResult: function(hands) {
      if (!this._alive || !this.data.cameraOn || !this.data.cameraReady) return;
      // Keep landmarks on the logic/GL side. Sending dozens of styled nodes
      // through setData on each camera frame delayed the overlay on real phones.
      this._hands = hands;
      const cue = this.data.currentCue;
      if (!cue || cue.automatic) return;
      if (this._advancing) return;
      if (!hands.length) {
        this.resetGestureProgress();
        this.setInferenceStatus('请把手完整放入左下角画面');
        return;
      }
      this.applyLiveMotion(hands);

      const paired = cue.requirements.length > 1;
      for (let index = 0; index < cue.requirements.length; index++) {
        const requirement = cue.requirements[index];
        const side = paired ? requirement.side : 'single';
        if (this._completedRequirements[side]) continue;
        const hand = this.handForRequirement(hands, requirement, paired);
        const tracker = this._trackers[side] || (this._trackers[side] = {});
        if (!requirementMet(hand, requirement, tracker)) {
          tracker.heldSince = 0;
          continue;
        }
        const now = Date.now();
        if (!tracker.heldSince) tracker.heldSince = now;
        if (now - tracker.heldSince >= 900) this._completedRequirements[side] = true;
      }

      const completed = Object.keys(this._completedRequirements).length;
      if (completed >= cue.requirements.length && !this._advancing) {
        this.completeStep();
      } else if (completed) {
        this.setInferenceStatus('一只手已完成 · 请完成另一只手');
      } else {
        const labels = hands.map(function(hand) { return hand.gesture.label; }).join('、');
        this.setInferenceStatus(`已识别：${labels}`);
      }
    },

    completeStep: function() {
      const scene = this.data.currentScene;
      const cue = this.data.currentCue;
      if (!scene || !cue || this._advancing) return;
      clearTimeout(this._automaticTimer);
      this._advancing = true;
      this.resetGestureProgress();
      if (wx.vibrateShort) wx.vibrateShort({ type: 'light' });
      const nextStep = this.data.stepIndex + 1;
      const self = this;
      const duration = this.playCueAnimation(cue);
      this.setData({ inferenceStatus: '正在呈现剧情效果…' });
      this._cueTimer = setTimeout(function() {
        if (!self._alive) return;
        if (nextStep < scene.steps.length) {
          self.setData({ stepIndex: nextStep, stageMotion: 'idle' }, function() { self._advancing = false; self.syncGuide(); });
          return;
        }
        self.advanceAct();
      }, duration + 420);
    },

    advanceAct: function() {
      const nextAct = this.data.actIndex + 1;
      if (!this.data.story || nextAct >= this.data.story.scenes.length) {
        this.setData({ completed: true, guideRows: [{ label: '演绎完成', text: '这一卷，谢幕' }], resultText: '山海故事在水面留下最后一圈涟漪。', inferenceStatus: '全剧完成' });
        this._advancing = false;
        return;
      }
      const image = `${packageRoot}/assets/act-${nextAct + 1}.jpg`;
      const self = this;
      this._heldPropId = '';
      this._frontStageEntered = false;
      this.setData({
        actIndex: nextAct,
        stepIndex: 0,
        currentScene: this.data.story.scenes[nextAct],
        sceneImage: image,
        puppetLayers: buildLayers(storyId, nextAct, packageRoot),
        stageMotion: 'idle',
        actionRippleVisible: false
      }, function() {
        self._advancing = false;
        self.syncGuide();
        self.mountWater();
        clearTimeout(self._entranceTimer);
        self._entranceTimer = setTimeout(function() { if (self._alive) self.enterFrontStage(); }, 480);
      });
    }
  };
};
