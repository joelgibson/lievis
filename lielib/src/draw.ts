import { aff } from './aff'
import {Vec, vec, Mat, mat, vecmut, matmut} from './linear'
import {maps} from './maps'

/** Drawing primitives. Everything in this namespace works purely in pixel space. */
namespace prim {
    /* An abstraction for drawing in SVG or onto canvas. */
    export interface Context {
        width: number
        height: number

        /** Move to the absolute position (x, y) without drawing. */
        M(x: number, y: number): void

        /** Draw a line from the last position to (x, y). */
        L(x: number, y: number): void

        /** Close the current path. */
        Z(): void

        /** Draw a circle centred at (cx, cy) with radius r. */
        C(cx: number, cy: number, r: number): void
    }

    /** An arrow from base to base + vect. */
    export function arrow(ctx: Context, vect: number[], base: number[]): void {
        const tipAngle = 0.4
        const tipLength = 12.5

        let backVec = vec.scaleToNorm(vect, -tipLength)
        let tip1 = vec.rotate2D(tipAngle, backVec)
        let tip2 = vec.rotate2D(-tipAngle, backVec)

        ctx.M(base[0], base[1])
        ctx.L(base[0] + vect[0], base[1] + vect[1])
        ctx.L(base[0] + vect[0] + tip1[0], base[1] + vect[1] + tip1[0])
        ctx.M(base[0] + vect[0], base[1] + vect[1])
        ctx.L(base[0] + vect[0] + tip2[0], base[1] + vect[1] + tip2[0])
    }
}

export namespace draw {
    interface Port {
        left: number,
        top: number,
        height: number,
        width: number,
        diam: number,
        extrema: Vec[],
        centre: Vec,
        viewBox: string
    }

    export function viewPort(left: number, top: number, width: number, height: number): Port {
        const diam = vec.norm([width, height])
        const extrema = [[left, top], [left + width, top], [left, top + height], [left + width, top + height]]
        const centre = [left + width / 2, top + height / 2]
        const viewBox = `${left} ${top} ${width} ${height}`
        return {left, top, height, width, diam, extrema, centre, viewBox}
    }

    /** A builder for SVG path syntax: https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Paths */
    export class PathBuilder {
        steps: any[]
        constructor() {
            this.steps = []
        }

        /** Move to absolute coordinates, without drawing a line. */
        M(pt: Vec): this { this.steps.push('M', pt[0], pt[1]); return this }

        /** Move to relative coordinates, without drawing a line. */
        m(pt: Vec): this { this.steps.push('m', pt[0], pt[1]); return this }

        /** Move to absolute coordinates, drawing a line. */
        L(pt: Vec): this { this.steps.push('L', pt[0], pt[1]); return this }

        /** Move to relative coordinates, drawing a line. */
        l(pt: Vec): this { this.steps.push('l', pt[0], pt[1]); return this }

        /** Arc */
        a(rx: number, ry: number, xRot: number, largeArcFlag: 0 | 1, sweepFlag: 0 | 1, dx: number, dy: number): this {
            this.steps.push('a', rx, ry, xRot, largeArcFlag, sweepFlag, dx, dy)
            return this
        }

        /** Close a path: draws a line back to the start of the path. */
        Z(): this { this.steps.push('Z'); return this }

        /** Draw a circle at (cx, cy) using the arc primitive (for batching multiple circles into one path). */
        circleAt([cx, cy]: Vec, r: number) {
            this.steps.push(
                'M', cx, cy,
                'm', -r, 0,
                'a', r, r, 0, 1, 0, 2*r, 0,
                'a', r, r, 0, 1, 0, -2*r, 0)
            return this
        }

        /** Return the path string. */
        build(): string { return this.steps.join(' ') }
    }

    // Draw an arrow as a vector based at a given basepoint.
    export function arrow(port: Port, vect: Vec, base: Vec): string {
        const tipAngle = 0.4
        const tipLength = 12.5

        let backVec = vec.scaleToNorm(vect, -tipLength)
        let tip1 = vec.rotate2D(tipAngle, backVec)
        let tip2 = vec.rotate2D(-tipAngle, backVec)
        return new PathBuilder()
            .M(base)
            .l(vect)
            .m([0, 0])
            .l(tip1)
            .m(vec.scale(tip1, -1))
            .l(tip2)
            .build()
    }

    /** Draw a projective line [a, b, c], i.e. the set of points (x, y)
        satisfying ax + by + c = 0. */
    export function line(port: Port, L: Vec): string {
        // The projective line going through the centre of the viewport, perpendicular to L.
        const P = pgeom.fromVector([L[0], L[1]], port.centre)

        // Intersect the line we're drawing with this perpendicular.
        const centrePt = pgeom.deproj(vec.cross3D(L, P))

        // Now draw a line of length 2*diam.
        const lineAdd = vec.scaleToNorm(vec.rotate2D(Math.PI / 2, [L[0], L[1]]), port.diam)
        return new PathBuilder()
            .M(vec.add(centrePt, lineAdd))
            .l(vec.scale(lineAdd, -2))
            .build()
    }

    /** Draw a projective line [a, b, c], i.e. the set of points (x, y)
        satisfying ax + by + c = 0. */
    export function canvasLine(ctx: CanvasRenderingContext2D, port: Port, L: Vec): void {
        // The projective line going through the centre of the viewport, perpendicular to L.
        const P = pgeom.fromVector([L[0], L[1]], port.centre)

        // Intersect the line we're drawing with this perpendicular.
        const centrePt = pgeom.deproj(vec.cross3D(L, P))

        // Now draw a line of length 2*diam.
        const lineAdd = vec.scaleToNorm(vec.rotate2D(Math.PI / 2, [L[0], L[1]]), port.diam)

        const p = vec.add(centrePt, lineAdd)
        const q = vec.add(p, vec.scale(lineAdd, -2))
        ctx.moveTo(p[0], p[1])
        ctx.lineTo(q[0], q[1])
    }

    // Draw a series of parallel lines to the given line, each spaced the given distance apart.
    export function parallelLines(port: Port, L: Vec, dist: number): string {
        // If the distance between lines is only a few pixels, abort.
        if (dist < 5)
            return ""

        // Scale the projective line so the normal vector part of it is a unit vector.
        L = vec.scale(L, 1/vec.norm([L[0], L[1]]))

        // The unit vector normal to the line.
        let n = [L[0], L[1]]

        // Go backwards a distance of port.diam/2 from the centre of the viewport.
        let behind = vec.sub(port.centre, vec.scale(n, port.diam/2))

        // We want that (n • behind) + L[2] is an integral multiple of dist.
        let evaluation = (vec.dot(n, behind) + L[2]) / dist
        let correction = evaluation - Math.floor(evaluation)
        let startPoint = vec.sub(behind, vec.scale(n, dist * correction))

        // Now startPoint is a point which lies on one of the parallel lines. LineVect will
        // go along each line, and tick will move up back to the next pen point, so the pen is moving
        // in a "Z" pattern to draw the lines.
        let lineVect = vec.scale(vec.rotate2D(Math.PI / 2, n), port.diam)
        let tick = vec.sub(vec.scale(n, dist), lineVect)
        let builder = new PathBuilder()
        builder.M(vec.sub(startPoint, vec.scale(lineVect, 1/2)))
        for (let i = 0; i <= Math.ceil(port.diam / dist); i++) {
            builder
                .l(lineVect)
                .m(tick)
        }
        return builder.build()
    }

    // Draw a series of parallel lines to the given line, each spaced the given distance apart.
    export function canvasParallelLines(ctx: CanvasRenderingContext2D, port: Port, L: Vec, dist: number): void {
        // If the distance between lines is only a few pixels, abort.
        if (dist < 5)
            return

        // Scale the projective line so the normal vector part of it is a unit vector.
        L = vec.scale(L, 1/vec.norm([L[0], L[1]]))

        // The unit vector normal to the line.
        let n = [L[0], L[1]]

        // Go backwards a distance of port.diam/2 from the centre of the viewport.
        let behind = vec.sub(port.centre, vec.scale(n, port.diam/2))

        // We want that (n • behind) + L[2] is an integral multiple of dist.
        let evaluation = (vec.dot(n, behind) + L[2]) / dist
        let correction = evaluation - Math.floor(evaluation)
        let startPoint = vec.sub(behind, vec.scale(n, dist * correction))

        // Now startPoint is a point which lies on one of the parallel lines. LineVect will
        // go along each line, and tick will move up back to the next pen point, so the pen is moving
        // in a "Z" pattern to draw the lines.
        let lineVect = vec.scale(vec.rotate2D(Math.PI / 2, n), port.diam)
        let tick = vec.sub(vec.scale(n, dist), lineVect)
        let p = vec.sub(startPoint, vec.scale(lineVect, 1/2))
        ctx.moveTo(p[0], p[1])
        for (let i = 0; i <= Math.ceil(port.diam / dist); i++) {
            vecmut.add(p, p, lineVect)
            ctx.lineTo(p[0], p[1])
            vecmut.add(p, p, tick)
            ctx.moveTo(p[0], p[1])
        }
    }

    // Draw circles at the given points, of varying radius given by some function.
    // Circles outside the viewport will not be drawn.
    export function circles(port: Port, centres: Vec[], rFunc: (i: number) => number): string {
        let builder = new PathBuilder()
        for (let i = 0; i < centres.length; i++) {
            let centre = centres[i]
            if (vec.dist(centre, port.centre) > port.diam / 2) {
                continue
            }
            builder.circleAt(centre, rFunc(i))
        }
        return builder.build()
    }

    // A half-open triangle, cut out by the two given normals and the basepoint.
    export function openTriangle(port: Port, n1: Vec, n2: Vec, base: Vec): string {
        let n1extreme = vec.rotate2D(Math.PI/2, vec.scaleToNorm(n1, 2*port.diam))
        if (vec.dot(n1extreme, n2) < 0)
            n1extreme = vec.neg(n1extreme)

        let n2extreme = vec.rotate2D(Math.PI/2, vec.scaleToNorm(n2, 2*port.diam))
        if (vec.dot(n2extreme, n1) < 0)
            n2extreme = vec.neg(n2extreme)

        return new PathBuilder()
            .M(vec.add(n1extreme, base))
            .l(vec.neg(n1extreme))
            .l(n2extreme)
            .build()
    }

    // Now we wrap all of our drawing primitives in a coordinates object which will translate in and our of our
    // chosen vector space by default.
    export class Coords {
        constructor(
            readonly port: Port,
            readonly affProj: Mat,
            readonly affSect: Mat,
        ) {}

        static fromLegacy(width: number, height: number, origin: Vec, scale: number, proj: Mat, sect?: Mat) {
            return new Coords(
                viewPort(0, 0, width, height),
                [
                    mat.fromRows([[1, 0, origin[0]], [0, 1, origin[1]], [0, 0, 1]]),
                    mat.fromRows([[scale, 0, 0], [0, -scale, 0], [0, 0, 1]]),
                    pgeom.affMat(proj)
                ].reduce(mat.multMat),
                [
                    (sect == undefined) ? pgeom.affMat(mat.transpose(proj)) : pgeom.affMat(sect),
                    mat.fromRows([[1/scale, 0, 0], [0, -1/scale, 0], [0, 0, 1]]),
                    mat.fromRows([[1, 0, -origin[0]], [0, 1, -origin[1]], [0, 0, 1]])
                ].reduce(mat.multMat),
            )
        }
        // In the GL coordinate system, (0, 0) is in the bottom left.
        static fromLegacyGL(width: number, height: number, origin: Vec, scale: number, proj: Mat, sect?: Mat) {
            return new Coords(
                viewPort(0, 0, width, height),
                [
                    mat.fromRows([
                        [1, 0, origin[0]],
                        [0, 1, origin[1]],
                        [0, 0, 1]
                    ]),
                    mat.fromRows([
                        [scale, 0, 0],
                        [0, scale, 0],
                        [0, 0, 1],
                    ]),
                    pgeom.affMat(proj)
                ].reduce(mat.multMat),
                [
                    (sect == undefined) ? pgeom.affMat(mat.transpose(proj)) : pgeom.affMat(sect),
                    mat.fromRows([
                        [1/scale, 0, 0],
                        [0, 1/scale, 0],
                        [0, 0, 1]
                    ]),
                    mat.fromRows([
                        [1, 0, -origin[0]],
                        [0, 1, -origin[1]],
                        [0, 0, 1]
                    ])
                ].reduce(mat.multMat),
            )
        }

        /** Coordinates that put the x-axis going right, y-axis going up, the origin in the centre, and no scaling or warping otherwise. */
        static stdScreen(width: number, height: number) {
            return Coords.fromLegacy(width, height, [width/2, height/2], 1, mat.id(2), mat.id(2))
        }

        translatePx(px: number[]) {
            return new Coords(this.port, mat.multMat(aff2.translate(px), this.affProj), mat.multMat(this.affSect, aff2.translate(vec.neg(px))))
        }

        scaleAbout(px: number[], scaleFactor: number) {
            let proj = [
                aff2.translate(vec.scale(px, 1)),
                aff2.scale(scaleFactor),
                aff2.translate(vec.scale(px, -1)),
            ].reduce(mat.multMat)
            let sect = mat.inverse(proj)

            return new Coords(this.port, mat.multMat(proj, this.affProj), mat.multMat(this.affSect, sect))
        }


        // The linear part of our map to pixel space, without the affine shift.
        toPixelsLinear(u: Vec): Vec {
            let result = [0, 0]
            matmut.multVec(result, this.affProj, u)
            return result
        }

        // The inverse map.
        fromPixelsLinear([x, y]: Vec): Vec {
            let projVec = [x, y, 0]
            let result = mat.multVec(this.affSect, projVec)
            return result.slice(0, result.length - 1)
        }

        // The whole map to pixel space, including the shift.
        toPixels(p: Vec): Vec {
            let transformed = [0, 0]
            matmut.multAff(transformed, this.affProj, p)
            return transformed
        }

        // Return the x-coordinate (in pixel space) of the vector.
        x(p: Vec) {
            let transformed = [0, 0]
            matmut.multAff(transformed, this.affProj, p)
            return transformed[0]
        }

        // Return the y-coordinate (in pixel space) of the vector.
        y(p: Vec) {
            let transformed = [0, 0]
            matmut.multAff(transformed, this.affProj, p)
            return transformed[1]
        }

        // The inverse map.
        fromPixels([x, y]: Vec): Vec {
            let projVec = [x, y, 1]
            let result = mat.multVec(this.affSect, projVec)
            return result.slice(0, result.length - 1)
        }

        // Go from pixels and find the closest lattice point.
        fromPixelsClosestLatticePoint(point: Vec): Vec {
            const RADIUS = 2;

            let guess = this.fromPixels(point).map(Math.round)
            let bestDist2 = vec.dist2(this.toPixels(guess), point)
            let bestGuess = guess

            let temp: number[] = []
            let temp2: number[] = []
            for (let i = 0-RADIUS; i <= RADIUS; i++) {
                temp[0] = guess[0] + i
                for (let j = 0-RADIUS; j <= RADIUS; j++) {
                    temp[1] = guess[1] + j
                    matmut.multAff(temp2, this.affProj, temp)
                    temp2.length = 2
                    let dist2 = vec.dist2(temp2, point)
                    if (dist2 < bestDist2) {
                        bestDist2 = dist2
                        vecmut.copy(bestGuess, temp)
                    }
                }
            }

            return bestGuess
        }

        // Convert a mouse event into coordinate space.
        fromEvent(e: MouseEvent, svgElement: SVGElement) {
            let rect = svgElement.getBoundingClientRect()
            let [sx, sy] = [e.clientX - rect.left, e.clientY - rect.top]
            return this.fromPixels([sx, sy])
        }

        // The line defined by (u • -) = value. Value defaults to zero. If origin is
        // supplied, we instaed do (u • ((-) - origin)) = value
        line(u: Vec, value?: number, origin?: Vec): string {
            value = value || 0
            origin = origin || u.map(() => 0)
            if (u.length != origin.length)
                throw new Error()
            return line(this.port, mat.multVecLeft([...u, -value - vec.dot(u, origin)], this.affSect))
        }

        // A vector u, based at b.
        vector(u: Vec, base?: Vec): string {
            let basePoint = (base == undefined) ? vec.zero(u.length) : base
            return arrow(this.port, this.toPixelsLinear(u), this.toPixels(basePoint))
        }

        absPosition(point: Vec, hint?: string): string {
            let svgPoint = [0, 0]
            matmut.multAff(svgPoint, this.affProj, point)
            if (hint == 'vector') {
                let offsetDirection = [0, 0]
                matmut.multVec(offsetDirection, this.affProj, point)
                vecmut.addScaled(svgPoint, svgPoint, offsetDirection, 15 / vec.norm(offsetDirection))
            }
            return `position: absolute; left: ${svgPoint[0]}px; top: ${svgPoint[1]}px; transform: translate(-50%, -50%);`
        }

        // A covector c, based at o, showing evaluations to integral multiples of v.
        covector(covect: Vec, value?: number, origin?: Vec): string {
            const val = (value == undefined) ? 1 : value
            const orig = (origin == undefined) ? vec.zero(covect.length) : origin

            // A projective line in pixel space perpendicular to covect and passing through origin.
            const L = mat.multVecLeft([...covect, -val-vec.dot(covect, orig)], this.affSect)
            let dist = Math.abs(val) / vec.norm([L[0], L[1]])
            return parallelLines(this.port, L, dist)
        }

        openTriangle(n1: Vec, n2: Vec, base?: Vec): string {
            // TODO: remove this hack for rank-1 or rank-0 systems
            if (n1 == undefined || n2 == undefined)
                return ''
            const basept = (base == undefined) ? vec.zero(n1.length) : base
            let L1 = mat.multVecLeft([...n1, 0], this.affSect)
            let L2 = mat.multVecLeft([...n2, 0], this.affSect)
            return openTriangle(this.port, [L1[0], L1[1]], [L2[0], L2[1]], this.toPixels(basept))
        }

        circlesFromMap(pts: maps.IMap<number[], number>, r: (value: number) => number): string {
            let builder = new PathBuilder()
            let projected = [0, 0]
            pts.forEach((centre, value) => {
                matmut.multAff(projected, this.affProj, centre)
                if (vec.dist(projected, this.port.centre) <= this.port.diam / 2)
                    builder.circleAt(projected, r(value))
            })
            return builder.build()

        }

        circlesFromEntries(entries: {key: number[], value: number}[], r: (value: number) => number): string {
            let builder = new PathBuilder()
            let projected = [0, 0]
            for (let i = 0; i < entries.length; i++) {
                let entry = entries[i]
                matmut.multAff(projected, this.affProj, entry.key)
                if (vec.dist(projected, this.port.centre) <= this.port.diam / 2)
                    builder.circleAt(projected, r(entry.value))
            }
            return builder.build()

        }

        circle(pt: Vec, r: number): string {
            let projected = [0, 0]
            matmut.multAff(projected, this.affProj, pt)
            return new PathBuilder().circleAt(projected, r).build()
        }

        segment(pt1: Vec, pt2: Vec): string {
            const builder = new PathBuilder()
            let projected = [0, 0]
            matmut.multAff(projected, this.affProj, pt1)
            builder.M(projected)
            matmut.multAff(projected, this.affProj, pt2)
            builder.L(projected)

            return builder.build()
        }

        closedPolygon(pts: Vec[]): string {
            const builder = new PathBuilder()
            let projected = [0, 0]
            for (let i = 0; i < pts.length; i++) {
                matmut.multAff(projected, this.affProj, pts[i])
                if (i == 0)
                    builder.M(projected)
                else
                    builder.L(projected)
            }
            builder.Z()

            return builder.build()
        }

        /** An open polytope formed by intersecting each adjacent pair of hyperplanes. */
        openPolytopeFromLines(hypplanes: Vec[]): string {
            let builder = new PathBuilder()
            for (let i = 0; i < hypplanes.length - 1; i++) {
                let L1 = mat.multVecLeft(hypplanes[i], this.affSect)
                let L2 = mat.multVecLeft(hypplanes[i + 1], this.affSect)
                let isect = pgeom.deproj(vec.cross3D(L1, L2))
                if (i == 0)
                    builder.M(isect)
                else
                    builder.L(isect)
            }
            return builder.build()
        }

        /** A path of the closed polytope formed by intersecting each adjacent pair of lines. */
        polytopeFromLines(lines: [Vec, number][]): string {
            let builder = new PathBuilder()
            for (let i = 0; i < lines.length; i++) {
                let a = lines[i % lines.length]
                let L1 = mat.multVecLeft([...a[0], -a[1]], this.affSect)
                let b = lines[(i + 1) % lines.length]
                let L2 = mat.multVecLeft([...b[0], -b[1]], this.affSect)
                let pt = vec.cross3D(L1, L2)
                if (i == 0)
                    builder.M([pt[0] / pt[2], pt[1] / pt[2]])
                else
                    builder.L([pt[0] / pt[2], pt[1] / pt[2]])
            }
            builder.Z()
            return builder.build()
        }
    }

    // Now we wrap all of our drawing primitives in a coordinates object which will translate in and our of our
    // chosen vector space by default.
    export class CanvasCoords {
        constructor(
            readonly ctx: CanvasRenderingContext2D,
            readonly port: Port,
            readonly affProj: Mat,
            readonly affSect: Mat,
        ) {}

        static fromLegacy(width: number, height: number, origin: Vec, scale: number, proj: Mat, sect?: Mat) {
            return new Coords(
                viewPort(0, 0, width, height),
                [
                    mat.fromRows([[1, 0, origin[0]], [0, 1, origin[1]], [0, 0, 1]]),
                    mat.fromRows([[scale, 0, 0], [0, -scale, 0], [0, 0, 1]]),
                    pgeom.affMat(proj)
                ].reduce(mat.multMat),
                [
                    (sect == undefined) ? pgeom.affMat(mat.transpose(proj)) : pgeom.affMat(sect),
                    mat.fromRows([[1/scale, 0, 0], [0, -1/scale, 0], [0, 0, 1]]),
                    mat.fromRows([[1, 0, -origin[0]], [0, 1, -origin[1]], [0, 0, 1]])
                ].reduce(mat.multMat),
            )
        }

        /** Coordinates that put the x-axis going right, y-axis going up, the origin in the centre, and no scaling or warping otherwise. */
        static stdScreen(width: number, height: number) {
            return Coords.fromLegacy(width, height, [width/2, height/2], 1, mat.id(2), mat.id(2))
        }

        // The linear part of our map to pixel space, without the affine shift.
        toPixelsLinear(u: Vec): Vec {
            let result = [0, 0]
            matmut.multVec(result, this.affProj, u)
            return result
        }

        // The inverse map.
        fromPixelsLinear([x, y]: Vec): Vec {
            let projVec = [x, y, 0]
            let result = mat.multVec(this.affSect, projVec)
            return result.slice(0, result.length - 1)
        }

        // The whole map to pixel space, including the shift.
        toPixels(p: Vec): Vec {
            let transformed = [0, 0]
            matmut.multAff(transformed, this.affProj, p)
            return transformed
        }

        // Return the x-coordinate (in pixel space) of the vector.
        x(p: Vec) {
            let transformed = [0, 0]
            matmut.multAff(transformed, this.affProj, p)
            return transformed[0]
        }

        // Return the y-coordinate (in pixel space) of the vector.
        y(p: Vec) {
            let transformed = [0, 0]
            matmut.multAff(transformed, this.affProj, p)
            return transformed[1]
        }

        // The inverse map.
        fromPixels([x, y]: Vec): Vec {
            let projVec = [x, y, 1]
            let result = mat.multVec(this.affSect, projVec)
            return result.slice(0, result.length - 1)
        }

        // The line defined by (u • -) = value. Value defaults to zero. If origin is
        // supplied, we instaed do (u • ((-) - origin)) = value
        line(u: Vec, value?: number, origin?: Vec): void {
            value = value || 0
            origin = origin || u.map(() => 0)
            if (u.length != origin.length)
                throw new Error()
            canvasLine(this.ctx, this.port, mat.multVecLeft([...u, -value - vec.dot(u, origin)], this.affSect))
        }

        // A covector c, based at o, showing evaluations to integral multiples of v.
        covector(covect: Vec, value?: number, origin?: Vec): void {
            const val = (value == undefined) ? 1 : value
            const orig = (origin == undefined) ? vec.zero(covect.length) : origin

            // A projective line in pixel space perpendicular to covect and passing through origin.
            const L = mat.multVecLeft([...covect, -val-vec.dot(covect, orig)], this.affSect)
            let dist = Math.abs(val) / vec.norm([L[0], L[1]])
            canvasParallelLines(this.ctx, this.port, L, dist)
        }
    }

    // Now we wrap all of our drawing primitives in a coordinates object which will translate in and our of our
    // chosen vector space by default.
    export class NewCoords {
        constructor(
            readonly port: Port,
            readonly aff2: aff.Aff2,
        ) {}

        /** Attempt to find the closest lattice point working backwards from an (x, y) point.
         * The difficult part here is that "closest" is defined in (x, y) space (i.e. the space
         * with the Weyl-invariant inner product), not in (u, v) coordinates. Therefore what we
         * actually do is just snap to rounded (u, v) coordinates, then go two steps in every
         * direction and check every lattice point to find the closest one.
        */
        fromPixelsClosestLatticePoint(xyPoint: Vec): Vec {
            const RADIUS = 2;

            let guess = this.aff2.uv(xyPoint).map(Math.round)
            let bestDist2 = vec.dist2(this.aff2.xy(guess), xyPoint)
            let bestGuess = guess

            let temp: number[] = []
            let temp2: number[] = []
            for (let i = 0-RADIUS; i <= RADIUS; i++) {
                temp[0] = guess[0] + i
                for (let j = 0-RADIUS; j <= RADIUS; j++) {
                    temp[1] = guess[1] + j
                    matmut.multAff(temp2, this.aff2.fwd, temp)
                    temp2.length = 2
                    let dist2 = vec.dist2(temp2, xyPoint)
                    if (dist2 < bestDist2) {
                        bestDist2 = dist2
                        vecmut.copy(bestGuess, temp)
                    }
                }
            }

            return bestGuess
        }

        /** The line {p | (u • p) = value}, with value defaulting to zero.
         * If origin is supplied, the locus is instead {p | (u • (p - origin)) = value} */
        line(u: Vec, value: number = 0, origin: Vec = [0, 0]): string {
            return line(this.port, mat.multVecLeft([...u, -value - vec.dot(u, origin)], this.aff2.rev))
        }

        /** Draw an arrow representing the vector u, based at some point. */
        vector(u: Vec, base: Vec = [0, 0]): string {
            return arrow(this.port, this.aff2.xyLin(u), this.aff2.xy(base))
        }

        /** Return an inline CSS style absolutely positioning an element at a particular point. */
        absPosition(point: Vec, hint: 'none' | 'vector' = 'none'): string {
            let svgPoint = [0, 0]
            matmut.multAff(svgPoint, this.aff2.fwd, point)
            if (hint == 'vector') {
                let offsetDirection = [0, 0]
                matmut.multVec(offsetDirection, this.aff2.fwd, point)
                vecmut.addScaled(svgPoint, svgPoint, offsetDirection, 15 / vec.norm(offsetDirection))
            }
            return `position: absolute; left: ${svgPoint[0]}px; top: ${svgPoint[1]}px; transform: translate(-50%, -50%);`
        }

        // A covector c, based at o, showing evaluations to integral multiples of v.
        covector(covect: Vec, value?: number, origin?: Vec): string {
            const val = (value == undefined) ? 1 : value
            const orig = (origin == undefined) ? vec.zero(covect.length) : origin

            // A projective line in pixel space perpendicular to covect and passing through origin.
            const L = mat.multVecLeft([...covect, -val-vec.dot(covect, orig)], this.aff2.rev)
            let dist = Math.abs(val) / vec.norm([L[0], L[1]])
            return parallelLines(this.port, L, dist)
        }

        openTriangle(n1: Vec, n2: Vec, base?: Vec): string {
            // TODO: remove this hack for rank-1 or rank-0 systems
            if (n1 == undefined || n2 == undefined)
                return ''
            const basept = (base == undefined) ? vec.zero(n1.length) : base
            let L1 = mat.multVecLeft([...n1, 0], this.aff2.rev)
            let L2 = mat.multVecLeft([...n2, 0], this.aff2.rev)
            return openTriangle(this.port, [L1[0], L1[1]], [L2[0], L2[1]], this.aff2.xy(basept))
        }

        circlesFromMap(pts: maps.IMap<number[], number>, r: (value: number) => number): string {
            let builder = new PathBuilder()
            let projected = [0, 0]
            pts.forEach((centre, value) => {
                matmut.multAff(projected, this.aff2.fwd, centre)
                if (vec.dist(projected, this.port.centre) <= this.port.diam / 2)
                    builder.circleAt(projected, r(value))
            })
            return builder.build()

        }

        circlesFromEntries(entries: {key: number[], value: number}[], r: (value: number) => number): string {
            let builder = new PathBuilder()
            let projected = [0, 0]
            for (let i = 0; i < entries.length; i++) {
                let entry = entries[i]
                matmut.multAff(projected, this.aff2.fwd, entry.key)
                if (vec.dist(projected, this.port.centre) <= this.port.diam / 2)
                    builder.circleAt(projected, r(entry.value))
            }
            return builder.build()

        }

        circle(pt: Vec, r: number): string {
            return new PathBuilder()
                .circleAt([this.aff2.x(pt[0], pt[1]), this.aff2.y(pt[0], pt[1])], r)
                .build()
        }

        segment(pt1: Vec, pt2: Vec): string {
            const builder = new PathBuilder()
            let projected = [0, 0]
            matmut.multAff(projected, this.aff2.fwd, pt1)
            builder.M(projected)
            matmut.multAff(projected, this.aff2.fwd, pt2)
            builder.L(projected)

            return builder.build()
        }

        closedPolygon(pts: Vec[]): string {
            const builder = new PathBuilder()
            let projected = [0, 0]
            for (let i = 0; i < pts.length; i++) {
                matmut.multAff(projected, this.aff2.fwd, pts[i])
                if (i == 0)
                    builder.M(projected)
                else
                    builder.L(projected)
            }
            builder.Z()

            return builder.build()
        }

        /** An open polytope formed by intersecting each adjacent pair of hyperplanes. */
        openPolytopeFromLines(hypplanes: Vec[]): string {
            let builder = new PathBuilder()
            for (let i = 0; i < hypplanes.length - 1; i++) {
                let L1 = mat.multVecLeft(hypplanes[i], this.aff2.rev)
                let L2 = mat.multVecLeft(hypplanes[i + 1], this.aff2.rev)
                let isect = pgeom.deproj(vec.cross3D(L1, L2))
                if (i == 0)
                    builder.M(isect)
                else
                    builder.L(isect)
            }
            return builder.build()
        }

        /** A path of the closed polytope formed by intersecting each adjacent pair of lines. */
        polytopeFromLines(lines: [Vec, number][]): string {
            let builder = new PathBuilder()
            for (let i = 0; i < lines.length; i++) {
                let a = lines[i % lines.length]
                let L1 = mat.multVecLeft([...a[0], -a[1]], this.aff2.rev)
                let b = lines[(i + 1) % lines.length]
                let L2 = mat.multVecLeft([...b[0], -b[1]], this.aff2.rev)
                let pt = vec.cross3D(L1, L2)
                if (i == 0)
                    builder.M([pt[0] / pt[2], pt[1] / pt[2]])
                else
                    builder.L([pt[0] / pt[2], pt[1] / pt[2]])
            }
            builder.Z()
            return builder.build()
        }

        /** A piecewise-linear path. */
        path(points: Vec[]): string {
            let builder = new PathBuilder()
            let tmp: number[] = []
            for (let i = 0; i < points.length; i++) {
                let pt = [this.aff2.x(points[i][0], points[i][1]), this.aff2.y(points[i][0], points[i][1])]
                if (i == 0)
                    builder.M(pt)
                else
                    builder.L(pt)
            }
            return builder.build()
        }
    }
}

namespace aff2 {
    export function translate([x, y]: number[]) {
        return mat.fromRows([
            [1, 0, x],
            [0, 1, y],
            [0, 0, 1],
        ])
    }

    export function scale(r: number) {
        return mat.fromRows([
            [r, 0, 0],
            [0, r, 0],
            [0, 0, 1],
        ])
    }
}

namespace pgeom {
    // Projective geometry

    /** An affine operator is one of the form v ↦ Lv + t, where L is linear and t
        (the translation) is any vector in the target space. This can be represented
        as the block matrix
        L t
        0 1
        operating over the standard affine patch. This function takes (L, t) and returns
        that matrix. The translation t will default to zero.
      */
    export function affMat(L: Mat, t?: Vec) {
        let T = t || vec.zero(L.nrows)
        if (L.nrows != T.length)
            throw new Error()

        return mat.fromEntries(L.nrows + 1, L.ncols + 1, (i, j) => {
            if (i < L.nrows)
                return (j < L.ncols) ? L.get(i, j) : T[i]
            return (j < L.ncols) ? 0 : 1
        })
    }

    // Deprojectivise a point, eg [x, y, z, w] => [x/w, y/w, z/w]
    export function deproj(u: Vec): Vec {
        const result = []
        for (let i = 0; i < u.length - 1; i++) {
            result.push(u[i] / u[u.length - 1])
        }
        return result
    }

    /** Return a projective line of the points p satisfying the equation (c • (p - o)) = v.
        The value v defaults to 0, the origin o defaults to (0, 0). */
    export function fromCovector(covector: Vec, value: number = 0, origin: Vec = [0, 0]): Vec {
        return [covector[0], covector[1], -vec.dot(covector, origin) - value]
    }

    /** Return a projective line in the direction of the vector containing the point. The point
        defaults to (0, 0). */
    export function fromVector(vector: Vec, point: Vec = [0, 0]): Vec {
        // Rotate the vector by 90 degrees, to create a covector representing the line.
        const covector = [-vector[1], vector[0]]
        return fromCovector(covector, 0, point)
    }
}
