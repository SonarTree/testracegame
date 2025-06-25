import { describe, it, expect, beforeEach } from 'vitest';
import { showMainMenu, showGameHud, showRaceOverMenu } from './GameUI';

describe('GameUI Module', () => {
    beforeEach(() => {
        document.body.innerHTML = `
            <div data-testid="main-menu" class="hidden"></div>
            <div data-testid="game-hud" class="hidden"></div>
            <div data-testid="race-over" class="hidden">
                <div id="final-time"></div>
                <div id="total-laps"></div>
            </div>
        `;
    });

    it('should show the main menu and hide other UI elements', () => {
        const mainMenu = document.querySelector('[data-testid="main-menu"]');
        const gameHud = document.querySelector('[data-testid="game-hud"]');
        const raceOverMenu = document.querySelector('[data-testid="race-over"]');

        showMainMenu();

        expect(mainMenu?.classList.contains('hidden')).toBe(false);
        expect(gameHud?.classList.contains('hidden')).toBe(true);
        expect(raceOverMenu?.classList.contains('hidden')).toBe(true);
    });

    it('should show the game HUD and hide other UI elements', () => {
        const mainMenu = document.querySelector('[data-testid="main-menu"]');
        const gameHud = document.querySelector('[data-testid="game-hud"]');
        const raceOverMenu = document.querySelector('[data-testid="race-over"]');

        showGameHud();

        expect(mainMenu?.classList.contains('hidden')).toBe(true);
        expect(gameHud?.classList.contains('hidden')).toBe(false);
        expect(raceOverMenu?.classList.contains('hidden')).toBe(true);
    });

    it('should show the race over menu and hide other UI elements', () => {
        const mainMenu = document.querySelector('[data-testid="main-menu"]');
        const gameHud = document.querySelector('[data-testid="game-hud"]');
        const raceOverMenu = document.querySelector('[data-testid="race-over"]');
        
        showRaceOverMenu(180.5, 3);

        expect(mainMenu?.classList.contains('hidden')).toBe(true);
        expect(gameHud?.classList.contains('hidden')).toBe(true);
        expect(raceOverMenu?.classList.contains('hidden')).toBe(false);
    });
}); 