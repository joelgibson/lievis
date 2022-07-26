import {arr, vec, mat, EnumCox, cartan, Queue} from 'lielib'
import type {Vec, Mat, CoxElt} from 'lielib'

import * as THREE from 'three'
import {OrbitControls} from './OrbitControls.js'

/** Transpose the ith and jth entries of a vector. */
function tranposition(i: number, j: number, u: Vec) {
    let v = u.slice()
    v[i] = u[j]
    v[j] = u[i]
    return v
}

/** The data defining a reflection representation of a Coxter group, and a regular weight. */
type ReflRep = {
    coxeterMat: Mat,
    dim: number,
    reg: Vec,
    proj: Mat,
    simp: Mat[],
}
export const S4: ReflRep = {
    coxeterMat: cartan.coxeterMat('A', 3),
    dim: 4,
    reg: [1, 2, 3, 4],
    proj: mat.fromRows(vec.gramSchmidt([
        [1, 1, 1, 1],
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
    ]).slice(1)),
    simp: [0, 1, 2].map(i => mat.fromLinear(v => tranposition(i, i+1, v), 4)),
}
export const B3: ReflRep = {
    coxeterMat: mat.fromRows([
        [1, 4, 2],
        [4, 1, 3],
        [2, 3, 1],
    ]),
    dim: 3,
    reg: [1, 2, 3],
    proj: mat.id(3),
    simp: [
        mat.fromRows([
            [-1, 0, 0],
            [0, 1, 0],
            [0, 0, 1],
        ]),
        mat.fromRows([
            [0, 1, 0],
            [1, 0, 0],
            [0, 0, 1],
        ]),
        mat.fromRows([
            [1, 0, 0],
            [0, 0, 1],
            [0, 1, 0],
        ])
    ],
}

export function setup(rep: ReflRep) {
    // Create the Coxeter group and fill it out.
    let cox = new EnumCox(rep.coxeterMat)
    cox.growToLength(10)

    // getVertex maps a Coxeter group element to a point in the reflection representation.
    let getVertex = cox.leftMemo(rep.reg, (s, sxt) => mat.multVec(rep.simp[s], sxt))
    let getR3Vertex = (w: CoxElt) => mat.multVec(rep.proj, getVertex(w))

    // Each face is indexed by a left coset of W_I for some |I| = 2. Since |I| = 3, we will
    // index our subgroups by the missing element.

    // Get the minimal-length coset representatives for the left coset representatives of
    // W_I where I = {1, 2, 3} - {missing}
    function getMinLengthReps(missing: number) {
        let tok = (7 ^ (1 << missing))
        console.log(tok)
        let seen = arr.constant(cox.size(), false)
        seen[cox.id] = true
        let queue = new Queue([cox.id])

        while (queue.size() > 0) {
            let w = queue.dequeue()
            for (let s = 0; s < cox.rank; s++) {
                let sw = cox.multL(s, w)
                if (cox.isMinimal(tok, sw) && !seen[sw]) {
                    seen[sw] = true
                    queue.enqueue(sw)
                }
            }
        }

        return arr.range(cox.size()).filter(i => seen[i])
    }

    // Get the elements of the dihedral group W_I where I = {1, 2, 3} - {missing}.
    // The elements are returned in a cyclic right-multiplication order, like id, s, st, sts, ...
    function getDihedral(missing: number) {
        let [s, t] = arr.range(3).filter(x => x != missing)
        let elt = cox.id
        let elts = []
        for (let i = 0; i < 2 * rep.coxeterMat.get(s, t); i++) {
            elts.push(elt)
            elt = cox.multR(elt, (i % 2 == 0) ? s : t)
        }

        return elts
    }

    /** A face of the polyhedron, not a WebGL face. */
    type Face = {
        missing: number     /** I = {1, 2, 3} - {missing}. */
        minLength: CoxElt   /** Minimal-length representative for the left coset. */
        dihedral: CoxElt[]  /** Elements of W_I in a right-multiplication circle. */
    }

    let positions: number[] = []
    let normals: number[] = []
    let colours: number[] = []

    let COLOURS = [
        [1, 0.5, 0.5],
        [0.5, 1, 0.5],
        [0.5, 0.5, 1],
    ]

    for (let missing of [0, 1, 2]) {
        let dihedral = getDihedral(missing)
        for (let w of getMinLengthReps(missing)) {
            console.log(`Subgroup with missing=${missing}, minimal coset rep ${cox.shortLex(w).join('')}, ${dihedral.length} dihedral elements`)

            if (!dihedral.every(w_I => cox.length(cox.multMaybe(w, w_I)) == cox.length(w) + cox.length(w_I)))
                console.log('Something is wrong')

            for (let i = 1; i < dihedral.length - 1; i++) {
                let v1 = getR3Vertex(w)
                let v2 = getR3Vertex(cox.multMaybe(w, dihedral[i]))
                let v3 = getR3Vertex(cox.multMaybe(w, dihedral[i+1]))

                // This normal might be in the wrong direction: it depends on whether this dihedral
                // tour goes clockwise or anticlockwise when looking from the outside of the polyhedron.
                // I can't seem to even fix this by checking whether the normal is pointing towards or
                // away from the origin at the vertex... So we do double-sided shading instead.
                let normal = vec.scaleToNorm(vec.cross3D(vec.sub(v2, v1), vec.sub(v3, v1)), 1)

                let colour = COLOURS[missing]

                positions.push(...v1, ...v2, ...v3)
                normals.push(...normal, ...normal, ...normal)
                colours.push(...colour, ...colour, ...colour)
            }
        }
    }

    let canvas = <HTMLCanvasElement>document.getElementById('permutohedron')
    let renderer = new THREE.WebGLRenderer({canvas})
    let fov = 75
    let aspect = 2
    let near = 0.1
    let far = 100
    let camera = new THREE.PerspectiveCamera(fov, aspect, near, far)
    camera.position.set(0, 0, 10)

    const controls = new OrbitControls(camera, renderer.domElement)


    const scene = new THREE.Scene()

    {
        const colour = 0xffffff
        const intensity = 1
        const light = new THREE.AmbientLight(colour, intensity)
        light.position.set(-1, 2, 4)
        scene.add(light)
    }

    const geometry = new THREE.BufferGeometry()
    const positionNumComponents = 3
    const normalNumComponents = 3
    const colourNumComponents = 3
    geometry.setAttribute(
        'position',
        new THREE.BufferAttribute(new Float32Array(positions), positionNumComponents),
    )
    geometry.setAttribute(
        'normal',
        new THREE.BufferAttribute(new Float32Array(normals), normalNumComponents),
    )
    geometry.setAttribute(
        'color',
        new THREE.BufferAttribute(new Float32Array(colours), colourNumComponents),
    )

    const material = new THREE.MeshPhongMaterial({
        //color: 0x88FF88,
        vertexColors: true,
        // wireframe: true,
        side: THREE.DoubleSide,
    })

    const polyhedron = new THREE.Mesh(geometry, material)

    polyhedron.position.x = 0
    polyhedron.rotation.x = 0.5
    //polyhedron.scale.set(0.5, 0.5, 0.5)

    // let wireframe = new THREE.LineSegments(
    //     new THREE.EdgesGeometry(polyhedron.geometry),
    //     new THREE.LineBasicMaterial({color: 0xffffff}),
    // )
    // polyhedron.add(wireframe)

    scene.add(polyhedron)

    function resizeRendererToDisplaySize(renderer: THREE.Renderer) {
        const canvas = renderer.domElement;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const needResize = canvas.width !== width || canvas.height !== height;
        if (needResize) {
          renderer.setSize(width, height, false);
        }
        return needResize;
    }

    function render(time: number) {
        time *= 0.001;

        if (resizeRendererToDisplaySize(renderer)) {
            const canvas = renderer.domElement;
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
        }

        // let speed = time * 0.3
        // polyhedron.rotation.x = speed;
        // polyhedron.rotation.y = speed;
        controls.update()

        renderer.render(scene, camera);

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render)

    // Following the following tutorial:
    // https://r105.threejsfundamentals.org/threejs/lessons/threejs-custom-buffergeometry.html
    //
    // Since we want each face to have a different normal, and normals are on vertices, we need
    // to create each vertex three times, one belonging to each face.
}
