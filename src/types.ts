export interface Planet {
  id: string;
  el: Element;
  name: string;
  x: number;
  y: number;
  z: number;
}

export interface TradeRoute {
  id: string;
  el: Element;
  name: string;
  pointA: string;
  pointB: string;
}

export interface StoryEvent {
  id: string;
  el: Element;
  name: string;
  eventType: string;
  eventParams: string[];
  rewardType: string;
  rewardParams: string[];
  prereqs: string[];
  storyDialog: string;
  storyChapter: string;
  storyTag: string;
  branch: string;
}

export type Language = 'en' | 'es';

export interface AppSettings {
  invertY: boolean;
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;
  language: Language;
  storyXmlEditable: boolean;
}

