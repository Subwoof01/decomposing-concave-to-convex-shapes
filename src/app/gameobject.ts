import * as PIXI from 'pixi.js';
import { Box } from './square';
import { HullLibrary } from './HullLibrary';

export class GameObject {
    private static InsidePoly: any;
    private static app: PIXI.Application;
    private sprite: PIXI.Sprite;
    private body: Box;

    public position: { x: number, y: number };
    public velocity: { x: number, y: number };
    public angle: number = 0;
    public name: string;
    public tag: string;
    public _uniqueID: number;
    public overlappingIds: number[];

    // Debug purposes (to remove when releasing)
    private boundingBoxGraphics: PIXI.Graphics;
    private convexHullGraphics: PIXI.Graphics;
    private colors: number[] = [ 0xFF0808,
                                 0x0831FF,
                                 0x35FF08,
                                 0xFF08DA,
                                 0xFFE800,
                                 0xFF6400,
                                 0x00FFEC,
                                 0x9E00FF,
                                 0x93FF00,
                                 0x00FF99 ];
    public myColor: number;

    public update(drawDebug?: boolean)
    {
        this.move(this.velocity);

        if (drawDebug) {
            this.drawDebug();
        }
    }

    public move(direction: { x: number, y: number }) 
    {
        this.position.x += direction.x;
        this.position.y += direction.y;

        this.sprite.position.x = this.position.x;
        this.sprite.position.y = this.position.y;
    }

    public overlaps(gameObject: GameObject)
    {
        const cos = Math.cos((gameObject.angle % 360) / 180 * Math.PI);
        const sin = Math.sin((gameObject.angle % 360) / 180 * Math.PI);

        for (var q = 0; q < gameObject.body.convexHull.length; q++) {
            var inWorld = new PIXI.Point((gameObject.body.convexHull[q].x * cos - gameObject.body.convexHull[q].y * sin) + gameObject.position.x,
                                        (gameObject.body.convexHull[q].y * cos + gameObject.body.convexHull[q].x * sin) + gameObject.position.y);
            
            if (this.pointInHull([inWorld.x, inWorld.y])) {
                return true;
            }
        }
        return false;
    }

    public drawDebug() {
        this.drawBoundingBox();
        this.drawHull();
    }

    public setSpriteTint(hexColor: number)
    {
        if (this.sprite.tint != hexColor) {
            this.sprite.tint = hexColor;
        }
    }

    public getSize() 
    {
        return {width: this.sprite.width, height: this.sprite.height};
    }

    public addAngle(angle: number)
    {
        this.angle += angle;
        this.sprite.angle += angle;
    }

    public setAngle(angle: number) 
    {
        this.angle = angle;
        this.sprite.angle = angle % 360;
    }

    constructor(app: PIXI.Application, spriteName: string, position: {x: number, y: number}, velocity?: {x: number, y: number}, rotation?: number, name?: string, tag?: string)
    {
        if (GameObject.app == null) {            
            GameObject.app = app;
        }
        if (GameObject.InsidePoly == null) {
            GameObject.InsidePoly = require('point-in-polygon');
        }

        var spriteAndHull = HullLibrary.GetSpriteAndHullByName(spriteName);
        var sprite = spriteAndHull.sprite;
        this.body = spriteAndHull.body;

        this.position = {x: position.x, y: position.y};
        if (velocity != null) {
            this.velocity = velocity;
        } else {
            this.velocity = {x: 0, y: 0};
        }
        if (rotation != null) {
            this.angle = rotation;
            sprite.angle = rotation % 360;
        } else {
            this.angle = 0;
            sprite.angle = 0;
        }
        this.name = name;
        this.tag = tag;

        sprite.position.x = this.position.x;
        sprite.position.y = this.position.y;

        this.sprite = sprite;

        if (this.tag != "World") {
            this.myColor = 0x1a0d00; // this.colors[Math.floor(Math.random() * 10)]
            this.setSpriteTint(this.myColor);
        }
        
        GameObject.app.stage.addChild(this.sprite);

        this._uniqueID = this.generateUniqueID();
    }

    private getHullInWorld(hull?: PIXI.Point[], position?:  { x: number, y: number }, rotation?: number) {
        var theHull;
        if (hull != null) {
            theHull = hull;
        } else {
            theHull = this.body.convexHull;
        }

        var thePosition;
        if (position != null) {
            thePosition = position;
        } else {
            thePosition = this.position;
        }

        var theRotation;
        if (rotation != null) {
            theRotation = rotation % 360;
        } else {
            theRotation = this.angle % 360;
        }

        const cos = Math.cos(theRotation / 180 * Math.PI);
        const sin = Math.sin(theRotation / 180 * Math.PI);

        var worldConcaveHull = [];
        var q = [];
        for (var o = 0; o < theHull.length; o++) {
            worldConcaveHull.push([(theHull[o].x * cos - theHull[o].y * sin) + thePosition.x, (theHull[o].y * cos + theHull[o].x * sin) + thePosition.y]);
        }
        return worldConcaveHull;
    }

    private pointInHull(point: [number, number])
    {
        if(GameObject.InsidePoly(point, this.getHullInWorld())){
            return true;
        }
    }

    private drawBoundingBox()
    {
        GameObject.app.stage.removeChild(this.boundingBoxGraphics);
        this.boundingBoxGraphics = new PIXI.Graphics();
        this.boundingBoxGraphics.lineStyle(1, 0x09FF00);
        this.boundingBoxGraphics.drawRect(this.position.x, this.position.y, this.body.size.width, this.body.size.height);
        GameObject.app.stage.addChild(this.boundingBoxGraphics);
    }

    private drawHull()
    {
        GameObject.app.stage.removeChild(this.convexHullGraphics);

        var newHull = [];
        this.getHullInWorld().forEach(p => {
            newHull.push(new PIXI.Point(p[0], p[1]));
        });
        this.convexHullGraphics = new PIXI.Graphics;
        this.convexHullGraphics.lineStyle(1, 0xF5FF1A);
        var poly = new PIXI.Polygon(newHull);
        this.convexHullGraphics.drawPolygon(poly);
        GameObject.app.stage.addChild(this.convexHullGraphics);
    }

    private generateUniqueID()
    {
        let num = (this.body.pixels.length + this.position.x + this.position.y + this.sprite.width + this.sprite.height + this.sprite.angle) * (Math.random() * Math.PI * 12345);
        num = num << Math.random();
        return num |= num;
    }
}