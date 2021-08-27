import { EnumCox } from '../src/enumcox'
import {hecke} from '../src/hecke'
import { mat } from '../src/linear'

const { assert } = intern.getPlugin('chai')
const { registerSuite } = intern.getPlugin('interface.object')

registerSuite('Canonical basis calculations', {
    'D2'() {
        let cox = new EnumCox(mat.fromRows([[1]]))
        let alg = new hecke.HeckeAlg(cox)
        let s = cox.growToWord([0])

        // B(id) = H(id)
        assert.deepEqual(alg.can(0).serialise(), [[0, '1']])

        // B(s) = H(s) + v H(id)
        assert.deepEqual(alg.can(s).serialise(), [
            [0, 'v'],
            [s, '1'],
        ])
    },

    'S3'() {
        let cox = new EnumCox(mat.fromRows([[1, 3], [3, 1]]))
        let alg = new hecke.HeckeAlg(cox)
        let [id, s, t, st, ts, sts] = [[], [0], [1], [0, 1], [1, 0], [0, 1, 0]].map(word => cox.growToWord(word))

        // B(id) = H(id)
        assert.deepEqual(alg.can(id).serialise(), [[id, '1']])

        // B(s) = H(s) + v H(id)
        assert.deepEqual(alg.can(s).serialise(), [
            [id, 'v'],
            [s, '1'],
        ])

        // B(t) = H(t) + v H(t)
        assert.deepEqual(alg.can(t).serialise(), [
            [id, 'v'],
            [t, '1'],
        ])

        // B(st) = H(st) + v H(s) + v H(t) + v^2 H(id)
        assert.deepEqual(alg.can(st).serialise(), [
            [id, 'v²'],
            [s, 'v'],
            [t, 'v'],
            [st, '1'],
        ])

        // B(ts) = H(ts) + v H(s) + v H(t) + v^2 H(id)
        assert.deepEqual(alg.can(ts).serialise(), [
            [id, 'v²'],
            [s, 'v'],
            [t, 'v'],
            [ts, '1'],
        ])

        // B(sts) = H(sts) + v H(st) + v H(ts) + v^2 H(s) + v^2 H(t) + v^3 H(id)
        assert.deepEqual(alg.can(sts).serialise(), [
            [id, 'v³'],
            [s, 'v²'],
            [t, 'v²'],
            [st, 'v'],
            [ts, 'v'],
            [sts, '1'],
        ])
    },
})
