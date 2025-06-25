export const startButton = document.getElementById('start-button');
export const restartButton = document.getElementById('restart-button');

export function showMainMenu() {
    const mainMenu = document.querySelector('[data-testid="main-menu"]');
    const gameHud = document.querySelector('[data-testid="game-hud"]');
    const raceOverMenu = document.querySelector('[data-testid="race-over"]');
    mainMenu?.classList.remove('hidden');
    gameHud?.classList.add('hidden');
    raceOverMenu?.classList.add('hidden');
}

export function showGameHud() {
    const mainMenu = document.querySelector('[data-testid="main-menu"]');
    const gameHud = document.querySelector('[data-testid="game-hud"]');
    const raceOverMenu = document.querySelector('[data-testid="race-over"]');
    mainMenu?.classList.add('hidden');
    gameHud?.classList.remove('hidden');
    raceOverMenu?.classList.add('hidden');
}

export function showRaceOverMenu(finalTime: number, totalLaps: number) {
    const mainMenu = document.querySelector('[data-testid="main-menu"]');
    const gameHud = document.querySelector('[data-testid="game-hud"]');
    const raceOverMenu = document.querySelector('[data-testid="race-over"]');
    mainMenu?.classList.add('hidden');
    gameHud?.classList.add('hidden');
    raceOverMenu?.classList.remove('hidden');

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