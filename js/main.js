"use strict";
let canvas = document.getElementById('game');
let ctx = canvas.getContext('2d');

function GameObject(x, y, sprite=null) {

    this.x = x;
    this.y = y;

    this.rotation = 0;
    this.sprite = sprite;
}

GameObject.prototype.Move = function (x, y) {
    // Vegna þess að ég nota hnitakerfi pixlana verður öll hreyfing að vera í hlutfalli við stærð canvas.
    this.x += x * canvas.height / 80;
    this.y += y * canvas.height / 80;
};

GameObject.prototype.DestroyIfOutOfBounds = function () {
    if (this.x < -10 || canvas.width < this.x - 10 || this.y < -10 || canvas.height < this.y - 10) {
        gm.RemoveGameObject(this);
    }
};

GameObject.prototype.BlockIfOutOfBounds = function () {
    if (this.x < 0) {
        this.x = 0
    }
    if (canvas.width < this.x) {
        this.x = canvas.width;
    }
    if (this.y < 0) {
        this.y = 0;
    }
    if (canvas.height < this.y) {
        this.y = canvas.height;
    }
};


function Player(x, y, sprite){
    GameObject.call(this, x, y, sprite);

    this.timeSinceFired = Infinity;
}
Player.prototype = Object.create(GameObject.prototype);
Player.prototype.constructor = Player;

Player.prototype.Update = function () {
    this.Move(...gm.Axes);
    this.BlockIfOutOfBounds();

    if (gm.Keys['Space'] && this.timeSinceFired > 15) {
        let distanceVector = [0, -this.sprite[2] / 2];
        let spawnVector = [];

        spawnVector[0] = distanceVector[0] * Math.cos(this.rotation * toRadians) - distanceVector[1] * Math.sin(this.rotation * toRadians);
        spawnVector[1] = distanceVector[0] * Math.sin(this.rotation * toRadians) + distanceVector[1] * Math.cos(this.rotation * toRadians);

        gm.AddNewGameObject(new Missile(
            this.x + spawnVector[0],
            this.y + spawnVector[1],
            gameGraphicData['Missile'],
            this.rotation,
            spawnVector
        ));
        this.timeSinceFired = 0;
    }

    if (gm.Keys['KeyQ']) {
        this.rotation -= 2;
    } else if (gm.Keys['KeyE']) {
        this.rotation += 2;
    }

    this.timeSinceFired++;
};


function Asteroid(x, y, sprite){
    GameObject.call(this, x, y, sprite);
    this.velocity = [];
    do {
        this.velocity[0] = ((Math.round(Math.random() * 4) - 2) * canvas.height / 160) * 0.1;
        this.velocity[1] = ((Math.round(Math.random() * 4) - 2) * canvas.height / 160) * 0.1;
    } while(this.velocity[0] === 0 || this.velocity[1] === 0);
}
Asteroid.prototype = Object.create(GameObject.prototype);
Asteroid.prototype.constructor = Asteroid;

Asteroid.prototype.Update = function () {
    this.Move(...this.velocity);
    this.DestroyIfOutOfBounds();
};


function AsteroidHandler(x, y){
    GameObject.call(this, x, y);
}
AsteroidHandler.prototype = Object.create(GameObject.prototype);
AsteroidHandler.prototype.constructor = AsteroidHandler;

AsteroidHandler.prototype.Update = function () {
    if (Math.random() < .15) {
        let spawnX, spawnY;
        if (Math.random() < .5) {
            spawnX = ((Math.random() < .5) ? 0 : canvas.width);
            spawnY = Math.random() * canvas.height
        } else {
            spawnX = Math.random() * canvas.width;
            spawnY = ((Math.random() < .5) ? 0 : canvas.height);
        }
        gm.AddNewGameObject(new Asteroid(spawnX, spawnY, gameGraphicData["Asteroid"]))
    }
};


function Missile(x, y, sprite, rotation, velocity){
    GameObject.call(this, x, y, sprite);
    this.velocity = velocity.map((x) => x * 0.1);
    this.rotation = rotation;
}
Missile.prototype = Object.create(GameObject.prototype);
Missile.prototype.constructor = Missile;

Missile.prototype.Update = function () {
    this.Move(...this.velocity);
    this.DestroyIfOutOfBounds();
};


function GameManager(spriteData) {
    this.spriteMap = spriteData;
    this.LoadSprites();

    this.gameObjects = [];

    document.addEventListener('keydown', this.KeyHandler.bind(this));
    document.addEventListener('keyup', this.KeyHandler.bind(this));
    this.Axes = [0, 0];
    this.Keys = {};

    setInterval(this.Update.bind(this), 16);
}
GameManager.prototype.Draw = function (item) {
    if (item.sprite !== null) {
        ctx.save();

        ctx.translate(item.x, item.y);

        ctx.rotate(item.rotation * toRadians);

        ctx.drawImage(item.sprite[0],-item.sprite[1]/2,-item.sprite[2]/2, item.sprite[1], item.sprite[2]);
        ctx.restore();
    }
};
GameManager.prototype.LoadSprites = function () {
    for (const [key, value] of Object.entries(this.spriteMap)) {
        let sprite = new Image(value[1], value[2]);
        sprite.src = value[3];
        this.spriteMap[key][0] = sprite;
    }
};
GameManager.prototype.Update = function () {
    for (let i = 0; i < this.gameObjects.length; i++) {
        let currentObject = this.gameObjects[i];
        if (typeof currentObject.Update === "function") {
            currentObject.Update();
        }
    }
    this.gameObjects.forEach(this.CheckCollisions.bind(this));
    this.gameObjects.forEach(this.Draw);
};
GameManager.prototype.CheckCollisions = function (item) {
    if (item.sprite && item.sprite[4]) {
        for (let i = 0; i < this.gameObjects.length; i++) {
            let currentObject = this.gameObjects[i];
            if (item !== currentObject && currentObject.sprite && currentObject.sprite[4]) {
                if (Distance(item.x, item.y, currentObject.x, currentObject.y) < item.sprite[1] * 0.3 + currentObject.sprite[1] * 0.3) {
                    this.RemoveGameObject(currentObject);
                    this.RemoveGameObject(item);
                }
            }
        }
    }
};
GameManager.prototype.KeyHandler = function (event) {
    if (event.type === "keydown") {
        if (event.code === "KeyW" || event.code === "ArrowUp") {
            this.Axes[1] = -1;
        }
        else if (event.code === "KeyA" || event.code === "ArrowLeft") {
            this.Axes[0] = -1;
        }
        else if (event.code === "KeyS" || event.code === "ArrowDown") {
            this.Axes[1] = 1;
        }
        else if (event.code === "KeyD" || event.code === "ArrowRight") {
            this.Axes[0] = 1;
        }

        this.Keys[event.code] = true;
    }
    if (event.type === "keyup") {
        if (event.code === "KeyW" || event.code === "ArrowUp") {
            this.Axes[1] = 0;
        }
        else if (event.code === "KeyA" || event.code === "ArrowLeft") {
            this.Axes[0] = 0;
        }
        else if (event.code === "KeyS" || event.code === "ArrowDown") {
            this.Axes[1] = 0;
        }
        else if (event.code === "KeyD" || event.code === "ArrowRight") {
            this.Axes[0] = 0;
        }

        this.Keys[event.code] = false;
    }
};
GameManager.prototype.AddNewGameObject = function (newObject) {
    gm.gameObjects.push(newObject);
};
GameManager.prototype.RemoveGameObject = function (deadObject) {
    let index = gm.gameObjects.indexOf(deadObject);
    if (index > -1) {
        gm.gameObjects.splice(index, 1);
    }
};

function initializeData() {
    gm.AddNewGameObject(new GameObject(canvas.width / 2, canvas.height / 2, gameGraphicData["Background"]));
    gm.AddNewGameObject(new Player(canvas.width / 2, canvas.height / 2, gameGraphicData["Player"]));
    gm.AddNewGameObject(new AsteroidHandler(0, 0));
}


/**
 * @return {number}
 */
function Distance(x1, y1, x2, y2) {
    let xDistance = x1 - x2;
    let yDistance = y1 - y2;
    return Math.sqrt(Math.pow(xDistance, 2) + Math.pow(yDistance, 2));
}

let gameGraphicData = {
    "Player": [null, 64, 64, "img/player.png", true],
    "Asteroid": [null, 32, 32, "img/asteroid.png", true],
    "Missile": [null, 32, 32, "img/missile.png", true],
    "Background": [null, canvas.width, canvas.height, "img/background.png", false]
};
let toRadians = Math.PI / 180;

let gm = new GameManager(gameGraphicData);
initializeData();
