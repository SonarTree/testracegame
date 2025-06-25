import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  showMainMenu,
  showGameHud,
  showRaceOverMenu,
  showMapSelectionMenu,
  populateMapList,
  updateUI,
  showNotification,
} from './GameUI';

function setupDOM() {
  document.body.innerHTML = `
    <div data-testid="main-menu"></div>
    <div data-testid="game-hud" class="hidden"></div>
    <div data-testid="race-over" class="hidden">
        <div id="final-time"></div>
        <div id="total-laps"></div>
    </div>
    <div data-testid="map-selection-menu" class="hidden">
        <ul id="map-list"></ul>
    </div>
    <div id="minimap" class="hidden"></div>
    <div id="notification" class="hidden"></div>
    <div id="laps"></div>
    <div id="time"></div>
    <div id="lap-time"></div>
    <div id="speed"></div>
  `;
}

describe('GameUI Coverage', () => {
  beforeEach(() => {
    setupDOM();
  });

  it('showMainMenu should show main menu and hide others', () => {
    showMainMenu();
    expect(document.querySelector('[data-testid="main-menu"]')?.classList.contains('hidden')).toBe(false);
    expect(document.querySelector('[data-testid="game-hud"]')?.classList.contains('hidden')).toBe(true);
    expect(document.querySelector('[data-testid="race-over"]')?.classList.contains('hidden')).toBe(true);
    expect(document.querySelector('[data-testid="map-selection-menu"]')?.classList.contains('hidden')).toBe(true);
    expect(document.getElementById('minimap')?.classList.contains('hidden')).toBe(true);
  });

  it('showGameHud should show game HUD and hide others', () => {
    showGameHud();
    expect(document.querySelector('[data-testid="main-menu"]')?.classList.contains('hidden')).toBe(true);
    expect(document.querySelector('[data-testid="game-hud"]')?.classList.contains('hidden')).toBe(false);
    expect(document.getElementById('minimap')?.classList.contains('hidden')).toBe(false);
  });

  it('showRaceOverMenu should show race over menu and hide others', () => {
    showRaceOverMenu(123.456, 3);
    expect(document.querySelector('[data-testid="race-over"]')?.classList.contains('hidden')).toBe(false);
    expect(document.getElementById('final-time')?.textContent).toBe('Final Time: 123.46');
    expect(document.getElementById('total-laps')?.textContent).toBe('Laps Completed: 3');
  });

  it('showMapSelectionMenu should show map selection menu and hide others', () => {
    showMapSelectionMenu();
    expect(document.querySelector('[data-testid="map-selection-menu"]')?.classList.contains('hidden')).toBe(false);
  });

  it('populateMapList should create list items for maps', () => {
    const maps = [
      { id: 'map1', name: 'Map 1' },
      { id: 'map2', name: 'Map 2' },
    ];
    populateMapList(maps);
    const listItems = document.querySelectorAll('#map-list li');
    expect(listItems.length).toBe(2);
    expect((listItems[0] as HTMLElement).dataset.mapId).toBe('map1');
    expect(listItems[0].textContent).toBe('Map 1');
    
    // Simulate click
    (listItems[0] as HTMLElement).click();
    expect(listItems[0].classList.contains('selected')).toBe(true);
    expect((listItems[0] as HTMLElement).style.fontWeight).toBe('bold');

    (listItems[1] as HTMLElement).click();
    expect(listItems[0].classList.contains('selected')).toBe(false);
    expect((listItems[0] as HTMLElement).style.fontWeight).toBe('normal');
    expect(listItems[1].classList.contains('selected')).toBe(true);
  });
  
  it('updateUI should update all HUD elements', () => {
    const data = {
        lap: 2,
        elapsedTime: 65.432,
        currentLapTime: 32.1,
        speed: 12.345
    };
    updateUI(data);
    expect(document.getElementById('laps')?.textContent).toBe('2');
    expect(document.getElementById('time')?.textContent).toBe('65.43');
    expect(document.getElementById('lap-time')?.textContent).toBe('32.10');
    expect(document.getElementById('speed')?.textContent).toBe('1235');
  });

  it('showNotification should display a notification', () => {
    vi.useFakeTimers();
    showNotification('Test Message', 1000);
    const notification = document.getElementById('notification');
    expect(notification?.classList.contains('hidden')).toBe(false);
    expect(notification?.textContent).toBe('Test Message');

    vi.runAllTimers();
    expect(notification?.classList.contains('hidden')).toBe(true);
    vi.useRealTimers();
  });
}); 