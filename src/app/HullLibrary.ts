import * as PIXI from 'pixi.js';
import { Box } from './square';
import { nextTick } from 'q';


export class HullObject {
    hull: PIXI.Point[] = [];
    attachedTo: string;
    constructor(points?: PIXI.Point[])
    {
        if (points !== undefined) {
            this.hull = points;
        } else {
            this.hull = [];
        }
    }
} 

export class HullLibrary {
    public static Sprites: {name: string, sprite: any}[] = [];
    public static SpriteAndHull: {name: string, body: Box}[] = [];
    public static NewHulls:{name: string, hulls: HullObject[]}[] = [];

    public static colors: number[] = [ 
        0xFF0808,
        0x0831FF,
        0x35FF08,
        0xFF08DA,
        0xFFE800,
        0xFF6400,
        0x00FFEC,
        0x9E00FF,
        0x93FF00,
        0x00FF99 ];

    private static InsidePoly: any = require('point-in-polygon');

    public static Add(string: string, sprite: any) 
    {
        HullLibrary.Sprites.push({name: string, sprite: sprite});
    }

    public static GenerateHulls()
    {
        HullLibrary.Sprites.forEach(sprite => {
            var theTexture = PIXI.Texture.from(sprite.name);
            var theSprite = new PIXI.Sprite(theTexture);
            HullLibrary.SpriteAndHull.push({name: sprite.name, body: new Box(theSprite.texture.baseTexture.resource.source)});
        });
    }

    // Makes sure all hulls are fed to the splitter
    public static InitShapeConversion(app: PIXI.Application)
    {
        HullLibrary.SpriteAndHull.forEach(element => {
            HullLibrary.ConvertToShapes(element.name, new HullObject(element.body.convexHull), app);
        });
    }

    public static GetOrigin(hullContainer: HullObject, app?: PIXI.Application): PIXI.Point
    {
        let origin = new PIXI.Point();
        let originGraphic = new PIXI.Graphics();
        
        for (let i = 0; i < hullContainer.hull.length; i++)
        {
            origin.x += hullContainer.hull[i].x;
            origin.y += hullContainer.hull[i].y;
        }

        origin.x = Math.round(origin.x / hullContainer.hull.length);
        origin.y = Math.round(origin.y / hullContainer.hull.length);

        console.log(origin.x, origin.y);

        originGraphic.beginFill(0xFFFFFF, 2);
        originGraphic.drawCircle(origin.x, origin.y, 2);
        originGraphic.zIndex = 100;
        originGraphic.endFill();
        app.stage.addChild(originGraphic);

        return origin;
    }

    public static TriangleContainsPoint(triangle: PIXI.Point[], point: PIXI.Point, app?: PIXI.Application)
    {

        //#region Debug Drawing
        // let lines = new PIXI.Graphics();
        // lines.beginFill(0x0000FF, 0);
        // lines.lineStyle(1, 0x9999FF, 1);
        // lines.moveTo(triangle[0].x, triangle[0].y);
        // lines.lineTo(triangle[1].x, triangle[1].y);
        // lines.lineTo(triangle[2].x, triangle[2].y);
        // lines.lineTo(triangle[0].x, triangle[0].y);
        // lines.zIndex = 0;
        // lines.endFill();
        // app.stage.addChild(lines);

        let pointA = new PIXI.Graphics();
        pointA.beginFill(0x00FF00, 2);
        pointA.drawCircle(triangle[0].x, triangle[0].y, 2);
        pointA.zIndex = 100;
        pointA.endFill();
        app.stage.addChild(pointA);

        let pointB = new PIXI.Graphics();
        pointB.beginFill(0x00FF00, 2);
        pointB.drawCircle(triangle[1].x, triangle[1].y, 2);
        pointB.zIndex = 100;
        pointB.endFill();
        app.stage.addChild(pointB);

        let pointC = new PIXI.Graphics();
        pointC.beginFill(0x00FF00, 2);
        pointC.drawCircle(triangle[2].x, triangle[2].y, 2);
        pointC.zIndex = 100;
        pointC.endFill();
        app.stage.addChild(pointC);

        let pointP = new PIXI.Graphics();
        pointP.beginFill(0xFF9999, 2);
        pointP.drawCircle(point.x, point.y, 2);
        pointP.zIndex = 100;
        pointP.endFill();
        app.stage.addChild(pointP);
        //#endregion

        let PBC = [];
        PBC[0] = point;
        PBC[1] = triangle[1];
        PBC[2] = triangle[2];

        let PAC = [];
        PAC[0] = triangle[0];
        PAC[1] = point;
        PAC[2] = triangle[2];

        let PAB = [];
        PAB[0] = triangle[0];
        PAB[1] = triangle[1];
        PAB[2] = point;

        let a = HullLibrary.triangleArea(triangle);
        let a1 = HullLibrary.triangleArea(PBC);
        let a2 = HullLibrary.triangleArea(PAC);
        let a3 = HullLibrary.triangleArea(PAB);

        return (a === a1 + a2 + a3);
    }

    private static triangleArea(points: PIXI.Point[])
    {
        let x1 = points[0].x;
        let y1 = points[0].y;
        let x2 = points[1].x;
        let y2 = points[1].y;
        let x3 = points[2].x;
        let y3 = points[2].y;

        return Math.abs((x1 * (y2 - y3) + 
                        x2 * (y3 - y1) +  
                        x3 * (y1 - y2)) / 2.0);
    }

    private static findPolygonCentroid(polygon: PIXI.Point[]): PIXI.Point
    {
        console.log(polygon);
        
        let first = polygon[0];
        let last = polygon[polygon.length - 1];

        let twiceArea = 0;
        let x = 0;
        let y = 0;
        let nPoints = polygon.length;
        let p1: PIXI.Point, p2: PIXI.Point;
        let f;
        
        for (let i = 0, j = nPoints - 1; i < nPoints; j = i++)
        {
            p1 = polygon[i];
            p2 = polygon[j];
            f = (p1.y - first.y) * (p2.x - first.x) - (p2.y - first.y) * (p1.x - first.x);
            twiceArea += f;
            x += (p1.x + p2.x - 2 * first.x) * f;
            y += (p1.y + p2.y - 2 * first.y) * f;
            console.log(p1, p2);
            
        }
        f = twiceArea * 3;
        
        return new PIXI.Point(x / f + first.x, y / f + first.y);

    }

    public static ConvertToShapes(name: string, hullContainer: HullObject, app?: PIXI.Application, depth?: number)
    {
        let prev, next;

        let newShape = [];

        for (let i = 0; i < hullContainer.hull.length; i++)
        {
            if (i + 1 >= hullContainer.hull.length)
                next = hullContainer.hull[0];
            else
                next = hullContainer.hull[i + 1];

            if (i - 1 < 0)
                prev = hullContainer.hull[hullContainer.hull.length - 1];
            else
                prev = hullContainer.hull[i - 1];

            
            let isConcave = HullLibrary.isConcaveAngle(prev, hullContainer.hull[i], next, app);
            
            if (isConcave)
            {
                for (let j = 0; j < hullContainer.hull.length; j++)
                {
                    let nextB: PIXI.Point;

                    if (j + 1 >= hullContainer.hull.length)
                        nextB = hullContainer.hull[0];
                    else
                        nextB = hullContainer.hull[j + 1];
    
                    let checkPoint = new PIXI.Point(hullContainer.hull[i].x, hullContainer.hull[i].y);

                    let intersectPoint = HullLibrary.LinesIntersect(prev, checkPoint, hullContainer.hull[j], nextB, app);

                    let margin = 1;
                    if (intersectPoint.x > 0 && intersectPoint.y > 0 &&
                        ((intersectPoint.x > hullContainer.hull[i].x + margin ||
                        intersectPoint.x < hullContainer.hull[i].x - margin) ||
                        (intersectPoint.y > hullContainer.hull[i].y + margin ||
                        intersectPoint.y < hullContainer.hull[i].y - margin)))
                    {
                        let distanceAC = new PIXI.Point(Math.abs(intersectPoint.x - hullContainer.hull[j].x), Math.abs(intersectPoint.y - hullContainer.hull[j].y));
                        let distanceBC = new PIXI.Point(Math.abs(intersectPoint.x - nextB.x), Math.abs(intersectPoint.y - nextB.y));
                        let distanceAB = new PIXI.Point(Math.abs(nextB.x - hullContainer.hull[j].x), Math.abs(nextB.y - hullContainer.hull[j].y));

                        if (distanceAC.x + distanceBC.x === distanceAB.x &&
                            distanceAC.y + distanceBC.y === distanceAB.y)
                        {
                            console.log('current', hullContainer.hull[i]);
                            
                            //#region Debug drawing
                            let lineP = new PIXI.Graphics();
                            lineP.beginFill(0xFF5555, 1);
                            lineP.lineStyle(1);
                            lineP.moveTo(hullContainer.hull[i].x, hullContainer.hull[i].y);
                            lineP.lineTo(intersectPoint.x, intersectPoint.y);
                            lineP.zIndex = 1000;
                            lineP.endFill();
                            app.stage.addChild(lineP);

                            let pointP = new PIXI.Graphics();
                            pointP.beginFill(0x55FF55, 1);
                            pointP.drawCircle(intersectPoint.x, intersectPoint.y, 1);
                            pointP.zIndex = 1000;
                            pointP.endFill();
                            app.stage.addChild(pointP);
                            //#endregion
                
                            intersectPoint.x = Math.round(intersectPoint.x);
                            intersectPoint.y = Math.round(intersectPoint.y);
                            console.log('intersect', intersectPoint);
                            let toRemove = Math.abs(j - i);
                            console.log(toRemove);
                            let leftover = 0;
                            if (toRemove > hullContainer.hull.length)
                            {
                                leftover = toRemove - hullContainer.hull.length - 1;
                                toRemove = hullContainer.hull.length - 1;
                            }
                            
                            newShape = hullContainer.hull.splice(i, toRemove);
                            newShape.push(intersectPoint);
                            let toAddLeftovers = hullContainer.hull.splice(0,leftover);
                            toAddLeftovers.forEach(p => {
                                newShape.push(p);
                            });

                            hullContainer.hull.splice(1,0,intersectPoint);

                            console.log(newShape);
                            console.log(hullContainer.hull);

                            let newShapeGraphics = new PIXI.Graphics;
                            newShapeGraphics.lineStyle(1, 0xFFFFFF);
                            var poly = new PIXI.Polygon(newShape);
                            newShapeGraphics.drawPolygon(poly);
                            app.stage.addChild(newShapeGraphics);

                            // HullLibrary.ConvertToShapes(name, new HullObject(hullContainer.hull), app);
                            // HullLibrary.ConvertToShapes(name, new HullObject(newShape), app);
                            return;
                        }
                    }

                }
                
            }
        }
    }

    private static findLineIntersection(a: PIXI.Point, b: PIXI.Point, c: PIXI.Point, d: PIXI.Point, app?: PIXI.Application)
    {
        // Line AB respresented as a1x + b1y = c1
        let a1 = b.y - a.y;
        let b1 = a.x - b.x;
        let c1 = a1 * (a.x) + b1 * (a.y);

        // Line CD represented as a2x + b2y = c2;
        let a2 = d.y - c.y;
        let b2 = c.x - d.x;
        let c2 = a2 * (c.x) + b2 * (c.y);

        let determinant = a1 * b2 - a2 * b1;

        if (determinant === 0)
        {
            // Lines are parallell.
            return new PIXI.Point(-1, -1);
        }
        else 
        {
            let x = (b2 * c1 - b1 * c2) / determinant;
            let y = (a1 * c2 - a2 * c1) / determinant;
            return new PIXI.Point(x, y);
        }
    }

    private static findLineOrientation(p: PIXI.Point, q: PIXI.Point, r: PIXI.Point): number
    {
        let val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);

        if (val === 0) return 0; // colinear

        return (val > 0) ? 1 : 2; // clock or counterclock wise
    }

    private static isConcaveAngle(prev: PIXI.Point, next: PIXI.Point, current: PIXI.Point, app?: PIXI.Application)
    {

        // let lines = new PIXI.Graphics();
        // lines.beginFill(0x0000FF, 0);
        // lines.lineStyle(1, 0x9999FF, 1);
        // lines.moveTo(prev.x, prev.y);
        // lines.lineTo(current.x, current.y);
        // lines.lineTo(next.x, next.y);
        // lines.lineTo(prev.x, prev.y);
        // lines.zIndex = 0;
        // lines.endFill();
        // app.stage.addChild(lines);

        let pointA = new PIXI.Graphics();
        pointA.beginFill(0x00FF00, 2);
        pointA.drawCircle(prev.x, prev.y, 2);
        pointA.zIndex = 90;
        pointA.endFill();
        app.stage.addChild(pointA);

        let pointC = new PIXI.Graphics();
        pointC.beginFill(0x00FF00, 2);
        pointC.drawCircle(next.x, next.y, 2);
        pointC.zIndex = 90;
        pointC.endFill();
        app.stage.addChild(pointC);

        let previousEdge = new PIXI.Point(current.x - prev.x, current.y - prev.y);
        let nextEdge = new PIXI.Point(next.x - current.x, next.y - current.y);

        var angle = ((Math.atan2(nextEdge.x, nextEdge.y) - Math.atan2(previousEdge.x, previousEdge.y) + Math.PI * 2) % (Math.PI * 2)) - Math.PI;

        if (angle > 0)
        {
            let pointB = new PIXI.Graphics();
            pointB.beginFill(0x0000FF, 2);
            pointB.drawCircle(current.x, current.y, 2);
            pointB.zIndex = 100;
            pointB.endFill();
            app.stage.addChild(pointB);
            return false
        }
        else if (angle < 0)
        {
            let pointB = new PIXI.Graphics();
            pointB.beginFill(0xFF0000, 2);
            pointB.drawCircle(current.x, current.y, 2);
            pointB.zIndex = 100;
            pointB.endFill();
            app.stage.addChild(pointB);

            return true;
        }
        else
            return false;
    }

    public static getOrCreateTotalHull(name: string) {
        for (var q = 0; q < HullLibrary.NewHulls.length; q++) {
            HullLibrary.NewHulls[q].name == name;
            return HullLibrary.NewHulls[q];
        }
        
        var newHull = {name: name, hulls: new HullObject()[0] = []}
        HullLibrary.NewHulls.push(newHull);
    }

    private static addToTotalHull(name: string, hull: HullObject) 
    {
        for (var q = 0; q < HullLibrary.NewHulls.length; q++) 
        {
            if (HullLibrary.NewHulls[q].name == name) {
                HullLibrary.NewHulls[q].hulls.push(hull);
            }
        }
    }

    public static pointInHull(point: PIXI.Point, hull: any) : boolean
    {
        var newHull = [];
        for (var q = 0; q < hull.length; q++) {
            newHull.push([Math.round(hull[q].x), Math.round(hull[q].y)]);
        }

        var majinboo = 15;

        var newPoint = [Math.round(point.x), Math.round(point.y)];

        var toReturn: boolean = false;
        if(HullLibrary.InsidePoly(newPoint, newHull)){
            toReturn = true;
        } 
        
        if(HullLibrary.InsidePoly([Math.round(point.x + majinboo), Math.round(point.y)], newHull)){
            toReturn = true;
        } 

        if(HullLibrary.InsidePoly([Math.round(point.x - majinboo), Math.round(point.y)], newHull)){
            toReturn = true;
        } 

        if(HullLibrary.InsidePoly([Math.round(point.x), Math.round(point.y + majinboo)], newHull)){
            toReturn = true;
        } 

        if(HullLibrary.InsidePoly([Math.round(point.x), Math.round(point.y - majinboo)], newHull)){
            toReturn = true;
        } 

        console.log(toReturn);
        
        return toReturn;
    }

    public static LinesIntersect(p1: PIXI.Point, p2: PIXI.Point, currentPoint: PIXI.Point, nextPoint: PIXI.Point, app?: PIXI.Application)
    {
        var intersectPoint = new PIXI.Point(
            ((p1.x * p2.y - p1.y * p2.x) * (currentPoint.x - nextPoint.x) - (p1.x - p2.x) * (currentPoint.x * nextPoint.y - currentPoint.y * nextPoint.x)) / ((p1.x - p2.x) * (currentPoint.y - nextPoint.y) - (p1.y - p2.y) * (currentPoint.x - nextPoint.x)),
            ((p1.x * p2.y - p1.y * p2.x) * (currentPoint.y - nextPoint.y) - (p1.y - p2.y) * (currentPoint.x * nextPoint.y - currentPoint.y * nextPoint.x)) / ((p1.x - p2.x) * (currentPoint.y - nextPoint.y) - (p1.y - p2.y) * (currentPoint.x - nextPoint.x))
        );

        if (!Number.isNaN(intersectPoint.x) && !Number.isNaN(intersectPoint.y)) {

            let point = new PIXI.Graphics();
            point.beginFill(0x5555FF, 1);
            point.drawCircle(intersectPoint.x, intersectPoint.y, 1);
            point.zIndex = 100;
            point.endFill();
            app.stage.addChild(point);

            return intersectPoint;
        }

        return new PIXI.Point(-1, -1);
    }

    public static FindClosestPointInHull(point: PIXI.Point, hull: HullObject)
    {
        console.log("startig");
        
        var closestPoint: {index: number, distance: number} = {index: 0, distance: Number.MAX_SAFE_INTEGER};
        for (var q = 0; q < hull.hull.length; q++) 
        {
            var distance = Math.sqrt(Math.pow(point.x - hull.hull[q].x, 2) + Math.pow(point.y - hull.hull[q].y, 2));

            if (distance < closestPoint.distance) {
                console.log("shorter");
                
                closestPoint = {index: q, distance: distance}
            }
        }

        return closestPoint.index;
    }

    public static FindOrigin(theHull: PIXI.Point[]) {
        var hullCollection: {x: number, y: number} = {x: 0, y: 0};
        for (var e = 0; e < theHull.length; e++) {
            hullCollection.x += theHull[e].x;
            hullCollection.y += theHull[e].y;
        }
        return { x: hullCollection.x / theHull.length, y: hullCollection.y / theHull.length };
    }

    public static GetSpriteAndHullByName(name: string){
        for (var q = 0; q < HullLibrary.SpriteAndHull.length; q++) {
            if (HullLibrary.SpriteAndHull[q].name == name) {
                var theTexture = PIXI.Texture.from(HullLibrary.SpriteAndHull[q].name);
                var theSprite = new PIXI.Sprite(theTexture);
                return {name: HullLibrary.SpriteAndHull[q].name, sprite: theSprite, body: HullLibrary.SpriteAndHull[q].body};
            }
        }
    }
}

HullLibrary.GenerateHulls();