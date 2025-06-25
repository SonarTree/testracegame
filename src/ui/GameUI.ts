export const startButton = document.getElementById('start-button');
export const restartButton = document.getElementById('restart-button');

export function showMainMenu() {
    const mainMenu = document.querySelector('[data-testid="main-menu"]');
    const gameHud = document.querySelector('[data-testid="game-hud"]');
    const raceOverMenu = document.querySelector('[data-testid="race-over"]');
    const minimap = document.getElementById('minimap');
    mainMenu?.classList.remove('hidden');
    gameHud?.classList.add('hidden');
    raceOverMenu?.classList.add('hidden');
    minimap?.classList.add('hidden');
}

export function showGameHud() {
    const mainMenu = document.querySelector('[data-testid="main-menu"]');
    const gameHud = document.querySelector('[data-testid="game-hud"]');
    const raceOverMenu = document.querySelector('[data-testid="race-over"]');
    const minimap = document.getElementById('minimap');
    mainMenu?.classList.add('hidden');
    gameHud?.classList.remove('hidden');
    raceOverMenu?.classList.add('hidden');
    minimap?.classList.remove('hidden');
}

export function showRaceOverMenu(finalTime: number, totalLaps: number) {
    const mainMenu = document.querySelector('[data-testid="main-menu"]');
    const gameHud = document.querySelector('[data-testid="game-hud"]');
    const raceOverMenu = document.querySelector('[data-testid="race-over"]');
    const minimap = document.getElementById('minimap');
    mainMenu?.classList.add('hidden');
    gameHud?.classList.add('hidden');
    raceOverMenu?.classList.remove('hidden');
    minimap?.classList.add('hidden');

    const finalTimeElement = document.getElementById('final-time');
    const totalLapsElement = document.getElementById('total-laps');

    if (finalTimeElement) finalTimeElement.innerText = `Final Time: ${finalTime.toFixed(2)}`;
    if (totalLapsElement) totalLapsElement.innerText = `Laps Completed: ${totalLaps}`;
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

    if (lapsElement) lapsElement.innerText = data.lap.toString();
    if (timeElement) timeElement.innerText = data.elapsedTime.toFixed(2);
    if (lapTimeElement) lapTimeElement.innerText = data.currentLapTime.toFixed(2);
    if (speedElement) speedElement.innerText = (Math.abs(data.speed) * 100).toFixed(0);
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