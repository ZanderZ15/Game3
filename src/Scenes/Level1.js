class Level1_Outside extends Phaser.Scene {
    constructor() {
        super("level1")
    }
    init() {
        this.timer = 0;
        this.ACCELERATION = 400;
        this.DRAG = 700;    // DRAG < ACCELERATION = icy slide
        this.physics.world.gravity.y = 1500;
        this.JUMP_VELOCITY = -400;
        this.PARTICLE_VELOCITY = 50;
        this.SCALE = 1.8;
        this.maxvx = 300;
        this.maxvy = 1000;
        this.score = 0;
        this.done = false;
        this.jumps = false;
        this.checkpoint = { //30, 500
            x: 30,
            y: 500
        };
    }
    preload () {
        this.load.scenePlugin('AnimatedTiles', './lib/AnimatedTiles.js', 'animatedTiles', 'animatedTiles');
    }
    create() {
        
        this.map = this.add.tilemap("level1", 18, 18, 450, 50);


        this.animatedTiles.init(this.map);


        // Add a tileset to the map
        // First parameter: name we gave the tileset in Tiled
        // Second parameter: key for the tilesheet (from this.load.image in Load.js)
        this.tiles = this.map.addTilesetImage("packed", "tiles");
        this.bg = this.map.addTilesetImage("Backgrounds", "background");

        this.bgLayer = this.map.createLayer("Background", this.bg, 0, 0);
        this.deathLayer = this.map.createLayer("Death", this.tiles, 0, 0);
        this.solidLayer = this.map.createLayer("Solids", this.tiles, 0, 0);
        this.platLayer = this.map.createLayer("Platforms", this.tiles, 0, 0);
        this.pLayer = this.map.createLayer("Passables", this.tiles, 0, 0);
        

        // Make it collidable
        this.solidLayer.setCollisionByProperty({
            collides: true
        });
        this.platLayer.setCollisionByProperty({
            oneWay: true
        });
        //this.solidLayer.setCollision([5]);

        // Adjust collision behavior for platforms to be passable from below
        
        this.platLayer.forEachTile(tile => {
            
            const tileProperties = this.map.tilesets[0].tileProperties[tile.index];
            
            if (tileProperties && tileProperties.oneWay) {
                
                tile.setCollision(false, false, true, false); // Only collides on top
            }
        });

        this.coins = this.map.createFromObjects("Collectibles", {
            name: "coin",
            key: "tilemap_sheet",
            frame: 151
        });
        this.anims.create({
            key: 'coinAnim', // Animation key
            frames: this.anims.generateFrameNumbers('tilemap_sheet', 
                {start: 151, end: 152}
            ),
            frameRate: 1,  // Higher is faster
            repeat: -1      // Loop the animation indefinitely
        });

        // Play the same animation for every memeber of the Object coins array
        this.anims.play('coinAnim', this.coins);
        
        
        this.gems = this.map.createFromObjects("Collectibles", {
            name: "gem",
            key: "tilemap_sheet",
            frame: 67
        });
        this.flags = this.map.createFromObjects("Collectibles", {
            name: "flag",
            key: "tilemap_sheet",
            frame: 131
        });
        this.spikes = this.map.createFromObjects("Collectibles", {
            name: "spike",
            key: "tilemap_sheet",
            frame: 68
        });
        this.waters = this.map.createFromObjects("Collectibles", {
            name: "water",
            key: "tilemap_sheet",
            frame: 73
        });
        this.checkpoints = this.map.createFromObjects("Collectibles", {
            name: "cp",
            key: "tilemap_sheet",
            frame: 89
        });

        // Since createFromObjects returns an array of regular Sprites, we need to convert 
        // them into Arcade Physics sprites (STATIC_BODY, so they don't move) 
        this.physics.world.enable(this.coins, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.gems, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.flags, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.spikes, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.waters, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.checkpoints, Phaser.Physics.Arcade.STATIC_BODY);
        // Create a Phaser group out of the array this.coins
        // This will be used for collision detection below.
        this.coinGroup = this.add.group(this.coins);
        this.gemGroup = this.add.group(this.gems);
        this.spikeGroup = this.add.group(this.spikes);
        this.flagGroup = this.add.group(this.flags);
        this.waterGroup = this.add.group(this.waters);
        this.checkpointGroup = this.add.group(this.checkpoints);

        this.fpLayer = this.map.createLayer("Front Passables", this.tiles, 0, 0);
        // set up player avatar
        my.sprite.player = this.physics.add.sprite(this.checkpoint.x, this.checkpoint.y, "platformer_characters", "tile_0000.png");
        my.sprite.player.setCollideWorldBounds(false);
        

        // Enable collision handling
        this.physics.add.collider(my.sprite.player, this.solidLayer);
        this.physics.add.collider(my.sprite.player, this.platLayer);

         // Handle collision detection with coins
        this.physics.add.overlap(my.sprite.player, this.coinGroup, (obj1, obj2) => {
            my.vfx.coining.x = obj2.x;
            my.vfx.coining.y = obj2.y;
            this.sound.play("coin");
            my.vfx.coining.start();

            obj2.destroy(); // remove coin on overlap
            this.score += 100;
            my.text.score.setText("SCORE: " + this.score);
        });
        this.physics.add.overlap(my.sprite.player, this.gemGroup, (obj1, obj2) => {
            my.vfx.gem.x = obj2.x;
            my.vfx.gem.y = obj2.y;
            my.vfx.gem.start();
            obj2.destroy(); // remove coin on overlap
            this.score += 5000;
            my.text.score.setText("SCORE: " + this.score);
        });
        this.physics.add.overlap(my.sprite.player, this.spikeGroup, (obj1, obj2) => {
            my.sprite.player.body.setVelocityX(0);
            my.sprite.player.body.setVelocityY(0);
            obj1.x = this.checkpoint.x; 
            obj1.y = this.checkpoint.y;
        });
        this.physics.add.overlap(my.sprite.player, this.flagGroup, (obj1, obj2) => {
            this.done = true;
        });
        this.physics.add.overlap(my.sprite.player, this.waterGroup, (obj1, obj2) => {
            my.sprite.player.body.setVelocityX(0);
            my.sprite.player.body.setVelocityY(0);
            obj1.x = this.checkpoint.x; 
            obj1.y = this.checkpoint.y;
        });
        this.physics.add.overlap(my.sprite.player, this.checkpointGroup, (obj1, obj2) => {
            this.checkpoint.x = obj2.x;
            this.checkpoint.y = obj2.y;

        });

        // set up Phaser-provided cursor key input
        cursors = this.input.keyboard.createCursorKeys();

        this.rKey = this.input.keyboard.addKey('R');
        
        // debug key listener (assigned to D key)
        this.input.keyboard.on('keydown-D', () => {
            this.physics.world.drawDebug = this.physics.world.drawDebug ? false : true
            this.physics.world.debugGraphic.clear()
        }, this);
        this.physics.world.drawDebug = this.physics.world.drawDebug ? false : true
        // movement vfx

        my.vfx.walking = this.add.particles(0, 0, "kenny-particles", {
            frame: ['flame_05.png', 'flame_06.png'],
            
            // TODO: Try: add random: true
            random: false, //Ranodmizes sprites shown
            scale: {start: 0.03, end: 0.2},
            // TODO: Try: maxAliveParticles: 8,
            maxAliveParticles: 10, //Limits total particles
            lifespan: 200,
            // TODO: Try: gravityY: -400,
            gravityY: -500, //Makes float up
            alpha: {start: 1, end: 0.1}, 
            frequency: 100
        });

        my.vfx.walking.stop();
        
        my.vfx.coining = this.add.particles(-100, -100, "kenny-particles", {
            frame: ['star_08.png'],
            
            random: false, //Ranodmizes sprites shown
            scale: {start: .3, end: 0.1},
            rotation: {start: 0, end: 360},
            maxAliveParticles: 1, //Limits total particles
            lifespan: 250,
            gravityY: -100, //Makes float up if negative
            alpha: {start: 1, end: 0.1},
            duration: 250,
            repeat: 0
        });
        my.vfx.coining.stop();

        my.vfx.gem = this.add.particles(-100, -100, "kenny-particles", {
            frame: ['circle_03.png'],
            
            random: false, //Ranodmizes sprites shown
            scale: {start: 0, end: 0.3},
            maxAliveParticles: 1, //Limits total particles
            lifespan: 250,
            gravityY: -100, //Makes float up if negative
            alpha: {start: 1, end: 0.1},
            duration: 500,
            repeat: 0
        });
        my.vfx.gem.stop();

        // Camera
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.startFollow(my.sprite.player, true, 0.25, 0.25); // (target, [,roundPixels][,lerpX][,lerpY])
        this.cameras.main.setDeadzone(50, 50);
        this.cameras.main.setZoom(this.SCALE);

        my.text.score = this.add.text(353, 162, 'SCORE: '+this.score, {
            font: '16px Arial',
            fill: '#000000',
            resolution: 10
        });
        my.text.score.setScrollFactor(0);
        
        my.text.end = this.add.text(760, 335, 'LEVEL COMPLETE', { //760, 335
                font: '32px Arial',
                fill: '#000000',
                resolution: 10
        });
        my.text.end.setScrollFactor(0);
        my.text.end.setOrigin(.5, .5); 
        my.text.end.alpha = 0;
    }
    update() {
        if(cursors.left.isDown) {
            my.sprite.player.setAccelerationX(-this.ACCELERATION);
            my.sprite.player.resetFlip();
            my.sprite.player.anims.play('walk', true);
            // Particle Following
            my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-5, my.sprite.player.displayHeight/2-2, false);
            my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);
            // Only play smoke effect if touching the ground
            if (my.sprite.player.body.blocked.down) {
                my.vfx.walking.start();
            } else {
                my.vfx.walking.stop();
            }

        } else if(cursors.right.isDown) {
            my.sprite.player.setAccelerationX(this.ACCELERATION);
            my.sprite.player.setFlip(true, false);
            my.sprite.player.anims.play('walk', true);
            // Particle Following
            my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-20, my.sprite.player.displayHeight/2-2, false);
            my.vfx.walking.setParticleSpeed(-this.PARTICLE_VELOCITY, 0);
            // Only play smoke effect if touching the ground
            if (my.sprite.player.body.blocked.down) {
                my.vfx.walking.start();
            } else {
                my.vfx.walking.stop();
            }
        } else {
            // Set acceleration to 0 and have DRAG take over
            my.sprite.player.setAccelerationX(0);
            my.sprite.player.setDragX(this.DRAG);
            my.sprite.player.anims.play('idle');
            // particle vfx stop
             my.vfx.walking.stop();
        }

        let currentvx = my.sprite.player.body.velocity.x;
        
        // Cap the velocity
        if (currentvx > this.maxvx) {
            my.sprite.player.setVelocityX(this.maxvx);
        } else if (currentvx < -this.maxvx) {
            my.sprite.player.setVelocityX(-this.maxvx);
        }
        let currentvy = my.sprite.player.body.velocity.y;
        if (currentvy > 1000) {
            my.sprite.player.setVelocityY(this.maxvy);
        } else if (currentvy < -this.maxvy) {
            my.sprite.player.setVelocityY(-this.maxvy);
        }
        // player jump
        // note that we need body.blocked rather than body.touching b/c the former applies to tilemap tiles and the latter to the "ground"
        if(!my.sprite.player.body.blocked.down) {
            my.sprite.player.anims.play('jump');
        }
        if(Phaser.Input.Keyboard.JustDown(cursors.up)) {
            if (my.sprite.player.body.blocked.down){
                my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
                this.jump(my.sprite.player.body);
                this.jumps = true;
            } else if (this.jumps == true) {
                my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
                this.jump(my.sprite.player.body);
                this.jumps = false;
            }
            
        }

        if(Phaser.Input.Keyboard.JustDown(this.rKey)) {
            this.scene.restart();
        }
        if (my.sprite.player.y > 900) {
            my.sprite.player.body.setVelocityX(0);
            my.sprite.player.body.setVelocityY(0);
            my.sprite.player.x = this.checkpoint.x;
            my.sprite.player.y = this.checkpoint.y - 18;
        }
        if (this.done) {
            my.text.end.alpha += .01;
            this.timer += 0.01;    
        }
        if (this.timer >= 5) {
            this.scene.restart();
        }
    }
    jump(sprite) {
        this.add.particles(sprite.x+10, sprite.y+20, "kenny-particles", {
            frame: ['circle_02.png'],
            
            // TODO: Try: add random: true
            random: false, //Ranodmizes sprites shown
            scale: {start: 0.06, end: 0.12},
            rotaion: 0,
            scaleX: 2,
            scaleY: .5,
            // TODO: Try: maxAliveParticles: 8,
            maxAliveParticles: 1, //Limits total particles
            lifespan: 1000,
            // TODO: Try: gravityY: -400,
            duration: 1000,
            gravityY: -10, //Makes float up
            alpha: {start: 1, end: 0.2}, 
            repeat:0
        });
        
    }
}