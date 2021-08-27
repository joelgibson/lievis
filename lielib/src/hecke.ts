// This file has some ugly code since we need cell computations in the full Hecke algebra to be
// really really fast, but other computations can be done by mostly-immutable objects.

import { arr } from "./arr";
import { digraph } from "./digraph";
import { maps } from "./maps";

import type { CoxElt, EnumCox } from "./enumcox";
import { lpoly } from "./lpoly";

/** Implementation of Hecke algebras and single-variable Laurent polynomials. */
export namespace hecke {

// TODO: Perhaps this should be a proper type?
export type GrpAlgElt = maps.IMap<number, number>

/** An LPoly-linear combination of Coxeter group elements. */
export class HeckeElt {
    terms = new maps.FlatIntMap<lpoly.LPoly>()

    forEach(fn: (key: CoxElt, value: lpoly.LPoly) => void): void {
        for (let i = 0; i < this.terms.keys.length; i++) {
            let key = this.terms.keys[i]
            let val = this.terms.values[i]
            if (!lpoly.isZero(val))
                fn(key, val)
        }
    }

    /** Tests whether x appears in the HeckeElt with a nonzero coefficient. */
    isSupportedAt(x: CoxElt) {
        return !lpoly.isZero(this.terms.getWithDefault(x, lpoly.zero))
    }

    /** The number of nonzero terms in the sum. */
    supportSize() {
        let count = 0
        for (let i = 0; i < this.terms.values.length; i++)
            count += lpoly.isZero(this.terms.values[i]) ? 0 : 1

        return count
    }

    /** Get the coefficient corresponding to x (or 0 if x does not appear). */
    get(x: CoxElt) {
        return this.terms.getWithDefault(x, lpoly.zero)
    }

    static zero = new HeckeElt()

    /** Construct the unit element of the algebra from a Laurent polynomial scalar. */
    static unit(scalar: lpoly.LPoly) {
        if (lpoly.isZero(scalar))
            return HeckeElt.zero

        let elt = new HeckeElt()
        elt.terms.set(0, scalar)
        return elt
    }

    /** Specialise v to an integer, returning a group algebra element. */
    eval(v: number): GrpAlgElt {
        return maps.mapValues(maps.FlatIntMap, this.terms, (key, poly) => lpoly.evaluate(poly, v))
    }

    /** An ad-hoc serialisation for testing purposes. */
    serialise(): [number, string][] {
        let result: [number, string][] = []
        this.forEach((coxElt, poly) => {
            if (!lpoly.isZero(poly))
                result.push([coxElt, lpoly.fmt(poly)])
        })

        return result.sort(([k1, v1], [k2, v2]) => k1 - k2)
    }
}

// "Dense" canonical basis computation
//
// In order to display cells quickly, we need to calculate a whole lot of canonical basis elements
// really really fast. This precludes using HeckeElts (there is a long tale of woe here involving
// me trying to do weird stuff like make them mutable, pack them all into a single array with "cursors"
// accessing them, and so on ... but this still can't get as fast as what we're about to do, and
// complicates the programming enormously).
//
// What we will do instead is very stupid (and I wouldn't try it for affine groups which are greater
// than two or three dimensional). The canonical basis element b(x) = (sum over y, x) h_{y, x} δ_y
// will be represented as a two-dimensional array, with one dimension running over the Coxeter group
// elements y with y ≤ x in the enumeration, and the other dimension running over the degrees of
// polynomial terms, [0, ..., l(x)]. This is quite wasteful: not all elements lower than x in the
// enumeration are actually lower than x in the Bruhat order, so rows indexed by those elements will
// just be full of zeros. Furthermore, only one half of this 2D array will be nonzero because the
// maximum degree of h_{y, x} is l(x) - l(y). However, this allows us to add and subtract Z-linear
// multiples of canonical basis elements incredibly fast, because all of the elements "line up" along
// the Coxeter element dimension.
//
// When we lay this 2D array out as a 1D array, the Laurent polynomials will be contiguous. Let
// 'width' be the number of terms allowed in a polynomial, then the Laurent polynomial for the
// Coxeter group element y can be accessed at data[y*width, ..., (y+1)*width). We are using the fact
// that all Laurent polynomials encountered throughout the computation are genuine polynomials.
//
// Here we only define three basic operations:
//   1. Create the "unit" canonical basis element b(id) = δ(id)
//   2. Multiply an existing basis element on the right by b(s)
//   3. Add/subtract scalar multiples of one element from another.
// After this, the canonical basis element b(y) = b(ys)*b(s) - (sum over x: xs < x < ys) mu(x, ys) b(x),
// but this logic is taken care of elsewhere, where we can cache previously computed elements.
class CanElt {
    private constructor(
        readonly width: number,         // The maximum number of terms in the polynomial.
        readonly height: number,        // height-1 is the Coxeter group element.
        readonly data: Int32Array,      // The backing array of size width * height.
    ) {}

    /** The canonical basis element corresponding to the unit group element. Technically the
     * width here does not need to be 2, but we are assuming later on that the v coefficient
     * is present in every data array.
    */
    static unit() {
        return new CanElt(2, 1, Int32Array.from([1, 0]))
    }

    /** Create a new zeroed element. */
    static zero(width: number, height: number) {
        return new CanElt(width, height, new Int32Array(width * height))
    }

    /** Right-multiply a CanElt by b_s, creating a new CanElt. */
    static act(elt: CanElt, cox: EnumCox, s: number) {
        let x = elt.height - 1
        if (cox.descendsR(x, s))
            throw new Error("xs < x")

        let xs = cox.multR(x, s)
        let newElt = CanElt.zero(cox.length(xs) + 1, xs + 1)

        // The formula for right multiplication by b(s) on the standard basis is:
        // δ(y) b(s) =
        //      δ(ys) + v δ(y)     if ys > y
        //      δ(ys) + v^-1 δ(y)  if ys < y
        for (let y = 0; y <= x; y++) {
            if (elt.isZero(y))
                continue

            CanElt.mutAddScaledRow(newElt, cox._multR(y, s), elt, y, 0)
            CanElt.mutAddScaledRow(newElt, y, elt, y, (cox._descendsR(y, s)) ? -1 : 1)
        }

        return newElt
    }

    /** dst[dstx] <- dst[dstx] + v^shift * src[srcx]. This will only be used for shifts in {-1, 0, 1}. */
    static mutAddScaledRow(dst: CanElt, dstx: CoxElt, src: CanElt, srcx: CoxElt, shift: number) {
        const width = src.width
        for (let i = Math.max(0, 0-shift); i < width; i++)
            dst.data[dstx * dst.width + i + shift] += src.data[srcx * src.width + i]
    }

    /** elt1 <- elt1 + elt2 * scalar.*/
    static mutAddScaled(elt1: CanElt, elt2: CanElt, scalar: number) {
        if (!(elt2.width <= elt1.width && elt2.height <= elt1.height))
            throw new Error("Must be adding/subtracting a smaller element.")

        for (let y = 0; y < elt2.height; y++)
            for (let i = 0; i < elt2.width; i++)
                elt1.data[elt1.width * y + i] += elt2.data[elt2.width * y + i] * scalar
    }

    /** Return whether a whole polynomial is zero or not. */
    isZero(y: CoxElt): boolean {
        for (let i = 0; i < this.width; i++)
            if (this.data[y * this.width + i] != 0)
                return false

        return true
    }

    /** Return a slice of the array, giving the polynomial associated to y. */
    polyCoeffs(y: CoxElt): number[] {
        let coeffs: number[] = []
        for (let i = 0; i < this.width; i++)
            coeffs[i] = this.data[y * this.width + i]

        return coeffs
    }
}


export class HeckeAlg {
    constructor(
        readonly cox: EnumCox,
        readonly subGrpTok: number = 0
    ) {}

    readonly zero = HeckeElt.zero
    readonly one = HeckeElt.unit(lpoly.unit(1))

    applyLinear(elt: HeckeElt, f: (w: CoxElt) => HeckeElt): HeckeElt {
        let result = new HeckeElt()
        elt.forEach((z, zcoeff) => {
            f(z).forEach((w, wcoeff) => {
                result.terms.set(w, lpoly.add(result.get(w), lpoly.mul(zcoeff, wcoeff)))
            })
        })
        return result
    }

    // This function recursively calculates CanElts (i.e. the dense version of canonical basis
    // elements). We won't use it for antispherical canonical basis elements.
    private canEltCache = new maps.FlatIntMap<CanElt>()
    private canElt(x: CoxElt): CanElt {
        if (this.canEltCache.contains(x))
            return this.canEltCache.get(x)

        if (x == 0) {
            this.canEltCache.set(0, CanElt.unit())
            return this.canEltCache.get(0)
        }

        let s = this.cox.firstDescentR(x)
        let xs = this.cox.multR(x, s)
        let Bxs = this.canElt(xs)
        let result = CanElt.act(Bxs, this.cox, s)
        for (let y = 0; y < Bxs.height; y++) {
            // Get the coefficient of v in the δ(y) polynomial of B(xs). This is safe to
            // access: we have made sure that even for the identity this slot always exists.
            let coeff = Bxs.data[y * Bxs.width + 1]
            if (coeff != 0 && this.cox.descendsR(y, s))
                CanElt.mutAddScaled(result, this.canElt(y), -coeff)
        }

        this.canEltCache.set(x, result)
        return result
    }

    private canCache = new maps.FlatIntMap<HeckeElt>()

    /** Return the canonical basis element corresponding to x. */
    can(x: CoxElt): HeckeElt {
        // If we are in the full Hecke algebra, use the "dense" version.
        if (this.subGrpTok == 0) {
            let canElt = this.canElt(x)
            let elt = new HeckeElt()
            for (let y = 0; y <= x; y++)
                if (!canElt.isZero(y))
                    elt.terms.set(y, lpoly.fromValCoeffs(0, canElt.polyCoeffs(y)))

            return elt
        }

        // Otherwise, use the "sparse" version. First check the cache.
        if (this.canCache.contains(x))
            return this.canCache.get(x)

        // Base case: identity.
        if (x == 0) {
            let result = HeckeElt.unit(lpoly.unit(1))
            this.canCache.set(0, result)
            return result
        }

        // Recursive case
        let s = this.cox.firstDescentR(x)
        let xs = this.cox.multR(x, s)
        let Bxs = this.can(xs)
        let result = new HeckeElt()

        // Set result = b(xs) * b(s)
        // The formula for right multiplication by b(s) on the standard basis is:
        // δ(y) b(s) =
        //      δ(ys) + v δ(y)     if ys > y
        //      δ(ys) + v^-1 δ(y)  if ys < y
        Bxs.forEach((z, zcoeff) => {
            let zs = this.cox.multR(z, s)
            if (!this.cox.isRightMinimal(this.subGrpTok, zs))
                return

            let shift = this.cox.descendsR(z, s) ? -1 : 1
            result.terms.set(zs, lpoly.add(result.get(zs), zcoeff))
            result.terms.set(z, lpoly.add(result.get(z), lpoly.shift(zcoeff, shift)))
        })

        // Subtract off the mus
        this.muvec(xs).forEach((z, mucoeff) => {
            if (!this.cox.descendsR(z, s))
                return

            this.can(z).forEach((w, wcoeff) => {
                result.terms.set(w, lpoly.sub(result.get(w), lpoly.scale(wcoeff, mucoeff)))
            })
        })

        this.canCache.set(x, result)
        return result
    }

    /** Return the mu-vector corresponding to x. */
    muvec(x: CoxElt): maps.FlatIntMap<number> {
        // If we are in the full Hecke algebra, use the "dense" version.
        if (this.subGrpTok == 0) {
            let canElt = this.canElt(x)
            let result = new maps.FlatIntMap<number>()
            for (let y = 0; y <= x; y++) {
                let coeff = canElt.data[canElt.width * y + 1]
                if (coeff != 0)
                    result.set(y, coeff)
            }

            return result
        }

        // Otherwise, use the "sparse" version.
        let Bx = this.can(x)
        let result = new maps.FlatIntMap<number>()
        Bx.forEach((z, poly) => {
            let vcoeff = lpoly.coefficient(poly, 1)
            if (vcoeff != 0)
                result.set(z, vcoeff)
        })
        return result
    }


    /** Returns a mapping of CoxElt => Cell index, for all enumerated Coxeter elements of
     * length at most upToLength.
     */
    cells(upToLength: number, rejectAboveLength?: number) {
        performance.mark('cellStart')

        // Represent an edge (z <- R <- w) by putting w in z's adjacency list.
        let adjRight: number[][] = arr.fromFunc(this.cox.size(), () => [])
        let adjLeft: number[][] = arr.fromFunc(this.cox.size(), () => [])
        let adjTwosided: number[][] = arr.fromFunc(this.cox.size(), () => [])
        const addRightEdge = function(i: number, j: number) {
            if (adjRight[i].indexOf(j) < 0)
                adjRight[i].push(j)
            if (adjTwosided[i].indexOf(j) < 0)
                adjTwosided[i].push(j)
        }
        const addLeftEdge = function(i: number, j: number) {
            if (adjLeft[i].indexOf(j) < 0)
                adjLeft[i].push(j)
            if (adjTwosided[i].indexOf(j) < 0)
                adjTwosided[i].push(j)
        }

        let eltCount = 0

        for (let y = 0; y < this.cox.size(); y++) {
            if (this.cox.length(y) > upToLength)
                continue
            // Every element is linked to itself.
            addRightEdge(y, y)
            addLeftEdge(y, y)
            eltCount += 1

            for (let s = 0; s < this.cox.rank; s++) {
                // When right multiplying B(y) by B(s), if ys < y then B(y)B(s) = (v + v^-1)B(y), so nothing more to do.
                // Otherwise, B(y)B(s) = B(ys) + sum_{z < y, zs < z} mu(z, y) B(z), so we will first add an edge to ys,
                // then go through all of the nonzero mu's and check the zs < z condition.

                // There is always an edge y -> ys if y < ys, and similarly for left multiplication. We
                // just need to check that ys is contained in the enumerated part.
                let ascendsR = !this.cox.descendsR(y, s)
                if (ascendsR && this.cox.isMultRDefined(y, s))
                    addRightEdge(this.cox.multR(y, s), y)

                let ascendsL = !this.cox.descendsL(s, y)
                if (ascendsL && this.cox.isMultLDefined(s, y))
                    addLeftEdge(this.cox.multL(s, y), y)

                let muy = this.muvec(y)
                for (let i = 0; i < muy.keys.length; i++) {
                    let z = muy.keys[i]
                    let mu = muy.values[i]
                    if (mu == 0)
                        continue

                    if (ascendsR && this.cox.descendsR(z, s))
                        addRightEdge(z, y)
                    if (ascendsL && this.cox.descendsL(s, z))
                        addLeftEdge(z, y)
                }
            }
        }

        // If we are rejecting elements above a certain length, find the minimum index with that length.
        let reject: undefined | number = undefined
        if (rejectAboveLength !== undefined) {
            for (let x = 0; x < this.cox.size(); x++) {
                if (this.cox.length(x) >= rejectAboveLength) {
                    reject = x
                    break
                }
            }
        }

        performance.mark('cellEnd')
        performance.measure('cell calculation', 'cellStart', 'cellEnd')
        console.log(performance.getEntriesByType('measure'))
        console.log(`${eltCount} elements involved in cell calculation`)


        // Return the strong components
        return {
            left: strongComponents(adjLeft, reject),
            right: strongComponents(adjRight, reject),
            twosided: strongComponents(adjTwosided, reject),
        }
    }
}

export type SCCReturnType = {
    G: digraph.Digraph<CoxElt, null, null>
    scc: number[]
}

/** Tarjan's strongly connected components algorithm, for a graph with indices [0, N) using
 * an adjacency list where a[i][j] means there is an arrow i -> j.
 */
 function strongComponents(adj: number[][], rejectAbove?: number): SCCReturnType {
    // Tarjan's strongly connected component algorithm.
    let stack: number[] = []
    let vindex: number[] = arr.fromFunc(adj.length, () => -1)
    let onStack: boolean[] = arr.fromFunc(adj.length, () => false)
    let lowlink: number[] = arr.fromFunc(adj.length, () => 0)
    let index = 0

    let sccIndex = 0
    let scc: number[] = arr.fromFunc(adj.length, () => -1)
    let sccDag: number[][] = []

    let strongconnect = function(v: number) {
        vindex[v] = index
        lowlink[v] = index
        index += 1
        stack.push(v)
        onStack[v] = true

        for (let j = 0; j < adj[v].length; j++) {
            let w = adj[v][j]
            if (vindex[w] < 0) {
                strongconnect(w)
                lowlink[v] = Math.min(lowlink[v], lowlink[w])
            } else if (onStack[w]) {
                lowlink[v] = Math.min(lowlink[v], vindex[w])
            }
        }

        if (lowlink[v] == vindex[v]) {
            // Locate v in the stack. Everything v and above is in the new SCC.
            let vpos = stack.lastIndexOf(v)

            // Find the minimum index of any element of this SCC. This is used to heuristically
            // reject small cells.
            let min = v
            for (let i = vpos; i < stack.length; i++)
                min = Math.min(min, stack[i])

            // If we should reject this, assign to -1.
            let newSCCIndex = (rejectAbove !== undefined && rejectAbove < min) ? -1 : sccIndex
            if (newSCCIndex >= 0)
                sccIndex += 1

            // If we took this SCC, find any links to others.
            if (newSCCIndex >= 0) {
                let newAdj: number[] = []
                for (let i = vpos; i < stack.length; i++)
                    for (let j = 0; j < adj[stack[i]].length; j++)
                        if (scc[adj[stack[i]][j]] >= 0 && newAdj.indexOf(scc[adj[stack[i]][j]]) < 0)
                            newAdj.push(scc[adj[stack[i]][j]])

                sccDag[newSCCIndex] = newAdj
            }

            let w = -1
            do {
                w = stack.pop()!
                onStack[w] = false
                scc[w] = newSCCIndex
            } while (w != v)
        }
    }

    for (let i = 0; i < adj.length; i++)
        if (vindex[i] < 0)
            strongconnect(i)

    let G = new digraph.Digraph<number, null, null>(() => new maps.FlatIntMap())
    for (let i = 0; i < sccDag.length; i++) {
        G.addNode(i, null)
        for (let j = 0; j < sccDag[i].length; j++)
            G.addEdge(sccDag[i][j], i, null)
    }

    return {scc, G: digraph.transitiveReduction(G)}
}

}
