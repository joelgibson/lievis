import {vec, vecmut, mat} from '../src/linear'

const { assert, config } = intern.getPlugin('chai')
const { registerSuite } = intern.getPlugin('interface.object')

export {}
declare global {
    namespace jest {
        interface Matchers<R, T> {
            toAlmostEqual(expected: number[]): R
        }
    }
}

config.truncateThreshold = 0

// Fuzzy matcher for vectors, since floating-point is a thing.
// expect.extend({
//     toAlmostEqual(received: number[], expected: number[]) {
//         const epsilon = 0.0000001
//         const pass = received.length == expected.length && received.every((_, i) => Math.abs(received[i] - expected[i]) < epsilon)
//         if (pass)
//             return {
//                 message: () => `expected ${received} not to be near ${expected}`,
//                 pass: true
//             }

//         return {
//             message: () => `expected ${received} to be near ${expected}`,
//             pass: false
//         }
//     }
// })

registerSuite('vec', {
    'Abstract vector space functions'() {
        assert.deepEqual(vec.zero(3), [0, 0, 0])
        assert.deepEqual(vec.add([1, 2, 3], [4, -2, 1]), [5, 0, 4])
        assert.deepEqual(vec.sub([1, 2, 3], [4, -2, 1]), [-3, 4, 2])
        assert.deepEqual(vec.neg([1, 2, 3]), [-1, -2, -3])
        assert.deepEqual(vec.scale([1, 2, 3], 2), [2, 4, 6])
        assert.deepEqual(vec.e(5, 3), [0, 0, 0, 1, 0])
    },

    'Euclidean vector space functions'() {
        assert.deepEqual(vec.dot([1, 2, 3], [2, -4, 5]), 2 - 8 + 15)
        assert.deepEqual(vec.norm([3, 4]), 5)
        assert.deepEqual(vec.dist([1, 1], [2, 2]), Math.sqrt(2))
        assert.deepEqual(vec.projectLine([1, 1], [0, 1]), [1/2, 1/2])
        assert.deepEqual(vec.projectHyperplane([1, 1], [0, 1]), [-1/2, 1/2])
        assert.deepEqual(vec.check([1, 0, -1]), [1, 0, -1])
        assert.deepEqual(vec.check([2, 0]), [1, 0])
        assert.deepEqual(vec.check(vec.check([2, 3, 4])), [2, 3, 4])
        assert.deepEqual(vec.reflect([1, -1], [4, 5]), [5, 4])
    },

    'Gram-Schmidt'() {
        assert.deepEqual(vec.gramSchmidt([]), [])
        assert.deepEqual(vec.gramSchmidt([[1]]), [[1]])
        assert.deepEqual(vec.gramSchmidt([[2]]), [[1]])
        assert.deepEqual(vec.gramSchmidt([[1, 0], [0, 1]]), [[1, 0], [0, 1]])
        assert.deepEqual(vec.gramSchmidt([[1, 0], [2, 1]]), [[1, 0], [0, 1]])
    },

    '3D vector space functions'() {
        assert.deepEqual(vec.cross3D(vec.e(3, 0), vec.e(3, 1)), vec.e(3, 2))
    },

    '2D vector space functions'() {
        assert.deepEqual(vec.angle2D([1, 0], [0, 1]), Math.PI / 2)
        assert.deepEqual(vec.angle2D([1, 0], [-1, 0]), Math.PI)
        assert.deepEqual(vec.angle2D([1, 0], [0, -1]), 3 * Math.PI / 2)
        assert.deepEqual(vec.angle2D([-1, 0], [0, 1]), 3 * Math.PI / 2)
    },
})

registerSuite('mat', {
    'Basic matrix operations'() {
        let A = mat.fromRows([
            [1, 2, 3],
            [4, 5, 6]
        ])

        assert.deepEqual(mat.toRows(A), [[1, 2, 3], [4, 5, 6]])
        assert.deepEqual(mat.toColumns(A), [[1, 4], [2, 5], [3, 6]])
        assert.deepEqual(mat.fromColumns([[1, 4], [2, 5], [3, 6]]), A)
        assert.deepEqual(mat.transpose(A), mat.fromColumns([[1, 2, 3], [4, 5, 6]]))
        assert.deepEqual(mat.scale(A, 2), mat.fromRows([[2, 4, 6], [8, 10, 12]]))
    },

    'Matrices with zero along a dimension'() {
        assert.deepEqual(mat.fromColumns([]).nrows, 0)
        assert.deepEqual(mat.fromColumns([]).ncols, 0)

        assert.deepEqual(mat.fromColumns([[], []]).ncols, 2)
        assert.deepEqual(mat.fromColumns([[], []]).nrows, 0)
    },

    'Matrix multiplication'() {
        let A = mat.fromRows([
            [1, 2, 3],
            [4, 5, 6]
        ])
        assert.throws(() => mat.multMat(A, A))

        assert.deepEqual(mat.multMat(A, mat.id(3)), A)
        assert.deepEqual(mat.multMat(mat.id(2), A), A)
    },

    'Matrix-vector multiplication'() {
        assert.throws(() => mat.multVec(<any>[1], [2]))
        assert.throws(() => mat.multVec(mat.id(2), [1, 2, 3]))
        assert.deepEqual(mat.multVec(mat.id(2), [2, 3]), [2, 3])

        assert.throws(() => mat.multVecLeft([1], <any>[2]))
        assert.throws(() => mat.multVecLeft([1, 2, 3], mat.id(2)))
        assert.deepEqual(mat.multVecLeft([2, 3], mat.id(2)), [2, 3])

        let M = mat.fromRows([[1, 2, 3], [4, 5, 6]])
        let v = [7, 8, 9]
        assert.deepEqual(mat.multVec(M, v), mat.multVecLeft(v, mat.transpose(M)))
    },

    'Determinant'() {
        assert.deepEqual(mat.det(mat.id(0)), 1)
        assert.deepEqual(mat.det(mat.id(1)), 1)
        assert.deepEqual(mat.det(mat.id(2)), 1)
        assert.deepEqual(mat.det(mat.id(3)), 1)

        assert.throws(() => mat.det(mat.fromRows([[1, 2]])))

        // The matrix swapping x and y has determinant -1.
        assert.deepEqual(mat.det(mat.fromRows([[0, 1], [1, 0]])), -1)

        // The matrix (x, y, z) ↦ (z, y, x) has determinant -1.
        assert.deepEqual(mat.det(mat.fromRows([[0, 0, 1], [0, 1, 0], [1, 0, 0]])), -1)

        assert.deepEqual(mat.det(mat.fromRows([[4, -6], [2, 3]])), 24)
    },

    '3x3 determinant'() {
        // Determinant of the B3 Cartan matrix should be 2
        let B3 = mat.fromRows([
            [2, -1, 0],
            [-1, 2, -1],
            [0, -2, 2]
        ])
        assert.deepEqual(mat.det(B3), 2)

        // Determinant of the An Cartan matrix should be n+1
        const A = (n: number) => mat.fromEntries(n, n, (i, j) => (i == j) ? 2 : (Math.abs(i - j) == 1) ? -1 : 0)
        assert.deepEqual(mat.det(A(1)), 2)
        assert.deepEqual(mat.det(A(2)), 3)
        assert.deepEqual(mat.det(A(3)), 4)
        assert.deepEqual(mat.det(A(4)), 5)
        assert.deepEqual(mat.det(A(5)), 6)
    },

    'Inverse'() {
        assert.deepEqual(mat.inverse(mat.id(0)), mat.id(0))
        assert.deepEqual(mat.inverse(mat.id(1)), mat.id(1))
        assert.deepEqual(mat.inverse(mat.id(2)), mat.id(2))
        assert.deepEqual(mat.inverse(mat.id(3)), mat.id(3))

        assert.deepEqual(mat.inverse(mat.fromRows([[2, 0], [0, 3]])), mat.fromRows([[1/2, 0], [0, 1/3]]))

        assert.deepEqual(mat.inverse(mat.fromRows([[1, 7], [0, 1]])), mat.fromRows([[1, -7], [0, 1]]))
    },

    'Upper-triangular inverse'() {
        assert.deepEqual(mat.invertUpperTriangular(mat.id(0)), mat.id(0))
        assert.deepEqual(mat.invertUpperTriangular(mat.id(1)), mat.id(1))
        assert.deepEqual(mat.invertUpperTriangular(mat.id(2)), mat.id(2))

        assert.deepEqual(mat.invertUpperTriangular(mat.fromRows([
            [1, 1],
            [0, 1],
        ])), mat.fromRows([
            [1, -1],
            [0, 1],
        ]))

        assert.deepEqual(mat.invertUpperTriangular(mat.fromRows([
            [1, 2, 3, 4],
            [0, 1, 5, 6],
            [0, 0, 1, 7],
            [0, 0, 0, 1],
        ])), mat.fromRows([
            [1, -2, 7, -41],
            [0, 1, -5, 29],
            [0, 0, 1, -7],
            [0, 0, 0, 1],
        ]))
    },
})
