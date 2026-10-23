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
  perpetual?: boolean;
  active?: boolean;
}

export interface CampaignFactionSetting {
  faction: string;
  homeLocation: string;
  startingCredits: number;
  startingTechLevel: number;
  maxTechLevel: number;
  aiPlayerControl: string;
  markupFilename: string;
  storyName: string;
}

export interface StartingForceEntry {
  id: string;
  faction: string;
  planet: string;
  unitType: string;
  count: number;
}

export interface Campaign {
  id: string;
  el: Element;
  name: string;
  campaignSet: string;
  sortOrder: number;
  textId: string;
  descriptionText: string;
  cameraShiftX: number;
  cameraShiftY: number;
  cameraDistance: number;
  locations: string[];
  tradeRoutes: string[];
  startingActivePlayer: string;
  humanVictoryConditions: string[];
  aiVictoryConditions: string[];
  specialStructuresLandVictory: boolean;
  winLeaderDestruction: boolean;
  conquerAllPlanets: boolean;
  showCompletedTab: boolean;
  supportsCustomSettings: boolean;
  isMultiplayer: boolean;
  factions: CampaignFactionSetting[];
  startingForces: StartingForceEntry[];
}

export type Language = 'en' | 'es' | 'fr';

export interface AppSettings {
  invertY: boolean;
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;
  language: Language;
  storyXmlEditable: boolean;
}

