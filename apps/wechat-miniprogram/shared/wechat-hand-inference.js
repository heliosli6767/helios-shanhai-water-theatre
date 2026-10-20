'use strict';

const { failure } = require('./vision-diagnostics');
// Native realtime VisionKit pipeline. The VKSession owns the camera and emits
// 21-point hand anchors; the WebGL canvas is also the live camera preview.
const EDGES = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[0,9],[9,10],[10,11],[11,12],[0,13],[13,14],[14,15],[15,16],[0,17],[17,18],[18,19],[19,20],[5,9],[9,13],[13,17]];

function distance(a, b) {
  if (!a || !b) return 1;
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function smoothPoints(points, previous) {
  if (!previous || previous.length !== points.length) return points.map(point => ({ x: point.x, y: point.y, z: point.z || 0 }));
  const alpha = .38;
  return points.map((point, index) => ({
    x: previous[index].x + (point.x - previous[index].x) * alpha,
    y: previous[index].y + (point.y - previous[index].y) * alpha,
    z: previous[index].z + ((point.z || 0) - previous[index].z) * alpha
  }));
}

function classify(points, previousState) {
  if (!points || points.length < 21) return { key: 'unknown', label: '正在寻找手掌', pinchStrength: 0, pinchRatio: 1 };
  const palm = Math.max(.035, distance(points[5], points[17]), distance(points[0], points[9]) * 1.18);
  const pinchRatio = distance(points[4], points[8]) / palm;
  const wasPinched = !!(previousState && previousState.pinched);
  const pinched = wasPinched ? pinchRatio < .60 : pinchRatio < .42;
  const extended = [8, 12, 16, 20].filter(tip => distance(points[tip], points[0]) > distance(points[tip - 2], points[0]) * 1.14).length;
  const pinchStrength = clamp((.66 - pinchRatio) / .48, 0, 1);
  if (pinched) return { key: 'pinch', label: '捏合', pinchStrength, pinchRatio, pinched: true };
  if (extended >= 3) return { key: 'open', label: '张掌', pinchStrength, pinchRatio, pinched: false };
  if (extended === 0 && pinchRatio > .66) return { key: 'fist', label: '握拳', pinchStrength, pinchRatio, pinched: false };
  return { key: 'pose', label: '手势已识别', pinchStrength, pinchRatio, pinched: false };
}

function decorateAnchor(anchor, handIndex, previous, aspect) {
  const rawPoints = anchor.points.map(point => ({ x: point.x, y: point.y }));
  // Raw points belong to the VKFrame viewport. Keep the preview at those
  // coordinates; smoothing is only for puppet control, never the camera overlay.
  const trackedPoints = smoothPoints(rawPoints, previous && previous.trackedPoints);
  const gesture = classify(trackedPoints.map(point => ({ x: point.x * aspect, y: point.y })), previous && previous.gesture);
  const center = trackedPoints.length ? trackedPoints.reduce(function(total, point) {
    total.x += point.x; total.y += point.y; return total;
  }, { x: 0, y: 0 }) : { x: .5, y: .5 };
  center.x /= Math.max(1, trackedPoints.length);
  center.y /= Math.max(1, trackedPoints.length);
  return { id: anchor.id, rawPoints, trackedPoints, points: rawPoints, gesture, center, handLabel: handIndex === 0 ? '手一' : '手二' };
}

function labelHands(anchors, previousHands, aspect) {
  const rough = (Array.isArray(anchors) ? anchors : []).filter(anchor =>
    (anchor.type == null || anchor.type === 7) && Array.isArray(anchor.points) &&
    anchor.points.length === 21 && anchor.points.every(point => Number.isFinite(point.x) && Number.isFinite(point.y))
  ).slice(0, 2).map(function(anchor) {
    const points = anchor.points || [];
    const x = points.length ? points.reduce((sum, point) => sum + point.x, 0) / points.length : .5;
    return { anchor, x };
  }).sort((a, b) => a.x - b.x);
  const hands = rough.map(function(item, index) {
    const previous = item.anchor.id == null ? previousHands[index] : previousHands.find(hand => hand.id === item.anchor.id);
    return decorateAnchor(item.anchor, index, previous, aspect);
  });
  return hands.map(function(hand, index) {
    hand.screenSide = hands.length > 1 ? (index === 0 ? 'left' : 'right') : 'single';
    hand.handLabel = hands.length > 1 ? (index === 0 ? '预览左侧' : '预览右侧') : '手';
    return hand;
  });
}

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) || 'WebGL shader compile failed';
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}

class WechatHandInference {
  constructor(options) {
    this.onResult = options.onResult;
    this.onError = options.onError;
    this.onReady = options.onReady || function() {};
    this.onStatus = options.onStatus || function() {};
    this.canvas = options.canvas;
    this.displayWidth = Math.max(1, options.width || 320);
    this.displayHeight = Math.max(1, options.height || 240);
    this.pixelRatio = Math.min(options.pixelRatio || 1, 2);
    this.running = false;
    this.lastFrameAt = 0;
    this.previousHands = [];
    this.stopped = false;
    this.failed = false;
    this.frameCount = 0;
    this.anchorCount = 0;
    this.lastAnchorsAt = 0;
    this.phase = 'idle';
  }

  status(phase, text) {
    this.phase = phase;
    this.onStatus(text, phase);
  }

  fail(phase, raw, message) {
    if (this.stopped || this.failed) return;
    this.failed = true;
    const error = failure(phase, raw, message);
    error.frameCount = this.frameCount;
    error.anchorCount = this.anchorCount;
    this.stop();
    this.onError(error);
  }

  initGL() {
    const canvas = this.canvas;
    canvas.width = Math.round(this.displayWidth * this.pixelRatio);
    canvas.height = Math.round(this.displayHeight * this.pixelRatio);
    const gl = this.gl = canvas.getContext('webgl', { alpha: false, antialias: false });
    if (!gl) throw new Error('无法创建 VisionKit 所需的 WebGL 上下文。');
    const vertex = compileShader(gl, gl.VERTEX_SHADER, `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      uniform mat3 displayTransform;
      varying vec2 v_texCoord;
      void main() {
        vec3 p = displayTransform * vec3(a_position, 0.0);
        gl_Position = vec4(p, 1.0);
        v_texCoord = a_texCoord;
      }
    `);
    const precision = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
    const fragment = compileShader(gl, gl.FRAGMENT_SHADER, `
      precision ${precision && precision.precision ? 'highp' : 'mediump'} float;
      uniform sampler2D y_texture;
      uniform sampler2D uv_texture;
      varying vec2 v_texCoord;
      void main() {
        float Y = texture2D(y_texture, v_texCoord).r;
        vec4 uv = texture2D(uv_texture, v_texCoord);
        float U = uv.r - 0.5;
        float V = uv.a - 0.5;
        gl_FragColor = vec4(Y + 1.402 * V, Y - 0.344 * U - 0.714 * V, Y + 1.772 * U, 1.0);
      }
    `);
    const program = this.program = gl.createProgram();
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || 'WebGL program link failed');
    this.positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([1,1,-1,1,1,-1,-1,-1]), gl.STATIC_DRAW);
    this.texcoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texcoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([1,1,0,1,1,0,0,0]), gl.STATIC_DRAW);
    this.positionLocation = gl.getAttribLocation(program, 'a_position');
    this.texcoordLocation = gl.getAttribLocation(program, 'a_texCoord');
    this.transformLocation = gl.getUniformLocation(program, 'displayTransform');
    gl.useProgram(program);
    gl.uniform1i(gl.getUniformLocation(program, 'y_texture'), 5);
    gl.uniform1i(gl.getUniformLocation(program, 'uv_texture'), 6);
    this.vaoExtension = gl.getExtension('OES_vertex_array_object');
    if (this.vaoExtension) {
      this.vao = this.vaoExtension.createVertexArrayOES();
      const previous = gl.getParameter(this.vaoExtension.VERTEX_ARRAY_BINDING_OES);
      this.vaoExtension.bindVertexArrayOES(this.vao);
      this.bindAttributes();
      this.vaoExtension.bindVertexArrayOES(previous);
    }
    this.initSkeletonGL();
  }

  initSkeletonGL() {
    const gl = this.gl;
    const vertex = compileShader(gl, gl.VERTEX_SHADER, `
      attribute vec2 a_point;
      uniform float pointSize;
      void main() {
        gl_Position = vec4(a_point, 0.0, 1.0);
        gl_PointSize = pointSize;
      }
    `);
    const fragment = compileShader(gl, gl.FRAGMENT_SHADER, `
      precision mediump float;
      uniform vec4 color;
      uniform bool roundPoint;
      void main() {
        if (roundPoint && distance(gl_PointCoord, vec2(0.5)) > 0.5) discard;
        gl_FragColor = color;
      }
    `);
    this.skeletonProgram = gl.createProgram();
    gl.attachShader(this.skeletonProgram, vertex);
    gl.attachShader(this.skeletonProgram, fragment);
    gl.linkProgram(this.skeletonProgram);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(this.skeletonProgram, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(this.skeletonProgram) || '骨架绘制初始化失败');
    this.skeletonBuffer = gl.createBuffer();
    this.skeletonLocation = gl.getAttribLocation(this.skeletonProgram, 'a_point');
    this.skeletonColor = gl.getUniformLocation(this.skeletonProgram, 'color');
    this.skeletonRound = gl.getUniformLocation(this.skeletonProgram, 'roundPoint');
    this.skeletonPointSize = gl.getUniformLocation(this.skeletonProgram, 'pointSize');
    if (this.vaoExtension) this.skeletonVAO = this.vaoExtension.createVertexArrayOES();
  }

  renderSkeleton() {
    // Same canvas, viewport, render pass and native orientation as the camera.
    // WeChat's sample maps its viewport-normalized points directly to NDC:
    // x * 2 - 1, 1 - y * 2. Do not apply getDisplayTransform a second time.
    if (!this.previousHands.length || Date.now() - this.lastAnchorsAt > 250) return;
    const gl = this.gl;
    const points = [], edges = [];
    this.previousHands.forEach(hand => {
      const vertices = hand.rawPoints.map(point => [point.x * 2 - 1, 1 - point.y * 2]);
      vertices.forEach(point => points.push(point[0], point[1]));
      EDGES.forEach(pair => edges.push(...vertices[pair[0]], ...vertices[pair[1]]));
    });
    gl.useProgram(this.skeletonProgram);
    if (this.vaoExtension) this.vaoExtension.bindVertexArrayOES(this.skeletonVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.skeletonBuffer);
    gl.vertexAttribPointer(this.skeletonLocation, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(this.skeletonLocation);
    gl.uniform1f(this.skeletonPointSize, 4 * this.pixelRatio);
    gl.uniform4f(this.skeletonColor, .65, .98, .85, 1);
    gl.uniform1i(this.skeletonRound, 0);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(edges), gl.DYNAMIC_DRAW);
    gl.drawArrays(gl.LINES, 0, edges.length / 2);
    gl.uniform4f(this.skeletonColor, 1, .91, .62, 1);
    gl.uniform1i(this.skeletonRound, 1);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.DYNAMIC_DRAW);
    gl.drawArrays(gl.POINTS, 0, points.length / 2);
  }

  bindAttributes() {
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.vertexAttribPointer(this.positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(this.positionLocation);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texcoordBuffer);
    gl.vertexAttribPointer(this.texcoordLocation, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(this.texcoordLocation);
  }

  renderFrame(frame) {
    const gl = this.gl;
    if (!gl || !frame) return false;
    const textures = frame.getCameraTexture(gl, 'yuv');
    if (!textures || !textures.yTexture || !textures.uvTexture) return false;
    // VisionKit shares this GL context. Do not leave our shader, textures or
    // framebuffer bound when the SDK analyses the next frame.
    const saved = {
      program: gl.getParameter(gl.CURRENT_PROGRAM),
      active: gl.getParameter(gl.ACTIVE_TEXTURE),
      buffer: gl.getParameter(gl.ARRAY_BUFFER_BINDING),
      framebuffer: gl.getParameter(gl.FRAMEBUFFER_BINDING),
      viewport: gl.getParameter(gl.VIEWPORT),
      depth: gl.isEnabled(gl.DEPTH_TEST),
      blend: gl.isEnabled(gl.BLEND),
      vao: this.vaoExtension && gl.getParameter(this.vaoExtension.VERTEX_ARRAY_BINDING_OES)
    };
    gl.activeTexture(gl.TEXTURE5);
    saved.y = gl.getParameter(gl.TEXTURE_BINDING_2D);
    gl.activeTexture(gl.TEXTURE6);
    saved.uv = gl.getParameter(gl.TEXTURE_BINDING_2D);
    if (!this.vaoExtension) {
      saved.attributes = [...new Set([this.positionLocation, this.texcoordLocation, this.skeletonLocation])].map(index => ({
        index,
        buffer: gl.getVertexAttrib(index, gl.VERTEX_ATTRIB_ARRAY_BUFFER_BINDING),
        enabled: gl.getVertexAttrib(index, gl.VERTEX_ATTRIB_ARRAY_ENABLED),
        size: gl.getVertexAttrib(index, gl.VERTEX_ATTRIB_ARRAY_SIZE),
        type: gl.getVertexAttrib(index, gl.VERTEX_ATTRIB_ARRAY_TYPE),
        normalized: gl.getVertexAttrib(index, gl.VERTEX_ATTRIB_ARRAY_NORMALIZED),
        stride: gl.getVertexAttrib(index, gl.VERTEX_ATTRIB_ARRAY_STRIDE),
        offset: gl.getVertexAttribOffset(index, gl.VERTEX_ATTRIB_ARRAY_POINTER)
      }));
    }
    try {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    gl.useProgram(this.program);
    if (this.vaoExtension) this.vaoExtension.bindVertexArrayOES(this.vao);
    else this.bindAttributes();
    gl.uniformMatrix3fv(this.transformLocation, false, frame.getDisplayTransform());
    gl.activeTexture(gl.TEXTURE5);
    gl.bindTexture(gl.TEXTURE_2D, textures.yTexture);
    gl.activeTexture(gl.TEXTURE6);
    gl.bindTexture(gl.TEXTURE_2D, textures.uvTexture);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    this.renderSkeleton();
    return true;
    } finally {
      gl.activeTexture(gl.TEXTURE5);
      gl.bindTexture(gl.TEXTURE_2D, saved.y);
      gl.activeTexture(gl.TEXTURE6);
      gl.bindTexture(gl.TEXTURE_2D, saved.uv);
      gl.activeTexture(saved.active);
      if (this.vaoExtension) this.vaoExtension.bindVertexArrayOES(saved.vao);
      else saved.attributes.forEach(attribute => {
        if (attribute.buffer) {
          gl.bindBuffer(gl.ARRAY_BUFFER, attribute.buffer);
          gl.vertexAttribPointer(attribute.index, attribute.size, attribute.type, attribute.normalized, attribute.stride, attribute.offset);
        }
        if (attribute.enabled) gl.enableVertexAttribArray(attribute.index);
        else gl.disableVertexAttribArray(attribute.index);
      });
      gl.bindBuffer(gl.ARRAY_BUFFER, saved.buffer);
      gl.bindFramebuffer(gl.FRAMEBUFFER, saved.framebuffer);
      gl.viewport.apply(gl, saved.viewport);
      if (saved.depth) gl.enable(gl.DEPTH_TEST);
      if (saved.blend) gl.enable(gl.BLEND);
      gl.useProgram(saved.program);
    }
  }

  publish(anchors) {
    if (!this.running || this.stopped) return;
    this.previousHands = labelHands(anchors, this.previousHands, this.displayWidth / this.displayHeight);
    this.lastAnchorsAt = Date.now();
    this.anchorCount += this.previousHands.length;
    this.onResult(this.previousHands);
  }

  start() {
    if (this.stopped || this.session) return;
    if (!wx.createVKSession) {
      this.fail('capability', 'API_MISSING', '当前微信没有 VisionKit 接口，请升级微信后再试。');
      return;
    }
    try {
      this.status('webgl', '正在准备摄像头画布…');
      this.initGL();
      const self = this;
      this.status('session-create', '正在创建手势会话…');
      this.session = wx.createVKSession({
        track: { plane: { mode: 1 }, hand: { mode: 1 } },
        version: 'v1',
        gl: this.gl
      });
      const session = this.session;
      this.status('session-start', '正在启动手势识别…');
      this._startTimer = setTimeout(() => self.fail('session-start', 'START_TIMEOUT', 'VisionKit 启动超过 20 秒'), 20000);
      session.start(function(errno) {
        if (self.stopped || self.session !== session) return;
        clearTimeout(self._startTimer);
        if (errno) {
          self.fail('session-start', errno);
          return;
        }
        try {
          self.status('camera-front', '正在切换前置摄像头…');
          const config = session.config || {};
          config.cameraPosition = 1;
          session.config = config;
        self.running = true;
        const onAnchors = anchors => {
          try { self.publish(anchors); } catch (error) { self.fail('anchors', error, '处理手部关键点失败'); }
        };
        session.on('addAnchors', onAnchors);
        session.on('updateAnchors', onAnchors);
        session.on('removeAnchors', () => onAnchors([]));
        self.status('first-frame', '正在等待摄像头画面…');
        self._frameTimer = setTimeout(() => self.fail('first-frame', 'FRAME_TIMEOUT', '摄像头 12 秒内没有返回可显示的画面'), 12000);
        const frameInterval = 1000 / 24;
        const loop = function() {
          if (!self.running || !self.session) return;
          try {
          const now = Date.now();
          if (!self.lastFrameAt || now - self.lastFrameAt >= frameInterval) {
            self.lastFrameAt = now;
            const frame = self.session.getVKFrame(self.canvas.width, self.canvas.height);
            if (self.previousHands.length && now - self.lastAnchorsAt > 250) self.publish([]);
            if (frame && self.renderFrame(frame)) {
              self.frameCount++;
              if (self.frameCount === 1) {
                clearTimeout(self._frameTimer);
                self.status('tracking', '摄像头已就绪 · 请伸出手');
                self.onReady();
              }
            }
          }
          if (!self.stopped) self._raf = session.requestAnimationFrame(loop);
          } catch (error) { self.fail('frame', error, '摄像头帧处理失败'); }
        };
        self._raf = session.requestAnimationFrame(loop);
        } catch (error) { self.fail(self.phase, error, 'VisionKit 摄像头初始化失败'); }
      });
    } catch (error) {
      this.fail(this.phase, error);
    }
  }

  stop() {
    this.running = false;
    this.stopped = true;
    clearTimeout(this._startTimer);
    clearTimeout(this._frameTimer);
    const session = this.session;
    this.session = null;
    // A failed stop must not prevent destroy or conceal the original error.
    const safely = fn => { try { fn(); } catch (_) {} };
    if (session) {
      if (this._raf != null && session.cancelAnimationFrame) safely(() => session.cancelAnimationFrame(this._raf));
      if (session.stop) safely(() => session.stop());
      if (session.destroy) safely(() => session.destroy());
    }
    const gl = this.gl;
    if (gl) {
      if (this.vao) safely(() => this.vaoExtension.deleteVertexArrayOES(this.vao));
      if (this.skeletonVAO) safely(() => this.vaoExtension.deleteVertexArrayOES(this.skeletonVAO));
      if (this.skeletonBuffer) safely(() => gl.deleteBuffer(this.skeletonBuffer));
      if (this.skeletonProgram) safely(() => gl.deleteProgram(this.skeletonProgram));
      if (this.positionBuffer) safely(() => gl.deleteBuffer(this.positionBuffer));
      if (this.texcoordBuffer) safely(() => gl.deleteBuffer(this.texcoordBuffer));
      if (this.program) safely(() => gl.deleteProgram(this.program));
    }
    this.previousHands = [];
    this.session = null;
    this.gl = null;
    this.canvas = null;
  }
}

module.exports = WechatHandInference;
