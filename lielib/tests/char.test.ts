import {char} from "../src/char"

const { assert } = intern.getPlugin('chai')
const { registerSuite } = intern.getPlugin('interface.object')

registerSuite('Characters of algebraic groups - basic operations', {
    'Binomial theorem: simple check of two-variable multiplication'() {
        let alg = new char.CharAlg(2)
        let x = alg.gen(0), y = alg.gen(1)

        let binom = alg.add(x, y)
        assert.deepEqual(binom.toPairs(), [
            [[0, 1], 1],
            [[1, 0], 1],
        ])

        let pow2 = alg.mul(binom, binom)
        assert.deepEqual(pow2.toPairs(), [
            [[0, 2], 1],
            [[1, 1], 2],
            [[2, 0], 1],
        ])

        let pow3 = alg.mul(pow2, binom)
        assert.deepEqual(pow3.toPairs(), [
            [[0, 3], 1],
            [[1, 2], 3],
            [[2, 1], 3],
            [[3, 0], 1],
        ])

        let pow4 = alg.mul(binom, pow3)
        assert.deepEqual(pow4.toPairs(), [
            [[0, 4], 1],
            [[1, 3], 4],
            [[2, 2], 6],
            [[3, 1], 4],
            [[4, 0], 1],
        ])
    }
})