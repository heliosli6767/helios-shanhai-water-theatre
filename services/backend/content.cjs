'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createHash } = require('node:crypto');
const project = require('../../packages/shared-constants/project.cjs');
const { isHomeResponse } = require('../../packages/api-contracts/home.js');
const { isStoryResponse } = require('../../packages/api-contracts/story.js');

function loadSources(root = path.resolve(__dirname, '../..')) {
  // Transitional adapter for trusted, checked-in project code ONLY. Never load
  // uploaded files or execute request input. vm is not a security sandbox.
  const context = vm.createContext({ window: {} });
  const hash = createHash('sha256');
  for (const file of ['stories.js', 'scene-data.js']) {
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    hash.update(file + '\0' + source);
    vm.runInContext(source, context, { filename: file, timeout: 1000 });
  }
  const { STORIES, STORY_SCENES, STORY_AUDIT } = context.window;
  if (!Array.isArray(STORIES) || !STORY_SCENES || !STORY_AUDIT) throw new Error('Missing story source');
  return { STORIES, STORY_SCENES, STORY_AUDIT, contentVersion: hash.digest('hex').slice(0, 16) };
}

function loadHome(root = path.resolve(__dirname, '../..')) {
  const { STORIES, STORY_SCENES, contentVersion } = loadSources(root);
  const stories = Array.from(STORIES, story => ({
    id: story.id,
    title: story.title,
    summary: story.summary,
    chapter: story.chapter,
    sceneCount: Array.isArray(STORY_SCENES[story.id]) ? STORY_SCENES[story.id].length : 0
  }));
  const home = {
    schemaVersion: 1,
    contentVersion,
    project: { id: project.id, name: project.name, tagline: project.tagline },
    hero: { title: project.homeTitle, subtitle: project.homeSubtitle },
    stats: { storyCount: stories.length, sceneCount: stories.reduce((n, story) => n + story.sceneCount, 0) },
    stories
  };
  if (!isHomeResponse({ data: home, requestId: 'startup-validation' })) throw new Error('Invalid home content');
  return home;
}

function loadStory(id, root = path.resolve(__dirname, '../..')) {
  const numericId = Number(id);
  const { STORIES, STORY_SCENES, STORY_AUDIT, contentVersion } = loadSources(root);
  const source = STORIES.find(story => story.id === numericId);
  if (!source) return null;
  const audit = STORY_AUDIT[numericId];
  const sourceScenes = STORY_SCENES[numericId] || [];
  const story = {
    schemaVersion: 1,
    contentVersion,
    id: source.id,
    title: source.title,
    chapter: source.chapter,
    summary: source.summary,
    narrative: Array.from(source.narrative),
    quote: Array.from(source.quote, pair => ({ text: pair[0], pinyin: pair[1] })),
    source: { note: audit.note, url: audit.url },
    sceneCount: sourceScenes.length,
    scenes: Array.from(sourceScenes, scene => ({
      title: scene.title,
      background: scene.background,
      steps: Array.from(scene.steps, step => ({
        label: step.label,
        instruction: step.instruction,
        motion: step.motion,
        result: step.result
      }))
    }))
  };
  if (!isStoryResponse({ data: story, requestId: 'startup-validation' })) throw new Error('Invalid story content');
  return story;
}

module.exports = { loadHome, loadStory };
