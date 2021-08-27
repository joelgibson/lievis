import { arr } from './arr'
import { bits } from './bits'
import { draw } from './draw'
import { Mat, mat, matmut, vec, Vec } from './linear'
import { num } from './num'

/** Cartan data and Cartan matrices. */
export namespace cartan {
    /** Predicate testing whether a matrix is a generalised Cartan matrix.
     * A GCM is a square integral matrix such that:
     *  (1) The diagonal elements are all 2.
     *  (2) The off-diagonal elements are <= 0.
     *  (3) A(i, j) = 0 iff A(j, i) = 0.
     */
     export function isGCM(mat: Mat): boolean {
        if (mat.nrows != mat.ncols)
            return false
        
        for (let i = 0; i < mat.nrows; i++) {
            for (let j = 0; j < mat.ncols; j++) {
                if (!num.isInteger(mat.get(i, j)))
                    return false
                
                if (i == j && mat.get(i, j) != 2)
                    return false
                
                if (i != j && mat.get(i, j) > 0)
                    return false
                
                if (i != j && mat.get(i, j) == 0 && mat.get(j, i) != 0)
                    return false
            }
        }
        
        return true
    }

    /** Predicate testing whether a matrix is a Coxeter matrix.
     * A coxeter matrix is a square integral matrix such that:
     *   (1) The diagonals are all 1.
     *   (2) The matrix is symmetric.
     *   (3) The off-diagonal entries are either >= 2, or 0 (representing infinity).
     */
    export function isCoxeterMat(M: Mat): boolean {
        if (!mat.isSymmetric(M) || !mat.isIntegral(M))
            return false
        
        for (let i = 0; i < M.nrows; i++)
            if (M.get(i, i) != 1)
                return false
        
        for (let i = 0; i < M.nrows; i++)
            for (let j = i + 1; j < M.nrows; j++)
                if (M.get(i, j) == 1 || M.get(i, j) < 0)
                    return false
        
        return true
    }

    /** The Coxeter matrix associated to the Cartan matrix. */
    export function cartanMatToCoxeterMat(cartan: Mat): Mat {
        if (!isGCM(cartan))
            throw new Error("Matrix was not a generalised Cartan matrix.")
        
        return mat.fromEntries(cartan.nrows, cartan.ncols, (i, j) => {
            // The Coxeter matrix has 1's down the diagonal, since (ss)^1 = 1.
            if (i == j)
                return 1
            
            // Otherwise, the entry is determined by A_ij A_ji, via the mapping
            //   a = 0    =>    m_st = 2
            //   a = 1    =>    m_st = 3
            //   a = 2    =>    m_st = 4
            //   a = 3    =>    m_st = 6
            //   a >= 4   =>    m_st = infinity
            // By convention, infinity in our Coxeter matrices is 0.
            let a = cartan.get(i, j) * cartan.get(j, i)
            return (a < 4) ? [2, 3, 4, 6][a] : 0
        })
    }

    /** Return a vector of even positive integers: the square lengths of the associated root system,
     * normalised so that the short roots have square length 2. If d[i] is the ith entry returned, then
     * scaling each row of the Cartan by d[i] / 2 makes the Cartan into a symmetric positive-definite
     * matrix.
     * 
     * This algorithm is very dumb, and goes over the Cartan matrix a bunch of times until it "converges".
     * Perhaps we should switch to something less dumb?
     */
    export function squareLengths(cartan: Mat): Vec {
        let rank = cartan.nrows

        // We have (ai, ai)/(aj, aj) = <aj^, ai>/<ai', aj> = a_ji / a_ij.
        // Play a game on the Dynkin diagram, with every vertex starting with a norm of 2.
        // Each edge (considered as directed) implies something about its target: whenever an edge
        // implies that its target is an integral multiple of it, replace the norm of its target with
        // the max of its current norm, and its implied norm.
        //
        // After playing this game rank many times, we should have arrived at a symmetrisation.
        let norm = arr.constant(rank, 2)
        for (let count = 0; count < rank; count++) {
            for (let i = 0; i < rank; i++) {
                for (let j = 0; j < rank; j++) {
                    let aij = cartan.get(i, j)
                    let aji = cartan.get(j, i)
                    if (aij == 0)
                        continue
                    
                    let r = aji / aij
                    let impliednormi =
                        (r == 1) ? norm[j] :
                        (num.isInteger(r) && r > 1) ? r * norm[j] :
                        norm[i]
                    norm[i] = Math.max(impliednormi, norm[i])
                }
            }
        }

        return norm
    }

    /** Return the symmetrised Cartan matrix, using the symmetrising factors d[i]/2 returned from squareLengths(). */
    export function symmetrise(cartan: Mat): Mat {
        let d = squareLengths(cartan)
        let B = mat.copy(cartan)
        for (let i = 0; i < B.nrows; i++)
            matmut.erScale(B, i, d[i] / 2)
        
        return B
    }
    
    /** Convert a Cartan datum to a Cartan matrix: a[i, j] = 2 c[i, j] / c[i, i]. */
    export function datumToCartanMat(dat: Mat): Mat {
        if (!datumIsValid(dat)) {
            mat.debugPrint(dat)
            throw new Error(`Given Cartan datum is invalid.`)
        }

        return mat.fromEntries(dat.nrows, dat.ncols, (i, j) => {
            return (2 * dat.get(i, j) / dat.get(i, i)) | 0
        })
    }

    /** Return the connected components of a cartan matrix or cartan datum. (More generally, for any
     * square matrix define a graph where i connects to j whenever a_ij or a_ji are nonzero. This
     * function returns the connected components of the graph.)
    */
    export function connectedComponents(A: Mat): number[][] {
        if (!mat.isSquare(A))
            throw new Error("Connected components only applies to square matrices.")
        
        // Special case the empty matrix: an empty connected component.
        if (A.nrows == 0)
            return [[]]

        let rank = A.nrows
        let comps: number[][] = []
        let seen = arr.constant(rank, false)
        let stack: number[] = []
        for (let start = 0; start < rank; start++) {
            if (seen[start])
                continue
            
            let comp = [start]
            stack.push(start)
            while (stack.length > 0) {
                let i = stack.pop()!
                for (let j = 0; j < rank; j++) {
                    if (seen[j] || A.get(i, j) == 0 && A.get(j, i) == 0)
                        continue
                    
                    stack.push(j)
                    comp.push(j)
                    seen[j] = true
                }
            }

            comps.push(comp)
        }

        return comps
    }

    /** Return an array of bit-masks of all connected subgraphs of a Cartan matrix or Cartan datum, in
     * decreasing order of cardinality, and increasing numerically within each cardinality.
     */
    export function connectedSubgraphMasks(A: Mat): number[] {
        let rank = A.nrows

        // All connected subtrees can be generated from larger connected subtrees by
        // deleting leaves.

        /** The degree of i in the subgraph induced by mask. */
        function deg(mask: number, i: number): number {
            let deg = 0
            for (let j = 0; j < A.nrows; j++)
                if (((1 << j) & mask) != 0 && A.get(i, j) != 0)
                    deg += 1
            
            // Return deg - 1 since we counted ourselves.
            return deg - 1
        }

        let comps = connectedComponents(A)
        let stack = comps.map(comp => comp.reduce((a, b) => a | (1 << b), 0))
        let masks = new Set<number>(stack)
        while (stack.length > 0) {
            let mask = stack.pop()!
            for (let i = 0; i < rank; i++) {
                if ((mask & (1 << i)) == 0 || deg(mask, i) != 1)
                    continue
                
                let newMask = mask & (~(1 << i))
                if (masks.has(newMask))
                    continue
                
                masks.add(newMask)
                stack.push(newMask)
            }
        }

        // Also add the empty component.
        masks.add(0)

        return Array.from(masks).sort((a, b) => {
            let pop = bits.popCount(b) - bits.popCount(a)
            return (pop != 0) ? pop : a - b
        })
    }

    /** Return a Cartan matrix for the specified finite irreducible type.
     * The numbering convention agrees with Table Fin in Kac.
     */
     export function cartanMat(type: string, rank: number, aff?: number): Mat {
        return datumToCartanMat(cartanDat(type, rank, aff))
    }

    /** Return the Coxeter matrix for the specified finite irreducible type. */
    export function coxeterMat(type: string, rank: number): Mat {
        return cartanMatToCoxeterMat(cartanMat(type, rank))
    }

    /** Check that a Cartan datum is valid: it must be symmetric, with positive multiples of two along the
     * diagonal, and such that 2 c[i, j] / c[i, i] is an integer <= 0 for off-diagonal entries.
     */
    export function datumIsValid(dat: Mat): boolean {
        if (dat.nrows != dat.ncols) return false
        for (let i = 0; i < dat.nrows; i++) {
            for (let j = 0; j < dat.ncols; j++) {
                if (dat.get(i, j) != dat.get(j, i)) return false
                if (i == j) {
                    if (dat.get(i, j) <= 0 || dat.get(i, j) % 2 != 0) return false
                } else {
                    let numer = 2 * dat.get(i, j)
                    let denom = dat.get(i, i)
                    if (denom == 0 || numer % denom != 0) return false
                    if ((numer / denom | 0) > 0) return false
                }
            }
        }
        return true
    }

    export function cartanDat(type: string, rank: number, aff?: number) {
        if (aff === undefined)
            return datumFin(type, rank)
        
        if (aff < 1 || aff > 3)
            throw new Error("Affine twists are 1, 2, or 3.")
        
        return (aff == 1) ? datumAff1(type, rank) : (aff == 2) ? datumAff2(type, rank) : datumAff3(type, rank)
    }

    /** Return a Cartan datum (not a Cartan matrix) for the specified finite irreducible type.
     * The numbering convention used agrees with Table Fin in Kac.
    */
    function datumFin(type: string, rank: number): Mat {
        if (rank < 1)
            throw new Error(`Rank must be positive: was given ${rank}`)
        
        switch (type) {
        
        // A: Simply-laced path.
        case 'A':
        return mat.fromEntries(rank, rank, (i, j) => {
            if (i == j) return 2
            if (Math.abs(i - j) == 1) return -1
            return 0
        })

        // B: Simply-laced path with fat edge at the end. Most roots long.
        case 'B':
        if (rank < 2) throw new Error(`Rank must be at least 2 for type B, was given ${rank}`)
        return mat.fromEntries(rank, rank, (i, j) => {
            if (i == j && i == rank - 1) return 2
            if (i == j) return 4
            if (Math.abs(i - j) == 1) return -2
            return 0
        })

        // C: Simply-laced path with fat edge at the end. Most roots short.
        case 'C':
        if (rank < 2) throw new Error(`Rank must be at least 2 for type C, was given ${rank}`)
        return mat.fromEntries(rank, rank, (i, j) => {
            if (i == j && i == rank - 1) return 4
            if (i == j) return 2
            if (Math.abs(i - j) == 1) {
                if (Math.max(i, j) == rank - 1) return -2
                return -1
            }
            return 0
        })

        // D: Simply-laced path with a leaf added to the second-last vertex.
        case 'D':
        if (rank < 3) throw new Error(`Rank must be at least 3 for type D, was given ${rank}`)
        return mat.fromEntries(rank, rank, (i, j) => {
            if (i == j) return 2
            if (Math.max(i, j) == rank - 1) {
                if (Math.abs(i - j) == 2) return -1
                return 0
            }
            if (Math.abs(i - j) == 1) return -1
            return 0
        })

        case 'E':
        if (rank < 6 || rank > 8) throw new Error(`Rank must be at 6, 7, or 8 for type D, was given ${rank}`)
        return mat.fromEntries(rank, rank, (i, j) => {
            if (i == j) return 2
            if (Math.max(i, j) == rank - 1) {
                let dist = (rank == 7) ? 4 : 3
                if (Math.abs(i - j) == dist) return -1
                return 0
            }
            if (Math.abs(i - j) == 1) return -1
            return 0
        })

        case 'F':
        if (rank != 4) throw new Error(`Rank must be 4 for type F, was given ${rank}`)
        return mat.fromRows([
            [ 4, -2,  0,  0],
            [-2,  4, -2,  0],
            [ 0, -2,  2, -1],
            [ 0,  0, -1,  2],
        ])

        case 'G':
        if (rank != 2) throw new Error(`Rank must be 2 for type G, was given ${rank}`)
        return mat.fromRows([
            [ 6, -3],
            [-3,  2],
        ])

        default:
        throw new Error(`Unhandled type: ${type}`)
        }
    }

    /** Return the affine Cartan datum X_rank^(1), according to the numbering in Kac. Where Kac puts the affine
     * root in index 0, we instead put it in index r+1, but otherwise the numbering is the same. */
    function datumAff1(type: string, rank: number): Mat {
        if (rank < 1)
            throw new Error(`Rank must be positive: was given ${rank}`)
        
        const finDatum = datumFin(type, rank)
        function addAffine(diag: number, offdiag: (i: number) => number): Mat {
            return mat.fromEntries(rank + 1, rank + 1, (i, j) => {
                if (i == rank && j == rank) return diag
                if (i == rank) return offdiag(j)
                if (j == rank) return offdiag(i)
                return finDatum.get(i, j)
            })
        }
        
        switch (type) {
            case 'A':
                if (rank == 1)
                    return addAffine(2, () => -2)
                
                return addAffine(2, (i) => (i == 0 || i == rank - 1) ? -1 : 0)

            case 'B':
                if (rank == 2)
                    return addAffine(4, (i) => (i == 1) ? -2 : 0)
                
                return addAffine(4, (i) => (i == 1) ? -2 : 0)
        
            case 'C':
                return addAffine(4, (i) => (i == 0) ? -2 : 0)
            
            case 'D':
                if (rank == 3)
                    return addAffine(2, (i) => (i == 1 || i == 2) ? -1 : 0)
                
                return addAffine(2, (i) => (i == 1) ? -1 : 0)
            
            case 'E':
                if (rank == 6)
                    return addAffine(2, (i) => (i == rank - 1) ? -1 : 0)
                if (rank == 7)
                    return addAffine(2, (i) => (i == 0) ? -1 : 0)
                if (rank == 8)
                    return addAffine(2, (i) => (i == 0) ? -1 : 0)
                
                throw new Error('Unreachable')
            
            case 'F':
                return addAffine(4, (i) => (i == 0) ? -2 : 0)
            
            case 'G':
                return addAffine(6, (i) => (i == 0) ? -3 : 0)
            
            default:
                throw new Error('Unreachable')
        }
    }

    function datumAff2(type: string, rank: number) {
        if (rank < 1)
            throw new Error(`Rank must be positive: was given ${rank}`)
        

        function addAffine(finDatum: Mat, scale: number, diag: number, offdiag: (i: number) => number): Mat {
            let rank = finDatum.nrows
            return mat.fromEntries(rank + 1, rank + 1, (i, j) => {
                if (i == rank && j == rank) return diag
                if (i == rank) return offdiag(j)
                if (j == rank) return offdiag(i)
                return finDatum.get(i, j) * scale
            })
        }
        
        switch (type) {
        case 'A':
            if (rank == 2)
                return mat.fromRows([[8, -4], [-4, 2]])
            if (rank % 2 == 0) {
                let newRank = rank / 2 + 1
                return addAffine(
                    datumFin('C', newRank),
                    2,
                    2,
                    (i) => (i == 0) ? -2 : 0
                )
            }
            if (rank >= 3 && rank % 2 == 1) {
                let newRank = (rank + 1) / 2
                return addAffine(
                    datumFin('C', newRank),
                    1,
                    (rank == 3) ? 4 : 2,
                    (i) => (rank == 3) ? ((i == 0) ? -2 : 0) : (i == 1) ? -1 : 0
                )
            }
            throw new Error(`Type A_${rank}^{(2)} undefined.`)
        
        case 'D':
            return addAffine(
                datumFin('B', rank - 1),
                1,
                2,
                (i) => (i == 0) ? -2 : 0
            )
        
        case 'E':
            if (rank != 6)
                throw new Error("There is no Aff 2 for type E except in E6")
            
            return addAffine(
                datumFin('F', 4),
                1,
                2,
                (i) => (i == 3) ? -1 : 0
            )
        }

        throw new Error(`Aff 2 unimplemented for type ${type}${rank}`)
    }

    function datumAff3(type: string, rank: number) {
        if (type != 'D' || rank != 4)
            throw new Error("The only Aff 3 datum is D4^(3)")
        
        return mat.fromRows([
            [2, -3, -1],
            [-3, 6, 0],
            [-1, 0, 2],
        ])
    }

    export interface DynkinLayoutSettings {
        horizDist: number
        vertDist: number
    }
    const defaultLayoutSettings: DynkinLayoutSettings = {
        horizDist: 30,
        vertDist: 40,
    }
    type DynkinEdge = {i: number, j: number, aij: number, aji: number}
    export interface DynkinLayout {
        nodes: number[]
        edges: DynkinEdge[]
        width: number
        height: number
        nodeX(i: number): number
        nodeY(i: number): number
        edge(edge: DynkinEdge, short?: boolean): string
    }

    export function dynkinLayout(cartanMat: Mat, optionalSettings?: Partial<DynkinLayoutSettings>): DynkinLayout {
        const settings: DynkinLayoutSettings = {...defaultLayoutSettings, ...optionalSettings}
        const rank = cartanMat.nrows
        const {xs, ys} = layoutDynkinXY(cartanMat)
        const nodes = arr.range(rank)
        const edges: DynkinEdge[] = []
        for (let i = 0; i < rank; i++)
            for (let j = i + 1; j < rank; j++)
                if (cartanMat.get(i, j) != 0)
                    edges.push({i, j, aij: cartanMat.get(i, j), aji: cartanMat.get(j, i)})
        
        const width = (Math.max(...xs) - Math.min(...xs)) * settings.horizDist
        const height = (Math.max(...ys) - Math.min(...ys)) * settings.vertDist

        const nodeX = function(i: number) { return settings.horizDist * xs[i] }
        const nodeY = function(i: number) { return settings.horizDist * ys[i] }
        const edge = function(edge: DynkinEdge, short?: boolean) {
            return dynkinEdge(
                [nodeX(edge.i), nodeY(edge.i)],
                [nodeX(edge.j), nodeY(edge.j)],
                Math.abs(Math.min(edge.aij, edge.aji)),
                arrowDirection(edge.aij, edge.aji),
                short,
            )
        }

        return {nodes, edges, width, height, nodeX, nodeY, edge}
    }

    
    function arrowDirection(aij: number, aji: number): 'none' | 'forward' | 'backward' | 'both' {
        if (aij < -1 && aji < -1)
            return 'both'
        if (aij < -1)
            return 'backward'
        if (aji < -1)
            return 'forward'
        
        return 'none'
    }

    export function dynkinEdge([ix, iy]: number[], [jx, jy]: number[], bonds: number, arrows: 'none' | 'forward' | 'backward' | 'both', short?: boolean): string {
        // Pretend that the i node is at the origin, and the j node is at (length, 0). We will rotate
        // and translate back to their proper positions.
        let length = Math.sqrt(Math.pow(ix - jx, 2) + Math.pow(iy - jy, 2))
        let squish = (x: number) => (x - 0.5) * (short ? 0.6 : 1.0) + 0.5
        let start = squish(0.1) * length
        let startArr = squish(0.3) * length
        let end = squish(0.9) * length
        let endArr = squish(0.7) * length
        let height = 0.12 * length
        let arrHeight = 0.28 * length

        let angle = Math.atan2(jy - iy, jx - ix)
        let aff = mat.fromSemidirect(mat.fromLinear(v => vec.rotate2D(angle, v), 2), [ix, iy])

        let b = new draw.PathBuilder()

        // Draw the bonds.
        // If bonds = 1, offsets = [0]
        //    bonds = 2, offsets = [-1/2, 1/2]
        //    bonds = 3, offsets = [-1, 0, -1]
        // and so on.
        for (let i = 0; i < bonds; i++) {
            let off = i - bonds/2 + 1/2
            b.M(mat.multAff(aff, [start, off*height]))
            b.L(mat.multAff(aff, [end, off*height]))
        }

        // Draw the arrows, if any.
        // If |a_ij| > 1, there is an arrow pointing to i.
        if (arrows == 'backward' || arrows == 'both') {
            b.M(mat.multAff(aff, [startArr, arrHeight]))
            b.L(mat.multAff(aff, [start, 0]))
            b.L(mat.multAff(aff, [startArr, -arrHeight]))
        }
        if (arrows == 'forward' || arrows == 'both') {
            b.M(mat.multAff(aff, [endArr, arrHeight]))
            b.L(mat.multAff(aff, [end, 0]))
            b.L(mat.multAff(aff, [endArr, -arrHeight]))
        }

        return b.build()
    }

    /** Layout a Dynkin diagram of finite type. Returns an array of x coordinates and y coordinates
     * for laying out a diagram on a grid. The x coordinates used will be [0, ..., N] for some N, and
     * possibly a half-integer when laying out affine A1. The y-coordinates used will be [0, ..., M]
     * for some M.
     */
     function layoutDynkinXY(A: Mat): {xs: number[], ys: number[]} {
        if (!isGCM(A))
            throw new Error("Provided matrix was not a GCM")
        
        let rank = A.nrows
        
        // Run all-pairs shortest paths, which we can use variously to extract paths and
        // connected components. This is an O(n^3) algorithm, but straightforward.
        let inf_dist = rank + 1
        let dists: number[][] = arr.fromFunc(rank, i => arr.fromFunc(rank, j => {
            if (i == j) return 0
            if (A.get(i, j) < 0) return 1
            return inf_dist
        }))
        let nexts: number[][] = arr.fromFunc(rank, i => arr.fromFunc(rank, j => {
            if (i == j) return i
            if (A.get(i, j) < 0) return j
            return inf_dist
        }))
        for (let k = 0; k < rank; k++) {
            for (let i = 0; i < rank; i++) {
                for (let j = 0; j < rank; j++) {
                    if (dists[i][j] > dists[i][k] + dists[k][j]) {
                        dists[i][j] = dists[i][k] + dists[k][j]
                        nexts[i][j] = nexts[i][k]
                    }
                }
            }
        }

        // For now, only deal with the connected case.
        if (dists.some(ds => ds.some(d => d == inf_dist)))
            throw new Error("layout only implemented for indecomposable Cartan matrices currently.")
        
        /** Return a shortest path from i to j in the graph. */
        let shortestPath = function(i: number, j: number): number[] {
            if (dists[i][j] == inf_dist)
                throw new Error(`There is no path from ${i} to ${j}.`)
            
            let path = [i]
            while (i != j) {
                i = nexts[i][j]
                path.push(i)
            }
            return path
        }

        /** Vertex degree = number of neighbours. */
        let deg = function(i: number): number {
            let count = 0
            for (let j = 0; j < A.ncols; j++)
                if (A.get(i, j) < 0)
                    count++
            
            return count
        }
        let neigh = function(i: number): number[] {
            return arr.range(rank).filter((j) => i != j && A.get(i, j) < 0)
        }

        // The underlying undirected graph is always a tree, except in the affine case A[2..]^(1).
        // Find the cycle.
        let verts = arr.range(A.nrows)
        if (verts.every(v => deg(v) == 2)) {
            let xs = arr.constant(rank, -1)
            let ys = arr.constant(rank, -1)
            xs[0] = ys[0] = 0
            let prev = 0
            for (;;) {
                let [a, b] = neigh(prev)
                if (xs[a] >= 0 && xs[b] >= 0) break
                let next = (xs[a] >= 0) ? b : a

                xs[next] = xs[prev] + 1
                ys[next] = 0
                prev = next
            }

            // Correct the last vertex so that it looks like a cycle.
            xs[prev] = rank / 2 - 1
            ys[prev] = 1

            return {xs, ys}



            // return {
            //     xs: arr.fromFunc(rank, (i) => (i == rank - 1) ? (rank - 2) / 2 : i),
            //     xs: order.map((vert, pos) => )
            //     ys: arr.fromFunc(rank, (i) => (i == rank - 1) ? 1 : 0)
            // }
        }

        // Special case a single vertex.
        if (verts.length == 1)
            return {xs: [0], ys: [0]}

        // For those that are trees, extract a longest path starting at the leaf with the
        // lowest index, ending at a leaf with the lowest index among maximal paths.
        let diam = Math.max(...dists.map(row => Math.max(...row)))
        let diamVerts = verts.filter(v => dists[v].some(dist => dist == diam))
        let startVert = Math.min(...diamVerts)
        let endVert = Math.min(...verts.filter(v => dists[startVert][v] == diam))

        // Now we have a "core path" to hang other things off.
        let path = shortestPath(startVert, endVert)
        let ys: number[] = arr.constant(rank, 0)
        let xs: number[] = arr.constant(rank, -1)
        for (let i = 0; i < path.length; i++)
            xs[path[i]] = i

        // For each remaining leaf, connect it to the tree, taking the same x-coordinate
        // and increasing the y-coordinate.
        let covered = verts.map(v => path.indexOf(v) >= 0)
        let leaves = verts.filter(v => deg(v) == 1 && !covered[v])

        // In the case of D_4^(1), we cannot just put branches up, we must also put a branch down. So we will
        // track whether we have hung a branch or not.
        let upBranchUsed = arr.constant(rank, false)
        for (let leaf of leaves) {
            // There is a unique node on the path with minimal distance to this leaf.
            let pathNodeIndex = arr.minimumBy(path, v => dists[leaf][v])
            let upBranch = shortestPath(pathNodeIndex, leaf).slice(1)
            for (let i = 0; i < upBranch.length; i++) {
                xs[upBranch[i]] = xs[pathNodeIndex]
                ys[upBranch[i]] = i + ((upBranchUsed[pathNodeIndex]) ? -1 : 1)
                covered[upBranch[i]] = true
            }
            upBranchUsed[pathNodeIndex] = true
        }

        return {xs, ys}
    }
}
