import { cartan, EnumCox, hecke, rtsys } from "..";

let cartanMat = cartan.cartanMat("B", 6)
let phi = rtsys.createRootSystem(cartanMat)
let W = new EnumCox(cartan.cartanMatToCoxeterMat(cartanMat))
W.growToWord(rtsys.longestWord(phi))
let H = new hecke.HeckeAlg(W)

let start = new Date()
for (let x = 0; x < W.size(); x++)
    H.muvec(x)

let end = new Date()

console.log(W.size(), "in", (end.getTime()-start.getTime())/1000, "ms")
