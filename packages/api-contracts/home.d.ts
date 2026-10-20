export interface StorySummary {
  id: number;
  title: string;
  summary: string;
  chapter: string;
  sceneCount: number;
}
export interface HomeData {
  schemaVersion: 1;
  contentVersion: string;
  project: { id: string; name: string; tagline: string };
  hero: { title: string; subtitle: string };
  stats: { storyCount: number; sceneCount: number };
  stories: StorySummary[];
}
export interface HomeResponse { data: HomeData; requestId: string }
export interface ApiErrorResponse { error: { code: string; message: string }; requestId: string }
export const HOME_PATH: '/api/v1/home';
export function isHomeResponse(value: unknown): value is HomeResponse;
