import {arr, mat, matmut} from 'lielib'
import type {Mat} from 'lielib'

export class BasisGraph {
    adj = new Map<string, Map<string, Mat>>()
    id: Mat

    constructor(initBasis: string, readonly uptoN: number) {
        this.adj.set(initBasis, new Map())
        this.id = mat.id(uptoN)
    }

    bases() {
        return this.adj.keys()
    }

    getTransition(source: string, target: string): Mat {
        if (!this.adj.has(source))
            throw new Error(`The basis "${source}" is not defined.`)

        if (source == target)
            return this.id

        return this.adj.get(source).get(target)
    }

    addTransition(source: string, target: string, matrix: Mat) {
        if (this.adj.has(source))
            throw new Error(`Already have the basis "${source}"`)
        if (!this.adj.has(target))
            throw new Error(`Unknown target basis "${target}"`)

        // Install the new node and the bidirectional edge to target.
        let inv = mat.invertUpperTriangular(matrix)
        this.adj.set(source, new Map([[target, matrix]]))
        this.adj.get(target).set(source, inv)

        // Fully connect the other bases.
        for (let basis of this.adj.keys()) {
            if (basis == source || basis == target)
                continue

            this.adj.get(source).set(basis, mat.multUpperTriangular(this.getTransition(target, basis), matrix))
            this.adj.get(basis).set(source, mat.multUpperTriangular(inv, this.getTransition(basis, target)))
        }
    }
}

/** The upper-unitriangular transition matrix from Weyls to monomials. */
export function weylToMonomial(uptoN: number) {
    let trans = mat.zero(uptoN, uptoN)
    for (let j = 0; j < uptoN; j++)
        for (let i = j; i >= 0; i -= 2)
            matmut.set(trans, i, j, 1)

    return trans
}

/** The upper-unitriangular transition matrix from simples to monomials. */
export function simpleToMonomial(uptoN: number, prime: number): Mat {
    // Calculate binomial coefficients modulo p, and at the end go back through and set anything nonzero to 1.
    // The trick is that we're only calculating half the array, so we need to "reflect" at 0.
    let trans = mat.id(uptoN)
    for (let col = 1; col < uptoN; col++) {
        for (let row = col - 2; row >= 0; row -= 2) {
            let a = trans.get(row + 1, col - 1)
            let b = (row == 0) ? a : trans.get(row - 1, col - 1)
            matmut.set(trans, row, col, (a + b) % prime)
        }
    }
    for (let col = 0; col < uptoN; col++)
        for (let row = 0; row < uptoN; row++)
            matmut.set(trans, row, col, (trans.get(row, col) == 0) ? 0 : 1)

    return trans
}

/** The upper-unitriangular transition matrix from tiltings to Weyls. */
export function tiltingToWeyl(uptoN: number, prime: number): Mat {
    let trans = mat.zero(uptoN, uptoN)

    // First fill out the cases where titltings coincide with Weyls coincide with simples.
    for (let i = 0; i < prime; i++)
        matmut.set(trans, i, i, 1)

    // Now fill out the remaining cases in X_1 + Steinberg
    for (let i = prime; i < 2*prime - 1; i++) {
        matmut.set(trans, i, i, 1)

        // Perform the dot-reflection over the first p-dialated hyperplane: we have
        // w(x) = 2p - x, so w ∙ x = w(x + 1) - 1 = 2p - x - 2
        matmut.set(trans, 2*prime - i - 2, i, 1)
    }

    // Now use Donkin and algebra with the Weyl characters.
    for (let n = 2*prime - 1; n < uptoN; n++) {
        // Decompose n = λ + pμ where lambda is in X_1 + Steinberg and μ is dominant.
        let lambda = ((n - prime + 1) % prime) + prime - 1
        let mu = (n - prime + 1) / prime | 0

        // For each χ(i) in the character of T(λ), multiply with χ(μ)^(p) by expanding.
        for (let i = 0; i <= lambda; i++) {
            let imult = trans.get(i, lambda)
            if (imult == 0)
                continue

            for (let j = 0; j <= mu; j++) {
                let jmult = trans.get(j, mu)
                if (jmult == 0)
                    continue

                for (let k = prime*j; k >= -prime*j; k -= 2*prime) {
                    // Add a χ(z), but if z is negative we will need to ∙-reflect it. If z = -1 then χ(z) = 0.
                    let mult = 1
                    let z = i + k
                    if (z == -1)
                        continue

                    if (z < 0) {
                        z = 0 - z - 2
                        mult = -1
                    }

                    matmut.set(trans, z, n, trans.get(z, n) + mult * imult * jmult)
                }
            }
        }
    }

    return trans
}

/** The basis graph for SL2 in prime characteristic. */
export function SL2BasisGraph(uptoN: number, prime: number): BasisGraph {
    let graph = new BasisGraph('monomial', uptoN)
    graph.addTransition('simple', 'monomial', simpleToMonomial(uptoN, prime))
    graph.addTransition('weyl', 'monomial', weylToMonomial(uptoN))
    graph.addTransition('tilting', 'weyl', tiltingToWeyl(uptoN, prime))
    return graph
}

/** The W_p orbit of a point, returned as an increasing list. */
export function WpOrbit(uptoN: number, prime: number, lambda: number): number[] {
    let orbit = arr.constant(uptoN, false)
    orbit[lambda] = true
    function addPoints() {
        let count = 0
        for (let i = 0; i < orbit.length; i++) {
            if (!orbit[i])
                continue

            for (let wall = prime; wall < uptoN; wall += prime) {
                let reflection = wall - i
                if (reflection < 0)
                    reflection = 0 - reflection
                if (!orbit[reflection]) {
                    orbit[reflection] = true
                    count += 1
                }
            }
        }
        return count
    }

    while (addPoints() != 0);
    let points: number[] = []
    for (let i = 0; i < orbit.length; i++)
        if (orbit[i])
            points.push(i)

    return points
}
