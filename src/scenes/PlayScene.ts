import Phaser from "phaser";

// player
import { Player } from "../entities/Player";

// scene
import { GameScene } from "./GameScene";

// types
import { SpriteWithDynamicBody } from "../types";

// config
import { PRELOAD_CONFIG } from "..";

class PlayScene extends GameScene {

    player: Player;
    ground: Phaser.GameObjects.TileSprite;
    obstacles: Phaser.Physics.Arcade.Group;
    startTrigger: SpriteWithDynamicBody;

    gameOverContainer: Phaser.GameObjects.Container;
    gameOverText: Phaser.GameObjects.Image;
    restartText: Phaser.GameObjects.Image;

    spawnInterval: number = 1500;
    spawnTime: number = 0;
    gameSpeed: number = 10;

    constructor() {
        super("PlayScene");
    }

    create() {
        this.createEnvironment();
        this.createPlayer();
        this.createObstacles();
        this.createGameOverContainer();

        this.handleGameStart();
        this.handleObstacleCollisions();
        this.handleGameRestart();
    }

    update(time: number, delta: number): void {
        if (!this.isGameRunning) { return; }

        this.spawnTime += delta;

        if (this.spawnTime >= this.spawnInterval) {
            this.spawnObstacle();
            this.spawnTime = 0;
        }

        Phaser.Actions.IncX(this.obstacles.getChildren(), -this.gameSpeed);

        this.obstacles.getChildren().forEach((obstacle: SpriteWithDynamicBody) => {
            if (obstacle.getBounds().right < 0) {
                this.obstacles.remove(obstacle);
            }
        });

        this.ground.tilePositionX += this.gameSpeed;
    }

    createEnvironment() {
        this.ground = this.add
            .tileSprite(0, this.gameHeight, 88, 26, "ground")
            .setOrigin(0, 1);
    }

    createPlayer() {
        this.player = new Player(this, 0, this.gameHeight);
    }

    createObstacles() {
        this.obstacles = this.physics.add.group();
    }

    createGameOverContainer() {
        this.gameOverText = this.add.image(0, 0, "game-over");
        this.restartText = this.add.image(0, 80, "restart").setInteractive();

        this.gameOverContainer = this.add
            .container(this.gameWidth / 2, (this.gameHeight / 2) - 50)
            .add([this.gameOverText, this.restartText])
            .setAlpha(0);
    }

    spawnObstacle() {
        const obstacleNum = Math.floor(Math.random() * PRELOAD_CONFIG.cactusesCount) + 1;
        const distance = Phaser.Math.Between(600, 900);

        this.obstacles
            .create(distance, this.gameHeight, `obstacle-${obstacleNum}`)
            .setOrigin(0, 1)
            .setImmovable();
    }

    handleGameStart() {
        this.startTrigger = this.physics.add.sprite(0, 10, null)
            .setAlpha(0)
            .setOrigin(0, 1);

        this.physics.add.overlap(this.startTrigger, this.player, () => {

            if (this.startTrigger.y === 10) {
                this.startTrigger.body.reset(0, this.gameHeight);
                return;
            }

            this.startTrigger.body.reset(9999, 9999);

            const rollOutEvent = this.time.addEvent({
                delay: 1000 / 60,
                loop: true,
                callback: () => {
                    this.player.playRunAnimation();
                    this.player.setVelocityX(80);
                    this.ground.width += (17 * 2);

                    if (this.ground.width >= this.gameWidth) {
                        rollOutEvent.remove();
                        this.ground.width = this.gameWidth;
                        this.player.setVelocityX(0);
                        this.isGameRunning = true;
                    }
                }
            });

        });
    }

    handleObstacleCollisions() {
        this.physics.add.collider(this.obstacles, this.player, () => {
            this.physics.pause();
            this.isGameRunning = false;

            this.player.die();
            this.gameOverContainer.setAlpha(1);

            this.spawnTime = 0;
            this.gameSpeed = 5;
        });
    }

    handleGameRestart() {
        this.restartText.on("pointerdown", () => {
            this.physics.resume();
            this.player.setVelocityY(0);

            this.obstacles.clear(true, true);
            this.gameOverContainer.setAlpha(0);
            this.anims.resumeAll();

            this.isGameRunning = true;
        });
    }
}

export default PlayScene;
