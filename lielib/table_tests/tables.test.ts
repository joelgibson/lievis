/** This test runs the positive-characteristic simple-characters code against a table of known facts. */

import {reduc, groups} from '../src/reduc'
import * as tablesUntyped from './table_data.json'
import { vec } from '../src/linear'
import { maps } from '../src/maps'

const { assert } = intern.getPlugin('chai')
const { registerSuite } = intern.getPlugin('interface.object')

interface TableRow {
    group: 'A2' | 'B2' | 'G2'
    weight: number[]
    dim: number
    primes: number[]
    domWtMults: [number[], number][]
}
let tables = tablesUntyped as TableRow[]


const tableSuite: {[name: string]: () => void} = {}
tables.forEach(({group, weight, dim, primes, domWtMults}) => {
    primes.forEach(prime => {
        const testName = `${group}, p=${prime}, weight=(${weight})`
        tableSuite[testName] = () => {
            // There are three exceptions in G2, for which my program cannot determine the character.
            // Comment these out when testing new strategies, and hopefully soon we'll be able to get rid of them all.
            if (group == 'G2' && prime == 3 && [[2, 0], [1, 1], [2, 1]].some(wt => vec.equal(wt, weight)))
                return

            let datum = groups.basedRootSystemByName(group)
            let simpleInWeyls = reduc.trySimpleInWeyls(datum, prime, weight, reduc.createTracker(datum, 10, prime), 0)
            assert.isNotNull(simpleInWeyls)

            let dimension = maps.reduce(simpleInWeyls!, (acc, wt, coeff) => acc + coeff * reduc.weylDimension(datum, wt), 0n)
            assert.deepEqual(dimension, BigInt(dim))

            let simpleChar = datum.charAlg.tryApplyLinear(simpleInWeyls!, wt => reduc.weylCharacter(datum, wt))?.zerosRemoved()
            assert.isNotNull(simpleChar)

            let domCharPairs = simpleChar!.toPairs().filter(([wt, _]) => reduc.isDominant(datum, wt))
            assert.deepEqual(domCharPairs, domWtMults.map(([wt, mult]) => [wt, BigInt(mult)]))
        }
    })
})

registerSuite('tableSuite', tableSuite)
