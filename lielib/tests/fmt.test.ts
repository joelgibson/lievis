import {mat} from '../src/linear'
import {fmt} from '../src/fmt'

const { assert } = intern.getPlugin('chai')
const { registerSuite } = intern.getPlugin('interface.object')

registerSuite('fmt', {
    'Fractions'() {
        assert.deepEqual(fmt.frac(1), '1')
        assert.deepEqual(fmt.frac(0), '0')
        assert.deepEqual(fmt.frac(-1), '-1')

        assert.deepEqual(fmt.frac(1/2), '\\frac{1}{2}')
        assert.deepEqual(fmt.frac(-1/2), '-\\frac{1}{2}')
        assert.deepEqual(fmt.frac(-Math.PI), '' + (-Math.PI))
    },

    'Linear combinations'() {
        assert.deepEqual(fmt.linComb([8, 9], 'x'), '8 x<sub>1</sub> + 9 x<sub>2</sub>')
        assert.deepEqual(fmt.linComb([8, -9], 'x'), '8 x<sub>1</sub> - 9 x<sub>2</sub>')
        assert.deepEqual(fmt.linComb([-8, -9], 'x'), '-8 x<sub>1</sub> - 9 x<sub>2</sub>')
        assert.deepEqual(fmt.linComb([-8, 0], 'x'), '-8 x<sub>1</sub> + 0 x<sub>2</sub>')
        assert.deepEqual(fmt.linComb([0, 0], 'x'), '0 x<sub>1</sub> + 0 x<sub>2</sub>')
    },

    'Matrix'() {
        let M = mat.fromRows([[1, 2], [3, 4]])
        let Mfmt = fmt.matrix(M)
        assert.equal(
            fmt.matrix(M),
            `\\begin{pmatrix}
1 & 2 \\\\
3 & 4 \\\\
\\end{pmatrix}`
        )
    }
})
