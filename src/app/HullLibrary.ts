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
            let hulls = HullLibrary.ConvertToShapes(element.name, new HullObject(element.body.convexHull), app);
            hulls.forEach(h => {
                let shapeGraphics = new PIXI.Graphics;
                var poly = new PIXI.Polygon(h.hull);
                shapeGraphics.beginFill(0xFFFFFF, 0.2);
                let colour = '0x'+(Math.random()*0xFFFFFF<<0).toString(16);
                shapeGraphics.lineStyle(1, Number(colour));
                shapeGraphics.drawPolygon(poly);
                shapeGraphics.endFill();
                app.stage.addChild(shapeGraphics);
            });
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

    private static findIntersectionIndex(prev: PIXI.Point, checkPoint: PIXI.Point, next: PIXI.Point, margin: number, hull: PIXI.Point[], app): { index: number, point: PIXI.Point }
    {
        let intersection: { index: number, point: PIXI.Point } = { index: -1, point: new PIXI.Point(-1, -1) };

        for (let j = 0; j < hull.length; j++)
        {
            if (hull[j].x === checkPoint.x &&
                hull[j].y === checkPoint.y)
            {
                continue;
            }

            let nextB: PIXI.Point, prevB: PIXI.Point;

            if (j + 1 >= hull.length)
                nextB = hull[0];
            else
                nextB = hull[j + 1];

            let intersectPoint = HullLibrary.LinesIntersect(prev, checkPoint, hull[j], nextB, app);

            if (intersectPoint.x > 0 && intersectPoint.y > 0 &&
                ((intersectPoint.x > checkPoint.x + margin ||
                intersectPoint.x < checkPoint.x - margin) ||
                (intersectPoint.y > checkPoint.y + margin ||
                intersectPoint.y < checkPoint.y - margin)))
            {
                let distanceAC = new PIXI.Point(Math.abs(intersectPoint.x - hull[j].x), Math.abs(intersectPoint.y - hull[j].y));
                let distanceBC = new PIXI.Point(Math.abs(intersectPoint.x - nextB.x), Math.abs(intersectPoint.y - nextB.y));
                let distanceAB = new PIXI.Point(Math.abs(nextB.x - hull[j].x), Math.abs(nextB.y - hull[j].y));

                if (distanceAC.x + distanceBC.x === distanceAB.x &&
                    distanceAC.y + distanceBC.y === distanceAB.y)
                {
                    if ((intersectPoint.x === prev.x &&
                        intersectPoint.y === prev.y) ||
                        (intersectPoint.x === next.x &&
                        intersectPoint.y === next.y))
                    {
                        continue;
                    }

                    let distance = Math.sqrt(
                        Math.pow(intersectPoint.x - checkPoint.x, 2) + Math.pow(intersectPoint.y + checkPoint.y, 2)
                    );

                    // let lineB = new PIXI.Graphics();
                    // let colour = '0x'+(Math.random()*0xFFFFFF<<0).toString(16);
                    // lineB.beginFill(0x00FFA8, 5);
                    // lineB.lineStyle(1);
                    // lineB.moveTo(hull[j].x, hull[j].y);
                    // lineB.lineTo(nextB.x, nextB.y);
                    // lineB.zIndex = 500;
                    // lineB.endFill();
                    // app.stage.addChild(lineB);

                    // console.log('distance', lastDistanceX, lastDistanceY);
                    // console.log('point', intersectPoint);
                    // console.log('intersect', intersection.point);
                    // let lineA = new PIXI.Graphics();
                    // lineA.beginFill(0xFF5555, 5);
                    // lineA.lineStyle(1);
                    // lineA.moveTo(checkPoint.x, checkPoint.y);
                    // lineA.lineTo(intersectPoint.x, intersectPoint.y);
                    // lineA.zIndex = 120;
                    // lineA.endFill();
                    // app.stage.addChild(lineA);

                    let pointA = new PIXI.Graphics();
                    pointA.beginFill(0xFF00C6, 1);
                    pointA.drawCircle(intersectPoint.x, intersectPoint.y, 2);
                    pointA.zIndex = 110;
                    pointA.endFill();
                    app.stage.addChild(pointA);
                    console.log('intersectLine', checkPoint, intersection.point);
                    console.log('checkPoint', checkPoint);
                    
                    return intersection = { index: j, point: intersectPoint };

                    // if (Math.abs(intersectPoint.x - intersection.point.x) < Math.abs(lastDistanceX) || Math.abs(intersectPoint.y - intersection.point.y) < Math.abs(lastDistanceY))
                    // {
                    //     lastDistanceX = Math.abs(intersectPoint.x - intersection.point.x);
                    //     lastDistanceY = Math.abs(intersectPoint.y - intersection.point.y);
                    //     // console.log('distanceXY', lastDistanceX, lastDistanceY);
                    //     // console.log('asd', intersection);
                        
                    // }
                }
            }
        }

        return intersection;
    }

    public static ConvertToShapes(name: string, hullContainer: HullObject, app?: PIXI.Application, depth?: number): Array<HullObject>
    {
        let prev, next;
        let allShapes = new Array<HullObject>();

        let newShape = new Array<PIXI.Point>();
        let oldShape = new Array<PIXI.Point>();

        //#region debug stuff
        if (depth === undefined)
        {
            depth = 0;
        }

        let l = 8;
        if (depth === 2)
            l = 0;
        if (depth === 3)
            l = 0;
        if (depth === 4)
            l = 0;
        //#endregion

        loop1:
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

            
            let isConcave = HullLibrary.isConcaveAngle(prev, next, hullContainer.hull[i], app);
            
            if (isConcave)
            {
                let margin = 1;
                
                let intersectA = HullLibrary.findIntersectionIndex(prev, hullContainer.hull[i], next, margin, hullContainer.hull, app);
                console.log('A',intersectA.index);
                console.log('A coords', hullContainer.hull[intersectA.index]);

                if (intersectA.index < 0 || hullContainer.hull[intersectA.index] === undefined)
                {
                    continue;
                }

                let intersectB = HullLibrary.findIntersectionIndex(next, hullContainer.hull[i], prev, margin, hullContainer.hull, app);
                console.log('B',intersectB.index);
                console.log('B coords', hullContainer.hull[intersectB.index]);

                if (intersectB.index < 0 || hullContainer.hull[intersectB.index] === undefined)
                {
                    continue;
                }

                let intersectCLinePoint = new PIXI.Point(
                    Math.round((intersectA.point.x + intersectB.point.x) / 2),
                    Math.round((intersectA.point.y + intersectB.point.y) / 2)
                );
                let intersectC = HullLibrary.findIntersectionIndex(hullContainer.hull[i], intersectCLinePoint, next, margin, hullContainer.hull, app);
                if (depth === 1)
                    console.log('aaa', intersectC, i);
                    
                intersectC.index += 1;
                intersectC.point.x = Math.round(intersectC.point.x);
                intersectC.point.y = Math.round(intersectC.point.y);
                console.log('C',intersectC.index);
                console.log('C coords', intersectC.point);

                hullContainer.hull.splice(intersectC.index, 0, intersectC.point);

                let index = (intersectC.index < i) ? i + 1 : i;
                
                let pointA = new PIXI.Graphics();
                pointA.beginFill(0x5555FF, 1);
                pointA.drawCircle(intersectCLinePoint.x, intersectCLinePoint.y, 2);
                pointA.zIndex = 1000;
                pointA.endFill();
                app.stage.addChild(pointA);

                let pointB = new PIXI.Graphics();
                pointB.beginFill(0xFF5A00, 2);
                pointB.drawCircle(hullContainer.hull[index].x, hullContainer.hull[index].y, 2);
                pointB.zIndex = 120;
                pointB.endFill();
                app.stage.addChild(pointB);

                console.log('i',index);
                console.log('i coords', hullContainer.hull[index]);

                if (intersectC.index < 0)
                {
                    continue;
                }

                let lineC = new PIXI.Graphics();
                lineC.beginFill(0x22FF22, 1);
                lineC.lineStyle(1);
                lineC.moveTo(hullContainer.hull[index].x, hullContainer.hull[index].y);
                lineC.lineTo(intersectC.point.x, intersectC.point.y);
                lineC.zIndex = 1000;
                lineC.endFill();
                app.stage.addChild(lineC);
                
                let j = index;
                while (j !== intersectC.index)
                {
                    if (j > hullContainer.hull.length - 1)
                    {
                        j = 0;
                    }

                    console.log(j, hullContainer.hull.length - 1);

                    newShape.push(hullContainer.hull[j]);
                    console.log('added to newShape');
                    
                    j++;
                }
                // if (j === i || j === i - 1 || j === i + 1)
                // {
                //     console.log('asd');
                    
                //     if (j > 2)
                //         j = i - 2;
                //     else if (hullContainer.hull.length - 1 > 2)
                //         j = i + 2
                        
                // }
                
                console.log(j);
                
                newShape.push(hullContainer.hull[j])
                console.log('newShape', newShape);

                let garbage;
                for (let k = 1; k < newShape.length - 1; k++)
                {
                    let index = hullContainer.hull.indexOf(newShape[k]);
                    garbage = hullContainer.hull.splice(index, 1);
                }
                garbage = undefined;

                oldShape = hullContainer.hull;
                console.log('oldshape',oldShape);
                
                break loop1;
            }
        }

        console.log('length', newShape.length);
        if (newShape.length <= 2)
        {
            allShapes.push(new HullObject(hullContainer.hull));
            return allShapes;
        }
        else if (newShape.length === 3)
        {
            // allShapes.push(new HullObject(newShape));
            allShapes.push(new HullObject(hullContainer.hull));
            return allShapes;
        }

        HullLibrary.ConvertToShapes(name, new HullObject(newShape), app, depth + 1).forEach(s =>
        {
            allShapes.push(s);
        });
        HullLibrary.ConvertToShapes(name, new HullObject(oldShape), app, depth + 1).forEach(s =>
        {
            allShapes.push(s);
        });
        console.log('allShapes', allShapes);
        
        return allShapes;
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
        console.log(angle);

        let BA = new PIXI.Point(current.x - prev.x, current.y - prev.y);
        let bx = BA.x;
        BA.x = -BA.y;
        BA.y = bx;

        let CB = new PIXI.Point(next.x - current.x, next.y - current.y);

        let dotProductABC = BA.x * CB.x + BA.y * CB.y;
        console.log('dotProduct',dotProductABC);
        
        

        if (dotProductABC < 0)
        {
            let pointB = new PIXI.Graphics();
            pointB.beginFill(0x0000FF, 2);
            pointB.drawCircle(current.x, current.y, 2);
            pointB.zIndex = 100;
            pointB.endFill();
            app.stage.addChild(pointB);
            return false
        }
        else if (dotProductABC > 0)
        {
            let pointB = new PIXI.Graphics();
            pointB.beginFill(0xFF0000, 2);
            pointB.drawCircle(current.x, current.y, 2);
            pointB.zIndex = 110;
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
        var intersectPointA = new PIXI.Point(
            ((p1.x * p2.y - p1.y * p2.x) * (currentPoint.x - nextPoint.x) - (p1.x - p2.x) * (currentPoint.x * nextPoint.y - currentPoint.y * nextPoint.x)) / ((p1.x - p2.x) * (currentPoint.y - nextPoint.y) - (p1.y - p2.y) * (currentPoint.x - nextPoint.x)),
            ((p1.x * p2.y - p1.y * p2.x) * (currentPoint.y - nextPoint.y) - (p1.y - p2.y) * (currentPoint.x * nextPoint.y - currentPoint.y * nextPoint.x)) / ((p1.x - p2.x) * (currentPoint.y - nextPoint.y) - (p1.y - p2.y) * (currentPoint.x - nextPoint.x))
        );

        if (!Number.isNaN(intersectPointA.x) && !Number.isNaN(intersectPointA.y)) {

            // let point = new PIXI.Graphics();
            // point.beginFill(0x5555FF, 1);
            // point.drawCircle(intersectPointA.x, intersectPointA.y, 2);
            // point.zIndex = 100;
            // point.endFill();
            // app.stage.addChild(point);

            return intersectPointA;
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