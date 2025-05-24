class Level1_Outside extends Phaser.Scene {
    constructor() {
        super("level1")
    }
    init() {
        this.ACCELERATION = 400;
        this.DRAG = 500;    // DRAG < ACCELERATION = icy slide
        this.physics.world.gravity.y = 1500;
        this.JUMP_VELOCITY = -600;
        this.PARTICLE_VELOCITY = 50;
        this.SCALE = 1.8;
        this.maxVelocity = 300;
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
        this.pLayer = this.map.createLayer("Passables", this.tiles, 0, 0);
        this.fpLayer = this.map.createLayer("Front Passables", this.tiles, 0, 0);

        // Make it collidable
        this.solidLayer.setCollisionByProperty({
            collides: true
        });
        //this.solidLayer.setCollision([5]);

        // Adjust collision behavior for platforms to be passable from below
        this.solidLayer.forEachTile(tile => {
            if (tile.index === 5) {
                tile.setCollision(true, true, true, false); // Disable collision from below
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

        // Since createFromObjects returns an array of regular Sprites, we need to convert 
        // them into Arcade Physics sprites (STATIC_BODY, so they don't move) 
        this.physics.world.enable(this.coins, Phaser.Physics.Arcade.STATIC_BODY);
        this.physics.world.enable(this.gems, Phaser.Physics.Arcade.STATIC_BODY);

        // Create a Phaser group out of the array this.coins
        // This will be used for collision detection below.
        this.coinGroup = this.add.group(this.coins);
        this.gemGroup = this.add.group(this.gems);
        

        // set up player avatar
        my.sprite.player = this.physics.add.sprite(30, 500, "platformer_characters", "tile_0000.png");
        my.sprite.player.setCollideWorldBounds(false);
        

        // Enable collision handling
        this.physics.add.collider(my.sprite.player, this.solidLayer);

         // Handle collision detection with coins
        this.physics.add.overlap(my.sprite.player, this.coinGroup, (obj1, obj2) => {
            obj2.destroy(); // remove coin on overlap
        });
        this.physics.add.overlap(my.sprite.player, this.gemGroup, (obj1, obj2) => {
            obj2.destroy(); // remove coin on overlap
        });

        // set up Phaser-provided cursor key input
        cursors = this.input.keyboard.createCursorKeys();

        this.rKey = this.input.keyboard.addKey('R');

        // debug key listener (assigned to D key)
        this.input.keyboard.on('keydown-D', () => {
            this.physics.world.drawDebug = this.physics.world.drawDebug ? false : true
            this.physics.world.debugGraphic.clear()
        }, this);

        // movement vfx

        my.vfx.walking = this.add.particles(0, 0, "kenny-particles", {
            frame: ['smoke_03.png', 'smoke_09.png'],
            
            // TODO: Try: add random: true
            random: true, //Ranodmizes sprites shown
            scale: {start: 0.03, end: 0.1},
            // TODO: Try: maxAliveParticles: 8,
            maxAliveParticles: 20, //Limits total particles
            lifespan: 350,
            // TODO: Try: gravityY: -400,
            gravityY: -400, //Makes float up
            alpha: {start: 1, end: 0.1}, 
        });

        my.vfx.walking.stop();
        

        // Camera
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.startFollow(my.sprite.player, true, 0.25, 0.25); // (target, [,roundPixels][,lerpX][,lerpY])
        this.cameras.main.setDeadzone(50, 50);
        this.cameras.main.setZoom(this.SCALE);



    }
    update() {
        if(cursors.left.isDown) {
            my.sprite.player.setAccelerationX(-this.ACCELERATION);
            my.sprite.player.resetFlip();
            my.sprite.player.anims.play('walk', true);
            // Particle Following
            my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-5, my.sprite.player.displayHeight/2-5, false);
            my.vfx.walking.setParticleSpeed(this.PARTICLE_VELOCITY, 0);
            // Only play smoke effect if touching the ground
            if (my.sprite.player.body.blocked.down) {
                my.vfx.walking.start();
            }

        } else if(cursors.right.isDown) {
            my.sprite.player.setAccelerationX(this.ACCELERATION);
            my.sprite.player.setFlip(true, false);
            my.sprite.player.anims.play('walk', true);
            // Particle Following
            my.vfx.walking.startFollow(my.sprite.player, my.sprite.player.displayWidth/2-20, my.sprite.player.displayHeight/2-5, false);
            my.vfx.walking.setParticleSpeed(-this.PARTICLE_VELOCITY, 0);
            // Only play smoke effect if touching the ground
            if (my.sprite.player.body.blocked.down) {
                my.vfx.walking.start();
            }
        } else {
            // Set acceleration to 0 and have DRAG take over
            my.sprite.player.setAccelerationX(0);
            my.sprite.player.setDragX(this.DRAG);
            my.sprite.player.anims.play('idle');
            // particle vfx stop
             my.vfx.walking.stop();
        }

        let currentVelocity = my.sprite.player.body.velocity.x;

        // Cap the velocity
        if (currentVelocity > this.maxVelocity) {
            my.sprite.player.setVelocityX(this.maxVelocity);
        } else if (currentVelocity < -this.maxVelocity) {
            my.sprite.player.setVelocityX(-this.maxVelocity);
        }
        // player jump
        // note that we need body.blocked rather than body.touching b/c the former applies to tilemap tiles and the latter to the "ground"
        if(!my.sprite.player.body.blocked.down) {
            my.sprite.player.anims.play('jump');
        }
        if(my.sprite.player.body.blocked.down && Phaser.Input.Keyboard.JustDown(cursors.up)) {
            my.sprite.player.body.setVelocityY(this.JUMP_VELOCITY);
        }

        if(Phaser.Input.Keyboard.JustDown(this.rKey)) {
            this.scene.restart();
        }
    }
}