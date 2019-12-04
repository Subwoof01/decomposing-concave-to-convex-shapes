
import * as PIXI from 'pixi.js';
export class Pixel
{
    alpha: number;
    x: number;
    y: number;

    public getWorldPosition (parentPos: { x: number, y: number })
    {
        let dx = parentPos.x + this.x;
        let dy = parentPos.y + this.y;

        return { x: dx, y: dy };
    }

    constructor(a, x, y)
    {
        this.alpha = a;
        this.x = x;
        this.y = y;
    }
}