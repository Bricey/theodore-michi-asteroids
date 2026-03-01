/**
 * Asteroids Clone - Two Player
 * Bootstrap Phaser game with scene pipeline.
 */
import Phaser from 'phaser';
import { gameConfig } from './config/gameConfig.js';
import { Boot } from './scenes/Boot.js';
import { Preloader } from './scenes/Preloader.js';
import { MainMenu } from './scenes/MainMenu.js';
import { Game } from './scenes/Game.js';
import { GameOver } from './scenes/GameOver.js';

const config = {
  ...gameConfig,
  scene: [Boot, Preloader, MainMenu, Game, GameOver],
};

const game = new Phaser.Game(config);
