import { FRUITS } from './fruits.js';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.engine = null;
        this.render = null;
        this.runner = null;

        // Game State
        this.currentFruit = null;
        this.nextFruit = null;
        this.score = 0;
        this.bestScore = localStorage.getItem('suika-best-score') || 0;
        this.isGameOver = false;
        this.canDrop = true;

        this.init();
    }

    init() {
        // Setup Matter.js
        const { Engine, Render, Runner, World, Bodies, MouseConstraint, Mouse } = Matter;

        this.engine = Engine.create();
        this.engine.gravity.scale = 0.002; // Increase gravity for faster drops
        this.world = this.engine.world;

        // Create Render
        const width = this.canvas.parentElement.clientWidth;
        const height = this.canvas.parentElement.clientHeight;

        this.render = Render.create({
            canvas: this.canvas,
            engine: this.engine,
            options: {
                width: width,
                height: height,
                wireframes: false,
                background: 'transparent'
            }
        });

        // Setup Walls
        this.createWalls(width, height);

        // Start Engine
        Render.run(this.render);
        this.runner = Runner.create();
        Runner.run(this.runner, this.engine);

        // Custom Rendering for Faces
        Matter.Events.on(this.render, 'afterRender', () => {
            const context = this.render.context;
            const bodies = Matter.Composite.allBodies(this.engine.world);

            context.beginPath();
            for (let i = 0; i < bodies.length; i += 1) {
                const body = bodies[i];
                if (body.fruitLevel !== undefined) {
                    const { x, y } = body.position;
                    const radius = body.circleRadius;
                    const angle = body.angle;

                    context.translate(x, y);
                    context.rotate(angle);

                    // Draw Face
                    context.fillStyle = '#FFF';
                    context.globalAlpha = 0.7;

                    // Eyes
                    context.beginPath();
                    context.arc(-radius * 0.3, -radius * 0.1, radius * 0.15, 0, 2 * Math.PI);
                    context.arc(radius * 0.3, -radius * 0.1, radius * 0.15, 0, 2 * Math.PI);
                    context.fill();

                    // Mouth
                    context.beginPath();
                    context.strokeStyle = '#FFF';
                    context.lineWidth = 2;
                    context.arc(0, radius * 0.1, radius * 0.2, 0, Math.PI);
                    context.stroke();

                    context.rotate(-angle);
                    context.translate(-x, -y);
                    context.globalAlpha = 1;
                }
            }

            // Draw Danger Line
            context.beginPath();
            context.moveTo(0, 100);
            context.lineTo(this.canvas.width, 100);
            context.strokeStyle = 'rgba(255, 0, 0, 0.5)';
            context.setLineDash([10, 10]);
            context.lineWidth = 2;
            context.stroke();
            context.setLineDash([]);
        });

        // Bind Events
        this.bindEvents();

        // Initial UI
        this.updateScore(0);
    }

    createWalls(width, height) {
        const { Bodies, World } = Matter;
        const wallOptions = {
            isStatic: true,
            render: { fillStyle: '#8d6e63' }
        };

        const ground = Bodies.rectangle(width / 2, height, width, 60, wallOptions);
        const leftWall = Bodies.rectangle(0, height / 2, 20, height, wallOptions);
        const rightWall = Bodies.rectangle(width, height / 2, 20, height, wallOptions);

        World.add(this.world, [ground, leftWall, rightWall]);
    }

    bindEvents() {
        // Mouse/Touch move to position the fruit
        this.canvas.addEventListener('mousemove', (e) => this.handleInputMove(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleInputMove(e), { passive: false });

        // Click/Touch end to drop
        this.canvas.addEventListener('click', (e) => this.handleInputEnd(e));
        this.canvas.addEventListener('touchend', (e) => this.handleInputEnd(e));

        // Collision for merging
        Matter.Events.on(this.engine, 'collisionStart', (event) => this.handleCollision(event));

        // Game Over Check
        Matter.Events.on(this.engine, 'beforeUpdate', () => this.checkGameOver());

        // Restart Button
        document.getElementById('restart-btn').addEventListener('click', () => this.reset());
    }

    start() {
        this.spawnFruit();
    }

    handleInputMove(e) {
        if (!this.canDrop || !this.currentFruit) return;

        e.preventDefault();
        const x = this.getEventX(e);
        const clampedX = Math.max(this.currentFruit.circleRadius + 20, Math.min(x, this.canvas.width - this.currentFruit.circleRadius - 20));

        Matter.Body.setPosition(this.currentFruit, {
            x: clampedX,
            y: this.currentFruit.position.y
        });
    }

    handleInputEnd(e) {
        if (!this.canDrop || !this.currentFruit) return;
        e.preventDefault();

        this.dropFruit();
    }

    getEventX(e) {
        const rect = this.canvas.getBoundingClientRect();
        const clientX = e.touches ? e.changedTouches[0].clientX : e.clientX;
        return (clientX - rect.left) * (this.canvas.width / rect.width);
    }

    spawnFruit() {
        const index = this.nextFruit ? FRUITS.indexOf(this.nextFruit) : Math.floor(Math.random() * 5);
        const fruitData = FRUITS[index];

        this.currentFruit = Matter.Bodies.circle(this.canvas.width / 2, 50, fruitData.radius, {
            label: fruitData.name,
            isStatic: true, // Static until dropped
            render: { fillStyle: fruitData.color },
            restitution: 0.2,
            friction: 0.1
        });

        this.currentFruit.fruitLevel = index;

        Matter.World.add(this.world, this.currentFruit);
        this.canDrop = true;

        // Prepare next fruit
        const nextIndex = Math.floor(Math.random() * 5);
        this.nextFruit = FRUITS[nextIndex];
        this.updateNextFruitDisplay();
    }

    dropFruit() {
        this.canDrop = false;
        Matter.Body.setStatic(this.currentFruit, false);
        this.currentFruit = null;

        setTimeout(() => {
            if (!this.isGameOver) {
                this.spawnFruit();
            }
        }, 1000);
    }

    updateNextFruitDisplay() {
        const display = document.getElementById('next-fruit-display');
        if (this.nextFruit) {
            display.style.backgroundColor = this.nextFruit.color;
            display.style.width = `${this.nextFruit.radius * 0.8}px`;
            display.style.height = `${this.nextFruit.radius * 0.8}px`;
            display.style.borderRadius = '50%';
            display.style.position = 'relative';

            // Add face using innerHTML
            display.innerHTML = `
                <div style="position: absolute; top: 30%; left: 20%; width: 15%; height: 15%; background: white; border-radius: 50%; opacity: 0.7;"></div>
                <div style="position: absolute; top: 30%; right: 20%; width: 15%; height: 15%; background: white; border-radius: 50%; opacity: 0.7;"></div>
                <div style="position: absolute; bottom: 25%; left: 50%; transform: translateX(-50%); width: 40%; height: 20%; border-bottom: 2px solid white; border-radius: 50%;"></div>
            `;
        }
    }

    handleCollision(event) {
        const pairs = event.pairs;

        for (let i = 0; i < pairs.length; i++) {
            const { bodyA, bodyB } = pairs[i];

            if (bodyA.fruitLevel !== undefined && bodyB.fruitLevel !== undefined) {
                if (bodyA.fruitLevel === bodyB.fruitLevel) {
                    // Check if already processed to avoid double merging
                    if (bodyA.isMerging || bodyB.isMerging) continue;

                    this.mergeFruits(bodyA, bodyB);
                }
            }
        }
    }

    mergeFruits(bodyA, bodyB) {
        // Mark as merging so we don't process them again in the same tick
        bodyA.isMerging = true;
        bodyB.isMerging = true;

        const currentLevel = bodyA.fruitLevel;

        // If max level, just remove (or handle differently? Suika usually keeps max or disappears)
        // Standard Suika: Two watermelons disappear
        if (currentLevel >= FRUITS.length - 1) {
            Matter.World.remove(this.world, [bodyA, bodyB]);
            this.updateScore(FRUITS[currentLevel].score * 2);
            return;
        }

        const newLevel = currentLevel + 1;
        const newFruitData = FRUITS[newLevel];

        // Calculate midpoint
        const midX = (bodyA.position.x + bodyB.position.x) / 2;
        const midY = (bodyA.position.y + bodyB.position.y) / 2;

        // Remove old bodies
        Matter.World.remove(this.world, [bodyA, bodyB]);

        // Create new body
        const newBody = Matter.Bodies.circle(midX, midY, newFruitData.radius, {
            label: newFruitData.name,
            render: { fillStyle: newFruitData.color },
            restitution: 0.2,
            friction: 0.1
        });

        newBody.fruitLevel = newLevel;

        Matter.World.add(this.world, newBody);

        // Add score
        this.updateScore(FRUITS[currentLevel].score);
    }

    updateScore(points) {
        this.score += points;
        document.getElementById('current-score').textContent = this.score;
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('suika-best-score', this.bestScore);
            document.getElementById('best-score').textContent = this.bestScore;
        }
    }
    checkGameOver() {
        if (this.isGameOver) return;

        const bodies = Matter.Composite.allBodies(this.world);
        const dangerLineY = 100; // Top of the container roughly

        let isOverflowing = false;

        for (let body of bodies) {
            // Ignore static bodies (walls) and the current controlled fruit
            if (body.isStatic || body === this.currentFruit || body.isMerging) continue;

            if (body.position.y < dangerLineY) {
                // Check if it's settled (not just bouncing up temporarily)
                if (body.speed < 0.5) {
                    isOverflowing = true;
                    break;
                }
            }
        }

        if (isOverflowing) {
            if (!this.gameOverTimer) {
                this.gameOverTimer = Date.now();
            } else if (Date.now() - this.gameOverTimer > 2000) {
                // 2 seconds of overflow triggers game over
                this.endGame();
            }
        } else {
            this.gameOverTimer = null;
        }
    }

    endGame() {
        this.isGameOver = true;
        this.canDrop = false;
        document.getElementById('game-over-modal').classList.remove('hidden');
        document.getElementById('final-score').textContent = this.score;
    }

    reset() {
        // Clear World
        Matter.World.clear(this.world);
        Matter.Engine.clear(this.engine);

        // Re-create walls
        const width = this.canvas.parentElement.clientWidth;
        const height = this.canvas.parentElement.clientHeight;
        this.createWalls(width, height);

        // Reset State
        this.score = 0;
        this.updateScore(0);
        this.isGameOver = false;
        this.gameOverTimer = null;
        this.currentFruit = null;
        this.nextFruit = null;

        // Hide Modal
        document.getElementById('game-over-modal').classList.add('hidden');

        // Start again
        this.spawnFruit();
    }
}
