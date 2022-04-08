import {reduc, groups} from '../src/reduc'
import {mat} from '../src/linear'

const { assert } = intern.getPlugin('chai')
const { registerSuite } = intern.getPlugin('interface.object')

registerSuite('reduc', {
    'Bases GL1'() {
        let datum = {
            rank: 1,
            roots: [],
            coroots: []
        }
        let basedDatum =
        assert.deepOwnInclude(reduc.baseBySimples(datum, []), {
            rank: 1,
            roots: [],
            coroots: [],
            ssrank: 0,
            simpleIdxs: [],
            simples: [],
            cosimples: [],
            cartan: mat.id(0),
            coxeter: mat.id(0),
            positives: [],
            copositives: [],
            rho: [0],
            rho2: [0],
            corho: [0],
            simplyConn: true
        })
    },

    'Bases GL2'() {
        let datum = {
            rank: 2,
            roots: [[1, -1], [-1, 1]],
            coroots: [[1, -1], [-1, 1]]
        }
        assert.deepOwnInclude(reduc.baseBySimples(datum, [0]), {
            rank: 2,
            roots: [[1, -1], [-1, 1]],
            coroots: [[1, -1], [-1, 1]],
            ssrank: 1,
            simpleIdxs: [0],
            simples: [[1, -1]],
            cosimples: [[1, -1]],
            cartan: mat.fromRows([[2]]),
            coxeter: mat.fromRows([[1]]),
            positives: [[1, -1]],
            copositives: [[1, -1]],
            rho: [1/2, -1/2],
            rho2: [1, -1],
            corho: [1/2, -1/2],
            simplyConn: false
        })
    },

    'Bases PGL2'() {
        let datum = {
            rank: 1,
            roots: [[1], [-1]],
            coroots: [[2], [-2]]
        }
        assert.deepOwnInclude(reduc.baseBySimples(datum, [0]), {
            rank: 1,
            roots: [[1], [-1]],
            coroots: [[2], [-2]],
            ssrank: 1,
            simpleIdxs: [0],
            simples: [[1]],
            cosimples: [[2]],
            cartan: mat.fromRows([[2]]),
            coxeter: mat.fromRows([[1]]),
            positives: [[1]],
            copositives: [[2]],
            rho: [1/2],
            rho2: [1],
            corho: [1],
            simplyConn: false
        })
    },

    'GL1 root datum'() {
        assert.deepOwnInclude(groups.GL(1), {
            rank: 1,
            ssrank: 0,
            cartan: mat.id(0),
            simples: [],
            positives: [],
            cosimples: [],
            copositives: [],
            rho: [0],
            corho: [0],
        })
    },

    'GL2 root datum'() {
        assert.deepOwnInclude(groups.GL(2), {
            rank: 2,
            ssrank: 1,
            cartan: mat.fromRows([[2]]),
            simples: [[1, -1]],
            positives: [[1, -1]],
            cosimples: [[1, -1]],
            copositives: [[1, -1]],
            rho: [1/2, -1/2],
            corho: [1/2, -1/2],
        })
    },

    'GL4 root datum'() {
        assert.deepOwnInclude(groups.GL(4), {
            rank: 4,
            ssrank: 3,
            cartan: mat.fromRows([
                [ 2, -1,  0],
                [-1,  2, -1],
                [ 0, -1,  2],
            ]),
            simples: [
                [1, -1,  0,  0], // α₁
                [0,  1, -1,  0], // α₂
                [0,  0,  1, -1], // α₃
            ],
            positives: [
                [1, -1,  0,  0], // α₁
                [0,  1, -1,  0], // α₂
                [0,  0,  1, -1], // α₃
                [1,  0, -1,  0], // α₁ + α₂
                [0,  1,  0, -1], // α₂ + α₃
                [1,  0,  0, -1], // α₁ + α₂ + α₃
            ],
            cosimples: [
                [1, -1,  0,  0], // α₁^
                [0,  1, -1,  0], // α₂^
                [0,  0,  1, -1], // α₃^
            ],
            copositives: [
                [1, -1,  0,  0], // α₁^
                [0,  1, -1,  0], // α₂^
                [0,  0,  1, -1], // α₃^
                [1,  0, -1,  0], // α₁^ + α₂^
                [0,  1,  0, -1], // α₂^ + α₃^
                [1,  0,  0, -1], // α₁^ + α₂^ + α₃^
            ],
            rho: [3/2, 1/2, -1/2, -3/2],
            corho: [3/2, 1/2, -1/2, -3/2],
        })
    },

    'Bases SL4'() {
        assert.deepOwnInclude(groups.SL(4), {
            rank: 3,
            ssrank: 3,

            cartan: mat.fromRows([
                [ 2, -1,  0],
                [-1,  2, -1],
                [ 0, -1,  2],
            ]),

            // The character lattice has been given the basis of fundamental weights,
            // hence the simple roots should be exactly the Cartan matrix.
            simples: [
                [ 2, -1,  0],
                [-1,  2, -1],
                [ 0, -1,  2],
            ],

            // The positive roots should be in the order α₁, α₂, α₃, α₁ + α₂, α₂ + α₃, α₁ + α₃
            positives: [
                [ 2, -1,  0], // α₁
                [-1,  2, -1], // α₂
                [ 0, -1,  2], // α₃
                [ 1,  1, -1], // α₁ + α₂
                [-1,  1,  1], // α₂ + α₃
                [ 1,  0,  1], // α₁ + α₂ + α₃
            ],

            // The cocharacter lattice has been given the basis dual to the fundamental weights,
            // ie the coroot basis. Therefore the simple coroots should be the identity matrix.
            cosimples: [
                [1, 0, 0],
                [0, 1, 0],
                [0, 0, 1],
            ],
            copositives: [
                [1, 0, 0],
                [0, 1, 0],
                [0, 0, 1],
                [1, 1, 0],
                [0, 1, 1],
                [1, 1, 1],
            ],
        })
    },

    'Weyl dimension for SL2'() {
        let SL2 = reduc.baseBySimples({rank: 1, roots: [[2], [-2]], coroots: [[1], [-1]]}, [0])
        assert.deepEqual(reduc.weylDimension(SL2, [2]), 3n)
        assert.deepEqual(reduc.weylDimension(SL2, [1]), 2n)
        assert.deepEqual(reduc.weylDimension(SL2, [0]), 1n)
        assert.deepEqual(reduc.weylDimension(SL2, [-1]), 0n)
        assert.deepEqual(reduc.weylDimension(SL2, [-2]), -1n)
    },

    'Weyl dimension for GL4 and SL4'() {
        let GL4 = groups.GL(4)
        let SL4 = groups.SL(4)

        // The trivial representation is one dimensional.
        assert.deepEqual(reduc.weylDimension(GL4, [0, 0, 0, 0]), 1n)
        assert.deepEqual(reduc.weylDimension(SL4, [0, 0, 0]), 1n)

        // The natural representation (or first wedge of it) is four dimensional.
        assert.deepEqual(reduc.weylDimension(GL4, [1, 0, 0, 0]), 4n)
        assert.deepEqual(reduc.weylDimension(SL4, [1, 0, 0]), 4n)

        // The second wedge power of the natural representation is (4 choose 2) = 6 dimensional.
        assert.deepEqual(reduc.weylDimension(GL4, [1, 1, 0, 0]), 6n)
        assert.deepEqual(reduc.weylDimension(SL4, [0, 1, 0]), 6n)

        // The dual of the natural representation is four dimensional.
        assert.deepEqual(reduc.weylDimension(GL4, [1, 1, 1, 0]), 4n)
        assert.deepEqual(reduc.weylDimension(SL4, [0, 0, 1]), 4n)

        // The determinant representation is one dimensional.
        assert.deepEqual(reduc.weylDimension(GL4, [1, 1, 1, 1]), 1n)
    },

    'Long words of some Weyl groups'() {
        assert.deepEqual(reduc.longWord(groups.T(2)), [])
        assert.deepEqual(reduc.longWord(groups.GL(2)), [0])
        assert.deepEqual(reduc.longWord(groups.GL(3)), [0, 1, 0])
    },

    'Weyl group orbits for the torus'() {
        const T3 = groups.T(3)
        assert.deepEqual(reduc.weylOrbit(T3, [3, -1, 4]), [
            [3, -1, 4]
        ])
        assert.deepEqual(reduc.weylOrbit(T3, [0, 0, 0]), [
            [0, 0, 0]
        ])
    },

    'Weyl group orbits for GL2'() {
        const GL2 = groups.GL(2)
        assert.deepEqual(reduc.weylOrbit(GL2, [2, 1]), [
            [2, 1],
            [1, 2]
        ])
        assert.deepEqual(reduc.weylOrbit(GL2, [0, 0]), [
            [0, 0]
        ])
        assert.deepEqual(reduc.weylOrbit(GL2, [0, 1]), [
            [1, 0],
            [0, 1]
        ])
    },

    'Weyl group orbits for GL3'() {
        const GL3 = groups.GL(3)
        assert.deepEqual(reduc.weylOrbit(GL3, [1, 2, 3]), [
            [3, 2, 1],
            [2, 3, 1],
            [3, 1, 2],
            [2, 1, 3],
            [1, 3, 2],
            [1, 2, 3],
        ])
        assert.deepEqual(reduc.weylOrbit(GL3, [1, 2, 2]), [
            [2, 2, 1],
            [2, 1, 2],
            [1, 2, 2],
        ])
    },

    'Weyl group orbits for SL3'() {
        const SL3 = groups.SL(3)
        assert.deepEqual(reduc.weylOrbit(SL3, [1, 2]), [
            [1, 2],
            [-1, 3],
            [3, -2],
            [2, -3],
            [-3, 1],
            [-2, -1]
        ])
    },

    'Weyl character for a torus'() {
        const T = groups.T(3)
        assert.deepEqual(reduc.weylCharacter(T, [1, 2, 3]), T.charAlg.basis([1, 2, 3]))
    },

    'Weyl character for SL2'() {
        let SL2 = reduc.baseBySimples({rank: 1, roots: [[2], [-2]], coroots: [[1], [-1]]}, [0])
        assert.deepEqual(reduc.weylCharacter(SL2, [2]).toPairs(), [[[-2], 1n], [[0], 1n], [[2], 1n]])
        assert.deepEqual(reduc.weylCharacter(SL2, [1]).toPairs(), [[[-1], 1n], [[1], 1n]])
        assert.deepEqual(reduc.weylCharacter(SL2, [0]).toPairs(), [[[0], 1n]])
        assert.deepEqual(reduc.weylCharacter(SL2, [-1]).toPairs(), [])
        assert.deepEqual(reduc.weylCharacter(SL2, [-2]).toPairs(), [[[0], -1n]])
    },

    'Weyl character for SL3'() {
        let SL3 = groups.SL(3)

        assert.deepEqual(reduc.weylCharacter(SL3, [0, 0]).toPairs(), [[[0, 0], 1n]])
        assert.deepEqual(reduc.weylCharacter(SL3, [1, 0]).toPairs(), [[[-1, 1], 1n], [[0, -1], 1n], [[1, 0], 1n]])
        assert.deepEqual(reduc.weylCharacter(SL3, [0, 1]).toPairs(), [[[-1, 0], 1n], [[0, 1], 1n], [[1, -1], 1n]])
        assert.deepEqual(reduc.weylCharacter(SL3, [1, 1]).toPairs(), [
            [[-2, 1], 1n],
            [[-1, -1], 1n],
            [[-1, 2], 1n],
            [[0, 0], 2n],
            [[1, -2], 1n],
            [[1, 1], 1n],
            [[2, -1], 1n],
        ])
    },

    'Coxeter matrices'() {
        assert.deepEqual(groups.SL(3).coxeter, mat.fromRows([
            [1, 3],
            [3, 1],
        ]))

        assert.deepEqual(groups.SL(4).coxeter, mat.fromRows([
            [1, 3, 2],
            [3, 1, 3],
            [2, 3, 1],
        ]))
    },

    'Normalise linear combination of Weyl characters for SL2'() {
        let SL2 = reduc.baseBySimples({rank: 1, roots: [[2], [-2]], coroots: [[1], [-1]]}, [0])
        assert.deepEqual(reduc.weylCharacterNormalise(SL2, SL2.charAlg.basis([0])).toPairs(), [[[0], 1n]])
        assert.deepEqual(reduc.weylCharacterNormalise(SL2, SL2.charAlg.basis([1])).toPairs(), [[[1], 1n]])
        assert.deepEqual(reduc.weylCharacterNormalise(SL2, SL2.charAlg.basis([-1])).toPairs(), [])
        assert.deepEqual(reduc.weylCharacterNormalise(SL2, SL2.charAlg.basis([-2])).toPairs(), [[[0], -1n]])
    },

    'Tensor product multiplicities of Weyl modules for SL2'() {
        let SL2 = reduc.baseBySimples({rank: 1, roots: [[2], [-2]], coroots: [[1], [-1]]}, [0])
        assert.deepEqual(reduc.tensorWeyls(SL2, [0], [0]).toPairs(), [[[0], 1n]])
        assert.deepEqual(reduc.tensorWeyls(SL2, [0], [1]).toPairs(), [[[1], 1n]])
        assert.deepEqual(reduc.tensorWeyls(SL2, [1], [0]).toPairs(), [[[1], 1n]])
        assert.deepEqual(reduc.tensorWeyls(SL2, [1], [1]).toPairs(), [[[0], 1n], [[2], 1n]])
        assert.deepEqual(reduc.tensorWeyls(SL2, [2], [2]).toPairs(), [[[0], 1n], [[2], 1n], [[4], 1n]])
    },

    'Tensor product multiplicities in GL4 and SL4'() {
        // Each GL4 case is followed by the corresponding SL4 case. Remember that in the GL4 weight lattice
        // we are in the basis of partition rows, so for example [5, 2, 2, 1] means the partition
        //    X X X X X
        //    X X
        //    X X
        //    X
        // However, in the SL4 case the basis chosen is fundamental weights, which is the number of columns
        // of the partition with a certain length, and columns of length 4 are ignored, so the above partition
        // would be [3, 0, 1]

        assert.deepEqual(reduc.tensorWeyls(groups.GL(4), [1, 1, 0, 0], [1, 1, 0, 0]).toPairs(), [
            [[1, 1, 1, 1], 1n],
            [[2, 1, 1, 0], 1n],
            [[2, 2, 0, 0], 1n]
        ])
        assert.deepEqual(reduc.tensorWeyls(groups.basedRootSystemByName('A3'), [0, 1, 0], [0, 1, 0]).toPairs(), [
            [[0, 0, 0], 1n],
            [[0, 2, 0], 1n],
            [[1, 0, 1], 1n],
        ])

        assert.deepEqual(reduc.tensorWeyls(groups.GL(4), [2, 1, 0, 0], [3, 2, 1, 1]).toPairs(), [
            [[3, 3, 2, 2], 1n],
            [[3, 3, 3, 1], 1n],
            [[4, 2, 2, 2], 1n],
            [[4, 3, 2, 1], 2n],
            [[4, 4, 1, 1], 1n],
            [[5, 2, 2, 1], 1n],
            [[5, 3, 1, 1], 1n]
        ])
        assert.deepEqual(reduc.tensorWeyls(groups.basedRootSystemByName('A3'), [1, 1, 0], [1, 1, 0]).toPairs(), [
            [[0, 0, 2], 1n], // 3 3 3 1
            [[0, 1, 0], 1n], // 3 3 2 2
            [[0, 3, 0], 1n], // 4 4 1 1
            [[1, 1, 1], 2n], // 4 3 2 1
            [[2, 0, 0], 1n], // 4 2 2 2
            [[2, 2, 0], 1n], // 5 3 1 1
            [[3, 0, 1], 1n], // 5 2 2 1
        ])
    },

    'Is dominant'() {
        assert.deepEqual(reduc.isDominant(groups.GL(4), [0, 0, 0, 0]), true)
        assert.deepEqual(reduc.isDominant(groups.GL(4), [4, 3, 2, 1]), true)
        assert.deepEqual(reduc.isDominant(groups.GL(4), [3, 4, 2, 1]), false)
    },

    'Bad input for Euclidean root system'() {
        // When the hyperplane to the normal contains a root, cannot proceed sensibly.
        assert.throws(() => groups.simplyConn({
            ssrank: 1,
            eucRoots: [[1, -1], [-1, 1]],
            eucNormal: [1, 1]}
        ))
    },

    'SL2 from Euclidean root system'() {
        let SL2 = groups.simplyConn({
            ssrank: 1,
            eucRoots: [[1, -1], [-1, 1]],
            eucNormal: [1, 0]
        })
        assert.deepEqual(SL2.rank, 1)
        assert.deepEqual(SL2.ssrank, 1)
        assert.deepEqual(SL2.roots, [[2], [-2]])
        assert.deepEqual(SL2.coroots, [[1], [-1]])
        assert.deepEqual(mat.multVec(SL2.charToEuc, [2]), [1, -1])
        assert.deepEqual(mat.multVec(SL2.charToEuc, [-2]), [-1, 1])
        assert.deepEqual(mat.multVec(SL2.eucToChar, [1, -1]), [2])
        assert.deepEqual(mat.multVec(SL2.eucToChar, [-1, 1]), [-2])

        assert.deepEqual(mat.multVec(SL2.charToEuc, [1]), [1/2, -1/2])
    },

    'SL3 from Euclidean root system'() {
        let SL3 = groups.SL(3)
        assert.deepEqual(SL3.rank, 2)
        assert.deepEqual(SL3.ssrank, 2)
        assert.deepEqual(SL3.simples, [[2, -1], [-1, 2]])
        assert.deepEqual(SL3.cosimples, [[1, 0], [0, 1]])
        assert.deepEqual(mat.multVec(SL3.charToEuc, [1, 1]), [1, 0, -1])
        assert.deepEqual(mat.multVec(SL3.charToEuc, [-2, 1]), [-1, 1, 0])
        assert.deepEqual(mat.multVec(SL3.eucToChar, [1, 0, -1]), [1, 1])
        assert.deepEqual(mat.multVec(SL3.eucToChar, [-1, 1, 0]), [-2, 1])

        assert.deepEqual(mat.toColumns(SL3.charToEuc), [
            [2/3, -1/3, -1/3],
            [1/3, 1/3, -2/3]
        ])
    },

    'G2 points correct way'() {
        let G2 = groups.simplyConn(groups.rootSystems['G2'])
        assert.deepEqual(G2.cartan, mat.fromRows([[2, -1], [-3, 2]]))
    },

    'B2 points correct way'() {
        let B2 = groups.simplyConn(groups.rootSystems['B2'])
        assert.deepEqual(B2.cartan, mat.fromRows([[2, -2], [-1, 2]]))
    },

    'P-adic valuation'() {
        assert.deepEqual(reduc.nu(2n, 1n), 0n)
        assert.deepEqual(reduc.nu(2n, 2n), 1n)
        assert.deepEqual(reduc.nu(2n, 3n), 0n)
        assert.deepEqual(reduc.nu(2n, 4n), 2n)
        assert.deepEqual(reduc.nu(2n, 5n), 0n)
        assert.deepEqual(reduc.nu(2n, 6n), 1n)
        assert.deepEqual(reduc.nu(2n, 7n), 0n)
        assert.deepEqual(reduc.nu(2n, 8n), 3n)

        assert.deepEqual(reduc.nu(3n, 45n), 2n)

        assert.throws(() => reduc.nu(1n, 6n))
        assert.throws(() => reduc.nu(3n, 0n))
    },

    'Steinberg decomposing weights'() {
        // Needs to be called with p >= 2
        assert.throws(() => reduc.steinbergDecomposeFundwt(1, [100]))

        // Needs to be called on dominant weights
        assert.throws(() => reduc.steinbergDecomposeFundwt(5, [1, 1, -1]))

        // Should actually work
        assert.deepEqual(reduc.steinbergDecomposeFundwt(5, [25, 6, 1]), [[0, 1, 1], [0, 1, 0], [1, 0, 0]])

        // Should return the zero weight rather than an empty list.
        assert.deepEqual(reduc.steinbergDecomposeFundwt(5, [0, 0, 0]), [[0, 0, 0]])
    },

    'Dimensions agree with Steinberg'() {
        let A2 = groups.simplyConn(groups.rootSystems['A2'])
        let p = 3
        let weight = [63, 76]
        let simpleDimension = reduc.trySimpleDimension(A2, p, weight, reduc.createTracker(A2, 10))
        // 63 = 1x0 + 3x0 + 9x1 + 27x2
        // 76 = 1x1 + 3x1 + 9x2 + 27x2
        let decomp = [[0, 1], [0, 1], [1, 2], [2, 2]]
        let expectedDimension = decomp.reduce((acc, wt) => acc * <bigint>reduc.trySimpleDimension(A2, p, wt, reduc.createTracker(A2, 10)), 1n)
        assert.deepEqual(simpleDimension, expectedDimension)
    },
})
