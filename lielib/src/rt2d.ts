import { arr } from "./arr";
import type { CoxElt, EnumCox } from "./enumcox";
import {maps} from './maps'
import { Mat, mat, Vec, vec } from "./linear";
import { rtsys } from "./rootsystems";

/** Helpers for plotting two-dimensional root systems, and associated affine Coxeter groups. */
export namespace rt2d {
    /** The root system carries a symmetric bilinear form, canonical up to scalar on each irreducible
     * component. The gram matrix of this form is recorded in the symmetrised Cartan matrix. This function
     * constructs two vectors in R^2 with the same gram matrix, such that the first lies on the positive
     * x-axis and such that the second lies in the first quadrant. Then the matrix [v1, v2] of the column
     * vectors, and its inverse, are returned as the "projection" from weight space to Euclidean space, and
     * a "section" going backwards.
     *
     * A more general approach (which we do not take here, since here we only care about two dimensions)
     * would be to take the square root of the Gram matrix, then rotate/reflect the resulting vectors.
     */
    export function euclideanProjSect(rs: rtsys.IRootSystem) {
        if (rtsys.rank(rs) != 2)
            throw new Error("Root system should have rank 2.")

        let innProd = rtsys.innerProduct(rs, 'wt')
        let angle = Math.acos(innProd.get(0, 1) / Math.sqrt(innProd.get(0, 0) * innProd.get(1, 1)))
        let fundImages = [
            vec.scaleToNorm([1, 0], Math.sqrt(innProd.get(0, 0))),
            vec.scaleToNorm([Math.cos(angle), Math.sin(angle)], Math.sqrt(innProd.get(1, 1)))
        ]
        let proj = mat.fromColumns(fundImages)
        let sect = mat.inverse(proj)

        return {proj, sect}
    }

    /** AffineAlcove holds data for plotting an alcove geometrically. It works in the basis of fundamental
     * weights, and using affine vectors (each vector is rank + 1 long, and the last element is a 1).
     */
    export type AffineAlcove = {
        /** Index of element as considered by EnumCox. */
        x: number

        /** Vertices of fundamental alcove, in affine form. The s-wall is made out of
         * all the vertices excluding the s-th. For example, in two dimensions this will
         * be [[1/a0, 0, 1], [0, 1/a1, 1], [0, 0, 1]].
        */
       verts: Vec[]

       /** Centre of mass of the fundamental alcove. */
       com: Vec
    }

    export class AffineData {
        private affSimpleRefs: Mat[]
        private affineWeylMatrixCache: maps.IMap<CoxElt, Mat>
        private affineAlcoveCache: maps.IMap<CoxElt, AffineAlcove>

        constructor(
            readonly rs: rtsys.IRootSystem,
            readonly cox: EnumCox,
        ) {
            let rank = rtsys.rank(rs)

            // Seed the affine Weyl transformations.
            this.affineWeylMatrixCache = new maps.FlatIntMap<Mat>()
            this.affineWeylMatrixCache.set(cox.id, mat.id(rank + 1))
            this.affSimpleRefs = rtsys.affineSimpleReflectionMatrices(rs, 'wt')

            // Seed the first alcove
            let marks = rtsys.highestCoroot(rs).rt
            this.affineAlcoveCache = new maps.FlatIntMap<AffineAlcove>()
            this.affineAlcoveCache.set(cox.id, {
                x: cox.id,
                verts: arr.fromFunc(rank + 1, s => {
                    if (s == rank)
                        return arr.fromFunc(rank + 1, i => (i == rank) ? 1 : 0)
                    return arr.fromFunc(rank + 1, i => (i == s) ? 1/marks[i] : (i == rank) ? 1 : 0)
                }),
                com: arr.fromFunc(rank + 1, i => (i == rank) ? 1 : 1/marks[i]/(rank + 1))
            })
        }

        /** Return the (rank + 1) x (rank + 1) matrix representing the matrix of the affine
         * Weyl element x acting on the rank-dimension plane.
         */
        affineWeylMatrix(x: CoxElt): Mat {
            if (this.affineWeylMatrixCache.contains(x))
                return this.affineWeylMatrixCache.get(x)

            let s = this.cox.firstDescentL(x)
            let sx = this.cox.multL(s, x)
            let trans = mat.multMat(this.affSimpleRefs[s], this.affineWeylMatrix(sx))
            this.affineWeylMatrixCache.set(x, trans)
            return trans
        }

        affineAlcove(x: CoxElt): AffineAlcove {
            //console.log("Affine alcove!")
            if (this.affineAlcoveCache.contains(x))
                return this.affineAlcoveCache.get(x)

            let s = this.cox.firstDescentL(x)
            let sx = this.cox.multL(s, x)
            let smallerAlcove = this.affineAlcove(sx)
            let alcove = {
                x,
                verts: smallerAlcove.verts.map(v => mat.multVec(this.affSimpleRefs[s], v)),
                com: mat.multVec(this.affSimpleRefs[s], smallerAlcove.com)
            }
            this.affineAlcoveCache.set(x, alcove)
            return alcove
        }
    }
}
