
import * as PIXI from 'pixi.js';
import { Pixel } from './pixel';

export class Box
{
    size: { width: number, height: number };
    convexHull: PIXI.Point[] = [];
    private imageSource: {imageCanvas: any, imageContext: any} = {imageCanvas: null, imageContext: null};

    public pixels: Pixel[][];

    public initializePixels(canvas: any, context: any){
        const w = canvas.width, h = canvas.height;
        let colourMap = context.getImageData(0, 0, w, h);

        this.pixels = [];
        var index = 0;
        for (let xp = 0; xp < this.size.width; xp++)
        {
            this.pixels[xp] = [];
            for (let yp = 0; yp < this.size.height; yp++)
            {
                this.pixels[xp].push(new Pixel(colourMap.data[index * 4 + 3], yp, xp));
                index++;
            }
        }
    }

    public initializeHull() {
        const points = [];
        for(var i = 0; i < this.pixels.length; i++) {
            for (var j = 0; j < this.pixels[i].length; j++) {
                if (this.pixels[i][j].alpha !== 0) {
                    points.push([
                        this.pixels[i][j].x,
                        this.pixels[i][j].y
                    ]);
                }
            }
        }

        // 0.2, 5
        var theHull = require('concaveman')(points, 0.15, 10);
        var index = 0;

        var toSkip = ((theHull.length * 0.035) | 0);
        if(toSkip == 0){
            toSkip = 4;
        }

        theHull.forEach(element => {
            if (index % toSkip == 0) {
                this.convexHull.push(new PIXI.Point(element[0], element[1]));
            }
            index++;
        });
    }

    constructor(imageSource: any)
    { 
        console.log(imageSource);
    
        if (imageSource.getContext)
        {
            this.imageSource.imageCanvas = imageSource;
            this.imageSource.imageContext = this.imageSource.imageCanvas.getContext('2d');
        }
        else if (imageSource instanceof Image)
        {
            this.imageSource.imageCanvas = document.createElement('canvas');
            this.imageSource.imageCanvas.width = imageSource.width;
            this.imageSource.imageCanvas.height = imageSource.height;
            this.imageSource.imageContext = this.imageSource.imageCanvas.getContext('2d');
            this.imageSource.imageContext.drawImage(imageSource, 0, 0);
        }

        this.size = {width: this.imageSource.imageCanvas.width, height: this.imageSource.imageCanvas.height};

        // Get SpriteMap
        this.initializePixels(this.imageSource.imageCanvas, this.imageSource.imageContext);

        // Creating the Convex Hull
        this.initializeHull();
    }
}