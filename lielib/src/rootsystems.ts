import { arr } from "./arr";
import { big } from "./big";
import { bits } from "./bits";
import { cartan } from "./cartan";
import { digraph } from "./digraph";
import { mat, vec, Mat, Vec, vecmut } from "./linear";
import { maps } from "./maps";
import { num } from "./num";
import { Queue } from "./queue";

/** The rtsys namespace works with finite crystallographic root systems. */
export namespace rtsys {
    type BasisKind = 'root' | 'weight' | 'coroot' | 'coweight'

    /** Perform the simple reflection s in the given basis. This makes sense for affine Cartan
     * matrices as well, provided that we are working in the correct basis in a compatible realisation.
     */
    export function simpleReflection(cartanMat: Mat, basis: BasisKind, s: number, v: Vec): Vec {
        if (v.length != cartanMat.nrows || s < 0 || s >= cartanMat.nrows)
            throw new Error("Incompatible arguments")

        if (basis == 'root' || basis == 'coroot') {
            // For the root basis, the vector is only modified in the sth place, where we
            // subtract the dot product of the vector with the sth row of the Cartan matrix.
            // The coroot base is analagous, with the transpose.
            let dot = 0
            if (basis == 'root')
                for (let i = 0; i < v.length; i++) dot += cartanMat.get(s, i) * v[i]
            else
            for (let i = 0; i < v.length; i++) dot += cartanMat.get(i, s) * v[i]

            let ret = v.slice()
            ret[s] -= dot
            return ret
        }
        else {
            // For the weight basis, the reflection s subtracts off v[s] * alpha_s, hence we are
            // subtracting v[s] lots of the sth column of the Cartan matrix.
            let ret = v.slice()
            if (basis == 'weight')
                for (let i = 0; i < v.length; i++) ret[i] -= v[s] * cartanMat.get(i, s)
            else
                for (let i = 0; i < v.length; i++) ret[i] -= v[s] * cartanMat.get(s, i)

            return ret
        }
    }

    function simpleReflectionMatrix(cartanMat: Mat, basis: BasisKind, s: number): Mat {
        return mat.fromLinear((v) => simpleReflection(cartanMat, basis, s, v), cartanMat.nrows)
    }

    export function simpleReflectionMatrices(cartanMat: Mat, basis: BasisKind): Mat[] {
        return arr.fromFunc(cartanMat.nrows, s => simpleReflectionMatrix(cartanMat, basis, s))
    }

    /** Attempt to move a point into the dominant chamber, and return the word that moves the dominant chamber
     * into the starting chamber. If the limit is hit, throws an error. */
    export function makeDominantWord(cartanMat: Mat, basis: 'weight' | 'coweight', wt: Vec, lengthLimit?: number) {
        if (wt.length != cartanMat.nrows)
            throw new Error("Weight has a different number of coordinates to Cartan matrix.")

        let word: number[] = []
        for (let i = 0; i < cartanMat.nrows; i++) {
            if (lengthLimit !== undefined && word.length > lengthLimit)
                throw new Error(`Length limit ${lengthLimit} exceeded.`)

            if (wt[i] < 0) {
                wt = simpleReflection(cartanMat, basis, i, wt)
                word.push(i)
                i = -1
            }
        }

        return word
    }

    // Build the positive roots by reflecting, starting from the simple roots. An enumerated set of
    // all positive roots is returned, with the simple roots in the first rank-many positions. The
    // enumeration happens in a deterministic order, traversing the root graph in increasing order
    // of depth. This deterministic order can be used to set up the root-coroot bijection.
    //
    // The reflection table for the positive roots is built at the same time.
    function positiveRootsByReflection(A: Mat) {
        // In the root basis, the simple roots are the standard basis vectors.
        // In the weight basis, the simple roots are the columns of the Cartan matrix.
        // This is because if (alpha j) = sum_i (lambda i, j) (w j), then taking the pairing
        // with the (coroot i) on each side leaves A_ij = (lambda i).
        let rank = A.ncols
        let rows = mat.toRows(A)
        let columns = mat.toColumns(A)

        /** An element of the root lattice, in both the root and weight basis. */
        interface RtLatElt {
            rt: number[]
            wt: number[]
            depth: number
            norm2: number
        }

        // Create the initial data for the simple roots.
        let norm2s = cartan.squareLengths(A)
        let simpleRoots: RtLatElt[] = arr.fromFunc(rank, (i) => ({
            rt: vec.e(rank, i),
            wt: columns[i],
            depth: 1,
            norm2: norm2s[i],
        }))

        let simpleReflection = function(s: number, root: RtLatElt): RtLatElt {
            // In the root basis r, the simple reflection s_i is the identity matrix, minus
            // the matrix which just has the ith row of the Cartan. Hence the vector gets
            // modified at the ith place, where we subtract off the dot product of the
            // vector with the ith row of the Cartan matrix.
            //
            // In the weight basis w, the reflection s_i subtracts off w[i] * alpha_i, and
            // alpha_i in this basis is the ith column of the Cartan matrix.
            //
            // Upon reflection, the depth changes by +1 (we are careful to only cover new ground
            // on each reflection, thus +1 rather than -1), and the square length remains the same.
            let rt = vec.copy(root.rt)
            rt[s] -= vec.dot(rt, rows[s])
            return {
                rt,
                wt: vec.sub(root.wt, vec.scale(columns[s], root.wt[s])),
                depth: root.depth + 1,
                norm2: root.norm2
            }
        }

        // Build an enumerated set of the positive roots, numbering the simple roots [0, rank)
        let posRootList = simpleRoots.slice()
        let positiveRoots = new maps.EntryVecMap<number>()
        for (let i = 0; i < simpleRoots.length; i++)
            positiveRoots.set(simpleRoots[i].rt, i)

        // The reflection table can be used to quickly compute s_i(alpha) for any positive root
        // alpha. If s_i(alpha) is a negative root (only happens when alpha = alpha_i), the table
        // contains a -1. Otherwise, the entry [rank * alpha + i] contains the index of the new
        // positive root.
        let reflectionTable: number[] = []

        let queue = new Queue(simpleRoots)
        while (queue.size() > 0) {
            let root = queue.dequeue()

            for (let s = 0; s < rank; s++) {
                let newRoot = simpleReflection(s, root)
                if (newRoot.rt.some(x => x < 0)) {
                    reflectionTable.push(-1)
                    continue
                }
                if (!positiveRoots.contains(newRoot.rt)) {
                    positiveRoots.set(newRoot.rt, positiveRoots.size())
                    queue.enqueue(newRoot)
                    posRootList.push(newRoot)
                }
                reflectionTable.push(positiveRoots.get(newRoot.rt))
            }
        }

        return {posRootList, reflectionTable}
    }

    // Build the positive roots by adding simple roots.
    // The root string data is produced at the same time.
    // The highest root is the last root produced.
    function positiveRootsByAddition(cartan: Mat) {
        /** An element of the root lattice, in both the root and weight basis. We also
         * carry a bit of string data: namely the highest weight of the sl2 representation
         * defined by the i-string.
        */
        interface PosRoot {
            height: number,
            rt: number[]
            wt: number[]
            strTop: number[]
        }

        let rank = cartan.ncols
        let rows = mat.toRows(cartan)
        let columns = mat.toColumns(cartan)

        // When we begin, all simple roots are either at the bottom or top of their i-strings,
        // and hence the highest weight vector is just the absolute value of the weight vector.
        let simpleRoots: PosRoot[] = arr.fromFunc(rank, (i) => ({
            height: 1,
            rt: vec.e(rank, i),
            wt: columns[i],
            strTop: columns[i].map(x => Math.abs(x)),
        }))

        function addSimpleRoot(i: number, root: PosRoot): PosRoot {
            return {
                height: root.height + 1,
                rt: vec.add(root.rt, simpleRoots[i].rt),
                wt: vec.add(root.wt, simpleRoots[i].wt),
                strTop: vec.fromEntries(rank, () => -1),
            }
        }

        // Build a mapping keyed off the root in the root basis.
        let positiveRoots = new maps.EntryVecMap<PosRoot>()
        for (let i = 0; i < rank; i++)
            positiveRoots.set(simpleRoots[i].rt, simpleRoots[i])

        // Traverse the roots in breadth-first order, building the string data as we go.
        let queue = new Queue<PosRoot>(simpleRoots)
        while (queue.size() > 0) {
            let root = queue.dequeue()

            // If this root has any more remaining unknown entries in its string vector,
            // they must be at the bottom of a string.
            for (let i = 0; i < rank; i++)
                if (root.strTop[i] < 0)
                    root.strTop[i] = Math.abs(root.wt[i])

            // Now go up any strings that we can, to find new vectors.
            for (let i = 0; i < rank; i++) {
                if (root.wt[i] == root.strTop[i])
                    continue

                // Create the new root, and if we've found it before switch to that version instead.
                let newRoot = addSimpleRoot(i, root)
                if (positiveRoots.contains(newRoot.rt)) {
                    newRoot = positiveRoots.get(newRoot.rt)!
                } else {
                    positiveRoots.set(newRoot.rt, newRoot)
                    queue.enqueue(newRoot)
                }

                // Since we've just gone up an i-string here, the size of the new
                // root's i-string is the same as ours.
                newRoot.strTop[i] = root.strTop[i]
            }
        }

        return positiveRoots
    }

    export interface IRoot {
        /** The index of a root. Compatible with the root - coroot bijection. */
        index: number

        /** For α > 0, depth(α) = min{ l(w) | w α < 0} */
        depth: number

        /** For α > 0, height(α) = ∑〈 ϖᵢ^, α〉, the sum of its coefficients in the root basis. */
        height: number

        /** The square norm (α, α), normalised so that short roots have square norm 2. */
        norm2: number

        /** The coefficients of α in the basis of simple roots. Note rt[i] =〈 ϖᵢ^, α〉 */
        rt: Vec

        /** The coefficients of α in the basis of fundamental weights. Note wt[i] = 〈 αᵢ^, α 〉*/
        wt: Vec

        /** α lives on some i-string for each i, and strTop[i] is the highest weight of that string. */
        strTop: number[]
    }

    export interface IRootSystem {
        cartan: Mat,
        cocartan: Mat,

        /** The norm squares of the simple roots, using the convention that short roots are 2. */
        simpNorms: Vec,

        // Contains positive roots and coroots, in an order compatible with the root - coroot bijection.
        // The first rank-many roots in each are the simple roots.
        posRoots: IRoot[]
        posCoroots: IRoot[]

        // The order in which roots were created via addition (handy for laying out the poset).
        additionOrder: number[]
        coAdditionOrder: number[]

        // Maps roots or coroots (in the root basis) to their indices.
        rtToIndex: maps.IMap<Vec, number>
        cortToIndex: maps.IMap<Vec, number>

        // A reflection table, purely in terms of the indices of the positive roots/coroots.
        // If s_i(alpha) is a negative root (only happens when alpha = alpha_i), the table contains a -1.
        // Otherwise, the entry [rank * alpha + i] contains the index of the new positive root.
        reflectionTable: number[]

        connectedSubmasks: number[]
        connectedSuborders: bigint[]
    }

    export function createRootSystem(A: Mat): IRootSystem {
        if (!cartan.isGCM(A))
            throw new Error("Given matrix was not a GCM")

        // First, enumerate the root system and its dual by depth. The roots and coroots will be
        // enumerated in an order that sets up the root - coroot bijection.
        let cocartan = mat.transpose(A)
        let {posRootList: posRootsByRefl, reflectionTable: posRefTable} = positiveRootsByReflection(A)
        let {posRootList: posCorootsByRefl, reflectionTable: posCorefTable} = positiveRootsByReflection(cocartan)
        if (!arr.isEqual(posRefTable, posCorefTable))
            throw new Error("Reflection and coreflection tables were not equal.")

        // Next, get the root system and its dual by height. This ordering is incompatible with the
        // root - coroot bijection, but does create the heights and the string data.
        let posRootsByHeight = positiveRootsByAddition(A)
        let posCorootsByHeight = positiveRootsByAddition(cocartan)

        if (posRootsByRefl.length != posRootsByHeight.size())
            throw new Error("Different numbers of roots by reflection vs addition")

        // Assemble the interface.
        let rtToIndex = new maps.EntryVecMap<number>()
        let posRoots: IRoot[] = []
        for (let i = 0; i < posRootsByRefl.length; i++) {
            rtToIndex.set(posRootsByRefl[i].rt, i)
            let {rt, wt, depth, norm2} = posRootsByRefl[i]
            let {height, strTop} = posRootsByHeight.get(rt)
            posRoots.push({index: i, depth, height, norm2, rt, wt, strTop})
        }
        let additionOrder: number[] = []
        for (let e of posRootsByHeight.entries)
            additionOrder.push(rtToIndex.get(e.key))


        let cortToIndex = new maps.EntryVecMap<number>()
        let posCoroots: IRoot[] = []
        for (let i = 0; i < posCorootsByRefl.length; i++) {
            cortToIndex.set(posCorootsByRefl[i].rt, i)
            let {rt, wt, depth, norm2} = posCorootsByRefl[i]
            let {height, strTop} = posCorootsByHeight.get(rt)
            posCoroots.push({index: i, depth, height, norm2, rt, wt, strTop})
        }
        let coAdditionOrder: number[] = []
        for (let e of posCorootsByHeight.entries)
            coAdditionOrder.push(cortToIndex.get(e.key))

        // The support of a vector, in bitmask form.
        function support(vec: Vec): number {
            let mask = 0
            for (let i = 0; i < vec.length; i++)
                if (vec[i] != 0)
                    mask |= 1 << i

            return mask
        }

        // The highest root on a connected component can be found by taking the maximum
        // over all roots which are supported only over that component in the root basis.
        function highestRoot(mask: number): number[] {
            let max = arr.constant(A.nrows, 0)
            for (let root of posRoots) {
                let supp = support(root.rt)
                if ((supp & mask) == supp) {
                    max = vec.max(max, root.rt)
                }
            }

            return max
        }

        let connectedSubmasks = cartan.connectedSubgraphMasks(A)
        function weylOrder(mask: number): bigint {
            let rootCoeffProd = 1
            let high = highestRoot(mask)
            for (let i = 0; i < A.nrows; i++)
                if (((1 << i) & mask) != 0)
                    rootCoeffProd *= Math.max(high[i], 1)

            let det = mat.integralDet(mat.submatrixMask(A, mask, mask))
            return big.factorial(bits.popCount(mask)) * BigInt(rootCoeffProd * det)
        }
        let connectedSuborders = connectedSubmasks.map(weylOrder)

        return {
            cartan: A,
            cocartan,
            simpNorms: cartan.squareLengths(A),
            posRoots,
            posCoroots,
            additionOrder,
            coAdditionOrder,
            rtToIndex,
            cortToIndex,
            reflectionTable: posRefTable,
            connectedSubmasks,
            connectedSuborders
        }
    }

    export function rank(rs: IRootSystem): number {
        return rs.cartan.nrows
    }

    export function highestRoot(rs: IRootSystem): IRoot {
        // When rs is indecomposable, there is a unique root of maximum height.
        return arr.maximumBy(rs.posRoots, (r) => r.height)
    }

    export function highestCoroot(rs: IRootSystem): IRoot {
        // When rs is indecomposable, there is a unique coroot of maximum height.
        return arr.maximumBy(rs.posCoroots, (r) => r.height)
    }

    export function highestShortRoot(rs: IRootSystem): IRoot {
        let coroot = highestCoroot(rs)
        return rs.posRoots[coroot.index]
    }

    export function highestShortCoroot(rs: IRootSystem): IRoot {
        let root = highestRoot(rs)
        return rs.posCoroots[root.index]
    }

    export function indexOfConnection(rs: IRootSystem): number {
        // TODO: We are using an inexact determinant. Find out how to efficiently and exactly take
        // the determinant of an integer matrix.
        return Math.round(mat.det(rs.cartan))
    }

    export function coxeterNumber(rs: IRootSystem): number {
        return 1 + highestRoot(rs).rt.reduce((a, b) => a + b, 0)
    }

    export function dualCoxeterNumber(rs: IRootSystem): number {
        return 1 + highestShortCoroot(rs).rt.reduce((a, b) => a + b, 0)
    }

    /** Calculate {word, s} such that word . alpha_s = root. */
    export function reflectionWord(rs: IRootSystem, root: IRoot) {
        // Walk down the root reflection table. Roots that are further from the simple roots have higher indices,
        // so we need to look for a lower index each time.
        // The root reflection table is indexed by [rank * alpha + i].

        let rank = rtsys.rank(rs)
        let word: number[] = []
        let index = root.index
        while (index >= rank) {
            // Let t be the first generator which takes us to a lower index in the table, or rank if there is none.
            let t: number
            for (t = 0; t < rank; t++)
                if (rs.reflectionTable[rank * index + t] < index)
                    break

            if (t == rank)
                throw new Error("Internal error: should have found a suitable entry in the reflection table.")

            word.push(t)
            index = rs.reflectionTable[rank * index + t]
        }

        return {word, s: index}
    }

    // export function coxeterNumberFromAffine(rs: IRootSystem): Vec {
    //     let affCartan = affineCartan(rs, 'coroot')
    //     let soln = mat.kernel(affCartan)[0].map(Math.round)
    //     return soln
    // }

    // export function dualCoxeterNumber(rs: IRootSystem) {
    //     let affCartan = affineCartan(rs, 'coroot')
    //     let dual = mat.transpose(affCartan)
    //     let solns = mat.kernel(dual)
    //     let soln = solns[0]
    //     return soln.map(Math.round)
    // }

    export function coxeterEigenvalues(rs: IRootSystem): number[] {
        let simpRefls = arr.fromFunc(rank(rs), i => rtsys.reflectionMatrix(rs, 'wt', i))
        let coxElt = simpRefls.reduce((a, b) => mat.multMat(a, b), mat.id(rank(rs)))
        let coxNum = coxeterNumber(rs)

        // The coxeter element should have order equal to the coxeter number.
        if (!mat.isIdentity(mat.pow(coxElt, coxNum)))
            throw new Error("coxElt^coxNum was not the identity matrix.")

        // Record the dimensions of each fixed-point subspace of M^i.
        let dims = arr.constant(coxNum + 1, 0)
        for (let pow = 1, M = coxElt; pow <= coxNum; pow += 1, M = mat.multMat(M, coxElt))
            dims[pow] = mat.kernelDim(mat.sub(M, mat.id(rank(rs))))


        let mMults = arr.constant(coxNum + 1, 0)
        for (let order = 1; order <= coxNum; order++) {
            if (dims[order] == 0)
                continue

            if (coxNum % order != 0)
                throw new Error("The order should divide the Coxeter number.")

            // This order has been overcounted in any number dividing it.
            for (let d = 2; order * d <= coxNum; d++)
                dims[d * order] -= dims[order]

            // Now add the primitive roots with the given order. The primitive roots are
            // exp(2 pi i k / order), where gcd(k, order) = 1. However, we are writing them
            // as exp(2 pi i m[j] / h), so k h = m[j] order.
            while (dims[order] > 0) {
                for (let k = 1; k < order; k++) {
                    if (num.gcd(k, order) != 1)
                        continue

                    let mj = k * coxNum / order
                    mMults[mj] += 1
                    dims[order] -= 1
                }
            }

            if (dims[order] != 0)
                throw new Error("Subtracted too much!")
        }

        let ms: number[] = []
        for (let i = 0; i < mMults.length; i++)
            for (let k = 0; k < mMults[i]; k++)
                ms.push(i)

        return ms
    }

    /** The order of the Weyl group defined by the root system. */
    export function oldWeylOrder(rs: IRootSystem): number {
        // We can cover the volume in the coroots space in two ways.
        // (Way 1): Take the parallelopiped spanned by (ϖ₁^, ..., ϖᵣ^) and translate by all elements
        //    of the weight lattice.
        // (Way 2): Take the fundamental alcove, the simplex with vertices (0, ϖ₁^/a1, ..., ϖᵣ^/ar)
        //    where (a1, ..., ar) are the coefficients of the highest root, take its W-orbit, and
        //    translate that by all elements of the root lattice.
        // Work in the basis of fundamental coweights, so that the parallelopiped has volume 1.
        // The volume of the simplex is 1/(r! a1 ... ar)
        // Then we have the "equation"
        //     Q = R |W| / (r! a1 ... ar)
        // leading to the "equation"
        //   |W| = |Q|/|R| * r! * a1 ... ar
        // Here the infinite fraction |Q| / |R| is understood to be the index of R in Q, i.e.
        // the index of connection.
        if (rs.posRoots.length == 0)
            return 1

        return num.factorial(rank(rs)) * arr.product(highestRoot(rs).rt) * indexOfConnection(rs)
    }

    export function weylOrder(rs: IRootSystem, parabolic?: number[]): bigint {
        // All 1s mask, representing the whole graph. We will decompose this into connected subdiagrams.
        let mask = (parabolic !== undefined)
            ? bits.toMask(parabolic)
            : (1 << rank(rs)) - 1

        if (mask >= (1 << rank(rs)))
            throw new Error(`Parabolic subgroup indices ${parabolic} out of range`)

        let order = 1n
        for (let i = 0; i < rs.connectedSubmasks.length && mask != 0; i++) {
            let comp = rs.connectedSubmasks[i]
            if ((comp & mask) == comp) {
                order *= rs.connectedSuborders[i]
                mask &= ~comp
            }
        }

        return order
    }

    /** Find an expression for the longest word of the Weyl group. */
    export function longestWord(rs: IRootSystem): number[] {
        let word: number[] = []

        // Start with the vector [1, 1, ..., 1] in the weight basis, which has no stabiliser.
        // Find a positive coordinate in position i, and apply the simple reflection s_i to
        // flip it to negative. When there are no more positive coordinates, we have applied
        // the longest element of the Weyl group.
        let wt: number[] = vec.fromEntries(rank(rs), () => 1)
        for (let again = true; again;) {
            again = false
            for (let i = 0; i < wt.length; i++) {
                if (wt[i] < 0)
                    continue

                vecmut.addScaled(wt, wt, rs.posRoots[i].wt, -wt[i])
                word.push(i)
                again = true
                break
            }
        }

        return word
    }

    type BasisType = 'rt' | 'wt'

    /** The W-invariant inner product on the character space, in the given basis. */
    export function innerProduct(rs: IRootSystem, basis: BasisType): Mat {
        // Recording the pairing of the roots is just the symmetrised Cartan matrix: in particular, it is integral.
        if (basis == 'rt')
            return cartan.symmetrise(rs.cartan)

        // Otherwise, we need to change basis.
        let invC = mat.inverse(rs.cartan)
        return mat.multMat(mat.multMat(mat.transpose(invC), cartan.symmetrise(rs.cartan)), invC)
    }

    /** The matrix for the reflection over the root with index i.
     * This matrix acts on the character lattice, in the specified basis.
    */
    export function reflectionMatrix(rs: IRootSystem, basis: BasisType, i: number): Mat {
        // s_i(v) = v - <alpha_i^, v> alpha_i. The pairing <-, -> is
        // the dot product if we use the fundamental coweights on one
        // side and the roots on the other (or vice-versa).
        let refl = (v: Vec) =>
            (basis == 'wt')
            ? vec.addScaled(v, rs.posRoots[i].wt, 0 - vec.dot(rs.posCoroots[i].rt, v))
            : vec.addScaled(v, rs.posRoots[i].rt, 0 - vec.dot(rs.posCoroots[i].wt, v))

        return mat.fromLinear(refl, rank(rs))
    }

    /** The matrix for the affine reflection s_{alpha, k} over the root with index i.
     * This matrix acts on the character lattice, in the specified basis.
    */
    export function affineReflectionMatrix(rs: IRootSystem, basis: BasisType, i: number, k: number): Mat {
        // s_{alpha, k}(v) = v - (<alpha^, v> - k) alpha = s_{alpha}(v) + k alpha.
        let root = rs.posRoots[i]
        let t = (basis == 'rt') ? root.rt : root.wt
        let refl = reflectionMatrix(rs, basis, i)
        return mat.fromSemidirect(refl, vec.scale(t, k))
    }

    type TranslationType = 'coroot' | 'root'

    /** Return the simple reflection matrices for the affine group which is
     * the semidirect product of the Weyl group with the root lattice.
     * This is _not_ the affine group in the sense of Bourbaki.
     */
    export function affineSimpleReflectionMatrices(rs: IRootSystem, basis: BasisType): Mat[] {
        let r = rank(rs)
        let highest = highestShortRoot(rs)
        return arr.fromFunc(r + 1, (i) => affineReflectionMatrix(rs, basis, (i < r) ? i : highest.index, (i < r) ? 0 : 1))
    }

    /** Return the affinised Cartan matrix. If trans = 'coroot', then
     * this builds the affine Weyl group using translations by the
     * coroot lattice (this is the Affine Weyl group in the sense of
     * Bourbaki). Otherwise if trans = 'root', translations by the root
     * lattice are used (this is the Affine Weyl group arising in the
     * study of algebraic groups). The translation type defaults to 'coroot'.
    */
    export function affineCartan(rs: IRootSystem, trans?: TranslationType) {
        // Collect some new simple roots and simple coroots, adding an extra
        // root which is -(highest root) or -(highest coroot), depending on
        // the translation type. We will write coroots in the coroot basis
        // and the roots in the weight basis so that we can use a dot product
        // to produce the new cartan.
        //
        // Setting the new affine root to -(highest root) and the new affine
        // coroot to -(highest root)^ corresponds to affinising a Lie algebra.
        // For example, affineCartan(X, 'coroot') will end up with X^(1) in the
        // notation of Kac.

        if (trans === undefined)
            trans = 'coroot'

        let r = rank(rs)
        let simpRoots = rs.posRoots.slice(0, r).map(r => r.wt)
        let simpCoroots = rs.posCoroots.slice(0, r).map(r => r.rt)

        let affineRoot = (trans == 'coroot') ? highestRoot(rs) : highestShortRoot(rs)
        simpRoots.push(vec.neg(affineRoot.wt))
        simpCoroots.push(vec.neg(rs.posCoroots[affineRoot.index].rt))

        return mat.fromEntries(r + 1, r + 1, (i, j) => vec.dot(simpCoroots[i], simpRoots[j]))
    }

    export function rootPosetDigraph(rs: IRootSystem): digraph.Digraph<number, IRoot, number> {
        let G = new digraph.Digraph<number, IRoot, number>(() => new maps.FlatIntMap())

        // Need to build the graph in topological order. First add the simple roots.
        let seen = arr.constant(rs.posRoots.length, false)
        let queue = new Queue<IRoot>()
        for (let s = 0; s < rank(rs); s++) {
            seen[s] = true
            G.addNode(rs.posRoots[s].index, rs.posRoots[s])
            queue.enqueue(rs.posRoots[s])
        }

        // Now try adding each simple root in order, and seeing whether we stay in the set
        // of positive roots.
        while (queue.size() > 0) {
            let root = queue.dequeue()
            let rt = root.rt.slice()
            for (let s = 0; s < rank(rs); s++) {
                rt[s] += 1
                if (rs.rtToIndex.contains(rt)) {
                    let newRoot = rs.posRoots[rs.rtToIndex.get(rt)]
                    if (!seen[newRoot.index]) {
                        G.addNode(newRoot.index, newRoot)
                        seen[newRoot.index] = true
                        queue.enqueue(newRoot)
                    }
                    G.addEdge(root.index, newRoot.index, s)
                }
                rt[s] -= 1
            }
        }

        return G
    }

    export function rootReflectionDigraph(rs: IRootSystem): digraph.Digraph<number, IRoot, number> {
        let G = new digraph.Digraph<number, IRoot, number>(() => new maps.FlatIntMap())
        let rank = rtsys.rank(rs)

        // Need to build the graph in topological order. First add the simple roots.
        let seen = arr.constant(rs.posRoots.length, false)
        let queue = new Queue<IRoot>()
        for (let s = 0; s < rank; s++) {
            seen[s] = true
            G.addNode(rs.posRoots[s].index, rs.posRoots[s])
            queue.enqueue(rs.posRoots[s])
        }

        while (queue.size() > 0) {
            let root = queue.dequeue()
            for (let s = 0; s < rank; s++) {
                let newIdx = rs.reflectionTable[rank * root.index + s]
                if (newIdx < 0 || newIdx <= root.index)
                    continue

                let newRoot = rs.posRoots[newIdx]
                if (!seen[newIdx]) {
                    G.addNode(newRoot.index, newRoot)
                    seen[newRoot.index] = true
                    queue.enqueue(newRoot)
                }

                G.addEdge(root.index, newRoot.index, s)
            }
        }

        return G
    }

    /** (Φ, λ) ↦ dim Δ(λ), the Weyl dimension formula. Here λ is given in the weight basis, and is
     * understood to be a representation of the simply-connected group. */
    export function weylDimension(rs: IRootSystem, wt: Vec): bigint {
        // The product of 〈α^, λ + ρ〉/ 〈α^, ρ〉where α^ ranges over all positive coroots.
        // In the fundamental weight basis, ρ = (1, ..., 1), and hence each denominator is the
        // height of the coroot.
        let numer = 1n
        let denom = 1n
        for (let coroot of rs.posCoroots) {
            numer *= BigInt(vec.dot(coroot.rt, wt) + coroot.height)
            denom *= BigInt(coroot.height)
        }

        return numer / denom
    }

    /** Dominant character of a weight, expressed in the basis m[μ], where each m[μ] is the sum over
     * the W-orbit of μ. */
    export function dominantChar(rs: IRootSystem, wt: Vec) {
        if (!wt.every(x => num.isInteger(x) && x >= 0))
            throw new Error(`dominantChar can only be called on dominant weights.`)

        // We will use Freudenthal's formula, which expresses the multiplicity of a weight in terms of
        // multiplicities of higher weights, starting with the base case that the multiplicity of the
        // highest weight is equal to 1.
        //
        // For this we need to compute the set of dominant weights in the character, which is the set
        // wt - ∑ℕαᵢ intersected with the dominant chamber, and we also need to partition this into
        // levels, where μ is a at level k if wt - μ has height k in the root lattice. Going in increasing
        // order of levels then gives us an ordering compatible with the calculation of the formula.
        //
        // To compute the levels, we cannot just subtract simple roots; for example it might be the case
        // that wt - αᵢ is not dominant for all simple roots. For for each new level we encounter, we will
        // subtract all positive roots from each weight, and assign them to their correct levels, keeping
        // track of what we have already added so that we don't add weights twice. Note also that not every
        // level needs to contain a weight.
        function isDominant(weight: number[]): boolean {
            for (let i = 0; i < weight.length; i++)
                if (weight[i] < 0)
                    return false

            return true
        }
        let weightToLevel = new maps.EntryVecMap<number>()
        weightToLevel.set(wt, 0)
        let weightsInLevel = [[wt]]
        let tmp: number[] = []
        let tmp2: number[] = []
        for (let curLevel = 0; weightsInLevel.length > curLevel; curLevel++) {
            let level = weightsInLevel[curLevel]
            for (let i = 0; i < level.length; i++) {
                let mu = level[i]
                for (let j = 0; j < rs.posRoots.length; j++) {
                    let root = rs.posRoots[j]
                    vecmut.sub(tmp, mu, root.wt)
                    if (!isDominant(tmp) || weightToLevel.contains(tmp))
                        continue

                    let newLevel = curLevel + root.height
                    weightToLevel.set(tmp, newLevel)
                    while (weightsInLevel.length <= newLevel)
                        weightsInLevel.push([])

                    weightsInLevel[newLevel].push(tmp.slice())
                }
            }
        }

        // In order to use the formula, we need to be able to compute inner products on weights. The inner
        // product is given by the Cartan datum DA on the root basis, hence on the weight basis it is given
        // by (A inverse transpose) D. By scaling the form we can use the adjugate of A rather than its
        // inverse, since the formula does not depend on the scaling of the inner prouduct.
        let {adj} = mat.integralAdjugate(rs.cartan)
        let innerProd = mat.multMat(mat.transpose(adj), mat.diag(rs.simpNorms))
        let rho = arr.constant(wt.length, 1)

        function mutMakeDominant(weight: number[]): void {
            for (;;) {
                let firstNeg = 0
                for (; firstNeg < weight.length; firstNeg++)
                    if (weight[firstNeg] < 0)
                        break

                if (firstNeg == weight.length)
                    break

                vecmut.addScaled(weight, weight, rs.posRoots[firstNeg].wt, 0 - weight[firstNeg])
            }
        }

        let multiplicities = new maps.EntryVecMap<number>()
        multiplicities.set(wt, 1)
        for (let curLevel = 1; curLevel < weightsInLevel.length; curLevel++) {
            for (let i = 0; i < weightsInLevel[curLevel].length; i++) {
                let mu = weightsInLevel[curLevel][i]
                let sum = 0
                for (let j = 0; j < rs.posRoots.length; j++) {
                    let root = rs.posRoots[j]
                    for (let k = 1; ; k++) {
                        vecmut.addScaled(tmp, mu, root.wt, k)
                        vecmut.copy(tmp2, tmp)
                        mutMakeDominant(tmp2)
                        if (!weightToLevel.contains(tmp2))
                            break

                        sum += multiplicities.get(tmp2) * mat.multInner(tmp, innerProd, root.wt)
                    }
                }

                let denom = 0
                vecmut.add(tmp, wt, rho)
                denom += mat.multInner(tmp, innerProd, tmp)
                vecmut.add(tmp, mu, rho)
                denom -= mat.multInner(tmp, innerProd, tmp)

                multiplicities.set(mu, 2 * sum / denom)
            }
        }

        return multiplicities
    }

    /** Evaluate the Kostant partition function for all positive roots <= rt. */
    // function kostantPartition(rs: IRootSystem, rt: Vec): IMap<Vec, bigint> {
    //     if (rt.some(x => x < 0))
    //         throw new Error(`Can only call kostantPartition on positive roots.`)
    //     if (rt.length != rank(rs))
    //         throw new Error(`Root vector length is incompatible with the root system`)

    //     // Let λ be an element of the nonnegative root lattice, and let
    //     // K(λ) be the set of ways of writing λ as a sum of simple roots. Introduce
    //     // K(λ, k) to be the set of ways of writing λ as a sum of simple roots, using only
    //     // the roots {0, ..., k - 1}. Then
    //     //   K(0, 0) = 1 and K(λ, 0) = 0 otherwise,
    //     //   K(λ, rank) = K(λ), and
    //     //   K(λ, k) = K(λ, k - 1) + K(λ - αₖ, k) + K(λ - 2αₖ, k) + ...
    //     //      where the sum terminates once λ - αₖ becomes negative.
    //     // In order to fill out a table of the K(λ, k), we just need to make sure that lower
    //     // elements are evaluated before higher ones, which we can do by

    //     let rank = rtsys.rank(rs)
    //     let K = IntVecMap.empty<bigint[]>()

    // }
}
