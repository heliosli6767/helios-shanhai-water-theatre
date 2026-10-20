'use strict';
var STORY_PATH_PREFIX = '/api/v1/stories/';

function record(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
function text(value) { return typeof value === 'string' && value.trim().length > 0; }
function positive(value) { return Number.isInteger(value) && value > 0; }
function scene(value) {
  if (!record(value) || !text(value.title) || !text(value.background) || !Array.isArray(value.steps) || value.steps.length < 1) return false;
  return value.steps.every(function(step) {
    return record(step) && text(step.label) && text(step.instruction) && text(step.motion) && text(step.result);
  });
}

function storyPath(id) {
  if (!positive(id)) throw new TypeError('Story id must be a positive integer');
  return STORY_PATH_PREFIX + id;
}

function isStoryResponse(value) {
  if (!record(value) || !text(value.requestId) || !record(value.data)) return false;
  var data = value.data;
  if (data.schemaVersion !== 1 || !text(data.contentVersion) || !positive(data.id)) return false;
  if (!text(data.title) || !text(data.chapter) || !text(data.summary) || !positive(data.sceneCount)) return false;
  if (!Array.isArray(data.narrative) || data.narrative.length < 1 || !data.narrative.every(text)) return false;
  if (!Array.isArray(data.quote) || data.quote.length < 1) return false;
  for (var i = 0; i < data.quote.length; i++) {
    if (!record(data.quote[i]) || !text(data.quote[i].text) || !text(data.quote[i].pinyin)) return false;
  }
  if (!Array.isArray(data.scenes) || data.scenes.length !== data.sceneCount || !data.scenes.every(scene)) return false;
  return record(data.source) && text(data.source.note) && /^https:\/\//.test(data.source.url);
}

module.exports = {
  STORY_PATH_PREFIX: STORY_PATH_PREFIX,
  storyPath: storyPath,
  isStoryResponse: isStoryResponse
};
