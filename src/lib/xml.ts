import { Planet, TradeRoute, StoryEvent } from '../types';

let lastId = 0;

export function parseStoryXml(xmlString: string): { doc: XMLDocument; storyEvents: StoryEvent[] } {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'application/xml');
  const errorNode = doc.querySelector('parsererror');
  if (errorNode) throw new Error("XML Inválido o corrupto");

  const eventEls = doc.querySelectorAll('Event');
  const storyEvents = Array.from(eventEls).map((el) => {
    const name = el.getAttribute('Name') || 'New_Event';
    const eventType = el.querySelector('Event_Type')?.textContent?.trim() || '';
    
    // Support Event_Param1 .. Event_Param10
    const eventParams: string[] = [];
    for(let i=1; i<=10; i++) {
        const param = el.querySelector(`Event_Param${i}`)?.textContent?.trim();
        if(param !== undefined) eventParams.push(param);
    }

    const rewardType = el.querySelector('Reward_Type')?.textContent?.trim() || '';
    
    // Support Reward_Param1 .. Reward_Param10
    const rewardParams: string[] = [];
    for(let i=1; i<=10; i++) {
        const param = el.querySelector(`Reward_Param${i}`)?.textContent?.trim();
        if(param !== undefined) rewardParams.push(param);
    }
    
    const prereqs = Array.from(el.querySelectorAll('Prereq')).map(p => p.textContent?.trim() || '').filter(p => p);
    const storyDialog = el.querySelector('Story_Dialog')?.textContent?.trim() || '';
    const storyChapter = el.querySelector('Story_Chapter')?.textContent?.trim() || '';
    const storyTag = el.querySelector('Story_Tag')?.textContent?.trim() || '';
    const branch = el.querySelector('Branch')?.textContent?.trim() || '';
    
    return {
      id: `ev_${lastId++}`,
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
      branch
    };
  });

  return { doc, storyEvents };
}

export function parsePlanetsXml(xmlString: string): { doc: XMLDocument; planets: Planet[] } {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, 'application/xml');
  const errorNode = doc.querySelector('parsererror');
  if (errorNode) throw new Error("XML Inválido o corrupto");

  const planetEls = doc.querySelectorAll('Planet');
  const planets = Array.from(planetEls).map((el) => {
    const name = el.getAttribute('Name') || 'Desconocido';
    let x = 0,
      y = 0,
      z = 0;
    const posEl = el.querySelector('Galactic_Position');
    if (posEl && posEl.textContent) {
      const parts = posEl.textContent.split(',').map((p) => parseFloat(p.trim()));
      if (parts.length >= 3) {
        x = parts[0] || 0;
        y = parts[1] || 0;
        z = parts[2] || 0;
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
  const doc = parser.parseFromString(xmlString, 'application/xml');
  const errorNode = doc.querySelector('parsererror');
  if (errorNode) throw new Error("XML Inválido o corrupto");

  const routeEls = doc.querySelectorAll('TradeRoute');
  const tradeRoutes = Array.from(routeEls).map((el) => {
    const name = el.getAttribute('Name') || 'Unidentified_Route';
    const pointA = el.querySelector('Point_A')?.textContent?.trim() || '';
    const pointB = el.querySelector('Point_B')?.textContent?.trim() || '';
    
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

export function updatePlanetPositionInDoc(planet: Planet): void {
  planet.el.setAttribute('Name', planet.name);
  let posEl = planet.el.querySelector('Galactic_Position');
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
  updateOrAddChild('Reward_Type', evt.rewardType);

  const existingPrereqs = evt.el.querySelectorAll('Prereq');
  existingPrereqs.forEach(p => evt.el.removeChild(p));
  evt.prereqs.forEach(p => {
    if(p) {
      const child = evt.el.ownerDocument.createElement('Prereq');
      child.textContent = p;
      evt.el.appendChild(child);
    }
  });

  updateOrAddChild('Story_Dialog', evt.storyDialog);
  updateOrAddChild('Story_Chapter', evt.storyChapter);
  updateOrAddChild('Story_Tag', evt.storyTag);
  updateOrAddChild('Branch', evt.branch);

  for (let i = 0; i < 10; i++) {
    updateOrAddChild(`Event_Param${i+1}`, evt.eventParams[i] || '');
  }
  
  for (let i = 0; i < 10; i++) {
    updateOrAddChild(`Reward_Param${i+1}`, evt.rewardParams[i] || '');
  }
}

export function updateStoryEventFromXml(xmlString: string, originalEvt: StoryEvent): StoryEvent {
  const parser = new DOMParser();
  // Wrap in a root to allow parsing single elements easily
  const doc = parser.parseFromString(`<root>${xmlString}</root>`, 'application/xml');
  const errorNode = doc.querySelector('parsererror');
  if (errorNode) throw new Error("XML Inválido o corrupto");

  const newEl = doc.querySelector('Event');
  if (!newEl) throw new Error("No Event tag found");

  // Replace old element with new element in the original document
  if (originalEvt.el.parentNode) {
    const importedNode = originalEvt.el.ownerDocument.importNode(newEl, true);
    originalEvt.el.parentNode.replaceChild(importedNode, originalEvt.el);
    
    // Parse properties again
    const name = importedNode.getAttribute('Name') || 'New_Event';
    const eventType = importedNode.querySelector('Event_Type')?.textContent?.trim() || '';
    
    const eventParams: string[] = [];
    for(let i=1; i<=10; i++) {
        const param = importedNode.querySelector(`Event_Param${i}`)?.textContent?.trim();
        if(param !== undefined) eventParams.push(param);
    }

    const rewardType = importedNode.querySelector('Reward_Type')?.textContent?.trim() || '';
    
    const rewardParams: string[] = [];
    for(let i=1; i<=10; i++) {
        const param = importedNode.querySelector(`Reward_Param${i}`)?.textContent?.trim();
        if(param !== undefined) rewardParams.push(param);
    }
    
    const prereqs = Array.from(importedNode.querySelectorAll('Prereq')).map(p => p.textContent?.trim() || '').filter(p => p);
    const storyDialog = importedNode.querySelector('Story_Dialog')?.textContent?.trim() || '';
    const storyChapter = importedNode.querySelector('Story_Chapter')?.textContent?.trim() || '';
    const storyTag = importedNode.querySelector('Story_Tag')?.textContent?.trim() || '';
    const branch = importedNode.querySelector('Branch')?.textContent?.trim() || '';

    return {
      id: originalEvt.id,
      el: importedNode,
      name,
      eventType,
      eventParams,
      rewardType,
      rewardParams,
      prereqs,
      storyDialog,
      storyChapter,
      storyTag,
      branch
    };
  }
  return originalEvt;
}

export function serializeXml(doc: XMLDocument): string {
  const serializer = new XMLSerializer();
  return serializer.serializeToString(doc);
}
