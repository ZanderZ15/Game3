// Jim Whitehead
// Created: 4/14/2024
// Phaser: 3.70.0
//
// Cubey
//
// An example of putting sprites on the screen using Phaser
// 
// Art assets from Kenny Assets "Shape Characters" set:
// https://kenney.nl/assets/shape-characters

// debug with extreme prejudice
"use strict"

// game config
let config = {
    fps: { forceSetTimeOut: true, target: 30 },
    parent: 'phaser-game',
    type: Phaser.CANVAS,
    render: {
        pixelArt: true  // prevent pixel art from getting blurred when scaled
    },
    width: 500,
    height: 690,
    scene: [Start1, Start2, Start3, lvl1, lvl2, lvl3, End],
    fps: { forceSetTimeOut: true, target: 30 }
}
var lives = 3;
var score = 0;
const game = new Phaser.Game(config);