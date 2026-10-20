var contract = require('./story-contract');
var config = require('./config');

function failure(code, message) {
  var error = new Error(message);
  error.code = code;
  return error;
}

function requestStory(id) {
  var task;
  var promise = new Promise(function(resolve, reject) {
    var settings;
    var path;
    try {
      settings = config.getConfig();
      path = contract.storyPath(id);
    } catch (error) {
      reject(error);
      return;
    }
    task = wx.request({
      url: settings.apiBaseUrl + path,
      method: 'GET',
      timeout: settings.timeoutMs,
      dataType: 'json',
      success: function(response) {
        if (response.statusCode === 404) return reject(failure('STORY_NOT_FOUND', '没有找到这卷故事。'));
        if (response.statusCode !== 200) return reject(failure('HTTP_ERROR', '故事暂时无法展开，请稍后重试。'));
        if (!contract.isStoryResponse(response.data)) return reject(failure('INVALID_RESPONSE', '故事数据格式不匹配，请检查接口版本。'));
        resolve(response.data);
      },
      fail: function(error) {
        var message = String(error && error.errMsg || '');
        var timeout = /timeout/i.test(message);
        reject(failure(timeout ? 'TIMEOUT' : 'NETWORK_ERROR', timeout ? '连接超时，请重试。' : '无法连接故事服务，请检查网络配置。'));
      }
    });
  });
  return { promise: promise, abort: function() { if (task) task.abort(); } };
}

module.exports = { requestStory: requestStory };
