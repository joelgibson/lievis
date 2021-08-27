import { Mat, mat } from "../src/linear"

const { assert, config } = intern.getPlugin('chai')
const { registerSuite } = intern.getPlugin('interface.object')

config.showDiff = true
config.truncateThreshold = 0

registerSuite('Integral matrix operations', {
    'Hermite form fixes identity'() {
        let A = mat.id(2)
        let {H, U} = mat.hermiteForm(A)
        assert.deepStrictEqual(H, mat.id(2))
        assert.deepStrictEqual(U, mat.id(2))
    },
    'Hermite form for single row'() {
        let A = mat.fromRows([[-4, 5, 0, -2]])
        let {H, U} = mat.hermiteForm(A)
        assert.deepStrictEqual(H, mat.fromRows([[4, -5, 0, 2]]))
        assert.deepStrictEqual(mat.multMat(U, A), H)
    },
    'Hermite form 3x3'() {
        let A = mat.fromRows([
            [1, 2, 3],
            [5, -6, 1],
            [7, 8, 10],
        ])
        let {H, U} = mat.hermiteForm(A)

        assert.deepStrictEqual(H, mat.fromRows([
            [1, 0, 30],
            [0, 2, 19],
            [0, 0, 46],
        ]))
        assert.deepStrictEqual(mat.multMat(U, A), H)
    },
    'Hermite form 3x4'() {
        let A = mat.fromRows([
            [2, 3, 6, 2],
            [5, 6, 1, 6],
            [8, 3, 1, 1],
        ])
        let {H, U} = mat.hermiteForm(A)

        assert.deepStrictEqual(H, mat.fromRows([
            [1, 0, 50, -11],
            [0, 3, 28, -2],
            [0, 0, 61, -13],
        ]))
        assert.deepStrictEqual(mat.multMat(U, A), H)
    },

    'Integral adjugate of type An Cartan matrices'() {
        function A(n: number): Mat {
            return mat.fromEntries(n, n, (i, j) => (i == j) ? 2 : (Math.abs(i - j) == 1) ? -1 : 0)
        }

        for (let n = 1; n < 5; n++) {
            let An = A(n)
            let {adj, det} = mat.integralAdjugate(An)

            // If it has the right determinant, and adj * An is the scalar matrix with determinant
            // down the diagonal, then adj must be the adjugate.
            assert.strictEqual(det, n + 1)
            assert.deepStrictEqual(mat.multMat(adj, An), mat.scalar(n, det))
        }
    }
})