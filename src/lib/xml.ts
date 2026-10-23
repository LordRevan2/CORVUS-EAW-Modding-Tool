import { Planet, TradeRoute, StoryEvent, Campaign, CampaignFactionSetting, StartingForceEntry } from '../types';

let lastId = 0;

export function parseStoryElement(el: Element, existingId?: string): StoryEvent {
  const name = el.getAttribute('Name') || el.getAttribute('name') || 'New_Event';
  const eventType = el.querySelector('Event_Type')?.textContent?.trim() || '';

  // Support Event_Param1 .. Event_Param10 while preserving sparse parameter indices
  const rawEventParams: (string | undefined)[] = [];
  let maxEventIdx = -1;
  for (let i = 1; i <= 10; i++) {
    const paramEl = el.querySelector(`Event_Param${i}`);
    const val = paramEl?.textContent?.trim();
    rawEventParams.push(val);
    if (val !== undefined && val !== '') {
      maxEventIdx = i - 1;
    }
  }
  const eventParams = maxEventIdx >= 0
    ? rawEventParams.slice(0, maxEventIdx + 1).map(v => v ?? '')
    : [];

  const rewardType = el.querySelector('Reward_Type')?.textContent?.trim() || '';

  // Support Reward_Param1 .. Reward_Param10 while preserving sparse parameter indices
  const rawRewardParams: (string | undefined)[] = [];
  let maxRewardIdx = -1;
  for (let i = 1; i <= 10; i++) {
    const paramEl = el.querySelector(`Reward_Param${i}`);
    const val = paramEl?.textContent?.trim();
    rawRewardParams.push(val);
    if (val !== undefined && val !== '') {
      maxRewardIdx = i - 1;
    }
  }
  const rewardParams = maxRewardIdx >= 0
    ? rawRewardParams.slice(0, maxRewardIdx + 1).map(v => v ?? '')
    : [];

  const prereqs = Array.from(el.querySelectorAll('Prereq'))
    .map(p => p.textContent?.trim() || '')
    .filter(p => p);
  const storyDialog = el.querySelector('Story_Dialog')?.textContent?.trim() || '';
  const storyChapter = el.querySelector('Story_Chapter')?.textContent?.trim() || '';
  const storyTag = el.querySelector('Story_Tag')?.textContent?.trim() || '';
  const branch = el.querySelector('Branch')?.textContent?.trim() || '';

  const perpetualText = el.querySelector('Perpetual')?.textContent?.trim().toLowerCase();
  const perpetual = perpetualText === 'true' || perpetualText === '1' || perpetualText === 'yes';

  const activeText = el.querySelector('Active')?.textContent?.trim().toLowerCase();
  const active = activeText === 'false' || activeText === '0' || activeText === 'no' ? false : true;

  return {
    id: existingId || `ev_${lastId++}`,
    el,
    name,
    eventType,
    eventParams,
    rewardType,
    rewardParams,
    prereqs,
    storyDialog,
    storyChapter,
    storyTag,
    branch,
    perpetual,
    active
  };
}

export function parseStoryXml(xmlString: string): { doc: XMLDocument; storyEvents: StoryEvent[] } {
  const parser = new DOMParser();
  const cleaned = xmlString.trim().replace(/^\uFEFF/, '');
  const doc = parser.parseFromString(cleaned, 'application/xml');
  const errorNode = doc.querySelector('parsererror');
  if (errorNode) throw new Error("XML Inválido o corrupto");

  const eventEls = doc.querySelectorAll('Event');
  const storyEvents = Array.from(eventEls).map((el) => parseStoryElement(el));

  return { doc, storyEvents };
}

export function parsePlanetsXml(xmlString: string): { doc: XMLDocument; planets: Planet[] } {
  const parser = new DOMParser();
  const cleaned = xmlString.trim().replace(/^\uFEFF/, '');
  const doc = parser.parseFromString(cleaned, 'application/xml');
  const errorNode = doc.querySelector('parsererror');
  if (errorNode) throw new Error("XML Inválido o corrupto");

  // Search case-insensitively for all <Planet> tags
  const allElements = Array.from(doc.getElementsByTagName('*'));
  const planetEls = allElements.filter(el => el.tagName.toLowerCase() === 'planet');

  const planets: Planet[] = planetEls.map((el) => {
    // Case-insensitive attribute Name
    const name = el.getAttribute('Name')
      || el.getAttribute('name')
      || el.getAttribute('NAME')
      || Array.from(el.attributes).find(a => a.name.toLowerCase() === 'name')?.value
      || 'Desconocido';

    let x = 0;
    let y = 0;
    let z = 0;

    // Find Galactic_Position case-insensitively
    const posEl = Array.from(el.children).find(c => c.tagName.toLowerCase() === 'galactic_position')
      || Array.from(el.getElementsByTagName('*')).find(c => c.tagName.toLowerCase() === 'galactic_position')
      || el.querySelector('Galactic_Position');

    if (posEl && posEl.textContent) {
      // Robust number extraction: handles comma, space, tab, newline separation, negative coordinates and decimals
      const numMatches = posEl.textContent.match(/[-+]?(?:\d*\.\d+|\d+)(?:[eE][-+]?\d+)?/g);
      if (numMatches && numMatches.length >= 2) {
        const nx = parseFloat(numMatches[0]);
        const ny = parseFloat(numMatches[1]);
        const nz = numMatches.length >= 3 ? parseFloat(numMatches[2]) : 0;
        if (!Number.isNaN(nx)) x = nx;
        if (!Number.isNaN(ny)) y = ny;
        if (!Number.isNaN(nz)) z = nz;
      }
    }

    return {
      id: `p_${lastId++}`,
      el,
      name,
      x,
      y,
      z,
    };
  });

  return { doc, planets };
}

export function parseTradeRoutesXml(xmlString: string): { doc: XMLDocument; tradeRoutes: TradeRoute[] } {
  const parser = new DOMParser();
  const cleaned = xmlString.trim().replace(/^\uFEFF/, '');
  const doc = parser.parseFromString(cleaned, 'application/xml');
  const errorNode = doc.querySelector('parsererror');
  if (errorNode) throw new Error("XML Inválido o corrupto");

  // Search case-insensitively for all <TradeRoute> tags
  const allElements = Array.from(doc.getElementsByTagName('*'));
  const routeEls = allElements.filter(el => el.tagName.toLowerCase() === 'traderoute');

  const tradeRoutes: TradeRoute[] = routeEls.map((el) => {
    const name = el.getAttribute('Name')
      || el.getAttribute('name')
      || el.getAttribute('NAME')
      || Array.from(el.attributes).find(a => a.name.toLowerCase() === 'name')?.value
      || 'Unidentified_Route';

    const pointAEl = Array.from(el.children).find(c => c.tagName.toLowerCase() === 'point_a')
      || el.querySelector('Point_A');
    const pointBEl = Array.from(el.children).find(c => c.tagName.toLowerCase() === 'point_b')
      || el.querySelector('Point_B');

    const pointA = pointAEl?.textContent?.trim() || '';
    const pointB = pointBEl?.textContent?.trim() || '';
    
    return {
      id: `tr_${lastId++}`,
      el,
      name,
      pointA,
      pointB
    };
  });

  return { doc, tradeRoutes };
}

function findChildCaseInsensitive(el: Element, tagNameLower: string): Element | undefined {
  return Array.from(el.children).find(c => c.tagName.toLowerCase() === tagNameLower);
}

function findChildrenCaseInsensitive(el: Element, tagNameLower: string): Element[] {
  return Array.from(el.children).filter(c => c.tagName.toLowerCase() === tagNameLower);
}

function parseCommaList(rawText: string | null | undefined): string[] {
  if (!rawText) return [];
  return rawText
    .split(/[,;\n\r]+/)
    .map(s => s.trim())
    .filter(Boolean);
}

function parseBoolTag(el: Element, tagNameLower: string, defaultVal = false): boolean {
  const child = findChildCaseInsensitive(el, tagNameLower);
  if (!child || !child.textContent) return defaultVal;
  const val = child.textContent.trim().toLowerCase();
  return val === 'true' || val === 'yes' || val === '1';
}

export function parseCampaignElement(el: Element, existingId?: string): Campaign {
  const name = el.getAttribute('Name')
    || el.getAttribute('name')
    || Array.from(el.attributes).find(a => a.name.toLowerCase() === 'name')?.value
    || 'Unnamed_Campaign';

  const getText = (tagLower: string, fallback = '') =>
    findChildCaseInsensitive(el, tagLower)?.textContent?.trim() || fallback;

  const getFloat = (tagLower: string, fallback = 0) => {
    const t = getText(tagLower, '');
    const n = parseFloat(t);
    return Number.isNaN(n) ? fallback : n;
  };

  const campaignSet = getText('campaign_set', 'Multiplayer_Campaign_Set');
  const sortOrder = Math.round(getFloat('sort_order', 1));
  const textId = getText('text_id', 'TEXT_CAMPAIGN_CUSTOM');
  const descriptionText = getText('description_text', 'TEXT_CAMPAIGN_CUSTOM_DESC');
  const cameraShiftX = getFloat('camera_shift_x', 0);
  const cameraShiftY = getFloat('camera_shift_y', 0);
  const cameraDistance = getFloat('camera_distance', 1000);

  const locations = parseCommaList(findChildCaseInsensitive(el, 'locations')?.textContent);
  const tradeRoutes = parseCommaList(findChildCaseInsensitive(el, 'trade_routes')?.textContent);
  const startingActivePlayer = getText('starting_active_player', 'Empire');

  const humanVictoryConditions = parseCommaList(
    findChildCaseInsensitive(el, 'human_victory_conditions')?.textContent
  );
  const aiVictoryConditions = parseCommaList(
    findChildCaseInsensitive(el, 'ai_victory_conditions')?.textContent
  );

  const specialStructuresLandVictory = parseBoolTag(el, 'special_structures_land_victory_condition', true);
  const winLeaderDestruction = parseBoolTag(el, 'win_leader_destruction', false);
  const conquerAllPlanets = parseBoolTag(el, 'conquer_all_planets', true);
  const showCompletedTab = parseBoolTag(el, 'show_completed_tab', true);
  const supportsCustomSettings = parseBoolTag(el, 'supports_custom_settings', false);
  const isMultiplayer = parseBoolTag(el, 'is_multiplayer', false);

  // Build faction map from all faction-specific tags
  const factionMap = new Map<string, CampaignFactionSetting>();
  const ensureFaction = (rawFaction: string): CampaignFactionSetting => {
    const clean = rawFaction.trim();
    const key = clean.toLowerCase();
    let existing = factionMap.get(key);
    if (!existing) {
      let defaultAi = 'BasicEmpire';
      if (key === 'rebel') defaultAi = 'BasicRebel';
      else if (key === 'underworld') defaultAi = 'UnderworldAI';
      existing = {
        faction: clean,
        homeLocation: '',
        startingCredits: 3000,
        startingTechLevel: 1,
        maxTechLevel: 5,
        aiPlayerControl: defaultAi,
        markupFilename: 'DefaultGalacticHints.xml',
        storyName: ''
      };
      factionMap.set(key, existing);
    }
    return existing;
  };

  // Seed standard EAW/FoC factions if present or default
  ['Rebel', 'Empire', 'Underworld'].forEach(f => ensureFaction(f));

  // <Home_Location>Faction, Planet</Home_Location>
  findChildrenCaseInsensitive(el, 'home_location').forEach(node => {
    const parts = (node.textContent || '').split(',').map(s => s.trim());
    if (parts.length >= 2 && parts[0]) {
      const f = ensureFaction(parts[0]);
      f.homeLocation = parts[1];
    }
  });

  // <Starting_Credits>Faction, Amount</Starting_Credits>
  findChildrenCaseInsensitive(el, 'starting_credits').forEach(node => {
    const parts = (node.textContent || '').split(',').map(s => s.trim());
    if (parts.length >= 2 && parts[0]) {
      const f = ensureFaction(parts[0]);
      const val = parseFloat(parts[1]);
      if (!Number.isNaN(val)) f.startingCredits = val;
    }
  });

  // <Starting_Tech_Level>Faction, Level</Starting_Tech_Level>
  findChildrenCaseInsensitive(el, 'starting_tech_level').forEach(node => {
    const parts = (node.textContent || '').split(',').map(s => s.trim());
    if (parts.length >= 2 && parts[0]) {
      const f = ensureFaction(parts[0]);
      const val = parseInt(parts[1], 10);
      if (!Number.isNaN(val)) f.startingTechLevel = val;
    }
  });

  // <Max_Tech_Level>Faction, Level</Max_Tech_Level>
  findChildrenCaseInsensitive(el, 'max_tech_level').forEach(node => {
    const parts = (node.textContent || '').split(',').map(s => s.trim());
    if (parts.length >= 2 && parts[0]) {
      const f = ensureFaction(parts[0]);
      const val = parseInt(parts[1], 10);
      if (!Number.isNaN(val)) f.maxTechLevel = val;
    }
  });

  // <AI_Player_Control>Faction, AIType</AI_Player_Control>
  findChildrenCaseInsensitive(el, 'ai_player_control').forEach(node => {
    const parts = (node.textContent || '').split(',').map(s => s.trim());
    if (parts.length >= 2 && parts[0]) {
      const f = ensureFaction(parts[0]);
      f.aiPlayerControl = parts[1];
    }
  });

  // <Markup_Filename>Faction, File.xml</Markup_Filename>
  findChildrenCaseInsensitive(el, 'markup_filename').forEach(node => {
    const parts = (node.textContent || '').split(',').map(s => s.trim());
    if (parts.length >= 2 && parts[0]) {
      const f = ensureFaction(parts[0]);
      f.markupFilename = parts[1];
    }
  });

  // Story names: <Rebel_Story_Name>, <Empire_Story_Name>, <Underworld_Story_Name>
  const rebelStory = getText('rebel_story_name', '');
  if (rebelStory) ensureFaction('Rebel').storyName = rebelStory;
  const empireStory = getText('empire_story_name', '');
  if (empireStory) ensureFaction('Empire').storyName = empireStory;
  const uwStory = getText('underworld_story_name', '');
  if (uwStory) ensureFaction('Underworld').storyName = uwStory;

  // <Starting_Forces>Faction, Planet, UnitType</Starting_Forces>
  const forcesGroupMap = new Map<string, StartingForceEntry>();
  findChildrenCaseInsensitive(el, 'starting_forces').forEach(node => {
    const parts = (node.textContent || '').split(',').map(s => s.trim()).filter(Boolean);
    if (parts.length >= 3) {
      const faction = parts[0];
      const planet = parts[1];
      const unitType = parts[2];
      ensureFaction(faction);
      const key = `${faction.toLowerCase()}|${planet.toLowerCase()}|${unitType.toLowerCase()}`;
      const existing = forcesGroupMap.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        forcesGroupMap.set(key, {
          id: `sf_${lastId++}`,
          faction,
          planet,
          unitType,
          count: 1
        });
      }
    }
  });

  return {
    id: existingId || `camp_${lastId++}`,
    el,
    name,
    campaignSet,
    sortOrder,
    textId,
    descriptionText,
    cameraShiftX,
    cameraShiftY,
    cameraDistance,
    locations,
    tradeRoutes,
    startingActivePlayer,
    humanVictoryConditions: humanVictoryConditions.length > 0 ? humanVictoryConditions : ['Galactic_All_Planets_Controlled'],
    aiVictoryConditions: aiVictoryConditions.length > 0 ? aiVictoryConditions : ['Galactic_All_Planets_Controlled'],
    specialStructuresLandVictory,
    winLeaderDestruction,
    conquerAllPlanets,
    showCompletedTab,
    supportsCustomSettings,
    isMultiplayer,
    factions: Array.from(factionMap.values()),
    startingForces: Array.from(forcesGroupMap.values())
  };
}

export function parseCampaignsXml(xmlString: string): { doc: XMLDocument; campaigns: Campaign[] } {
  const parser = new DOMParser();
  const cleaned = xmlString.trim().replace(/^\uFEFF/, '');
  const doc = parser.parseFromString(cleaned, 'application/xml');
  const errorNode = doc.querySelector('parsererror');
  if (errorNode) throw new Error("XML de Campañas Inválido o corrupto");

  const allElements = Array.from(doc.getElementsByTagName('*'));
  const campaignEls = allElements.filter(el => el.tagName.toLowerCase() === 'campaign');

  const campaigns: Campaign[] = campaignEls.map(el => parseCampaignElement(el));
  return { doc, campaigns };
}

export function updateCampaignInDoc(campaign: Campaign): void {
  const el = campaign.el;
  const doc = el.ownerDocument;

  if (campaign.name) {
    if (el.hasAttribute('name')) {
      el.setAttribute('name', campaign.name);
    } else {
      el.setAttribute('Name', campaign.name);
    }
  }

  const setSingleTag = (tagName: string, value: string) => {
    let child = findChildCaseInsensitive(el, tagName.toLowerCase());
    if (!child) {
      if (!value) return;
      child = doc.createElement(tagName);
      el.appendChild(child);
    }
    child.textContent = value;
  };

  const removeTags = (tagNameLower: string) => {
    findChildrenCaseInsensitive(el, tagNameLower).forEach(node => {
      if (node.parentNode === el) el.removeChild(node);
    });
  };

  setSingleTag('Campaign_Set', campaign.campaignSet);
  setSingleTag('Sort_Order', String(campaign.sortOrder));
  setSingleTag('Text_ID', campaign.textId);
  setSingleTag('Description_Text', campaign.descriptionText);
  setSingleTag('Camera_Shift_X', Number(campaign.cameraShiftX).toFixed(1));
  setSingleTag('Camera_Shift_Y', Number(campaign.cameraShiftY).toFixed(1));
  setSingleTag('Camera_Distance', Number(campaign.cameraDistance).toFixed(1));

  setSingleTag(
    'Locations',
    campaign.locations.length > 0 ? `\n\t\t\t${campaign.locations.join(',\n\t\t\t')}\n\t\t` : ''
  );
  setSingleTag(
    'Trade_Routes',
    campaign.tradeRoutes.length > 0 ? `\n\t\t\t${campaign.tradeRoutes.join(',\n\t\t\t')}\n\t\t` : ''
  );

  setSingleTag('Starting_Active_Player', campaign.startingActivePlayer);

  // Story names for standard factions
  const rebelF = campaign.factions.find(f => f.faction.toLowerCase() === 'rebel');
  const empireF = campaign.factions.find(f => f.faction.toLowerCase() === 'empire');
  const uwF = campaign.factions.find(f => f.faction.toLowerCase() === 'underworld');
  if (rebelF?.storyName) setSingleTag('Rebel_Story_Name', rebelF.storyName);
  if (empireF?.storyName) setSingleTag('Empire_Story_Name', empireF.storyName);
  if (uwF?.storyName) setSingleTag('Underworld_Story_Name', uwF.storyName);

  setSingleTag(
    'Human_Victory_Conditions',
    campaign.humanVictoryConditions.join(', ')
  );
  setSingleTag(
    'AI_Victory_Conditions',
    campaign.aiVictoryConditions.join(', ')
  );

  setSingleTag('Special_Structures_Land_Victory_Condition', campaign.specialStructuresLandVictory ? 'True' : 'False');
  setSingleTag('Win_Leader_Destruction', campaign.winLeaderDestruction ? 'True' : 'False');
  setSingleTag('Conquer_All_Planets', campaign.conquerAllPlanets ? 'True' : 'False');
  setSingleTag('Show_Completed_Tab', campaign.showCompletedTab ? 'True' : 'False');
  setSingleTag('Supports_Custom_Settings', campaign.supportsCustomSettings ? 'True' : 'False');
  setSingleTag('Is_Multiplayer', campaign.isMultiplayer ? 'True' : 'False');

  // Rebuild multi-faction tags cleanly
  removeTags('home_location');
  removeTags('starting_credits');
  removeTags('starting_tech_level');
  removeTags('max_tech_level');
  removeTags('ai_player_control');
  removeTags('markup_filename');

  campaign.factions.forEach(f => {
    if (f.homeLocation) {
      const node = doc.createElement('Home_Location');
      node.textContent = `${f.faction}, ${f.homeLocation}`;
      el.appendChild(node);
    }
    const credNode = doc.createElement('Starting_Credits');
    credNode.textContent = `${f.faction}, ${f.startingCredits}`;
    el.appendChild(credNode);

    const techNode = doc.createElement('Starting_Tech_Level');
    techNode.textContent = `${f.faction}, ${f.startingTechLevel}`;
    el.appendChild(techNode);

    const maxTechNode = doc.createElement('Max_Tech_Level');
    maxTechNode.textContent = `${f.faction}, ${f.maxTechLevel}`;
    el.appendChild(maxTechNode);

    if (f.aiPlayerControl) {
      const aiNode = doc.createElement('AI_Player_Control');
      aiNode.textContent = `${f.faction}, ${f.aiPlayerControl}`;
      el.appendChild(aiNode);
    }
    if (f.markupFilename) {
      const mkNode = doc.createElement('Markup_Filename');
      mkNode.textContent = `${f.faction}, ${f.markupFilename}`;
      el.appendChild(mkNode);
    }
  });

  // Rebuild Starting_Forces tags
  removeTags('starting_forces');
  campaign.startingForces.forEach(sf => {
    const qty = Math.max(1, Math.min(99, sf.count || 1));
    for (let i = 0; i < qty; i++) {
      const sfNode = doc.createElement('Starting_Forces');
      sfNode.textContent = `${sf.faction}, ${sf.planet}, ${sf.unitType}`;
      el.appendChild(sfNode);
    }
  });
}

export function createSampleCampaignsXml(existingPlanets: Planet[] = [], existingRoutes: TradeRoute[] = []): string {
  const pNames = existingPlanets
    .filter(p => p.name.toLowerCase() !== 'galaxy_core_art_model')
    .map(p => p.name);

  const selectedPlanets = pNames.length >= 3
    ? ['Galaxy_Core_Art_Model', ...pNames.slice(0, 18)]
    : ['Galaxy_Core_Art_Model', 'Coruscant', 'Kuat', 'Corellia', 'Alderaan', 'Tatooine', 'Hoth', 'Yavin', 'Mandalore', 'MonCalimari'];

  const planetSet = new Set(selectedPlanets.map(p => p.toLowerCase()));
  const activeRoutes = existingRoutes
    .filter(r => planetSet.has(r.pointA.toLowerCase()) && planetSet.has(r.pointB.toLowerCase()))
    .map(r => r.name);

  const empireHQ = selectedPlanets.find(p => p.toLowerCase() === 'coruscant') || selectedPlanets[1] || 'Coruscant';
  const rebelHQ = selectedPlanets.find(p => p.toLowerCase() === 'yavin' || p.toLowerCase() === 'hoth') || selectedPlanets[2] || 'Yavin';
  const uwHQ = selectedPlanets.find(p => p.toLowerCase() === 'mandalore' || p.toLowerCase() === 'tatooine') || selectedPlanets[3] || 'Mandalore';

  return `<?xml version="1.0" encoding="utf-8"?>
<Campaigns>
\t<Campaign Name="Sandbox_Equal_Footing_Empire">
\t\t<Campaign_Set>Sandbox_Equal_Footing_Campaign_Set</Campaign_Set>
\t\t<Sort_Order>1</Sort_Order>
\t\t<Text_ID>TEXT_CAMPAIGN_SINGLE_EQUAL_FOOTING</Text_ID>
\t\t<Description_Text>TEXT_CAMPAIGN_SINGLE_EQUAL_FOOTING_DESC</Description_Text>
\t\t<Camera_Shift_X>40.0</Camera_Shift_X>
\t\t<Camera_Shift_Y>0.0</Camera_Shift_Y>
\t\t<Camera_Distance>1000.0</Camera_Distance>
\t\t<Locations>
\t\t\t${selectedPlanets.join(',\n\t\t\t')}
\t\t</Locations>
\t\t<Trade_Routes>
\t\t\t${activeRoutes.join(',\n\t\t\t')}
\t\t</Trade_Routes>
\t\t<Home_Location>Rebel, ${rebelHQ}</Home_Location>
\t\t<Home_Location>Empire, ${empireHQ}</Home_Location>
\t\t<Home_Location>Underworld, ${uwHQ}</Home_Location>
\t\t<Starting_Active_Player>Empire</Starting_Active_Player>
\t\t<Rebel_Story_Name>Story_Plots_Sandbox_Rebel.xml</Rebel_Story_Name>
\t\t<Empire_Story_Name>Story_Plots_Sandbox_Empire.xml</Empire_Story_Name>
\t\t<Underworld_Story_Name>Story_Plots_Sandbox_Underworld.xml</Underworld_Story_Name>
\t\t<AI_Player_Control>Rebel, BasicRebel</AI_Player_Control>
\t\t<AI_Player_Control>Empire, SandboxHuman</AI_Player_Control>
\t\t<AI_Player_Control>Underworld, UnderworldAI</AI_Player_Control>
\t\t<Markup_Filename>Rebel, DefaultGalacticHints.xml</Markup_Filename>
\t\t<Markup_Filename>Empire, DefaultGalacticHints.xml</Markup_Filename>
\t\t<Markup_Filename>Underworld, DefaultGalacticHints.xml</Markup_Filename>
\t\t<Human_Victory_Conditions>Galactic_All_Planets_Controlled</Human_Victory_Conditions>
\t\t<AI_Victory_Conditions>Galactic_All_Planets_Controlled</AI_Victory_Conditions>
\t\t<Special_Structures_Land_Victory_Condition>True</Special_Structures_Land_Victory_Condition>
\t\t<Win_Leader_Destruction>False</Win_Leader_Destruction>
\t\t<Conquer_All_Planets>True</Conquer_All_Planets>
\t\t<Show_Completed_Tab>True</Show_Completed_Tab>
\t\t<Supports_Custom_Settings>False</Supports_Custom_Settings>
\t\t<Is_Multiplayer>False</Is_Multiplayer>
\t\t<Starting_Credits>Rebel, 3000</Starting_Credits>
\t\t<Starting_Credits>Empire, 3500</Starting_Credits>
\t\t<Starting_Credits>Underworld, 3000</Starting_Credits>
\t\t<Starting_Tech_Level>Rebel, 1</Starting_Tech_Level>
\t\t<Starting_Tech_Level>Empire, 1</Starting_Tech_Level>
\t\t<Starting_Tech_Level>Underworld, 1</Starting_Tech_Level>
\t\t<Max_Tech_Level>Rebel, 5</Max_Tech_Level>
\t\t<Max_Tech_Level>Empire, 5</Max_Tech_Level>
\t\t<Max_Tech_Level>Underworld, 5</Max_Tech_Level>
\t\t<Starting_Forces>Empire, ${empireHQ}, Empire_Star_Base_2</Starting_Forces>
\t\t<Starting_Forces>Empire, ${empireHQ}, E_Ground_Barracks</Starting_Forces>
\t\t<Starting_Forces>Empire, ${empireHQ}, E_Ground_Light_Vehicle_Factory</Starting_Forces>
\t\t<Starting_Forces>Empire, ${empireHQ}, Star_Destroyer</Starting_Forces>
\t\t<Starting_Forces>Empire, ${empireHQ}, Stormtrooper_Squad</Starting_Forces>
\t\t<Starting_Forces>Rebel, ${rebelHQ}, Rebel_Star_Base_2</Starting_Forces>
\t\t<Starting_Forces>Rebel, ${rebelHQ}, R_Ground_Barracks</Starting_Forces>
\t\t<Starting_Forces>Rebel, ${rebelHQ}, Calamari_Cruiser</Starting_Forces>
\t\t<Starting_Forces>Rebel, ${rebelHQ}, Rebel_Infantry_Squad</Starting_Forces>
\t\t<Starting_Forces>Underworld, ${uwHQ}, Underworld_Star_Base_2</Starting_Forces>
\t\t<Starting_Forces>Underworld, ${uwHQ}, U_Ground_Barracks</Starting_Forces>
\t\t<Starting_Forces>Underworld, ${uwHQ}, Vengeance_Frigate</Starting_Forces>
\t\t<Starting_Forces>Underworld, ${uwHQ}, Underworld_Merc_Squad</Starting_Forces>
\t</Campaign>
</Campaigns>`;
}

export function updatePlanetPositionInDoc(planet: Planet): void {
  if (planet.name) {
    if (planet.el.hasAttribute('name')) {
      planet.el.setAttribute('name', planet.name);
    } else {
      planet.el.setAttribute('Name', planet.name);
    }
  }

  let posEl = Array.from(planet.el.children).find(c => c.tagName.toLowerCase() === 'galactic_position')
    || planet.el.querySelector('Galactic_Position');

  if (!posEl) {
    posEl = planet.el.ownerDocument.createElement('Galactic_Position');
    planet.el.appendChild(posEl);
  }
  // Formato EAW estandar (x, y, z)
  posEl.textContent = `${Number(planet.x).toFixed(1)}, ${Number(planet.y).toFixed(1)}, ${Number(planet.z).toFixed(1)}`;
}

export function updateStoryEventInDoc(evt: StoryEvent): void {
  if (evt.name) evt.el.setAttribute('Name', evt.name);
  
  const updateOrAddChild = (tagName: string, value: string) => {
    let child = evt.el.querySelector(tagName);
    if (!child) {
      if (!value) return; // don't create empty elements if they didn't exist unless needed
      child = evt.el.ownerDocument.createElement(tagName);
      evt.el.appendChild(child);
    }
    if (value) {
      child.textContent = value;
    } else {
      evt.el.removeChild(child);
    }
  };

  updateOrAddChild('Event_Type', evt.eventType);
  for (let i = 0; i < 10; i++) {
    updateOrAddChild(`Event_Param${i + 1}`, evt.eventParams[i] || '');
  }

  updateOrAddChild('Reward_Type', evt.rewardType);
  for (let i = 0; i < 10; i++) {
    updateOrAddChild(`Reward_Param${i + 1}`, evt.rewardParams[i] || '');
  }

  const existingPrereqs = evt.el.querySelectorAll('Prereq');
  existingPrereqs.forEach(p => evt.el.removeChild(p));
  evt.prereqs.forEach(p => {
    if (p) {
      const child = evt.el.ownerDocument.createElement('Prereq');
      child.textContent = p;
      evt.el.appendChild(child);
    }
  });

  updateOrAddChild('Story_Dialog', evt.storyDialog);
  updateOrAddChild('Story_Chapter', evt.storyChapter);
  updateOrAddChild('Story_Tag', evt.storyTag);
  updateOrAddChild('Branch', evt.branch);
  updateOrAddChild('Perpetual', evt.perpetual ? 'true' : '');
  updateOrAddChild('Active', evt.active === false ? 'false' : '');
}

export function updateStoryEventFromXml(xmlString: string, originalEvt: StoryEvent): StoryEvent {
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<root>${xmlString}</root>`, 'application/xml');
  const errorNode = doc.querySelector('parsererror');
  if (errorNode) throw new Error("XML Inválido o corrupto");

  const newEl = doc.querySelector('Event');
  if (!newEl) throw new Error("No Event tag found");

  if (originalEvt.el.parentNode) {
    const importedNode = originalEvt.el.ownerDocument.importNode(newEl, true);
    originalEvt.el.parentNode.replaceChild(importedNode, originalEvt.el);
    return parseStoryElement(importedNode, originalEvt.id);
  }
  return originalEvt;
}

export function createSampleStoryXml(): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<Story>
\t<Event Name="Universal_Story_Start">
\t\t<Event_Type>STORY_ELAPSED</Event_Type>
\t\t<Event_Param1>2</Event_Param1>
\t\t<Reward_Type>SET_FLAG</Reward_Type>
\t\t<Reward_Param1>Campaign_Initialized_Flag</Reward_Param1>
\t\t<Reward_Param2>1</Reward_Param2>
\t\t<Branch>Branch_Core_Setup</Branch>
\t</Event>

\t<Event Name="Mission_Briefing_Coruscant">
\t\t<Event_Type>STORY_FLAG</Event_Type>
\t\t<Event_Param1>Campaign_Initialized_Flag</Event_Param1>
\t\t<Event_Param2>1</Event_Param2>
\t\t<Event_Param3>GREATER_THAN_EQUAL_TO</Event_Param3>
\t\t<Reward_Type>MULTIMEDIA</Reward_Type>
\t\t<Reward_Param1>TEXT_STORY_CORE_ASSAULT_BRIEFING</Reward_Param1>
\t\t<Reward_Param2>10</Reward_Param2>
\t\t<Prereq>Universal_Story_Start</Prereq>
\t\t<Story_Dialog>Story_Campaign_Dialogs</Story_Dialog>
\t\t<Story_Chapter>0</Story_Chapter>
\t\t<Story_Tag>Goal_Capture_Kuat</Story_Tag>
\t\t<Branch>Branch_Core_Assault</Branch>
\t</Event>

\t<Event Name="Capture_Kuat_Shipyards">
\t\t<Event_Type>STORY_CONQUER</Event_Type>
\t\t<Event_Param1>Kuat</Event_Param1>
\t\t<Event_Param2>CONQUER_PLANET</Event_Param2>
\t\t<Reward_Type>SPAWN_HERO</Reward_Type>
\t\t<Reward_Param1>Grand_Moff_Tarkin_Team</Reward_Param1>
\t\t<Reward_Param2>Kuat</Reward_Param2>
\t\t<Prereq>Mission_Briefing_Coruscant</Prereq>
\t\t<Branch>Branch_Core_Assault</Branch>
\t</Event>

\t<Event Name="Complete_Kuat_Holocron_Goal">
\t\t<Event_Type>STORY_TRIGGER</Event_Type>
\t\t<Reward_Type>STORY_GOAL_COMPLETED</Reward_Type>
\t\t<Reward_Param1>Goal_Capture_Kuat</Reward_Param1>
\t\t<Prereq>Capture_Kuat_Shipyards</Prereq>
\t\t<Branch>Branch_Core_Assault</Branch>
\t</Event>

\t<Event Name="Unlock_Star_Destroyer_Production">
\t\t<Event_Type>STORY_ELAPSED</Event_Type>
\t\t<Event_Param1>5</Event_Param1>
\t\t<Reward_Type>BUILDABLE_UNIT</Reward_Type>
\t\t<Reward_Param1>Star_Destroyer</Reward_Param1>
\t\t<Prereq>Capture_Kuat_Shipyards</Prereq>
\t\t<Branch>Branch_Core_Assault</Branch>
\t</Event>
</Story>`;
}

export function serializeXml(doc: XMLDocument): string {
  const serializer = new XMLSerializer();
  return serializer.serializeToString(doc);
}

