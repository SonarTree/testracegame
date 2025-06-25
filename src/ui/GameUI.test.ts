import { describe, it, expect, beforeEach } from 'vitest';
import { updateUI } from './GameUI';

describe('GameUI Module', () => {
    beforeEach(() => {
        // Set up a mock DOM environment for each test
        document.body.innerHTML = `
            <div id="laps">0</div>
            <div id="time">0.00</div>
            <div id="lap-time">0.00</div>
            <div id="speed">0</div>
        `;
    });

    it('should update all UI elements with the provided data', () => {
        // Data to be displayed
        const testData = {
            lap: 2,
            elapsedTime: 123.456,
            currentLapTime: 45.678,
            speed: 0.88,
        };

        // Call the function to update the UI
        updateUI(testData);

        // Verify the content of each element
        const lapsElement = document.getElementById('laps');
        const timeElement = document.getElementById('time');
        const lapTimeElement = document.getElementById('lap-time');
        const speedElement = document.getElementById('speed');

        expect(lapsElement?.innerText).toBe('2');
        expect(timeElement?.innerText).toBe('123.46'); // toFixed(2)
        expect(lapTimeElement?.innerText).toBe('45.68'); // toFixed(2)
        expect(speedElement?.innerText).toBe('88'); // (speed * 100).toFixed(0)
    });

    it('should handle missing elements gracefully', () => {
        // Clear the mock DOM
        document.body.innerHTML = '';

        const testData = {
            lap: 1,
            elapsedTime: 10,
            currentLapTime: 10,
            speed: 0.5,
        };

        // Expect the function to run without throwing an error
        expect(() => updateUI(testData)).not.toThrow();
    });
}); 