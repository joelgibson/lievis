import { num } from "../src/num"

const { assert } = intern.getPlugin('chai')
const { registerSuite } = intern.getPlugin('interface.object')

registerSuite('num tests', {
    'nextPow2'() {
        assert.equal(num.nextPow2(1), 1)
        assert.equal(num.nextPow2(2), 2)
        assert.equal(num.nextPow2(3), 4)
        assert.equal(num.nextPow2(4), 4)
        assert.equal(num.nextPow2(9), 16)
        assert.equal(num.nextPow2(15), 16)
        assert.equal(num.nextPow2(16), 16)
    },
    'bezout'() {
        // gcd(6, 12) = 6 = 1 * 6 + 0 * 12
        assert.deepStrictEqual(num.bezout(6, 12), {d: 6, s: 1, t: 0})
        assert.deepStrictEqual(num.bezout(-6, 12), {d: 6, s: -1, t: 0})
        assert.deepStrictEqual(num.bezout(6, -12), {d: 6, s: 1, t: 0})
        assert.deepStrictEqual(num.bezout(-6, -12), {d: 6, s: -1, t: 0})

        // gcd(-3, 4) = 1 = 1 * -3 + 1 * 4
        assert.deepStrictEqual(num.bezout(-3, 4), {d: 1, s: 1, t: 1})

        // gcd(12, 28) = 4 = -2 * 12 + 1 * 28
        assert.deepStrictEqual(num.bezout(12, 28), {d: 4, s: -2, t: 1})

        // gcd(1, 1) = 1 = 1 * 1 + 0 * 1
        assert.deepStrictEqual(num.bezout(1, 1), {d: 1, s: 1, t: 0})

        // gcd(55, 72) = 1 = -17 * 55 + 13 * 72
        assert.deepStrictEqual(num.bezout(55, 72), {d: 1, s: -17, t: 13})
    },
})