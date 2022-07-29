import type { Mat } from './linear'
import { mat } from './linear'

export namespace aff {

/** Represents an affine transformation fwd from a source (u, v) space to a target (x, y) space,
 * together with its inverse transformation rev.
 */
export class Aff2 {
    // Internally we will only allow matrices of the form
    //   [a b c]
    //   [d e f]
    //   [0 0 1]
    // so we never need to divide by the homogeneous coordinate.
    // This is enforced by hiding the constructor.

    private constructor(
        readonly fwd: Mat,
        readonly rev: Mat,
    ) {}

    static id = new Aff2(mat.id(3), mat.id(3))

    static fromLinear(fwd: Mat, rev: Mat) {
        const liftMat = (A: Mat) => mat.fromRows([
            [A.get(0, 0), A.get(0, 1), 0],
            [A.get(1, 0), A.get(1, 1), 0],
            [          0,           0, 1],
        ])
        return new Aff2(liftMat(fwd), liftMat(rev))
    }

    /** The inverse affine transformation. */
    inv(): Aff2 {
        return new Aff2(this.rev, this.fwd)
    }

    /** Reversed composition, so that A.then(B) is BA. */
    then(aff: Aff2): Aff2 {
        return new Aff2(mat.multMat(aff.fwd, this.fwd), mat.multMat(this.rev, aff.rev))
    }

    /** Postcompose by translation. */
    translate(dx: number, dy: number): Aff2 {
        const transMat = (tx: number, ty: number) => mat.fromRows([
            [1, 0, tx],
            [0, 1, ty],
            [0, 0,  1],
        ])
        return this.then(new Aff2(transMat(dx, dy), transMat(-dx, -dy)))
    }

    /** Postcompose by scaling. */
    scale(sx: number, sy: number): Aff2 {
        const scaleMat = (x: number, y: number) => mat.fromRows([
            [x, 0, 0],
            [0, y, 0],
            [0, 0, 1],
        ])
        return this.then(new Aff2(scaleMat(sx, sy), scaleMat(1/sx, 1/sy)))
    }

    /** Postcompose by a complex multiplication. */
    complex(a: number, b: number): Aff2 {
        const complexMat = (a: number, b: number) => mat.fromRows([
            [a, -b, 0],
            [b,  a, 0],
            [0,  0, 1],
        ])

        // Since 1/(a + ib) = (a - ib)/(a^2 + b^2) we'll need this:
        let norm2 = a*a + b*b
        return this.then(new Aff2(complexMat(a, b), complexMat(a/norm2, -b/norm2)))
    }

    /** Postcompose by an anticlockwise rotation, speficied in radians. */
    rotate(radians: number): Aff2 {
        return this.complex(Math.cos(radians), Math.sin(radians))
    }

    /** The square root of the absolute value of the determinant of the 2x2 linear part of fwd.
     * If the 2x2 part is a scalar multiple of an orthogonal matrix (as one would often expect for
     * a coordinate transform where we allow scaling, translations, and rotations), then this is a
     * measure of "scale" or "zoom" which is applied to the scene. */
    detScale() {
        let det = this.fwd.get(0, 0) * this.fwd.get(1, 1) - this.fwd.get(0, 1) * this.fwd.get(1, 0)
        return Math.sqrt(Math.abs(det))
    }

    /** Lock the scaling factor in between a minimum and maximum. */
    clampScale(minScale: number, maxScale: number) {
        let scale = this.detScale()
        let clamped = Math.max(minScale, Math.min(maxScale, scale))
        if (scale == clamped)
            return this

        return this.scale(clamped/scale, clamped/scale)
    }

    // A bunch of convenience methods. Conventions: the "fwd" matrix takes us from (u, v) space
    // to (x, y) space. Aff2.x(u, v) is the x-coordinate for (u, v), i.e. applies the full affine
    // transformation and then tkes the first coordinate. Aff2.xLin(u, v) only applies the linear part.
    // xy, uv, etc all take and return vectors rather than scalars.
    x(u: number, v: number) { return this.fwd.get(0, 0) * u + this.fwd.get(0, 1) * v + this.fwd.get(0, 2) }
    y(u: number, v: number) { return this.fwd.get(1, 0) * u + this.fwd.get(1, 1) * v + this.fwd.get(1, 2) }
    xLin(u: number, v: number) { return this.fwd.get(0, 0) * u + this.fwd.get(0, 1) * v }
    yLin(u: number, v: number) { return this.fwd.get(1, 0) * u + this.fwd.get(1, 1) * v }
    u(x: number, y: number) { return this.rev.get(0, 0) * x + this.rev.get(0, 1) * y + this.rev.get(0, 2) }
    v(x: number, y: number) { return this.rev.get(1, 0) * x + this.rev.get(1, 1) * y + this.rev.get(1, 2) }
    uLin(x: number, y: number) { return this.rev.get(0, 0) * x + this.rev.get(0, 1) * y }
    vLin(x: number, y: number) { return this.rev.get(1, 0) * x + this.rev.get(1, 1) * y }
    xy([u, v]: number[]) { return [this.x(u, v), this.y(u, v)] }
    uv([x, y]: number[]) { return [this.u(x, y), this.v(x, y)] }
    xyLin([u, v]: number[]) { return [this.xLin(u, v), this.yLin(u, v)] }
    uvLin([x, y]: number[]) { return [this.uLin(x, y), this.vLin(x, y)] }
}

}
