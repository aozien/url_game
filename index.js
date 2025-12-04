const baseURL = "http://127.0.0.1:5500/#/";
const screenLength = 80;


function Screen() {
    this.width = 80;
    this.background = null;
    this.entities = [];
    this.pixels = new Array(this.width).fill("_");
    this.endGame = false;
    this.getPixels = function () {
        // Create an array filled with background characters
        for (let i = 0; i < this.width; i++) {
            this.background ? this.pixels[i] = this.background[i % this.background.length]
                            : this.pixels[i] = "_";
        }
        
        for (let entity of this.entities) {
            if (entity.x < 0 || entity.x >= this.width) continue;
            this.pixels[entity.x] = entity.char;
            entity.updateFrame();
        }

        let stats = `|Coins:${coins}|`;
        let score = enemiesKilled * 2 + coins * 5;
        return stats + (this.endGame ? `SCORE:${score}|______________GAME_OVER!_______________` : this.pixels.join(""));
    }

    this.renderLine  = function ()  {
        location.replace(baseURL + this.getPixels());
    }
}

function Entity(x, y, chars, velocityX = 0, tag = null) {
    this.x = x;
    this.actX = x;
    this.y = y;
    this.char = chars[0];
    this.chars = chars ?? ['X'];
    this.currentFrame = 0;
    this.velocityX = velocityX;
    this.tag = tag;
    this.isDead = false;

    this.updateFrame = function () {
        this.currentFrame = (this.currentFrame + 1) % this.chars.length;
        this.char = this.chars[this.currentFrame];
    }
}


function renderLine(line) {
    location.replace(baseURL + line);
}

let playerIdleFrames = ["║", "╠"];

let background = "............................................";

let screen = new Screen();
screen.background = background;

let player = new Entity(0, 0, playerIdleFrames, 0, "player");

let coins = 0;
let enemiesKilled = 0;

let enemyClasses = [
    {
        chars: ["¤", "ø"],
        velocityX: -0.5
    },
    // {
    //     chars: ["B","ß"],
    //     velocityX: -0.75
    // },
    {
        chars: ["ϖ", "ώ"],
        velocityX: -2
    },
    // {
    //     chars: ["ò","ó"],
    //     velocityX: -1.25
    // },
    // {
    //     chars: ["<","["],
    //     velocityX: -2
    // }
]

screen.entities.push(player);

//-- Spawner Logic is a bit random might need tuning
//-- Spawn Enemies
let lastX = 100;
for (let i = 0; i < 5000; i++) {
    let enemyIndex = Math.floor(Math.random() * enemyClasses.length);
    let enemyClass = enemyClasses[enemyIndex];
    lastX = lastX + (i * 4 + enemyIndex * 20);
    screen.entities.push(new Entity(lastX, 0, [...enemyClass.chars], enemyClass.velocityX, "enemy"));
}
//-- Spawn Coins
lastX = 100;
for (let i = 0; i < 40; i++) {
    let enemyIndex = Math.floor(Math.random() * 5);
    lastX = lastX + (i + enemyIndex) * 10;
    screen.entities.push(new Entity(lastX, 0, ["©"], -1, "coin"));
}




function update() {
    for (let entity of screen.entities) {
        entity.actX = (entity.actX + entity.velocityX);
        entity.x = Math.floor(entity.actX);
    }
    //-- Move and Check For Collisions
    for (let i = 0; i < screen.entities.length; i++) {
        const currEntity = screen.entities[i];
        let entityOutOfBounds = (currEntity.actX >= screen.width && currEntity.velocityX > 0)
                                || (currEntity.actX < 0 && currEntity.velocityX < 0);
        
        if (entityOutOfBounds) {
            currEntity.isDead = true;
            continue;
        }

        //-- Check For Collisions
        for (let j = i + 1; j < screen.entities.length; j++) {
            const otherElement = screen.entities[j];
            var oneIsEnemy = currEntity.tag === "enemy" || otherElement.tag === "enemy";
            var oneIsPlayer = currEntity.tag === "player" || otherElement.tag === "player";
            var oneIsBullet = currEntity.tag === "bullet" || otherElement.tag === "bullet";
            var oneIsCoin = currEntity.tag === "coin" || otherElement.tag === "coin";

            if (didEntitiesCollide(currEntity, otherElement)) {
                if (oneIsEnemy && oneIsPlayer) {
                    clearInterval(gameLoop);
                    screen.endGame = true;
                }
                else if (oneIsEnemy && oneIsBullet) {
                    currEntity.isDead = true;
                    otherElement.isDead = true;
                    enemiesKilled += 1;
                }
                else if (oneIsCoin && oneIsPlayer) {
                    coins += 1;
                    let coinEntity = currEntity.tag === "coin" ? currEntity : otherElement;
                    coinEntity.isDead = true;
                }
                else if (oneIsCoin && oneIsBullet) {
                    currEntity.isDead = true;
                    otherElement.isDead = true;
                }

                // Handle collision
                // console.log(`Collision detected between entities at position ${currEntity.x}`);
            }
        }
    }

    // Remove dead entities
    screen.entities = screen.entities.filter(entity => !entity.isDead);

    screen.renderLine();
}

function didEntitiesCollide(entityA, entityB) {
    let samePos = entityA.x === entityB.x;
    let beforeEachOther = entityA.actX < entityB.actX;
    let afterEachOther = (entityA.actX - entityA.velocityX) > (entityB.actX - entityB.velocityX);

    let passedEachOther = beforeEachOther && afterEachOther;
    return samePos || passedEachOther;
}



document.addEventListener('keydown', function (event) {
    if (event.key === "ArrowRight") {
        player.x = (player.x + 1) % screen.width;
    } else if (event.key === "ArrowLeft") {
        player.x = (player.x - 1 + screen.width) % screen.width;
    } else if (event.key === " ") {
        let bullet = new Entity(player.x, 0, ["°"], 1.5, "bullet");
        screen.entities.push(bullet);
    }

    screen.renderLine();
});

var gameLoop = setInterval(update, 60);
