var homeService = require('../../services/home');
var storyService = require('../../services/story');
var BUILD = require('../../shared/build-info');

var STORY_VISUALS = {
  1: { cover: '/assets/images/covers/story-01.jpg', islandStyle: 'left:34%;top:66%;--book-tilt:-8deg' },
  2: { cover: '/assets/images/covers/story-02.jpg', islandStyle: 'left:15%;top:21%;--book-tilt:-7deg' },
  3: { cover: '/assets/images/covers/story-03.jpg', islandStyle: 'left:84%;top:24%;--book-tilt:8deg' },
  7: { cover: '/assets/images/covers/story-07.jpg', islandStyle: 'left:68%;top:70%;--book-tilt:6deg' },
  8: { cover: '/assets/images/covers/story-08.jpg', islandStyle: 'left:46%;top:23%;--book-tilt:-3deg' },
  9: { cover: '/assets/images/covers/story-09.jpg', islandStyle: 'left:88%;top:45%;--book-tilt:5deg' },
  10: { cover: '/assets/images/covers/story-10.jpg', islandStyle: 'left:22%;top:42%;--book-tilt:-5deg' },
  16: { cover: '/assets/images/covers/story-16.jpg', islandStyle: 'left:53%;top:46%;--book-tilt:3deg' },
  20: { cover: '/assets/images/covers/story-20.jpg', islandStyle: 'left:14%;top:84%;--book-tilt:-5deg' }
};

function decorateStories(stories) {
  return stories.filter(function(story) {
    return story.id === 1;
  }).map(function(story) {
    var visual = STORY_VISUALS[story.id] || {};
    return Object.assign({}, story, visual);
  });
}

function annotateQuote(quote) {
  return quote.map(function(line, lineIndex) {
    var syllables = line.pinyin.match(/[^\s,.;!?，。；：]+/g) || [];
    var syllableIndex = 0;
    var tokens = line.text.split('').map(function(character, characterIndex) {
      if (/[\u3400-\u9fff]/.test(character)) {
        return { key: lineIndex + '-' + characterIndex, han: character, pinyin: syllables[syllableIndex++] || '' };
      }
      return { key: lineIndex + '-' + characterIndex, han: character, pinyin: '' };
    });
    return { key: 'line-' + lineIndex, tokens: tokens };
  });
}

function decorateStory(story) {
  var visual = STORY_VISUALS[story.id] || {};
  var prefix = String(story.id);
  if (prefix.length < 2) prefix = '0' + prefix;
  var scenes = story.scenes.map(function(scene, index) {
    return Object.assign({}, scene, {
      number: index + 1,
      backgroundImage: '/assets/images/scenes/story-' + prefix + '-act-' + (index + 1) + '.jpg',
      firstStep: scene.steps[0]
    });
  });
  return Object.assign({}, story, visual, { classicLines: annotateQuote(story.quote), scenes: scenes });
}

Page({
  data: {
    buildId: BUILD.id,
    screen: 'home',
    waterMotion: false,
    loading: true,
    error: '',
    home: null,
    stories: [],
    selectedSummary: null,
    story: null,
    storyLoading: false,
    storyError: '',
    readingMode: 'story',
    homeScrollLeft: 0,
    stageAct: 0,
    currentScene: null,
    cameraOn: false,
    cameraError: '',
    requestId: ''
  },
  onLoad: function() {
    this._alive = true;
    this._sequence = 0;
    this._storySequence = 0;
    this._storyCache = {};
    this.loadHome();
  },
  onUnload: function() {
    this._alive = false;
    if (this._request) this._request.abort();
    if (this._storyRequest) this._storyRequest.abort();
  },
  loadHome: function() {
    var self = this, sequence = ++this._sequence;
    if (this._request) this._request.abort();
    this.setData({ loading: true, error: '', home: null, stories: [], requestId: '' });
    var request = this._request = homeService.requestHome();
    request.promise.then(function(response) {
      if (self._alive && self._sequence === sequence) self.setData({
        loading: false,
        home: response.data,
        stories: decorateStories(response.data.stories),
        requestId: response.requestId
      });
    }).catch(function(error) {
      if (self._alive && self._sequence === sequence) self.setData({ loading: false, error: error.message });
    });
  },
  retry: function() { this.loadHome(); },
  showBuildInfo: function() {
    wx.showModal({
      title: '无手势上传测试',
      content: '当前小程序版本：' + BUILD.id + '\n本分支不请求摄像头权限，不创建 VisionKit 会话。\n仅用于比较素材上传和真机连接时间。',
      showCancel: false,
      confirmText: '知道了'
    });
  },
  toggleWater: function() { this.setData({ waterMotion: !this.data.waterMotion }); },
  openCatalog: function() {
    if (!this.data.home) return;
    this.setData({ screen: 'catalog' });
  },
  backHome: function() {
    var self = this;
    this.setData({ screen: 'home', homeScrollLeft: 1 }, function() {
      self.setData({ homeScrollLeft: 0 });
    });
  },
  chooseStory: function(event) {
    var id = Number(event.currentTarget.dataset.id);
    var summary = this.data.stories.find(function(item) { return item.id === id; });
    if (!summary) return;
    var prefix = String(id);
    if (prefix.length < 2) prefix = '0' + prefix;
    wx.navigateTo({ url: '/story-packages/story-' + prefix + '/pages/reader/index' });
  },
  openStory: function(summary) {
    var cached = this._storyCache[summary.id];
    this.setData({
      screen: 'story',
      selectedSummary: summary,
      story: cached || null,
      storyLoading: !cached,
      storyError: '',
      readingMode: 'story',
      stageAct: 0,
      currentScene: cached ? cached.scenes[0] : null,
      cameraOn: false,
      cameraError: ''
    });
    if (cached) return;
    this.loadStory(summary.id);
  },
  loadStory: function(id) {
    var self = this;
    var sequence = ++this._storySequence;
    if (this._storyRequest) this._storyRequest.abort();
    this.setData({ storyLoading: true, storyError: '' });
    var request = this._storyRequest = storyService.requestStory(id);
    request.promise.then(function(response) {
      if (!self._alive || self._storySequence !== sequence) return;
      var story = decorateStory(response.data);
      self._storyCache[id] = story;
      self.setData({ storyLoading: false, story: story, currentScene: story.scenes[0] });
    }).catch(function(error) {
      if (self._alive && self._storySequence === sequence) {
        self.setData({ storyLoading: false, storyError: error.message });
      }
    });
  },
  retryStory: function() {
    if (this.data.selectedSummary) this.loadStory(this.data.selectedSummary.id);
  },
  backCatalog: function() {
    if (this._storyRequest) this._storyRequest.abort();
    this._storySequence++;
    this.setData({ screen: 'catalog', storyError: '', cameraOn: false, cameraError: '' });
  },
  setReading: function(event) {
    var mode = event.currentTarget.dataset.mode;
    if (mode === 'stage' || mode === 'story' || mode === 'classic') {
      this.setData({ readingMode: mode, cameraOn: mode === 'stage' ? this.data.cameraOn : false });
    }
  },
  setStageAct: function(event) {
    if (!this.data.story) return;
    var index = Number(event.currentTarget.dataset.index);
    if (!Number.isInteger(index) || !this.data.story.scenes[index]) return;
    this.setData({ stageAct: index, currentScene: this.data.story.scenes[index] });
  },
  toggleCamera: function() {
    this.setData({ cameraOn: !this.data.cameraOn, cameraError: '' });
  },
  cameraError: function(event) {
    var message = event && event.detail && event.detail.errMsg;
    this.setData({ cameraOn: false, cameraError: message || '摄像头暂时无法开启。' });
  }
});
