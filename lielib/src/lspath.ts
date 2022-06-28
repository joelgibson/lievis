import { vec } from "./linear";
import { rtsys } from "./rootsystems";

export namespace lspath {

/** A piecewise-linear path in Z^n. */
class Path {
    private constructor(
        /** The list of points is normalised so that
         * 1. The sequence never stutters, i.e. repeats the same point twice in a row.
         * 2. Redundant points (those that do not look like corners) are removed: if [a, b, c] appears, then b is not a
         *    convex combination of a and c. We still allow a path to move forward and then backward along the same line.
         *    eg in Z^1 we allow [0, 1, -1, 1] as a path.
         */
        readonly points: number[][]
    ) {
        // Check that every point is integral.
        for (let i = 0; i < points.length; i++)
            if (!vec.isIntegral(points[i]))
                throw new Error(`The point ${points[i]} is not integral`)

        // Check the sequence does not stutter.
        for (let i = 0; i < points.length - 1; i++)
            if (vec.equal(points[i], points[i + 1]))
                throw new Error(`The same point appeared twice: ${points[i]} at index ${i}`)

        // TODO: Check that convex combinations do not appear in triples.
    }
}

/** Predicate checking whether a path is valid and normalised. A valid path:
 * 1. Starts at the origin (so necessarily has at least one vertex).
 * 2. Never stutters, i.e. the same point does not appear twice in a row, and
 * 3. In every adjacent triple [a, b, c], the point b is never a convex combination of a and c.
 */
export function assertPathNormalised(path: number[][]) {
    // The path must contain at least one point.
    if (path.length == 0)
        throw new Error(`Path is empty`)

    // The first point must be the origin.
    if (!vec.isZero(path[0]))
        throw new Error(`The path does not start at the origin.`)

    // The path must not stutter.
    for (let i = 0; i < path.length - 1; i++)
        if (vec.equal(path[i], path[i + 1]))
            throw new Error(`The same point appeared twice: ${path[i]} at index ${i}`)
}

/** Translate an affine path so that the first point is at the origin. */
export function rebase(path: number[][]): number[][] {
    if (path.length == 0)
        throw new Error("Path has no points")

    if (vec.isZero(path[0]))
        return path

    return path.map(pt => vec.sub(pt, path[0]))
}

/** Remove adjacent points which are sufficiently close together. */
export function removeRepeated(path: number[][]): number[][] {
    const EPS = 1e-4
    let result: number[][] = [path[0]]

    for (let i = 1; i < path.length; i++)
        if (vec.dist(result[result.length - 1], path[i]) > EPS)
            result.push(path[i])

    return result
}

/** Remove points which appear as a convex combination of adjacent points. */
export function removeRedundant(path: number[][]): number[][] {
    const EPS = 1e-4
    let result: number[][] = []

    for (let i = 0; i < path.length; i++) {
        result.push(path[i])
        if (result.length < 3)
            continue

        // [a, b, c] are colinear if the unit vector a->b is approx the same as the unit vector b->c.
        let a = result[result.length - 3]
        let b = result[result.length - 2]
        let c = result[result.length - 1]
        let ab = vec.scaleToNorm(vec.sub(b, a), 1)
        let bc = vec.scaleToNorm(vec.sub(c, b), 1)
        if (vec.dist(ab, bc) < EPS)
            result.splice(result.length-2, 1)
    }

    return result
}

/** Round points which are close to integers. */
export function roundNearIntegralPoints(path: number[][]): number[][] {
    const EPS = 1e-4
    for (let i = 0; i < path.length; i++) {
        for (let j = 0; j < path[i].length; j++) {
            let x = path[i][j]
            let rx = Math.round(x)
            if (Math.abs(x - rx) < EPS)
                path[i][j] = rx
        }
    }

    return path
}

/** Concatenate multiple paths starting at the origin, and simplify them. */
export function concat(...paths: number[][][]): number[][] {
    // Ensure all paths start with the origin.
    for (let k = 0; k < paths.length; k++)
        if (paths[k].length == 0 || !vec.isZero(paths[k][0]))
            throw new Error("All paths must contain at least one point, and start with the origin")

    let base = paths[0][0]
    let result: number[][] = []
    for (let k = 0; k < paths.length; k++) {
        for (let i = 0; i < paths[k].length; i++)
            result.push(vec.add(base, paths[k][i]))

        base = result[result.length - 1]
    }

    result = removeRepeated(result)
    result = removeRedundant(result)
    result = roundNearIntegralPoints(result)
    return result
}

export function f(rs: rtsys.IRootSystem, path: number[][], s: number): null | number[][] {
    assertPathNormalised(path)

    // We are following "A Littlewood-Richardson rule for symmetrizable Kac-Moody algebras", Littelmann, 1994.
    // The description in "Paths and Root Operators in Representation Theory" by Littelmann, 1995, is slightly different.

    // First we need to find the maximal integer Q attained by the sth coordinate of the path, and the point along
    // the path at which Q is first attained. Since we are evaluating a covector on a piecewise-linear path, the
    // global minimum must be at a corner point. Since all paths start with the origin, Q <= 0.
    //
    // Scan along the array, finding the last index p for which the sth coordinate is minimised.
    let Q = 0
    let p = 0
    for (let i = 1; i < path.length; i++) {
        if (path[i][s] <= Q) {
            Q = path[i][s]
            p = i
        }
    }
    // At this point Q may be fractional.
    console.log("Q = " + Q)

    let P = path[path.length-1][s] - Q

    // If P = 0, then f_s(path) = 0.
    if (P == 0)
        return null

    // We have P >= 1. Find the first point x after p such that the path passes through <path, alpha_s^> = Q + 1.
    // We just need to check for the first point after p such that the coordinate becomes >= Q + 1, but we may actually
    // have to split the path in order to have an x.
    //
    // We will search for xmax, which is either x, or the point where the path needs to be split.
    let xmax = p + 1
    for (; xmax < path.length; xmax++)
        if (path[xmax][s] >= Q + 1)
            break

    if (xmax == path.length)
        throw new Error("No suitable xmax")

    // We need to separate the path into three pieces: [0, p], [p, x], [x, end], and replace it with [0, p] * s[p, x] * [x, end].
    let first = path.slice(0, p + 1)
    let second: number[][]
    let third: number[][]

    // We have that the point (xmax - 1) < Q+1, and xmax >= Q + 1. We might have to 'cut' the segment between xmax-1 and xmax to
    // create a suitable point x.
    if (path[xmax][s] == Q + 1) {
        // Easy case: no need to cut the path.
        second = path.slice(p, xmax+1)
        third = path.slice(xmax, path.length)
    } else {
        // Harder case: have to cut the segment between xmax - 1 and xmax at the appropriate point.
        let diff = vec.sub(path[xmax], path[xmax-1])

        // Want the number r solving r*diff[s] + prev[s] = Q + 1
        let r = ((Q + 1) - path[xmax - 1][s]) / diff[s]
        let xpt = vec.addScaled(path[xmax - 1], diff, r)

        second = path.slice(p, xmax)
        second.push(xpt)

        third = [xpt, ...path.slice(xmax)]
    }

    //console.log("Original path:", fmt(path))
    //console.log("Sliced path:", fmt(first), fmt(second), fmt(third))
    //console.log(concat(first, rebase(second).map(pt => rtsys.simpleReflection(rs.cartan, 'weight', s, pt)), rebase(third)))
    let result = concat(first, rebase(second).map(pt => rtsys.simpleReflection(rs.cartan, 'weight', s, pt)), rebase(third))

    let newWt = result[result.length - 1]
    let expectedWt = vec.sub(path[path.length - 1], rs.posRoots[s].wt)
    if (!vec.equal(newWt, newWt))
        throw new Error(`New path had weight ${newWt}, expected ${expectedWt}`)

    console.log('New path:', fmt(result))
    return result
}

export function fmt(path: number[][]) {
    return '[' + path.map(pt => '(' + pt.join(',') + ')').join('|') + ')'
}

}
