export const startButton = document.getElementById('start-button');
export const restartButton = document.getElementById('restart-button');

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