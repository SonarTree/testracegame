import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import {
    showMainMenu,
    showGameHud,
    showRaceOverMenu,
    updateMinimap,
} from './GameUI';

describe('GameUI Module', () => {
    beforeEach(() => {
        const dom = new JSDOM(`
            <!DOCTYPE html>
            <html>
                <body>
                    <div data-testid="main-menu" class="hidden"></div>
                    <div data-testid="game-hud" class="hidden"></div>
                    <div data-testid="race-over" class="hidden">
                        <div id="final-time"></div>
                        <div id="total-laps"></div>
                    </div>
                    <canvas id="minimap" class="hidden"></canvas>
                </body>
            </html>
        `);
        global.window = dom.window as unknown as Window & typeof globalThis;
        global.document = dom.window.document;
    });

    it('should show the main menu and hide other UI elements', () => {
        const mainMenu = document.querySelector('[data-testid="main-menu"]');
        const gameHud = document.querySelector('[data-testid="game-hud"]');
        const raceOverMenu = document.querySelector('[data-testid="race-over"]');
        const minimap = document.getElementById('minimap');

        showMainMenu();

        expect(mainMenu?.classList.contains('hidden')).toBe(false);
        expect(gameHud?.classList.contains('hidden')).toBe(true);
        expect(raceOverMenu?.classList.contains('hidden')).toBe(true);
        expect(minimap?.classList.contains('hidden')).toBe(true);
    });

    it('should show the game HUD and hide other UI elements', () => {
        const mainMenu = document.querySelector('[data-testid="main-menu"]');
        const gameHud = document.querySelector('[data-testid="game-hud"]');
        const raceOverMenu = document.querySelector('[data-testid="race-over"]');
        const minimap = document.getElementById('minimap');

        showGameHud();

        expect(mainMenu?.classList.contains('hidden')).toBe(true);
        expect(gameHud?.classList.contains('hidden')).toBe(false);
        expect(raceOverMenu?.classList.contains('hidden')).toBe(true);
        expect(minimap?.classList.contains('hidden')).toBe(false);
    });

    it('should show the race over menu and hide other UI elements', () => {
        const mainMenu = document.querySelector('[data-testid="main-menu"]');
        const gameHud = document.querySelector('[data-testid="game-hud"]');
        const raceOverMenu = document.querySelector('[data-testid="race-over"]');
        const minimap = document.getElementById('minimap');

        showRaceOverMenu(180.5, 3);

        expect(mainMenu?.classList.contains('hidden')).toBe(true);
        expect(gameHud?.classList.contains('hidden')).toBe(true);
        expect(raceOverMenu?.classList.contains('hidden')).toBe(false);
        expect(minimap?.classList.contains('hidden')).toBe(true);
    });

    it('should draw on the minimap canvas', () => {
        const canvas = document.getElementById('minimap') as HTMLCanvasElement;
        
        const mockCtx = {
            clearRect: vi.fn(),
            beginPath: vi.fn(),
            stroke: vi.fn(),
            fill: vi.fn(),
            moveTo: vi.fn(),
            lineTo: vi.fn(),
            arc: vi.fn(),
            closePath: vi.fn(),
            strokeStyle: '',
            fillStyle: '',
            lineWidth: 0,
        };
        
        vi.spyOn(canvas, 'getContext').mockReturnValue(mockCtx as any);

        updateMinimap({ x: 10, z: 20 }, { x: 15, z: 25 }, 50);

        expect(mockCtx.clearRect).toHaveBeenCalled();
        expect(mockCtx.beginPath).toHaveBeenCalledTimes(3); // 1 for track, 2 for cars
        expect(mockCtx.stroke).toHaveBeenCalledOnce();
        expect(mockCtx.fill).toHaveBeenCalledTimes(2); // 2 for cars
    });
}); 