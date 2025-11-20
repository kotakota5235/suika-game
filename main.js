import { Game } from './game.js';
import { FRUITS } from './fruits.js';

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('game-canvas');
    const game = new Game(canvas);
    game.start();

    initEvolutionWheel();
});

function initEvolutionWheel() {
    const container = document.getElementById('wheel-container');
    const radius = 130; // Half of container width
    const centerX = 130;
    const centerY = 130;
    const step = (2 * Math.PI) / FRUITS.length;

    // Add arrow in center
    const arrow = document.createElement('div');
    arrow.className = 'wheel-arrow';
    arrow.innerHTML = '↻';
    container.appendChild(arrow);

    FRUITS.forEach((fruit, index) => {
        const angle = index * step - Math.PI / 2; // Start from top
        const x = centerX + Math.cos(angle) * 100 - 20; // 100 is orbit radius, 20 is half fruit size approx
        const y = centerY + Math.sin(angle) * 100 - 20;

        const el = document.createElement('div');
        el.className = 'wheel-fruit';
        el.style.backgroundColor = fruit.color;

        // Scale size relative to fruit radius but clamped for UI
        const uiSize = Math.max(25, Math.min(50, fruit.radius * 0.8));
        el.style.width = `${uiSize}px`;
        el.style.height = `${uiSize}px`;
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;

        // Add face
        el.innerHTML = `
            <div style="position: absolute; top: 30%; left: 20%; width: 15%; height: 15%; background: white; border-radius: 50%; opacity: 0.7;"></div>
            <div style="position: absolute; top: 30%; right: 20%; width: 15%; height: 15%; background: white; border-radius: 50%; opacity: 0.7;"></div>
            <div style="position: absolute; bottom: 25%; left: 50%; transform: translateX(-50%); width: 40%; height: 20%; border-bottom: 2px solid white; border-radius: 50%;"></div>
        `;

        container.appendChild(el);
    });
}
