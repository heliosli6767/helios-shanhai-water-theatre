'use strict';

// VKSession.start status values from WeChat's official API definitions.
// Preserve the native status; never infer unsupported hardware from the brand.
const START_ERRORS = {
  104: ['摄像头授权已取消', '请重新开启摄像头并同意授权。', 'mini'],
  112: ['缺少隐私接口声明', '开发者需在微信公众平台补全此版本的用户隐私保护指引；清缓存不能解决。', ''],
  1025: ['小程序隐私接口被限制', '需由开发者检查微信公众平台的隐私接口限制。', ''],
  1026: ['隐私接口被限制', '需由开发者检查微信公众平台的隐私接口限制。', ''],
  2000001: ['识别参数被拒绝', '请复制诊断信息，由开发者检查当前客户端的接口参数。', ''],
  2003000: ['识别会话不可用', '请关闭其他相机使用界面，再重试。若仍失败，请复制诊断信息。', ''],
  2000000: ['识别系统错误', '请复制诊断信息，需核对微信版本与设备支持情况。', ''],
  2000002: ['设备不支持此识别能力', '当前设备返回不支持；需核对具体型号与微信版本。', ''],
  2000003: ['系统不支持此识别能力', '当前系统返回不支持；需核对系统与微信版本。', ''],
  2000004: ['设备不支持此识别能力', '当前设备返回不支持；需核对具体型号与微信版本。', ''],
  2003001: ['微信没有系统相机权限', '请在手机设置中允许微信使用相机，再重试。', 'system'],
  2003002: ['小程序没有相机权限', '请在小程序设置中开启相机权限，再重试。', 'mini']
};

function failure(phase, raw, fallback) {
  const code = typeof raw === 'number' || typeof raw === 'string'
    ? raw : raw && (raw.errCode != null ? raw.errCode : raw.errno != null ? raw.errno : raw.code);
  const known = phase === 'session-start' && START_ERRORS[code];
  const detail = raw && (raw.errMsg || raw.message) || (code != null ? String(code) : '无额外错误信息');
  const error = new Error(known ? known[0] : fallback || '手势识别启动失败');
  error.phase = phase;
  error.code = code == null ? 'UNKNOWN' : code;
  error.detail = String(detail);
  error.help = known ? known[1] : '请复制诊断信息，保留当前错误以便定位。';
  error.settings = known ? known[2] : '';
  return error;
}

module.exports = { failure };
