'use strict';

// 微信 2D Canvas 水面折射。它直接重绘背景图的水域切片，形成连续的
// 纹理位移和高光，而不是在画面上叠加二维圆圈。
class MiniWater {
  constructor(page, imagePath, options) {
    this.page = page;
    this.imagePath = imagePath;
    this.phase = 0;
    this.strength = 1;
    this.ripples = [];
    this.ambient = !options || options.ambient !== false;
    this.destroyed = false;
  }

  mount() {
    const self = this;
    wx.createSelectorQuery().select('#waterCanvas').fields({ node: true, size: true }).exec(function(result) {
      const field = result && result[0];
      if (self.destroyed || !field || !field.node) return;
      self.canvas = field.node;
      self.ctx = self.canvas.getContext('2d');
      if (!self.ctx) return;
      const windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
      const ratio = Math.min(windowInfo.pixelRatio || 1, 1.5);
      self.width = Math.max(1, Math.round(field.width * ratio));
      self.height = Math.max(1, Math.round(field.height * ratio));
      self.canvas.width = self.width;
      self.canvas.height = self.height;
      self.setImage(self.imagePath);
    });
  }

  setImage(path) {
    this.imagePath = path;
    if (!this.canvas || !this.ctx) return;
    this.loaded = false;
    const self = this;
    const image = this.canvas.createImage();
    image.onload = function() {
      if (!self.canvas) return;
      self.image = image;
      self.loaded = true;
      self.start();
    };
    image.src = path;
  }

  pulse(value) {
    this.strength = Math.max(this.strength, Math.min(1.18, value || 1.08));
  }

  ripple(x, y, strength) {
    this.ripples.push({ x: x == null ? .5 : x, y: y == null ? .82 : y, strength: strength || .6, born: Date.now() });
    if (this.ripples.length > 5) this.ripples.shift();
    this.start();
  }

  start() {
    if (this.running || !this.loaded || (!this.ambient && !this.ripples.length)) return;
    this.running = true;
    this.last = 0;
    this.tick = this.tick.bind(this);
    this.raf = this.canvas.requestAnimationFrame(this.tick);
  }

  drawWater() {
    const ctx = this.ctx;
    const image = this.image;
    const width = this.width;
    const height = this.height;
    if (!ctx || !image || !width || !height) return;

    const imageWidth = image.width || 1280;
    const imageHeight = image.height || 720;
    const scale = Math.max(width / imageWidth, height / imageHeight);
    const cropWidth = width / scale;
    const cropHeight = height / scale;
    const cropX = (imageWidth - cropWidth) / 2;
    const cropY = (imageHeight - cropHeight) / 2;
    const waterTop = Math.round(height * .49);
    const strip = Math.max(3, Math.round(height / 180));

    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, waterTop, width, height - waterTop);
    ctx.clip();
    // Keep the original scene dominant. The canvas contributes only a quiet
    // refraction layer, avoiding the motion sickness caused by moving the
    // whole lower half of the image at near-full opacity.
    ctx.globalAlpha = .24;

    if (this.ambient) {
    for (let y = waterTop; y < height; y += strip) {
      const depth = (y - waterTop) / Math.max(1, height - waterTop);
      const offset = (
        Math.sin(y * .018 + this.phase * .24) * .58 +
        Math.sin(y * .037 - this.phase * .14) * .24 +
        Math.sin(this.phase * .1 + depth * 4) * .12
      ) * this.strength * (.12 + depth * .38);
      const sourceY = cropY + y / scale;
      const sourceHeight = Math.min(strip / scale + 1, cropY + cropHeight - sourceY);
      if (sourceHeight <= 0) continue;
      ctx.drawImage(image, cropX, sourceY, cropWidth, sourceHeight, offset, y, width, strip + 1);
    }

    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = .035 + Math.min(.035, (this.strength - 1) * .04);
    for (let y = waterTop + strip; y < height; y += strip * 8) {
      const shift = Math.sin(y * .025 + this.phase * .2) * width * .003;
      const gradient = ctx.createLinearGradient(width * .12 + shift, y, width * .86 + shift, y);
      gradient.addColorStop(0, 'rgba(126,231,238,0)');
      gradient.addColorStop(.48, 'rgba(216,255,244,.9)');
      gradient.addColorStop(1, 'rgba(126,231,238,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, y, width, Math.max(1, strip * .55));
    }
    }
    const now = Date.now();
    this.ripples = this.ripples.filter(function(ripple) { return now - ripple.born < 1500; });
    this.ripples.forEach(function(ripple) {
      const progress = (now - ripple.born) / 1500;
      const radius = width * (.025 + progress * .12) * ripple.strength;
      ctx.save();
      ctx.translate(ripple.x * width, ripple.y * height);
      ctx.scale(1, .28);
      ctx.globalAlpha = (1 - progress) * .48;
      ctx.strokeStyle = 'rgba(222,255,246,.9)';
      ctx.lineWidth = Math.max(1, 2.2 * (1 - progress));
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });
    ctx.restore();
  }

  tick(timestamp) {
    if (!this.running || !this.ctx) return;
    const now = typeof timestamp === 'number' ? timestamp : Date.now();
    if (this.last) this.phase += Math.min((now - this.last) / 1000, .05);
    this.last = now;
    this.strength += (1 - this.strength) * .12;
    this.drawWater();
    if (!this.ambient && !this.ripples.length) {
      this.ctx.clearRect(0, 0, this.width, this.height);
      this.running = false;
    } else this.raf = this.canvas.requestAnimationFrame(this.tick);
  }

  destroy() {
    this.destroyed = true;
    this.running = false;
    if (this.canvas && this.raf) this.canvas.cancelAnimationFrame(this.raf);
    this.ctx = null;
    this.image = null;
    this.canvas = null;
    this.ripples = [];
  }
}

module.exports = MiniWater;
