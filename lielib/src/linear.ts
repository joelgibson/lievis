import { bits } from "./bits"
import { num } from "./num"

/** A vector is represented as a plain, unadorned javascript array containing numbers.
 * The length of the array is the dimension of the vector. The functions in the "vec"
 * and "mat" namespaces will all check the lengths of vectors to ensure they make sense
 * on the given operation: for example adding or subtracting vectors of different lengths
 * will throw an error. The functions in the "vecmut" and "matmut" namespaces will not do
 * any checking, see the documentation of those functions for the semantics.
 */
export type Vec = number[]

/** A matrix is represented as a plain object storing the number of rows, number of columns,
 * and the contents of the matrix as a single array in row-major order.
 */
export interface Mat {
    readonly nrows: number
    readonly ncols: number
    readonly data: number[]
    get(i: number, j: number): number
}

/** The functions in the "vec" namespace only read their arguments, and always produce
 * new objects as output. (In other words, they work in a purely-functional style). This is
 * pretty much always the right choice to start with.
 */
export namespace vec {
    /** (u, v) ↦ true if u == v, otherwise false. Compares the elements of each vector.
     * It will throw an error if given vectors of different lengths. */
    export function equal(u: Vec, v: Vec): boolean {
        if (u.length != v.length)
            throw new Error("Should not be comparing vectors of different lengths.")

        for (let i = 0; i < u.length; i++)
            if (u[i] != v[i])
                return false

        return true
    }

    /** Construct a vector from a length, and a function (index => number). */
    export function fromEntries(dim: number, f: (i: number) => number): Vec {
        if (dim < 0)
            throw new Error("Cannot construct a vector with a negative length.")

        let result = []
        for (let i = 0; i < dim; i++)
            result[i] = f(i)

        return result
    }

    /** n ↦ zero vector of length n */
    export function zero(dim: number): Vec {
        return fromEntries(dim, () => 0)
    }

    /** (u, v) ↦ u + v */
    export function add(u: Vec, v: Vec): Vec {
        if (u.length != v.length)
            throw new Error("Vectors must have the same length to add.")

        return fromEntries(u.length, (i) => u[i] + v[i])
    }

    /** (u, v) ↦ u - v */
    export function sub(u: Vec, v: Vec): Vec {
        if (u.length != v.length)
            throw new Error("Vectors must have the same length to subtract.")

        return fromEntries(u.length, (i) => u[i] - v[i])
    }

    /** (u, v, λ) ↦ u + vλ */
    export function addScaled(u: Vec, v: Vec, scalar: number) {
        if (u.length != v.length)
            throw new Error("Vectors must have same length")

        return fromEntries(u.length, (i) => u[i] + v[i] * scalar)
    }

    /** u ↦ -u */
    export function neg(u: Vec): Vec {
        return u.map(x => 0-x)
    }

    /** (u, λ) ↦ uλ */
    export function scale(u: Vec, scalar: number): Vec {
        return u.map(x => x * scalar)
    }

    /** (n, i) ↦ basis vector e_i in dimension n */
    export function e(n: number, i: number): Vec {
        if (n < 0)
            throw new Error("Cannot construct a vector with a negative length")

        if (i < 0 || i >= n)
            throw new Error("The index lies outside the bounds: this would construct a zero 'basis vector'.")

        return fromEntries(n, j => (i == j) ? 1 : 0)
    }

    // Functions relevant in a Euclidean space.
    // By convention, if there is a nonlinear argument it comes first.

    /** (u, v) ↦ u • v */
    export function dot(u: Vec, v: Vec): number {
        if (u.length != v.length)
            throw new Error("Vectors must have the same length to take the dot product.")

        let sum = 0
        for (let i = 0; i < u.length; i++)
            sum += u[i] * v[i]
        return sum
    }

    /** (u) ↦ |u| */
    export function norm(u: Vec): number {
        return Math.sqrt(dot(u, u))
    }

    /** (u, v) ↦ |u - v|² */
    export function dist2(u: Vec, v: Vec): number {
        if (u.length != v.length)
            throw new Error("Vectors must have the same length to take the distance squared.")

        let sum = 0
        for (let i = 0; i < u.length; i++)
            sum += (u[i] - v[i]) * (u[i] - v[i])
        return sum
    }

    /** (u, v) ↦ |u - v| */
    export function dist(u: Vec, v: Vec): number {
        return Math.sqrt(dist2(u, v))
    }

    /** (u, λ) ↦ λ u / |u| */
    export function scaleToNorm(u: Vec, newNorm: number): Vec {
        return scale(u, newNorm / norm(u))
    }

    /** (u, v) ↦ projection of v to Ru */
    export function projectLine(u: Vec, v: Vec): Vec {
        if (u.length != v.length)
            throw new Error("Vectors must have the same length to take projections.")

        return scale(u, dot(u, v) / dot(u, u))
    }

    /** (u, v) ↦ projection of v to hyperplane (u • -) = 0 */
    export function projectHyperplane(u: Vec, v: Vec): Vec {
        if (u.length != v.length)
            throw new Error("Vectors must have the same length to take projections.")

        return sub(v, projectLine(u, v))
    }

    /** α ↦ 2 α / (α • α) */
    export function check(u: Vec) {
        return vec.scale(u, 2 / vec.dot(u, u))
    }

    /** (u, v) ↦ Reflection of v in hyperplane (u • -) = 0 */
    export function reflect(u: Vec, v: Vec): Vec {
        let scalar = 2 * vec.dot(u, v) / vec.dot(u, u)
        return vec.sub(v, vec.scale(u, scalar))
    }

    /** [u1, u2, ...] ↦ orthonormal [v1, v2, ...] spanning the same space */
    export function gramSchmidt(vectors: Vec[]): Vec[] {
        if (vectors.length == 0) {
            return []
        }

        // Zero vector of the same length as one of the vectors.
        const zero = vectors[0].map(x => 0)

        // Collect our orthonormal vectors here.
        const output = [scaleToNorm(vectors[0], 1)]
        for (let i = 1; i < vectors.length; i++) {
            // Project to the subspace so far.
            const proj = output.reduce((acc, n) => add(acc, projectLine(n, vectors[i])), zero)
            // Now vectors[i] - proj is orthogonal to what we have so far.
            output.push(scaleToNorm(sub(vectors[i], proj), 1))
        }

        return output
    }

    /** ([u1, u2, ...], A) ↦ orthonormal (wrt the sym bilin form A) [v1, v2, ...] spanning the same space.
     * The matrix A should be symmetric positive-definite in order for this function to work.
    */
    export function gramSchmidtBilin(us: Vec[], A: Mat): Vec[] {
        if (us.length == 0)
            return []

        let dim = us[0].length
        if (!us.every(u => u.length == dim))
            throw new Error("Input vectors to gramSchmidtBilin were not all the same length.")

        if (A.nrows != dim || A.ncols != dim)
            throw new Error("Input matrix to gramSchmidtBilin was not the same size as the vectors.")

        // Zero vector of the same length as one of the vectors.
        const zero = vec.zero(dim)

        const innprod = (u: Vec, v: Vec) => vec.dot(u, mat.multVec(A, v))
        const norm = (v: Vec) => Math.sqrt(innprod(v, v))
        const scaleToNorm = (v: Vec, length: number) => vec.scale(v, length / norm(v))
        const projectLine = (u: Vec, v: Vec) => scale(u, innprod(u, v) / innprod(u, u))

        // Collect our orthonormal vectors here.
        const vs = [scaleToNorm(us[0], 1)]
        for (let i = 1; i < us.length; i++) {
            // Project to the subspace so far.
            const proj = vs.reduce((acc, n) => add(acc, projectLine(n, us[i])), zero)
            // Now us[i] - proj is orthogonal to what we have so far.
            vs.push(scaleToNorm(sub(us[i], proj), 1))
        }

        return vs
    }

    // Functions which work on 3D vectors.

    /** (u, v) ↦ u × v */
    export function cross3D(u: Vec, v: Vec): Vec {
        if (u.length != 3 || v.length != 3)
            throw new Error("Vectors must be length 3 to take the cross product.")

        return [
            u[1] * v[2] - u[2] * v[1],
            u[2] * v[0] - u[0] * v[2],
            u[0] * v[1] - u[1] * v[0]
        ]
    }

    // Functions which work on 2D vectors.

    /** (θ, u) ↦ u rotated anticlockwise by θ radians */
    export function rotate2D(angle: number, u: Vec): Vec {
        if (u.length != 2)
            throw new Error("Vectors must be length 2 to rotate.")

        const [x, y] = u
        const c = Math.cos(angle)
        const s = Math.sin(angle)
        return [c*x - s*y, s*x + c*y];
    }

    /** (u, v) ↦ the anticlockwise angle from u to v, radians. angle2D(u, -) is discontinuous at u. */
    export function angle2D(u: Vec, v: Vec): number {
        if (u.length != 2 || v.length != 2)
            throw new Error("Vectors must be length 2 to take the angle betweent them.")

        let angle = Math.atan2(v[1], v[0]) - Math.atan2(u[1], u[0])
        return (angle < 0) ? Math.PI - angle : angle
    }

    export function mean(...vecs: Vec[]) {
        if (vecs.length == 0)
            throw new Error("Mean needs to be called with at least one element (to get dimension).")

        const length = vecs[0].length
        const result = vec.zero(length)
        for (let i = 0; i < vecs.length; i++) {
            if (vecs[i].length != length)
                throw new Error("Vectors must all be of the same length for mean.")
            for (let j = 0; j < length; j++)
                result[j] += vecs[i][j] / vecs.length
        }

        return result
    }

    export function copy(vec: Vec): Vec {
        let newVec: Vec = []
        for (let i = 0; i < vec.length; i++)
            newVec[i] = vec[i]

        return newVec
    }

    export function isZero(vec: Vec): boolean {
        for (let i = 0; i < vec.length; i++)
            if (vec[i] != 0)
                return false

        return true
    }

    export function sum(v: Vec): number {
        let sum = 0
        for (let i = 0; i < v.length; i++)
            sum += v[i]

        return sum
    }

    export function max(...vs: Vec[]): Vec {
        if (vs.length == 0)
            throw new Error("Maximum of empty list")

        let len = vs[0].length
        for (let i = 1; i < vs.length; i++)
            if (vs[i].length != len)
                throw new Error("Cannot take maximum of vectors of different lengths.")

        let max = vs[0].slice()
        for (let i = 1; i < vs.length; i++)
            for (let j = 0; j < len; j++)
                max[j] = Math.max(max[j], vs[i][j])

        return max
    }
}

export namespace mat {
    /** This class is not directly exposed. Callers should construct matrices using the functions
     * in this namespace.
     */
    class Matrix implements Mat {
        /** Create a matrix from row-major data, i.e. (i, j) is at data[ncols * i + j]. */
        constructor(
            readonly nrows: number,
            readonly ncols: number,
            readonly data: number[]
        ) {}

        get(i: number, j: number): number {
            return this.data[this.ncols * i + j]
        }
    }

    /** Construct an n x m matrix from a function (i, j) => number. */
    export function fromEntries(nrows: number, ncols: number, f: (i: number, j: number) => number): Mat {
        if (nrows < 0 || ncols < 0)
            throw new Error("Cannot make a matrix with a negative number of rows or columns.")

        const data = []
        for (let i = 0; i < nrows; i++)
            for (let j = 0; j < ncols; j++)
                data.push(f(i, j))

        return new Matrix(nrows, ncols, data)
    }

    /** The zero matrix. */
    export function zero(nrows: number, ncols: number): Mat {
        let data: number[] = []
        for (let i = 0; i < nrows * ncols; i++)
            data[i] = 0

        return new Matrix(nrows, ncols, data)
    }

    /** A square scalar matrix. */
    export function scalar(n: number, scalar: number): Mat {
        let data: number[] = []
        for (let i = 0; i < n; i++)
            for (let j = 0; j < n; j++)
                data[i*n + j] = (i == j) ? scalar : 0

        return new Matrix(n, n, data)
    }

    /** The identity matrix */
    export function id(dim: number): Mat {
        return fromEntries(dim, dim, (i, j) => (i == j) ? 1 : 0)
    }

    /** A diagonal matrix. */
    export function diag(diagonal: number[]): Mat {
        let n = diagonal.length
        let data: number[] = []
        for (let i = 0; i < n; i++)
            for (let j = 0; j < n; j++)
                data[i*n + j] = (i == j) ? diagonal[i] : 0

        return new Matrix(n, n, data)
    }

    /** Construct a matrix from a list of rows */
    export function fromRows(vectors: Vec[]): Mat {
        if (vectors.length == 0)
            return new Matrix(0, 0, [])

        return fromEntries(vectors.length, vectors[0].length, (i, j) => vectors[i][j])
    }

    /** Recover a list of rows from a matrix */
    export function toRows(M: Mat): Vec[] {
        const rows = []
        for (let i = 0; i < M.data.length; i += M.ncols) {
            rows.push(M.data.slice(i, i + M.ncols))
        }
        return rows
    }

    /** Return a flat array of the entries of the matrix in column-major order. */
    export function toColMaj(M: Mat): Vec {
        let data: Vec = []
        for (let j = 0; j < M.ncols; j++)
            for (let i = 0; i < M.nrows; i++)
                data[j*M.nrows + i] = M.get(i, j)

        return data
    }

    /** Transpose a matrix */
    export function transpose(M: Mat): Mat {
        return fromEntries(M.ncols, M.nrows, (i, j) => M.get(j, i))
    }

    /** Construct a matrix from a list of columns */
    export function fromColumns(vectors: Vec[]): Mat {
        return transpose(fromRows(vectors))
    }

    /** Recover a list of columns from a matrix */
    export function toColumns(M: Mat): Vec[] {
        return toRows(transpose(M))
    }

    /** Construct a matrix from a linear function. */
    export function fromLinear(f: (v: Vec) => Vec, dim: number): Mat {
        let columns = []
        for (let i = 0; i < dim; i++) {
            columns.push(f(vec.e(dim, i)))
        }
        return fromColumns(columns)
    }

    /** Construct a linear function backed by a matrix. */
    export function toLinear(M: Mat): (v: Vec) => Vec {
        return v => multVec(M, v)
    }

    /** "Matrixify" a linear map, returning another equivalent
     *  linear map which uses matrix multiplication instead. */
    export function matrixify(f: (v: Vec) => Vec, dim: number): (v: Vec) => Vec {
        return toLinear(fromLinear(f, dim))
    }

    /** Take the submatrix defined by the index lists. */
    export function submatrix(M: Mat, I: number[], J: number[]): Mat {
        let newData: number[] = []
        for (let i of I)
            for (let j of J)
                newData.push(M.get(i, j))

        return new Matrix(I.length, J.length, newData)
    }

    /** Take the submatrix defined by the bitmasks. */
    export function submatrixMask(M: Mat, rowMask: number, colMask: number): Mat {
        let newData: number[] = []
        for (let i = 0; i < M.nrows; i++)
            if (((1 << i) & rowMask) != 0)
                for (let j = 0; j < M.ncols; j++)
                    if (((1 << j) & colMask) != 0)
                        newData.push(M.get(i, j))

        return new Matrix(bits.popCount(rowMask), bits.popCount(colMask), newData)
    }

    /** Using an nxn matrix M and an n-length vector t, construct the affine
     * (n + 1)x(n + 1) matrix which performs multiplication by M followed by
     * translation by t.
     *
     * This is the block matrix
     * [ M | t ]
     * [ 0 | 1 ]
     */
    export function fromSemidirect(M: Mat, t: Vec): Mat {
        if (M.nrows != M.ncols)
            throw new Error("Matrix was not square.")

        if (M.nrows != t.length)
            throw new Error("Matrix and vector should be the same size.")

        let n = M.nrows
        return fromEntries(n + 1, n + 1, (i, j) => {
            if (i < n && j < n) return M.get(i, j)
            if (i == n && j == n) return 1
            if (j == n) return t[i]
            return 0
        })
    }

    /** Matrix-scalar multiplication */
    export function scale(M: Mat, scalar: number): Mat {
        return new Matrix(M.nrows, M.ncols, M.data.map(x => x * scalar))
    }

    /** Matrix-matrix subtraction */
    export function sub(M: Mat, N: Mat): Mat {
        if (M.nrows != N.nrows || M.ncols != N.ncols)
            throw new Error("Matrices must be the same shape to subtract.")

        return new Matrix(M.nrows, M.ncols, M.data.map((_, i) => M.data[i] - N.data[i]))
    }

    /** (M, u) ↦ Mu. Multiplies a matrix M with a vector u (considered as a column vector). */
    export function multVec(M: Mat, u: Vec): Vec {
        if (!(M instanceof Matrix)) {
            throw new Error("M is not a matrix.")
        }
        if (M.ncols != u.length) {
            throw new Error("The dimensions of M and u are not compatible.")
        }

        const result = []
        for (let idx = 0; idx < M.data.length; ) {
            let entry = 0
            for (let j = 0; j < u.length; j++) {
                entry += M.data[idx++] * u[j]
            }
            result.push(entry)
        }

        return result
    }

    /** (u, M) ↦ uM. Multiplies a vector u (considered as a row vector) with a matrix M. */
    export function multVecLeft(u: Vec, M: Mat): Vec {
        if (!(M instanceof Matrix)) {
            throw new Error("M is not a matrix.")
        }
        if (M.nrows != u.length) {
            throw new Error("The dimensions of M and u are not compatible.")
        }

        const result = []
        for (let j = 0; j < M.ncols; j++) {
            let entry = 0
            for (let i = 0; i < M.nrows; i++) {
                entry += u[i] * M.data[M.ncols * i + j]
            }
            result.push(entry)
        }

        return result
    }

    /** (u, M, v) ↦ uMv. Multiplies a vector u (considered as a row vector) with a matrix M and with
     * a column vector v, to produce a scalar. */
    export function multInner(u: Vec, M: Mat, v: Vec): number {
        if (!(M instanceof Matrix))
            throw new Error("M is not a matrix.")

        if (M.nrows != u.length || M.ncols != v.length)
            throw new Error("Dimensions incompatible.")

        let sum = 0
        for (let i = 0; i < M.nrows; i++)
            for (let j = 0; j < M.ncols; j++)
                sum += u[i] * M.data[M.ncols * i + j] * v[j]

        return sum
    }

    /** (M, N) ↦ MN. */
    export function multMat(M: Mat, N: Mat): Mat {
        if (M.ncols != N.nrows)
            throw new Error(`Dimensions incompatible: (${M.nrows}, ${M.ncols}) x (${N.nrows}, ${N.ncols})`)

        let data: number[] = []
        for (let i = 0; i < M.nrows * N.ncols; i++)
            data[i] = 0

        for (let i = 0; i < M.nrows; i++)
            for (let k = 0; k < M.ncols; k++)
                for (let j = 0; j < N.ncols; j++)
                    data[i * N.ncols + j] += M.data[M.ncols * i + k] * N.data[N.ncols * k + j]

        return new Matrix(M.nrows, N.ncols, data)
    }

    /** M ↦ M^n. */
    export function pow(M: Mat, pow: number): Mat {
        if (!Number.isSafeInteger(pow) || pow < 0)
            throw new Error("Fractional or negative powers unhandled.")

        if (!isSquare(M))
            throw new Error("Cannot take powers of a non-square matrix.")

        let acc = mat.id(M.nrows)
        let powered = M
        for (let exp = pow; exp != 0; exp >>>= 1) {
            if (exp & 1)
                acc = mat.multMat(acc, powered)

            powered = mat.multMat(powered, powered)
        }

        return acc
    }

    /** (M, i, j) ↦ M with row i and column j deleted */
    function cofactor(M: Mat, i: number, j: number) {
        let data: number[] = []
        for (let k = 0; k < M.nrows; k++)
            for (let l = 0; l < M.ncols; l++)
                if (i != k && j != l)
                    data.push(M.get(k, l))

        return new Matrix(M.nrows - 1, M.ncols - 1, data)
    }

    /** M ↦ inverse of M. Uses the subdeterminant definition of the cofactor matrix and so runs
     * in O(n³ × n!) time. Only use this for small matrices.
     */
    export function inverse(M: Mat): Mat {
        const determinant = det(M)
        return fromEntries(M.nrows, M.ncols, (i, j) => {
            const sign = ((i + j) % 2 == 0) ? 1 : -1
            // The sneaky "0 + ..." is to avoid weird IEEE floating point -0 sneaking in.
            return 0 + sign * det(cofactor(M, j, i)) / determinant
        })
    }

    /** (M, b) ↦ a solution x of Mx = b. This does not solve general systems, only those of a "skinny" matrix
     * M which has linearly independent columns. */
    export function solveLinear(M: Mat, b: Vec): Vec {
        // Check the input makes sense.
        if (M.nrows != b.length)
            throw new Error(`Trying to solve a linear system where the matrix has ${M.nrows} rows but the vector has ${b.length}`)

        // We only ever need the case of a unique solution, where the number of columns of the matrix is at most the length
        // of the vector. (The matrices we are solving must be skinny rather than fat.)
        if (M.ncols > b.length)
            throw new Error("Solving systems of this kind is unimplemented.")

        // Naive Gaussian elimination. We don't use this method much so perhaps it's fine.
        // Firstly we form the rows of the augmented matrix.
        let rows = toRows(M)
        for (let i = 0; i < b.length; i++)
            rows[i].push(b[i])

        // Now we go looking for pivots.
        for (let i = 0; i < M.ncols; i++) {
            // We don't want to distub any top rows (the number of top rows equal to pivotsFound).
            // Search in column i, below this top region, looking for a nonzero entry.
            let nonZero = -1
            for (let j = i; j < M.nrows; j++) {
                if (rows[j][i] != 0) {
                    nonZero = j
                    break
                }
            }

            // If we didn't find any nonzero entries, the columns of the starting matrix were not
            // linearly independent and so we abort.
            if (nonZero < 0) {
                throw new Error("The matrix in the linear system had linearly dependent columns.")
            }

            // Now swap our non-zero row with the current row.
            [rows[i], rows[nonZero]] = [rows[nonZero], rows[i]]

            // Normalise the current row so that the (i, i) entry is 1.
            vecmut.scale(rows[i], rows[i], 1/rows[i][i])

            // Use the affine row operations to kill any entries above or below (i, i).
            for (let j = 0; j < M.nrows; j++) {
                if (i == j)
                    continue

                vecmut.addScaled(rows[j], rows[j], rows[i], -rows[j][i])
            }
        }

        // If we got this far, our augmented matrix now has an identity matrix in the top with zeros
        // below it. We need to check that the bottom rows are consistent.
        for (let i = M.ncols; i < M.nrows; i++)
            if (rows[i][M.ncols] != 0)
                throw new Error("The linear system was inconsistent.")

        // Now the answer will be in the augmented part of the matrix.
        let result: number[] = []
        for (let i = 0; i < M.ncols; i++)
            result[i] = rows[i][M.ncols]

        return result
    }

    export function copy(M: Mat): Mat {
        return new Matrix(M.nrows, M.ncols, M.data.slice())
    }

    /** Return the trace of the matrix. */
    export function tr(M: Mat): number {
        if (M.nrows != M.ncols)
            throw new Error("Trace can only be taken for square matrices.")

        let trace = 0
        for (let i = 0; i < M.nrows; i++)
            trace += M.get(i, i)

        return trace
    }

    /** Return the determinant of the matrix.
     * The determinant is calculated using Gaussian elimination over R, and is inexact for integral matrices.
     * Math.floor(det(M)) might be "good enough".
     */
    export function det(M: Mat) {
        if (M.nrows != M.ncols)
            throw new Error("Matrix must be square to take determinant.")

        // We will row-reduce M, looking to get it in upper-triangular form. This can
        // be done using only affine operations (which do not affect the determinant)
        // and swaps (which negate the determinant). We will keep track of the number
        // of swaps for this reason.
        M = mat.copy(M)
        let swaps = 0

        for (let col = 0; col < M.ncols; col++) {
            // Go down the column looking for a nonzero entry. We can start from col, since
            // we're just looking for something upper-triangular.
            let row = col;
            while (row < M.nrows && M.get(row, col) == 0) row++

            // If we reached the end of the column, the determinant is zero.
            if (row == M.nrows)
                return 0

            // Otherwise, we might need to swap this row back to col.
            if (row != col) {
                matmut.erSwap(M, row, col)
                swaps += 1
            }

            // Now kill each entry below.
            for (let i = col + 1; i < M.nrows; i++)
                matmut.erAff(M, i, col, -M.get(i, col)/M.get(col,col))
        }

        // Take the product of the diagonals.
        let prod = 1
        for (let i = 0; i < M.nrows; i++)
            prod *= M.get(i, i)

        return (swaps % 2 == 0) ? prod : 0 - prod
    }

    /** Row-reduce a matrix to row-echelon form, returning the new matrix and the list of pivots.
     * The list of pivots specify the columns in which the pivot can be found, eg pivots[i] = j means
     * that (i, j) is a pivot.
     */
    function rowEchelonForm(M: Mat) {
        M = mat.copy(M)
        let pivots: number[] = []
        let nonpivots: number[] = []
        for (let col = 0; col < M.ncols; col++) {
            // Go down the column looking for a nonzero entry.
            let row = (pivots.length == 0) ? 0 : pivots[pivots.length - 1] + 1
            while (row < M.nrows && Math.abs(M.get(row, col)) < 1e-6) row++

            // If we reached the end of the column, try again on the next column.
            if (row == M.nrows) {
                nonpivots.push(col)
                continue
            }

            // Otherwise, swap this row to the pivot position, scale it so that the pivot is a 1,
            // and clear entries below.
            let pivRow = pivots.length
            matmut.erSwap(M, row, pivRow)
            for (let i = pivRow + 1; i < M.nrows; i++)
                matmut.erAff(M, i, pivRow, -M.get(i, col)/M.get(pivRow, col))

            pivots.push(col)
        }

        return {M, pivots, nonpivots}
    }

    /** Dimension of the kernel of M. */
    export function kernelDim(M: Mat) {
        let {M: res, pivots} = rowEchelonForm(M)
        return M.ncols - pivots.length
    }

    /** Vectors spanning the kernel of M. */
    export function kernel(M: Mat): Vec[] {
        let {M: res, pivots, nonpivots} = rowEchelonForm(M)
        let solns: Vec[] = []
        for (let n of nonpivots) {
            let soln = vec.zero(M.ncols)
            soln[n] = 1

            for (let i = pivots.length - 1; i >= 0; i--) {
                let j = pivots[i]
                let remainder = 0
                for (let k = j + 1; k < M.ncols; k++)
                    remainder += res.get(i, k) * soln[k]

                soln[j] = 0 - remainder / res.get(i, j)
            }

            solns.push(soln)
        }

        return solns
    }

    /** A square root of a matrix, currently only defined for 1x1 or 2x2 symmetric positive-definite
     * matrices.
     */
    export function sqrt(M: Mat): Mat {
        if (M.nrows != M.ncols)
            throw new Error("Cannot take square root of a non-square matrix.")

        if (M.nrows == 0)
            return M

        if (M.get(0, 0) < 0)
            throw new Error("Matrix is not positive-definite.")

        if (M.nrows == 1)
            return new Matrix(1, 1, [Math.sqrt(M.get(0, 0))])

        if (M.nrows >= 3)
            throw new Error("Matrix square root not implemented for 3x3 or higher.")

        // 2x2 case from https://en.wikipedia.org/wiki/Square_root_of_a_2_by_2_matrix
        let tr = mat.tr(M)
        let det = mat.det(M)
        if (det <= 0 || tr <= 0)
            throw new Error("Matrix is not positive-definite")

        let s = Math.sqrt(det)
        let t = Math.sqrt(tr + 2*s)
        return new Matrix(2, 2, [
            (M.get(0, 0) + s) / t, M.get(0, 1) / t,
            M.get(1, 0) / t, (M.get(1, 1) + s) / t
        ])
    }

    export function equal(A: Mat, B: Mat) {
        return (A.nrows == B.nrows) && (A.ncols == B.ncols) && vec.equal(A.data, B.data)
    }

    /** Test whether M is square. */
    export function isSquare(M: Mat): boolean {
        return M.nrows == M.ncols
    }

    /** Test whether M is the identity matrix. */
    export function isIdentity(M: Mat): boolean {
        if (!isSymmetric(M) || !isIntegral(M))
            return false

        for (let i = 0; i < M.nrows; i++)
            if (M.get(i, i) != 1)
                return false

        for (let i = 0; i < M.nrows; i++)
            for (let j = i + 1; j < M.nrows; j++)
                if (M.get(i, j) != 0)
                    return false

        return true
    }

    /** Predicate testing whether a matrix is symmetric. */
    export function isSymmetric(M: Mat): boolean {
        if (M.nrows != M.ncols)
            return false

        for (let i = 0; i < M.nrows; i++)
            for (let j = i + 1; j < M.nrows; j++)
                if (M.get(i, j) != M.get(j, i))
                    return false

        return true
    }

    /** Predicate testing whether a matrix is integral. */
    export function isIntegral(M: Mat): boolean {
        for (let i = 0; i < M.nrows; i++)
            for (let j = 0; j < M.ncols; j++)
                if (!Number.isSafeInteger(M.get(i, j)))
                    return false

        return true
    }

    export function multAff(M: Mat, v: Vec): Vec {
        let u: number[] = v.map(() => 0)
        matmut.multAff(u, M, v)
        return u
    }

    /** The 2D rotation matrix. */
    export function rotate2D(radians: number): Mat {
        const c = Math.cos(radians)
        const s = Math.sin(radians)
        return new Matrix(2, 2, [c, -s, s, c])
    }

    export function debugPrint(A: Mat): void {
        console.log(mat.toRows(A).map(row => row.map(x => (x.toFixed(3)).padStart(7)).join('')).join('\n'))
    }

    /** Put an integral matrix A into Hermite normal form, returning H, U such that
     * H = UA, H is in Hermite normal form, and U is invertible over the integers.
     * The determinant of U is +1 or -1, and is returned in detU.
     *
     * Here a "Hermite form" means:
     *   1. H is upper triangular, with any rows of zeros appearing at the bottom.
     *   2. Pivots are positive, and go down the diagonal and/or to the right.
     *   3. Below pivots are zeros, and above pivots entries lie in the range [0, pivot).
     *
     * The matrix A has a unique Hermite form H.
     */
    export function hermiteForm(A: Mat): {H: Mat, U: Mat, detU: number} {
        if (!mat.isIntegral(A))
            throw new Error(`Hermite form only applies to integral matrices.`)

        // U will "track" row operations: every row operation we do to A we will also do to U.
        let H = mat.copy(A)
        let U = mat.id(A.nrows)
        let detUparity = 0

        // Predicate checking if the ith row of A consists entirely of zeros.
        function rowIsZero(A: Mat, i: number): boolean {
            for (let j = 0; j < A.ncols; j++)
                if (A.data[A.ncols * i + j] != 0)
                    return false

            return true
        }

        // Return the index of the first nonzero entry of the jth column of A, in the range [a, b).
        // Return -1 if all entries A[a, j], A[a+1, j], ..., A[b - 1, j] are zero.
        function firstNonzeroInCol(A: Mat, j: number, a: number, b: number): number {
            for (let k = a; k < b; k++)
                if (A.data[A.ncols * k + j] != 0)
                    return k

            return -1
        }

        // Begin by swapping any rows of zeros down to the bottom of the matrix.
        let nonzeroRows = H.nrows
        for (let i = 0; i < nonzeroRows; i++) {
            // Swap this row to the bottom if it consists all of zeros.
            while (i < nonzeroRows && rowIsZero(H, i)) {
                matmut.erSwap(H, i, nonzeroRows - 1)
                matmut.erSwap(U, i, nonzeroRows - 1)
                nonzeroRows -= 1
                detUparity += 1
            }
        }

        // At this point, all the rows of the matrix we are interested in are [0, nonzeroRows).

        // Now we proceed to echelonise the matrix, column by column.
        let pivotRow = 0
        for (let j = 0; j < H.ncols; j++) {
            // Find the first nonzero entry in this column, below where we have already cleared.
            let firstNonempty = firstNonzeroInCol(H, j, pivotRow, nonzeroRows)
            if (firstNonempty < 0)
                continue

            // If pivotRow != r, perform a swap to bring the nonzero entry back up to where
            // the pivot needs to be placed.
            if (pivotRow != firstNonempty) {
                matmut.erSwap(H, pivotRow, firstNonempty)
                matmut.erSwap(U, pivotRow, firstNonempty)
                detUparity
            }

            // Now proceed down the row looking for nonzero elements.
            for (let r = pivotRow + 1; r < nonzeroRows; r++) {
                if (H.get(r, j) == 0)
                    continue

                // If the pivot divides this entry, we can subtract off an appropriate multiple.
                if (H.get(r, j) % H.get(pivotRow, j) == 0) {
                    let multiple = H.get(r, j) / H.get(pivotRow, j)
                    matmut.erAff(H, r, pivotRow, 0 - multiple)
                    matmut.erAff(U, r, pivotRow, 0 - multiple)
                    continue
                }

                // Otherwise, we use the more complicated strategy of replacing the pivot by the
                // GCD of these two numbers, and killing the bottom one. Let the pivot and the entry
                // be a and b, then by Bezout's identity there exist integers s, t such that
                // as + bt = d where d = gcd(a, b) > 0. We then have
                // [ s       t ][ a ] = [as + bt      ] = [ d ]
                // [ b/d  -a/d ][ b ]   [(ab - ba) / d]   [ 0 ]
                // as required.
                let a = H.get(pivotRow, j)
                let b = H.get(r, j)
                let {d, s, t} = num.bezout(a, b)
                matmut.er2x2(H, pivotRow, r, s, t, b/d, 0-a/d)
                matmut.er2x2(U, pivotRow, r, s, t, b/d, 0-a/d)

                if (0-s*a/d-t*b/d < 0)
                    detUparity += 1
            }

            // Now we have cleared the row. Ensure that our pivot is positive.
            if (H.get(pivotRow, j) < 0) {
                matmut.erNegate(H, pivotRow, -1)
                matmut.erNegate(U, pivotRow, -1)
                detUparity += 1
            }

            // The last thing left to do is to make sure that all entries above the pivot p
            // lie in the range [0, p).
            let p = H.get(pivotRow, j)
            for (let r = 0; r < pivotRow; r++) {
                let q = H.get(r, j)
                if (0 <= q && q < p)
                    continue

                let multiple = Math.floor(q / p)
                matmut.erAff(H, r, pivotRow, 0 - multiple)
                matmut.erAff(U, r, pivotRow, 0 - multiple)
            }

            // Finally, our next pivot must be found in a new row.
            pivotRow += 1
        }

        let detU = (detUparity % 2 == 0) ? 1 : -1

        return {H, U, detU}
    }

    /** Returns the determinant of an integral matrix, exactly. */
    export function integralDet(A: Mat): number {
        // The determinant of H = UA is the product of the diagonals of its Hermite form,
        // multiplied by the determinant of U.
        if (!isSquare(A) || !isIntegral(A))
            throw new Error(`IntegralDet can only be called on square integral matrices.`)

        let {H, detU} = hermiteForm(A)
        let prod = 1
        for (let i = 0; i < H.nrows; i++)
            prod *= H.get(i, i)

        return 0 + detU * prod
    }

    /** Returns the adjugate and determinant of an integral matrix A, so that
     * (inverse A) = (1 / det) adj. This means that both adj and det are integral.
     */
    export function integralAdjugate(A: Mat): {adj: Mat, det: number} {
        // Check that we have an integral square matrix to start with.
        if (!mat.isIntegral(A) || !mat.isSquare(A))
            throw new Error("Integral adjugate applies only to square integral matrices.")

        // The strategy will be to put A into Hermite normal form, so we have
        // H = UA, and therefore (A inverse) = (H inverse) U. The determinant
        // of H can be read off easily, and we can solve for the adjugate of H
        // easily because it is upper-triangular.
        let {H, U, detU} = hermiteForm(A)
        let det = 1
        for (let i = 0; i < H.nrows; i++)
            det *= H.get(i, i)

        if (det == 0)
            throw new Error("Matrix was not invertible.")

        // Since H is upper-triangular, so is its inverse. Actually we are after its
        // adjugate B, such that HB = (det H) id.
        //
        // The diagonal entries are easy: B(i, i) = det / H(i, i). After this, we fill
        // in each "level" of B at a time, first the diagonal above the main diagonal, then
        // the next, and so on. Writing down a formula for matrix multiplication and rearranging,
        // we have on the off-diagonals i < j that
        //   B(i, j) = (- 1 / H(i, i)) sum[i < k <= j] H(i, k) B(k, j)
        // and provided we visit the levels in the correct order, those B(k, j) that we depend
        // on will have already been computed.
        let n = A.nrows
        let B = mat.zero(n, n)
        for (let i = 0; i < n; i++)
            B.data[n * i + i] = det / H.get(i, i)

        for (let gap = 1; gap < n; gap++) {
            for (let i = 0; i < n; i++) {
                let j = i + gap
                if (j == n)
                    break

                let sum = 0
                for (let k = i + 1; k <= j; k++)
                    sum += H.get(i, k) * B.get(k, j)

                B.data[n * i + j] = 0 - sum / H.get(i, i)
            }
        }

        // Now B is the adjugate of H. We now have (A adjugate) = B U, and the determinant of
        // A is det * detU.
        return {adj: mat.multMat(B, U), det: (detU > 0) ? det : 0 - det}
    }
}

/** These functions all overwrite their first argument. The amount they overwrite is
 *  determined by their second argument. Be careful when using these.
 */
export namespace vecmut {
    /** Fill the first n entries of u with the scalar λ */
    export function fill(u: Vec, n: number, scalar: number) {
        for (let i = 0; i < n; i++)
            u[i] = scalar
    }

    /** u ← v */
    export function copy(u: Vec, v: Vec): void {
        for (let i = 0; i < v.length; i++)
            u[i] = v[i]
    }

    /** u ← v + w */
    export function add(u: Vec, v: Vec, w: Vec): void {
        for (let i = 0; i < v.length; i++)
            u[i] = v[i] + w[i]
    }

    /** u ← v - w */
    export function sub(u: Vec, v: Vec, w: Vec): void {
        for (let i = 0; i < v.length; i++)
            u[i] = v[i] - w[i]
    }

    /** u ← va */
    export function scale(u: Vec, v: Vec, a: number): void {
        for (let i = 0; i < v.length; i++)
            u[i] = v[i] * a
    }

    /** u ← v + wa */
    export function addScaled(u: Vec, v: Vec, w: Vec, a: number): void {
        for (let i = 0; i < v.length; i++)
            u[i] = v[i] + w[i] * a
    }
}

export namespace matmut {
    /** u ← M v. This only accesses the top left |u| x |v| submatrix of M. */
    export function multVec(u: Vec, M: Mat, v: Vec): void {
        for (let i = 0; i < u.length; i++) {
            u[i] = 0
            for (let j = 0; j < v.length; j++)
                u[i] += M.data[i * M.ncols + j] * v[j]
        }
    }

    /** [u | 1] ← M [v | 1]. Here u and v should be vectors of length n, and M should be a
     *  (n+1) x (n+1) matrix in (n, 1) block form, where the bottom right is 1, and the bottom
     *  left is 0. M and v are treated as though they have 1's in their bottom right corners.
     * TODO: Find a better approach to affine multiplication!
    */
    export function multAff(u: Vec, M: Mat, v: Vec): void {
        for (let i = 0; i < u.length; i++) {
            u[i] = 0
            for (let j = 0; j < M.ncols - 1; j++)
                u[i] += M.data[i * M.ncols + j] * v[j]
        }
        for (let i = 0; i < u.length; i++)
            u[i] += M.data[(i + 1) * M.ncols - 1]
    }

    /** Scaling elementary row operation. R(i) ← R(i) λ */
    export function erScale(M: Mat, i: number, lambda: number): void {
        for (let j = 0; j < M.ncols; j++)
            M.data[M.ncols * i + j] *= lambda
    }

    /** Negating elementary row operation. R(i) ← -R(i). Avoids -0. */
    export function erNegate(M: Mat, i: number, lambda: number): void {
        for (let j = 0; j < M.ncols; j++)
            M.data[M.ncols * i + j] = 0 - M.data[M.ncols * i + j]
    }

    /** Swapping elementary row operation. (R(i), R(j)) ← (R(j), R(i)) */
    export function erSwap(M: Mat, i: number, j: number): void {
        for (let k = 0; k < M.ncols; k++) {
            let tmp = M.data[M.ncols * i + k]
            M.data[M.ncols * i + k] = M.data[M.ncols * j + k]
            M.data[M.ncols * j + k] = tmp
        }
    }

    /** Affine elementary row operation. R(i) ← R(i) + R(j) λ */
    export function erAff(M: Mat, i: number, j: number, lambda: number): void {
        for (let k = 0; k < M.ncols; k++)
            M.data[M.ncols * i + k] += lambda * M.data[M.ncols * j + k]
    }

    /** A 2x2 elementary row operation. Simultaneously,
     * R(i) ← a R(i) + b R(j)
     * R(j) ← c R(i) + d R(j)
     * This will only be invertible if [a b; c d] is.
     */
    export function er2x2(M: Mat, i: number, j: number, a: number, b: number, c: number, d: number): void {
        for (let k = 0; k < M.ncols; k++) {
            let ri = M.data[M.ncols * i + k]
            let rj = M.data[M.ncols * j + k]
            M.data[M.ncols * i + k] = a * ri + b * rj
            M.data[M.ncols * j + k] = c * ri + d * rj
        }
    }

    /** Scaling elementary column operation. C(i) ← C(i) λ */
    export function ecScale(M: Mat, i: number, lambda: number): void {
        for (let k = 0; k < M.nrows; k++)
            M.data[M.ncols * k + i] *= lambda
    }

    /** Swapping elementary column operation. (C(i), C(j)) ← (C(j), C(i)) */
    export function ecSwap(M: Mat, i: number, j: number): void {
        for (let k = 0; k < M.nrows; k++) {
            let tmp = M.data[M.ncols * k + i]
            M.data[M.ncols * k + i] = M.data[M.ncols * k + j]
            M.data[M.ncols * k + j] = tmp
        }
    }

    /** Affine elementary column operation. C(i) ← C(i) + C(j) λ */
    export function ecAff(M: Mat, i: number, j: number, lambda: number): void {
        for (let k = 0; k < M.nrows; k++)
            M.data[M.ncols * k + i] += lambda * M.data[M.ncols * k + j]
    }

    /** A 2x2 elementary column operation. Simultaneously,
     * C(i) ← a C(i) + b C(j)
     * C(j) ← c C(i) + d C(j)
     * This will only be invertible if [a b; c d] is.
     */
    export function ec2x2(M: Mat, i: number, j: number, a: number, b: number, c: number, d: number): void {
        for (let k = 0; k < M.nrows; k++) {
            let ci = M.data[M.ncols * k + i]
            let cj = M.data[M.ncols * k + j]
            M.data[M.ncols * k + i] = a * ci + b * cj
            M.data[M.ncols * k + j] = c * ci + d * cj
        }
    }
}
