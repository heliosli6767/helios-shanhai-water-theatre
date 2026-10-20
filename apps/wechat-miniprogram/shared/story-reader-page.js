'use strict';

const storyService = require('../services/story');

function annotateQuote(quote) {
  return quote.map(function(line, lineIndex) {
    const syllables = line.pinyin.match(/[^\s,.;!?，。；：]+/g) || [];
    let syllableIndex = 0;
    return {
      key: `line-${lineIndex}`,
      tokens: line.text.split('').map(function(character, characterIndex) {
        const isHan = /[\u3400-\u9fff]/.test(character);
        return {
          key: `${lineIndex}-${characterIndex}`,
          han: character,
          pinyin: isHan ? (syllables[syllableIndex++] || '') : ''
        };
      })
    };
  });
}

module.exports = function createReaderPage(storyId, packageRoot, forcedLandscape) {
  return {
    data: {
      storyId,
      story: null,
      loading: true,
      error: '',
      readingMode: 'story',
      forcedLandscape: !!forcedLandscape,
      sceneImage: `${packageRoot}/assets/reader-bg.jpg`,
      readerCharacter: `${packageRoot}/assets/reader-character.png`,
      readerProp: `${packageRoot}/assets/reader-prop.png`
    },
    onLoad: function(options) {
      this._alive = true;
      const mode = options && options.mode;
      if (mode === 'classic') this.setData({ readingMode: 'classic' });
      this.loadStory();
    },
    onUnload: function() {
      this._alive = false;
      if (this._request) this._request.abort();
    },
    loadStory: function() {
      const self = this;
      if (this._request) this._request.abort();
      this.setData({ loading: true, error: '' });
      const request = this._request = storyService.requestStory(storyId);
      request.promise.then(function(response) {
        if (!self._alive) return;
        const story = Object.assign({}, response.data, { classicLines: annotateQuote(response.data.quote) });
        self.setData({ loading: false, story });
      }).catch(function(error) {
        if (self._alive) self.setData({ loading: false, error: error.message });
      });
    },
    retry: function() { this.loadStory(); },
    backCatalog: function() {
      wx.navigateBack({ delta: this.data.forcedLandscape ? 2 : 1 });
    },
    toggleOrientation: function() {
      if (!this.data.forcedLandscape) {
        wx.navigateTo({ url: `${packageRoot}/pages/reader-landscape/index?mode=${this.data.readingMode}` });
        return;
      }
      const mode = this.data.readingMode;
      wx.navigateBack({
        success: function() {
          if (typeof getCurrentPages !== 'function') return;
          const pages = getCurrentPages();
          const portraitReader = pages[pages.length - 1];
          if (portraitReader && portraitReader.setData) portraitReader.setData({ readingMode: mode });
        }
      });
    },
    setReading: function(event) {
      const mode = event.currentTarget.dataset.mode;
      if (mode === 'story' || mode === 'classic') this.setData({ readingMode: mode });
    },
    enterStage: function() {
      wx.navigateTo({ url: `${packageRoot}/pages/stage/index` });
    }
  };
};
