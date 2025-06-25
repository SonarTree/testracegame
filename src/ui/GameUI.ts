export const startButton = document.getElementById('start-button');
export const restartButton = document.getElementById('restart-button');
export const startRaceButton = document.getElementById('start-race-button');
export const backToMainMenuButton = document.getElementById(
  'back-to-main-menu-button'
);

export function showMainMenu() {
    const mainMenu = document.querySelector('[data-testid="main-menu"]');
    const gameHud = document.querySelector('[data-testid="game-hud"]');
    const raceOverMenu = document.querySelector('[data-testid="race-over"]');
    const mapSelectionMenu = document.querySelector(
      '[data-testid="map-selection-menu"]'
    );
    const minimap = document.getElementById('minimap');
    mainMenu?.classList.remove('hidden');
    gameHud?.classList.add('hidden');
    raceOverMenu?.classList.add('hidden');
    mapSelectionMenu?.classList.add('hidden');
    minimap?.classList.add('hidden');
}

export function showGameHud() {
    const mainMenu = document.querySelector('[data-testid="main-menu"]');
    const gameHud = document.querySelector('[data-testid="game-hud"]');
    const raceOverMenu = document.querySelector('[data-testid="race-over"]');
    const mapSelectionMenu = document.querySelector(
      '[data-testid="map-selection-menu"]'
    );
    const minimap = document.getElementById('minimap');
    mainMenu?.classList.add('hidden');
    gameHud?.classList.remove('hidden');
    raceOverMenu?.classList.add('hidden');
    mapSelectionMenu?.classList.add('hidden');
    minimap?.classList.remove('hidden');
}

export function showRaceOverMenu(finalTime: number, totalLaps: number) {
    const mainMenu = document.querySelector('[data-testid="main-menu"]');
    const gameHud = document.querySelector('[data-testid="game-hud"]');
    const raceOverMenu = document.querySelector('[data-testid="race-over"]');
    const mapSelectionMenu = document.querySelector(
      '[data-testid="map-selection-menu"]'
    );
    const minimap = document.getElementById('minimap');
    mainMenu?.classList.add('hidden');
    gameHud?.classList.add('hidden');
    raceOverMenu?.classList.remove('hidden');
    mapSelectionMenu?.classList.add('hidden');
    minimap?.classList.add('hidden');

    const finalTimeElement = document.getElementById('final-time');
    const totalLapsElement = document.getElementById('total-laps');

    if (finalTimeElement) finalTimeElement.textContent = `Final Time: ${finalTime.toFixed(2)}`;
    if (totalLapsElement) totalLapsElement.textContent = `Laps Completed: ${totalLaps}`;
}

export function showMapSelectionMenu() {
  const mainMenu = document.querySelector('[data-testid="main-menu"]');
  const gameHud = document.querySelector('[data-testid="game-hud"]');
  const raceOverMenu = document.querySelector('[data-testid="race-over"]');
  const mapSelectionMenu = document.querySelector(
    '[data-testid="map-selection-menu"]'
  );
  const minimap = document.getElementById('minimap');
  mainMenu?.classList.add('hidden');
  gameHud?.classList.add('hidden');
  raceOverMenu?.classList.add('hidden');
  mapSelectionMenu?.classList.remove('hidden');
  minimap?.classList.add('hidden');
}

export function populateMapList(maps: any[]) {
  const mapList = document.getElementById('map-list');
  if (!mapList) return;

  mapList.innerHTML = ''; // Clear existing content

  maps.forEach(map => {
    const li = document.createElement('li');
    li.dataset.mapId = map.id;
    li.textContent = map.name;
    li.style.cursor = 'pointer';
    li.addEventListener('click', () => {
      // Remove 'selected' class from all other list items
      mapList.querySelectorAll('li').forEach(item => {
        item.classList.remove('selected');
        item.style.fontWeight = 'normal';
      });
      // Add 'selected' class to the clicked one
      li.classList.add('selected');
      li.style.fontWeight = 'bold';
    });
    mapList.appendChild(li);
  });
}

export function updateUI(data: {
    lap: number;
    elapsedTime: number;
    currentLapTime: number;
    speed: number;
}) {
    const lapsElement = document.getElementById('laps');
    const timeElement = document.getElementById('time');
    const lapTimeElement = document.getElementById('lap-time');
    const speedElement = document.getElementById('speed');

    if (lapsElement) lapsElement.textContent = data.lap.toString();
    if (timeElement) timeElement.textContent = data.elapsedTime.toFixed(2);
    if (lapTimeElement) lapTimeElement.textContent = data.currentLapTime.toFixed(2);
    if (speedElement) speedElement.textContent = (Math.abs(data.speed) * 100).toFixed(0);
}

let notificationTimeout: number | undefined;

export function showNotification(message: string, duration = 3000) {
    const notificationElement = document.getElementById('notification');
    if (!notificationElement) return;

    notificationElement.textContent = message;
    notificationElement.classList.remove('hidden');

    if (notificationTimeout) {
        clearTimeout(notificationTimeout);
    }

    notificationTimeout = window.setTimeout(() => {
        notificationElement.classList.add('hidden');
        notificationTimeout = undefined;
    }, duration);
}

export function updateMinimap(
    playerPos: { x: number; z: number },
    aiPos: { x: number; z: number },
    trackRadius: number
) {
    const canvas = document.getElementById('minimap') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const scale = Math.min(width, height) / (trackRadius * 2.2);

    ctx.clearRect(0, 0, width, height);

    // Draw track outline
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, trackRadius * scale, 0, 2 * Math.PI);
    ctx.stroke();

    // Draw player car
    ctx.fillStyle = 'blue';
    ctx.beginPath();
    ctx.arc(width / 2 + playerPos.x * scale, height / 2 + playerPos.z * scale, 4, 0, 2 * Math.PI);
    ctx.fill();

    // Draw AI car
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(width / 2 + aiPos.x * scale, height / 2 + aiPos.z * scale, 4, 0, 2 * Math.PI);
    ctx.fill();
} 