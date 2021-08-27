import { cartan } from '../src/cartan'
import { mat } from '../src/linear'
import { rtsys } from '../src/rootsystems'

const { assert, config } = intern.getPlugin('chai')
const { registerSuite } = intern.getPlugin('interface.object')

registerSuite('A2', {
    'Weyl dimension formula'() {
        let rs = rtsys.createRootSystem(cartan.cartanMat('A', 2))

        assert.strictEqual(rtsys.weylDimension(rs, [0, 0]), 1n) // Trivial
        assert.strictEqual(rtsys.weylDimension(rs, [1, 0]), 3n) // Defining
        assert.strictEqual(rtsys.weylDimension(rs, [0, 1]), 3n) // Dual defining
        assert.strictEqual(rtsys.weylDimension(rs, [1, 1]), 8n) // Adjoint
    },
    'Multiplicities'() {
        let rs = rtsys.createRootSystem(cartan.cartanMat('A', 2))

        // Trivial: χ[0, 0] = m[0, 0]
        assert.deepStrictEqual(
            rtsys.dominantChar(rs, [0, 0]).toPairs(),
            [[[0, 0], 1]],
        )

        // Defining: χ[1, 0] = m[1, 0]
        assert.deepStrictEqual(
            rtsys.dominantChar(rs, [1, 0]).toPairs(),
            [[[1, 0], 1]],
        )

        // Dual defining: χ[0, 1] = m[0, 1]
        assert.deepStrictEqual(
            rtsys.dominantChar(rs, [0, 1]).toPairs(),
            [[[0, 1], 1]],
        )

        // Adjoint: χ[1, 1] = m[1, 1] + 2 m[0, 0]
        assert.deepStrictEqual(
            rtsys.dominantChar(rs, [1, 1]).toPairs(),
            [[[0, 0], 2], [[1, 1], 1]],
        )

        // Symmetric square: χ[2, 0] = m[2, 0] + m[0, 1]
        assert.deepStrictEqual(
            rtsys.dominantChar(rs, [2, 0]).toPairs(),
            [[[0, 1], 1], [[2, 0], 1]],
        )
    }
})

registerSuite('B2', {
    'Multiplicities'() {
        // 1 is the short root.
        let cartanMat = mat.fromRows([
            [2, -2],
            [-1, 2],
        ])
        let rs = rtsys.createRootSystem(cartanMat)

        // Trivial
        assert.deepStrictEqual(
            rtsys.dominantChar(rs, [0, 0]).toPairs(),
            [[[0, 0], 1]]
        )

        // First fundamental
        assert.deepStrictEqual(
            rtsys.dominantChar(rs, [1, 0]).toPairs(),
            [[[1, 0], 1]]
        )

        // Second fundamental
        assert.deepStrictEqual(
            rtsys.dominantChar(rs, [0, 1]).toPairs(),
            [[[0, 0], 1], [[0, 1], 1]]
        )

        assert.deepStrictEqual(
            rtsys.dominantChar(rs, [2, 0]).toPairs(),
            [[[0, 0], 2], [[0, 1], 1], [[2, 0], 1]]
        )

        // Rho
        assert.deepStrictEqual(
            rtsys.dominantChar(rs, [1, 1]).toPairs(),
            [[[1, 0], 2], [[1, 1], 1]]
        )
    }
})

registerSuite('F4', {
    'Multiplicities'() {
        // F4, with long roots first.
        let rs = rtsys.createRootSystem(cartan.cartanMat('F', 4))

        // Trivial
        assert.deepStrictEqual(
            rtsys.dominantChar(rs, [0, 0, 0, 0]).toPairs(),
            [[[0, 0, 0, 0], 1]]
        )

        // First fundamental
        assert.deepStrictEqual(
            rtsys.dominantChar(rs, [1, 0, 0, 0]).toPairs(),
            [[[0, 0, 0, 0], 4], [[0, 0, 0, 1], 1], [[1, 0, 0, 0], 1]]
        )

        // Second fundamental
        assert.deepStrictEqual(
            rtsys.dominantChar(rs, [0, 1, 0, 0]).toPairs(),
            [
                [[0, 0, 0, 0], 26],
                [[0, 0, 0, 1], 13],
                [[0, 0, 0, 2], 3],
                [[0, 0, 1, 0], 4],
                [[0, 1, 0, 0], 1],
                [[1, 0, 0, 0], 10],
                [[1, 0, 0, 1], 1],
            ]
        )

        // Third fundamental
        assert.deepStrictEqual(
            rtsys.dominantChar(rs, [0, 0, 1, 0]).toPairs(),
            [[[0, 0, 0, 0], 9], [[0, 0, 0, 1], 5], [[0, 0, 1, 0], 1], [[1, 0, 0, 0], 2]]
        )

        // Fourth fundamental
        assert.deepStrictEqual(
            rtsys.dominantChar(rs, [0, 0, 0, 1]).toPairs(),
            [[[0, 0, 0, 0], 2], [[0, 0, 0, 1], 1]]
        )

        // Huge
        assert.deepStrictEqual(rtsys.dominantChar(rs, [3, 3, 3, 3]).size(), 1691)
    }
})