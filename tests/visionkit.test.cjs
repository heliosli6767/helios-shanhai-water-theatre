'use strict';

// Logic tests with synthetic hand points and a mocked wx/VKSession, not hardware
// validation. Real Android camera permissions and GPU behaviour still need a phone.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../apps/wechat-miniprogram');

function runtime(wx = {}) {
  const cache = new Map(), timers = new Map();
  let timerId = 0, now = 1000;
  function load(relative) {
    const filename = path.resolve(root, relative.endsWith('.js') ? relative : relative + '.js');
    if (cache.has(filename)) return cache.get(filename).exports;
    const module = { exports: {} };
    cache.set(filename, module);
    vm.runInNewContext(fs.readFileSync(filename, 'utf8'), {
      module, exports: module.exports, wx, console: { warn() {}, log() {} },
      Date: class extends Date { static now() { return now; } },
      setTimeout: (fn, delay) => { timers.set(++timerId, { fn, delay }); return timerId; },
      clearTimeout: id => timers.delete(id),
      require: name => load(path.relative(root, path.resolve(path.dirname(filename), name)))
    }, { filename });
    return module.exports;
  }
  return {
    load, timers,
    tick(ms) { now += ms; },
    fire(delay) {
      const found = [...timers].find(([, timer]) => timer.delay === delay);
      assert.ok(found, `missing ${delay}ms timer`);
      timers.delete(found[0]);
      found[1].fn();
    },
    page() {
      const page = load('shared/story-stage-page')(1, '/story-packages/story-01');
      page.data = JSON.parse(JSON.stringify(page.data));
      page._alive = true;
      page.setData = function(patch, done) { Object.assign(this.data, patch); if (done) done(); };
      page.resetGestureProgress();
      return page;
    }
  };
}

function sessionFixture(options = {}) {
  const events = {}, results = [], errors = [], states = [];
  let callback, raf, ready = 0, destroyed = 0, frames = 0;
  const session = {
    config: {},
    on(name, fn) { events[name] = fn; },
    start(fn) { callback = fn; },
    requestAnimationFrame(fn) { raf = fn; return 1; },
    cancelAnimationFrame() {},
    getVKFrame() { frames++; if (options.frameError) throw new Error('GPU fault'); return options.noFrame ? null : {}; },
    stop() { if (options.stopError) throw new Error('stop failed'); },
    destroy() { destroyed++; }
  };
  const rt = runtime({ createVKSession: () => session });
  const Inference = rt.load('shared/wechat-hand-inference');
  const inference = new Inference({
    canvas: { width: 160, height: 100 }, width: 160, height: 100,
    onResult: hands => results.push(hands), onError: error => errors.push(error),
    onReady: () => ready++, onStatus: (text, phase) => states.push(phase)
  });
  inference.initGL = () => { inference.gl = {}; };
  inference.renderFrame = () => true;
  return { rt, inference, events, results, errors, states, session,
    startResult: code => callback(code), frame: () => raf(),
    get ready() { return ready; }, get destroyed() { return destroyed; }, get frames() { return frames; } };
}

function handPoints() {
  const p = Array.from({ length: 21 }, () => ({ x: .5, y: .7 }));
  p[0] = { x: .5, y: .9 };
  p[4] = { x: .30, y: .55 };
  for (const [base, x] of [[5,.38],[9,.48],[13,.58],[17,.68]]) {
    for (let n = 0; n < 4; n++) p[base+n] = { x, y: .66 - n * .14 };
  }
  return p;
}

test('native startup codes retain the distinction between privacy, permissions and hardware', () => {
  const { failure } = runtime().load('shared/vision-diagnostics');
  assert.match(failure('session-start', 112).message, /隐私/);
  assert.equal(failure('session-start', 2003001).settings, 'system');
  assert.equal(failure('session-start', 2003002).settings, 'mini');
  assert.match(failure('session-start', 2000002).message, /设备不支持/);
  const unknown = failure('session-start', 99999);
  assert.equal(unknown.code, 99999);
  assert.doesNotMatch(unknown.message, /设备不支持/);
});

test('ready is reported after first visible frame, not just successful session.start', () => {
  const f = sessionFixture();
  f.inference.start(); f.startResult(0);
  assert.equal(f.ready, 0);
  assert.equal(f.session.config.cameraPosition, 1);
  f.frame();
  assert.equal(f.ready, 1);
  assert.equal(f.inference.frameCount, 1);
  f.inference.stop();
  assert.equal(f.rt.timers.size, 0);
});

test('native failure is reported once and original status survives cleanup failure', () => {
  const f = sessionFixture({ stopError: true });
  f.inference.start(); f.startResult(2003001);
  assert.equal(f.errors.length, 1);
  assert.equal(f.errors[0].code, 2003001);
  assert.equal(f.destroyed, 1);
  f.startResult(0);
  assert.equal(f.ready, 0);
});

test('late session callback after leaving the page cannot reopen the camera', () => {
  const f = sessionFixture();
  f.inference.start(); f.inference.stop(); f.startResult(0);
  assert.equal(f.ready, 0);
  assert.equal(f.errors.length, 0);
  assert.equal(f.inference.running, false);
});

test('startup hang and missing camera frames are distinguishable', () => {
  const first = sessionFixture();
  first.inference.start(); first.rt.fire(20000);
  assert.equal(first.errors[0].code, 'START_TIMEOUT');
  const second = sessionFixture({ noFrame: true });
  second.inference.start(); second.startResult(0); second.frame(); second.rt.fire(12000);
  assert.equal(second.errors[0].code, 'FRAME_TIMEOUT');
  assert.equal(second.ready, 0);
});

test('asynchronous frame exception is captured instead of silently stopping detection', () => {
  const f = sessionFixture({ frameError: true });
  f.inference.start(); f.startResult(0); f.frame();
  assert.equal(f.errors[0].phase, 'frame');
  assert.match(f.errors[0].detail, /GPU fault/);
  assert.equal(f.destroyed, 1);
});

test('only complete finite 21-point hand anchors reach gesture classification', () => {
  const f = sessionFixture();
  f.inference.start(); f.startResult(0); f.frame();
  f.events.updateAnchors([{ type: 1 }, { type: 7, points: [{ x: NaN, y: 0 }] }]);
  assert.equal(f.results.at(-1).length, 0);
  f.events.updateAnchors([{ type: 7, points: handPoints() }]);
  assert.equal(f.results.at(-1)[0].points.length, 21);
  assert.equal(f.results.at(-1)[0].gesture.key, 'open');
  const points = handPoints(); points[4] = { ...points[8] };
  for (let n = 0; n < 8; n++) f.events.updateAnchors([{ type: 7, points }]);
  assert.equal(f.results.at(-1)[0].gesture.key, 'pinch');
  f.inference.stop();
});

test('bone vertices use native viewport coordinates with no extra mirror or smoothing lag', () => {
  const f = sessionFixture();
  f.inference.start(); f.startResult(0); f.frame();
  const original = handPoints();
  f.events.updateAnchors([{ id: 10, type: 7, points: original }]);
  const moved = original.map(point => ({ x: point.x - .2, y: point.y - .1 }));
  f.events.updateAnchors([{ id: 10, type: 7, points: moved }]);
  const uploads = [], draws = [];
  f.inference.gl = {
    ARRAY_BUFFER: 1, FLOAT: 2, DYNAMIC_DRAW: 3, LINES: 4, POINTS: 5,
    useProgram() {}, bindBuffer() {}, vertexAttribPointer() {}, enableVertexAttribArray() {},
    uniform1f() {}, uniform4f() {}, uniform1i() {},
    bufferData(target, data) { uploads.push(Array.from(data)); },
    drawArrays(mode, first, count) { draws.push({ mode, count }); }
  };
  // Raw overlay coordinates stay exact across window shapes and DPR values;
  // the SDK already supplies points in this frame's viewport.
  for (const [width, height, ratio] of [[160,100,1], [200,90,2], [90,160,3]]) {
    f.inference.displayWidth = width; f.inference.displayHeight = height; f.inference.pixelRatio = ratio;
    f.inference.renderSkeleton();
    const vertices = uploads.at(-1);
    moved.forEach((point, index) => {
      assert.ok(Math.abs(vertices[index * 2] - (point.x * 2 - 1)) < 1e-6);
      assert.ok(Math.abs(vertices[index * 2 + 1] - (1 - point.y * 2)) < 1e-6);
    });
    assert.equal(draws.at(-1).count, 21);
    assert.equal(draws.at(-2).mode, 4);
  }
  const hand = f.results.at(-1)[0];
  assert.equal(hand.rawPoints[0].x, moved[0].x);
  assert.ok(hand.trackedPoints[0].x > hand.rawPoints[0].x, 'control smoothing is separate from preview');
  f.rt.tick(300);
  const before = draws.length;
  f.inference.renderSkeleton();
  assert.equal(draws.length, before, 'stale hand must not float over fresh camera video');
  f.inference.stop();
});

test('crossing hands keep their own smoothing histories by anchor id', () => {
  const f = sessionFixture();
  f.inference.start(); f.startResult(0); f.frame();
  const pointsAt = x => handPoints().map(point => ({ x: x + (point.x - .5) * .1, y: point.y }));
  f.events.updateAnchors([{ id: 1, points: pointsAt(.49) }, { id: 2, points: pointsAt(.51) }]);
  f.events.updateAnchors([{ id: 1, points: pointsAt(.52) }, { id: 2, points: pointsAt(.48) }]);
  const left = f.results.at(-1).find(hand => hand.id === 2);
  const right = f.results.at(-1).find(hand => hand.id === 1);
  assert.equal(left.screenSide, 'left');
  assert.ok(Math.abs(left.trackedPoints[0].x - (.51 + (.48 - .51) * .38)) < 1e-8);
  assert.equal(right.screenSide, 'right');
  f.inference.stop();
});

function pageFixture(options = {}) {
  let auth, selections = 0, starts = 0, instance;
  const wx = {
    getDeviceInfo: () => ({ platform: 'android', brand: 'HUAWEI', model: 'test' }),
    getAppBaseInfo: () => ({ version: '8.test', SDKVersion: '3.test' }),
    getAppAuthorizeSetting: () => ({ cameraAuthorized: options.denied ? 'denied' : 'authorized' }),
    getWindowInfo: () => ({ pixelRatio: 2 }),
    createVKSession() {},
    authorize: opts => { auth = opts; },
    nextTick: fn => fn(),
    createSelectorQuery: () => {
      const q = { select() { return q; }, fields() { return q; }, exec(fn) {
        selections++;
        fn(selections <= (options.delayed || 0) ? [] : [{ node: {}, width: 160, height: 100 }]);
      } };
      return q;
    }
  };
  const rt = runtime(wx);
  const Inference = rt.load('shared/wechat-hand-inference');
  Inference.prototype.start = function() { starts++; instance = this; };
  const page = rt.page();
  return { page, rt, authorize: () => auth.success(), reject: () => auth.fail({ errMsg: 'authorize:fail auth deny' }),
    get selections() { return selections; }, get starts() { return starts; }, get instance() { return instance; } };
}

test('permission happens before canvas/session and delayed Android canvas is retried', () => {
  const f = pageFixture({ delayed: 2 });
  f.page.toggleCamera();
  assert.equal(f.selections, 0); assert.equal(f.starts, 0);
  f.authorize();
  assert.equal(f.starts, 0);
  f.rt.fire(100); f.rt.fire(100);
  assert.equal(f.starts, 1);
  assert.equal(f.page.data.cameraReady, false);
  f.instance.onReady();
  assert.equal(f.page.data.cameraReady, true);
  f.page.stopInference();
});

test('denied system permission reports the right setting and never creates a session', () => {
  const f = pageFixture({ denied: true });
  f.page.toggleCamera();
  assert.equal(f.starts, 0);
  assert.equal(f.page.data.cameraErrorSettings, 'system');
  assert.match(f.page.data.cameraErrorCode, /2003001/);
});

test('closing during permission or canvas wait invalidates late callbacks', () => {
  const f = pageFixture({ delayed: 1 });
  f.page.toggleCamera(); f.page.toggleCamera(); f.authorize();
  assert.equal(f.starts, 0); assert.equal(f.selections, 0);
  f.page.toggleCamera(); f.authorize();
  f.page.onHide();
  assert.equal(f.rt.timers.size, 0);
  assert.equal(f.page.data.cameraOn, false);
});

test('camera errors can be retried in one tap, without stale error or ready status', () => {
  const f = pageFixture();
  f.page.toggleCamera(); f.reject();
  assert.ok(f.page.data.cameraError);
  f.page.toggleCamera(); f.authorize();
  assert.equal(f.starts, 1);
  assert.equal(f.page.data.cameraError, '');
  assert.equal(f.page.data.cameraReady, false);
  f.page.stopInference();
});

test('continuous hand motion moves girl before cue completion; bird pickup moves the prop', () => {
  const rt = runtime();
  const page = rt.page();
  const layout = rt.load('shared/stage-layout-data')['1'];
  const cues = rt.load('shared/performance-data')['1'];
  function setup(act, step) {
    page.data.puppetLayers = layout.acts[act].cast.concat(layout.acts[act].props).map(layer =>
      Object.assign({}, layer, { baseX: layer.x, baseBottom: layer.bottom, scale: 1 }));
    page.data.currentCue = cues.scenes[act].cues[step];
    page._lastPuppetUpdate = 0;
  }
  const hand = { center: { x: .75, y: .45 }, gesture: { key: 'open', label: '张掌' }, points: [], lines: [] };
  setup(0, 1);
  const before = page.data.puppetLayers.find(layer => layer.id === 'A010').x;
  page.applyLiveMotion([hand]);
  assert.ok(page.data.puppetLayers.find(layer => layer.id === 'A010').x > before);
  assert.equal(page.data.stepIndex, 0);
  setup(2, 0);
  hand.gesture = { key: 'pinch', pinchStrength: 1 };
  page.applyLiveMotion([hand]);
  const bird = page.data.puppetLayers.find(layer => layer.id === 'A011');
  const stone = page.data.puppetLayers.find(layer => layer.id === 'A013');
  assert.equal(stone.x, bird.x + 7);
  assert.ok(stone.bottom > stone.baseBottom);
});

test('no story actions advance before the camera has actually produced a frame', () => {
  const page = runtime().page();
  page.data.cameraOn = true;
  page.data.cameraReady = false;
  page.applyLiveMotion = () => { throw new Error('must not run'); };
  page.onHandResult([{ center: { x: .5, y: .5 }, gesture: { key: 'open' } }]);
  assert.equal(page.data.hands.length, 0);
});

test('landmark results do not send an asynchronous DOM skeleton through setData', () => {
  const page = runtime().page();
  page.data.cameraOn = true; page.data.cameraReady = true;
  const updates = [];
  page.setData = patch => updates.push(patch);
  page.onHandResult([{ center: { x: .5, y: .5 }, gesture: { key: 'open' }, points: handPoints() }]);
  assert.ok(updates.every(patch => !Object.hasOwn(patch, 'hands')));
  assert.equal(page._hands.length, 1);
});

test('stage calm mode never displaces the backdrop', () => {
  const rt = runtime();
  const Water = rt.load('shared/mini-water');
  const water = new Water({}, 'scene.jpg', { ambient: false });
  let images = 0;
  water.width = 600; water.height = 300; water.image = { width: 1280, height: 720 };
  water.ctx = { clearRect() {}, save() {}, beginPath() {}, rect() {}, clip() {}, restore() {}, drawImage() { images++; } };
  water.drawWater();
  assert.equal(images, 0);
});

test('full and diagnostic packages use exactly the same stage pipeline and build marker', () => {
  const diagnostic = path.resolve(root, '../wechat-miniprogram-diagnostic');
  for (const file of ['build-info.js', 'vision-diagnostics.js', 'wechat-hand-inference.js', 'story-stage-page.js', 'mini-water.js']) {
    assert.equal(fs.readFileSync(path.join(root, 'shared', file), 'utf8'), fs.readFileSync(path.join(diagnostic, 'shared', file), 'utf8'), file);
  }
  for (const name of ['wxml', 'wxss']) {
    const relative = `story-packages/story-01/pages/stage/index.${name}`;
    assert.equal(fs.readFileSync(path.join(root, relative), 'utf8'), fs.readFileSync(path.join(diagnostic, relative), 'utf8'));
  }
});
