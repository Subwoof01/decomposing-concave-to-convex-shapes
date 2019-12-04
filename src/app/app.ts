import { GameObject } from './gameobject';

import {playerSprite, worldSprite1, worldSprite2, worldSprite3, worldSprite4, burgerSprite, burgermanhatSprite, burgermanhatgieterSprite, carboySprite, snekSprite, fullcarSprite, frogboySprite, gietermanSprite} from '../assets/loader';

import * as PIXI from 'pixi.js';
import { HullLibrary, HullObject } from './HullLibrary';

// Saving a reference to the PIXI asset loader for ease of use.
const loader = PIXI.Loader.shared;

export class GameApp 
{
    nRows = 16;
    nClms = 33;
    rSpeed = 4;
    mSpeed = 10;

    totalFps = 0;
    totalSeconds = 0;

    private app: PIXI.Application;
    private objects: GameObject[];

    constructor(parent: HTMLElement, width: number, height: number)
    {
        this.objects = [];

        this.app = new PIXI.Application(
        {
            width, height, backgroundColor: 0x000000
        });

        // Create Sprite library so that files dont have to be loaded double
        // HullLibrary.Add("playerSprite", playerSprite);
        // HullLibrary.Add("worldSprite1", worldSprite1);
        // HullLibrary.Add("worldSprite2", worldSprite2);
         HullLibrary.Add("worldSprite3", worldSprite3);
        // HullLibrary.Add("worldSprite4", worldSprite4);
        // HullLibrary.Add("burgerSprite", burgerSprite);
        // HullLibrary.Add("burgermanhatSprite", burgermanhatSprite);
        // HullLibrary.Add("burgermanhatgieterSprite", burgermanhatgieterSprite);
        // HullLibrary.Add("carboySprite", carboySprite);
        // HullLibrary.Add("fullcarSprite", fullcarSprite);
        // HullLibrary.Add("frogboySprite", frogboySprite);
        // HullLibrary.Add("gietermanSprite", gietermanSprite);
         // HullLibrary.Add("snekSprite", snekSprite);

        HullLibrary.Sprites.forEach(element => {
            loader.add(element.name, element.sprite);
        });

        loader
            .load(this.onAssetsLoaded.bind(this));
        
        parent.replaceChild(this.app.view, parent.lastElementChild);

        this.app.ticker.add(this.update.bind(this));
    }

    private onAssetsLoaded()
    {
        this.app.stage.sortableChildren = true;

        HullLibrary.GenerateHulls();


        console.log(HullLibrary.NewHulls);
        


        //#region THIS IS JUST DRAWING

        console.log(HullLibrary.NewHulls);
        

        for (var q = 0; q < HullLibrary.NewHulls.length; q++)
        {
            // var theHull = HullLibrary.NewHulls[q].hulls;

            // for (var w = 0; w < HullLibrary.NewHulls[q].hulls.length; w++) 
            // {
            //     var graphics = new PIXI.Graphics();
            //     graphics.lineStyle(1, 0xF5FF1A);
                
            //     graphics.moveTo(HullLibrary.NewHulls[q].hulls[w].hull[0].x, HullLibrary.NewHulls[q].hulls[w].hull[0].y);
                
            //     for (var e = 1; e < HullLibrary.NewHulls[q].hulls[w].hull.length + 1; e++) {
            //         if (HullLibrary.NewHulls[q].hulls[w].hull[e] === undefined) {
            //             graphics.lineTo(HullLibrary.NewHulls[q].hulls[w].hull[0].x, HullLibrary.NewHulls[q].hulls[w].hull[0].y);
            //             continue;
            //         }
            //         graphics.lineTo(HullLibrary.NewHulls[q].hulls[w].hull[e].x, HullLibrary.NewHulls[q].hulls[w].hull[e].y);
            //     }

            //     this.app.stage.addChild(graphics);
            // }

            
            // origin
            /*var graphics2 = new PIXI.Graphics();
            graphics2.lineStyle(3, 0xFF0000);

            graphics2.drawCircle(HullLibrary.NewHulls[q].origin.x, HullLibrary.NewHulls[q].origin.y, 1);

            this.app.stage.addChild(graphics2);*/
        }


        
        // this.objects.push(new GameObject(this.app, "snekSprite", {x:150, y:150}, {x:-3, y:-3}, 0, "Edward", "Player"));
        
        // this.objects.push(new GameObject(this.app, "snekSprite", {x:444, y:444}, {x: -Math.random() * 10, y: -Math.random() * 10}, 0, "Snake1", "Object"));

        // this.objects.push(new GameObject(this.app, "burgermanhatSprite", {x:550, y:150}, {x: -Math.random()* 10, y: -Math.random()* 10}, 0, "BurgerManHat", "Object"));
        
        // this.objects.push(new GameObject(this.app, "burgermanhatgieterSprite", {x:800, y:150}, {x: Math.random()* 10, y: Math.random() * 10}));
        
        // this.objects.push(new GameObject(this.app, "carboySprite", {x:150, y:300}, {x: -Math.random()* 10 , y: Math.random()* 10 }));
        
        // this.objects.push(new GameObject(this.app, "fullcarSprite", {x:150, y:550}, {x: Math.random()* 10 , y: -Math.random()* 10 }));
        
        // this.objects.push(new GameObject(this.app, "frogboySprite", {x:300, y:300}, {x: -Math.random()* 10 , y: Math.random()* 10 }));

        // this.objects.push(new GameObject(this.app, "gietermanSprite", {x:300, y:550}, {x: Math.random() * 10, y: -Math.random()* 10 }));

        // this.objects.push(new GameObject(this.app, "worldSprite2", {x:800, y:400}, {x: Math.random() * 10, y: -Math.random()* 10 }));

        this.objects.push(new GameObject(this.app,  "worldSprite3", {x:0, y:0}, {x: 0 , y: 0 }));
        
        for (var rows = 1; rows < this.nRows + 1; rows++) {
            if (rows % 2 == 0) {
                // this.objects.push(new GameObject(this.app, "playerSprite", {x:55 * rows , y: 55 * rows}, {x: this.mSpeed, y: 0}, 0, "Player"));
            }

            if (rows % 2 == 1){
                // this.objects.push(new GameObject(this.app, "playerSprite", {x:55 * rows , y: 55 * rows}, {x: 0, y: this.mSpeed}, 0, "Player"));
            }

            for (var things = 1; things < this.nClms + 1; things++) {
                // this.objects.push(new GameObject(this.app, "worldSprite4", {x: 55 * hulls, y: 55 * rows}, {x: 0, y: 0}, 0, "Circle", "World"));
            }
        }
        //#endregion
    
        HullLibrary.InitShapeConversion(this.app);
    }

    private checkCollision = () =>
    {
        for (let q = 0; q < this.objects.length; q++) {
            for (let w = 0; w < this.objects.length; w++) {
                var objectA = this.objects[q];
                var objectB = this.objects[w];
                if (objectA._uniqueID === objectB._uniqueID) {
                    continue;
                }

                if (objectA.tag == "World" && objectB.tag == "World") {
                    continue;
                }
                    
                if (Math.abs(objectA.position.x - objectB.position.x) > 
                    objectA.getSize().width + objectB.getSize().width) 
                {
                    continue;
                }

                if (Math.abs(objectA.position.y - objectB.position.y) > 
                    objectA.getSize().height + objectB.getSize().height) 
                {
                    continue;
                }

                if (objectB.overlaps(this.objects[q])) {
                    if (objectB.tag == "World") {
                        this.objects[w].setSpriteTint(objectA.myColor)
                    }

                    if (objectA.tag == "World") {
                        this.objects[q].setSpriteTint(objectB.myColor)
                    }
                }
            }
        }
    }

    private update() 
    {
        this.objects.forEach(object => {
            if (object.position.x > 1500 - object.getSize().width) {
                object.velocity.x = object.velocity.x * -1;
            }
    
            if (object.position.x < 0) {
                object.velocity.x = object.velocity.x * -1;
            }

            if (object.position.y > 800 - object.getSize().height) {
                object.velocity.y = object.velocity.y * -1;
            }
    
            if (object.position.y < 0) {
                object.velocity.y = object.velocity.y * -1;
            }
        });

        this.objects.forEach(object => {
            object.update(true);
        });

        // Check for collisions
        this.checkCollision();

        this.totalFps += this.app.ticker.FPS;
        this.totalSeconds += 1;

        //console.log(this.app.ticker.FPS);
        //console.log("New AVERAGE FPS = " + this.totalFps / this.totalSeconds + " with " + this.objects.length + " amount of objects");
    }
}
