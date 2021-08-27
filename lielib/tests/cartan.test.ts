import { cartan } from "../src/cartan"
import { mat, Mat } from "../src/linear"

const { assert } = intern.getPlugin('chai')
const { registerSuite } = intern.getPlugin('interface.object')

const finTable: [string, number, number[][]][] = [
    ['A', 1, [
        [2]
    ]],
    ['A', 2, [
        [2, -1],
        [-1, 2],
    ]],
    ['A', 3, [
        [ 2, -1,  0],
        [-1,  2, -1],
        [ 0, -1,  2],
    ]],
    ['A', 4, [
        [ 2, -1,  0,  0],
        [-1,  2, -1,  0],
        [ 0, -1,  2, -1],
        [ 0,  0, -1,  2],
    ]],

    ['B', 2, [
        [ 4, -2],
        [-2,  2],
    ]],
    ['B', 3, [
        [ 4, -2,  0],
        [-2,  4, -2],
        [ 0, -2,  2],
    ]],
    ['B', 4, [
        [ 4, -2,  0,  0],
        [-2,  4, -2,  0],
        [ 0, -2,  4, -2],
        [ 0,  0, -2,  2],
    ]],

    ['C', 2, [
        [ 2, -2],
        [-2,  4],
    ]],
    ['C', 3, [
        [ 2, -1,  0],
        [-1,  2, -2],
        [ 0, -2,  4],
    ]],
    ['C', 4, [
        [ 2, -1,  0,  0],
        [-1,  2, -1,  0],
        [ 0, -1,  2, -2],
        [ 0,  0, -2,  4],
    ]],

    ['D', 3, [
        [ 2, -1, -1],
        [-1,  2,  0],
        [-1,  0,  2],
    ]],
    ['D', 4, [
        [ 2, -1,  0,  0],
        [-1,  2, -1, -1],
        [ 0, -1,  2,  0],
        [ 0, -1,  0,  2],
    ]],

    ['E', 6, [
        [ 2, -1,  0,  0,  0,  0],
        [-1,  2, -1,  0,  0,  0],
        [ 0, -1,  2, -1,  0, -1],
        [ 0,  0, -1,  2, -1,  0],
        [ 0,  0,  0, -1,  2,  0],
        [ 0,  0, -1,  0,  0,  2],
    ]],
    ['E', 7, [
        [ 2, -1,  0,  0,  0,  0,  0],
        [-1,  2, -1,  0,  0,  0,  0],
        [ 0, -1,  2, -1,  0,  0, -1],
        [ 0,  0, -1,  2, -1,  0,  0],
        [ 0,  0,  0, -1,  2, -1,  0],
        [ 0,  0,  0,  0, -1,  2,  0],
        [ 0,  0, -1,  0,  0,  0,  2],
    ]],
    ['E', 8, [
        [ 2, -1,  0,  0,  0,  0,  0,  0],
        [-1,  2, -1,  0,  0,  0,  0,  0],
        [ 0, -1,  2, -1,  0,  0,  0,  0],
        [ 0,  0, -1,  2, -1,  0,  0,  0],
        [ 0,  0,  0, -1,  2, -1,  0, -1],
        [ 0,  0,  0,  0, -1,  2, -1,  0],
        [ 0,  0,  0,  0,  0, -1,  2,  0],
        [ 0,  0,  0,  0, -1,  0,  0,  2],
    ]],

    ['F', 4, [
        [ 4, -2,  0,  0],
        [-2,  4, -2,  0],
        [ 0, -2,  2, -1],
        [ 0,  0, -1,  2],
    ]],
    ['G', 2, [
        [ 6, -3],
        [-3,  2],
    ]]
]
const finSuite: {[name: string]: () => void} = {}
finTable.forEach(([type, rank, rows]) => {
    finSuite[type + rank] = () => {
        assert.deepStrictEqual(cartan.cartanDat(type, rank), mat.fromRows(rows))
    }
})

registerSuite('Small Cartan data of finite type', finSuite)


registerSuite('Cartan graphs', {
    'connectedSubgraphMasks'() {
        // Empty matrix has only the empty component.
        assert.deepStrictEqual(
            cartan.connectedSubgraphMasks(mat.fromRows([])),
            [0],
        )

        // A1 has two.
        assert.deepStrictEqual(
            cartan.connectedSubgraphMasks(mat.fromRows([[2]])),
            [1, 0],
        )

        // A2: all subgraphs are connected.
        assert.deepStrictEqual(
            cartan.connectedSubgraphMasks(cartan.cartanMat('A', 2)),
            [0b11, 0b01, 0b10, 0b00],
        )

        // A3: all but one subgraph is connected.
        assert.deepStrictEqual(
            cartan.connectedSubgraphMasks(cartan.cartanMat('A', 3)),
            [0b111, 0b011, 0b110, 0b001, 0b010, 0b100, 0b000],
        )
    }
})
