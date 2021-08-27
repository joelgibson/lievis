import {lpoly} from '../src/lpoly'

const { assert } = intern.getPlugin('chai')
const { registerSuite } = intern.getPlugin('interface.object')

registerSuite('LPoly', {
    'Arithmetic'() {
        // Addition on {0, 1} x {0, 1}
        assert.deepEqual(lpoly.add(lpoly.zero, lpoly.zero), lpoly.zero)
        assert.deepEqual(lpoly.add(lpoly.one, lpoly.zero), lpoly.one)
        assert.deepEqual(lpoly.add(lpoly.zero, lpoly.one), lpoly.one)
        assert.deepEqual(lpoly.add(lpoly.one, lpoly.one), lpoly.unit(2))

        // Subtraction on {0, 1} x {0, 1}
        assert.deepEqual(lpoly.sub(lpoly.zero, lpoly.zero), lpoly.zero)
        assert.deepEqual(lpoly.sub(lpoly.one, lpoly.zero), lpoly.one)
        assert.deepEqual(lpoly.sub(lpoly.zero, lpoly.one), lpoly.unit(-1))
        assert.deepEqual(lpoly.sub(lpoly.one, lpoly.one), lpoly.zero)

        // Subtraction of terms in different degrees.
        assert.deepEqual(lpoly.sub(lpoly.one, lpoly.vee), lpoly.fromValCoeffs(0, [1, -1]))
        assert.deepEqual(lpoly.sub(lpoly.shift(lpoly.one, -1), lpoly.vee), lpoly.fromValCoeffs(-1, [1, 0, -1]))

        // Binomial theorem for (1 + v)
        let pow1 = lpoly.fromValCoeffs(0, [1, 1])
        let pow2 = lpoly.mul(pow1, pow1)
        assert.deepEqual(pow2, lpoly.fromValCoeffs(0, [1, 2, 1]))
        let pow3 = lpoly.mul(pow1, pow2)
        assert.deepEqual(pow3, lpoly.fromValCoeffs(0, [1, 3, 3, 1]))
        let pow4 = lpoly.mul(pow2, pow2)
        assert.deepEqual(pow4, lpoly.fromValCoeffs(0, [1, 4, 6, 4, 1]))

        // Evaluation of (1 + v)^n at v = 1
        assert.deepEqual(lpoly.evaluate(pow1, 1), 2)
        assert.deepEqual(lpoly.evaluate(pow2, 1), 4)
        assert.deepEqual(lpoly.evaluate(pow3, 1), 8)
        assert.deepEqual(lpoly.evaluate(pow4, 1), 16)

        // Evaluation of (1 + v)^n at v = -1
        assert.deepEqual(lpoly.evaluate(pow1, -1), 0)
        assert.deepEqual(lpoly.evaluate(pow2, -1), 0)
        assert.deepEqual(lpoly.evaluate(pow3, -1), 0)
        assert.deepEqual(lpoly.evaluate(pow4, -1), 0)
    },

    'Formatting'() {
        assert.equal(lpoly.fmt(lpoly.zero), '0')
        assert.equal(lpoly.fmt(lpoly.one), '1')
        assert.equal(lpoly.fmt(lpoly.vee), 'v')

        assert.equal(
            lpoly.fmt(lpoly.fromValCoeffs(-2, [3, -4, 0, 0, 8])),
            '3v⁻² - 4v⁻¹ + 8v²',
        )
    },
})
