var contract = require('./home-contract');
var config = require('./config');
function failure(code, message) { var error = new Error(message); error.code = code; return error; }
function requestHome() {
  var task;
  var promise = new Promise(function(resolve, reject) {
    var settings;
    try { settings = config.getConfig(); } catch (error) { reject(error); return; }
    task = wx.request({
      url: settings.apiBaseUrl + contract.HOME_PATH,
      method: 'GET', timeout: settings.timeoutMs, dataType: 'json',
      success: function(response) {
        if (response.statusCode !== 200) return reject(failure('HTTP_ERROR', '服务暂时不可用，请稍后重试。'));
        if (!contract.isHomeResponse(response.data)) return reject(failure('INVALID_RESPONSE', '首页数据格式不匹配，请检查接口版本。'));
        resolve(response.data);
      },
      fail: function(error) {
        var message = String(error && error.errMsg || '');
        var timeout = /timeout/i.test(message);
        reject(failure(timeout ? 'TIMEOUT' : 'NETWORK_ERROR', timeout ? '连接超时，请重试。' : '无法连接首页服务，请检查 API 地址与网络配置。'));
      }
    });
  });
  return { promise: promise, abort: function() { if (task) task.abort(); } };
}
module.exports = { requestHome: requestHome };
