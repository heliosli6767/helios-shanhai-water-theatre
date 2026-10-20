export interface StoryQuoteLine { text: string; pinyin: string }
export interface StoryStep { label: string; instruction: string; motion: string; result: string }
export interface StoryScene { title: string; background: string; steps: StoryStep[] }
export interface StoryData {
  schemaVersion: 1;
  contentVersion: string;
  id: number;
  title: string;
  chapter: string;
  summary: string;
  narrative: string[];
  quote: StoryQuoteLine[];
  source: { note: string; url: string };
  sceneCount: number;
  scenes: StoryScene[];
}
export interface StoryResponse { data: StoryData; requestId: string }
export const STORY_PATH_PREFIX: '/api/v1/stories/';
export function storyPath(id: number): string;
export function isStoryResponse(value: unknown): value is StoryResponse;
