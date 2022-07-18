import { vec, mat } from './src/linear'
import { rtsys } from './src/rootsystems'
import { cartan } from './src/cartan'

let cartanMat = cartan.cartanMat("F", 4)
let rs = rtsys.createRootSystem(cartanMat)
let startRoot = rtsys.highestShortRoot(rs)

let seen = rs.posRoots.map(_ => false)
seen[startRoot.index] = true
let frontier = [startRoot]
while (frontier.length > 0) {
    let newFrontier = []
    for (let root of frontier) {
        for (let s = 0; s < rs.cartan.nrows; s++) {
            if (root.index == s)
                continue

            let reflected = rs.posRoots[rs.reflectionTable[rtsys.rank(rs) * root.index + s]]
            if (seen[reflected.index])
                continue

            seen[reflected.index] = true
            newFrontier.push(reflected)
        }
    }

    frontier = newFrontier
}

let orbit: rtsys.IRoot[] = []
seen.forEach((didSee, i) => {
    if (didSee)
        orbit.push(rs.posRoots[i])
})

let rtMat = mat.fromColumns(orbit.map(rt => rt.rt))
let {H, U, pivots} = mat.hermiteForm(mat.transpose(rtMat))
mat.debugPrint(rtMat)
console.log('---')
mat.debugPrint(H)
mat.debugPrint(U)
console.log(pivots)
console.log('---')
mat.debugPrint(H)

// console.log("---")
// let soln = mat.integralSolveLinear(rtMat, mat.fromColumns([[0, 0, 0, 1]]))
// mat.debugPrint(soln.H)
// mat.debugPrint(soln.U)
