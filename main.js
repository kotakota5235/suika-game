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

        // Add Face
        const face = fruit.face || { mouth: 'smile', eye: 'dot' };
        const mouthType = face.mouth;
        const eyeType = face.eye || 'dot';

        let leftEyeStyle = '';
        let rightEyeStyle = '';
        let mouthStyle = '';
        let mouthClass = ''; // Helper to simplify some CSS if needed, or just inline styles

        // define common styles
        const baseEyeStyle = 'position: absolute; top: 35%; width: 15%; height: 15%; opacity: 0.9;';
        const leftEyePos = 'left: 20%;';
        const rightEyePos = 'right: 20%;';

        const getEyeStyle = (type) => {
            if (type === 'dot') return 'background: white; border-radius: 50%;';
            if (type === 'line') return 'height: 10%; top: 40%; background: white; border-radius: 2px;'; // thinner, centered
            if (type === 'open') return 'border: 2px solid white; border-radius: 50%; background: transparent; box-sizing: border-box;';
            return 'background: white; border-radius: 50%;'; // fallback dot
        };

        let leftType = eyeType;
        let rightType = eyeType;
        if (eyeType === 'wink') {
            leftType = 'dot';
            rightType = 'line';
        }

        leftEyeStyle = `${baseEyeStyle} ${leftEyePos} ${getEyeStyle(leftType)}`;
        rightEyeStyle = `${baseEyeStyle} ${rightEyePos} ${getEyeStyle(rightType)}`;


        // Mouth Logic
        const baseMouthStyle = 'position: absolute; left: 50%; transform: translateX(-50%); opacity: 0.9;';

        let mouthInner = '';
        if (mouthType === 'smile') {
            mouthStyle = `${baseMouthStyle} bottom: 25%; width: 40%; height: 20%; border-bottom: 3px solid white; border-radius: 50%;`;
        } else if (mouthType === 'frown') {
            mouthStyle = `${baseMouthStyle} bottom: 20%; width: 40%; height: 20%; border-top: 3px solid white; border-radius: 50%;`;
        } else if (mouthType === 'line') {
            mouthStyle = `${baseMouthStyle} bottom: 30%; width: 40%; height: 3px; background: white; border-radius: 2px;`;
        } else if (mouthType === 'open') {
            mouthStyle = `${baseMouthStyle} bottom: 25%; width: 30%; height: 30%; border: 3px solid white; border-radius: 50%; box-sizing: border-box;`;
        } else {
            // default smile
            mouthStyle = `${baseMouthStyle} bottom: 25%; width: 40%; height: 20%; border-bottom: 3px solid white; border-radius: 50%;`;
        }

        el.innerHTML = `
            <div style="${leftEyeStyle}"></div>
            <div style="${rightEyeStyle}"></div>
            <div style="${mouthStyle}"></div>
        `;

        container.appendChild(el);
    });
}
