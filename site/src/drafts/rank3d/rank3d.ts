import * as THREE from 'three'
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls'
import { cartan, mat, rtsys, vec } from 'lielib'

export function createRootVis(type: string, rank: number, el: HTMLElement) {
    let cartanMat = cartan.cartanMat(type, rank)
    let gramMat = cartan.symmetrise(cartanMat)
    let toEuc = mat.transpose(mat.cholesky(gramMat))
    mat.debugPrint(toEuc)
    mat.debugPrint(mat.multMat(mat.transpose(toEuc), toEuc))
    let rs = rtsys.createRootSystem(cartanMat)

    let rect = el.getBoundingClientRect()
    let width = rect.width
    let height = rect.height

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000)

    const renderer = new THREE.WebGLRenderer()
    renderer.setSize(width, height)
    el.appendChild(renderer.domElement)

    const geometry = new THREE.BoxGeometry()
    const material = new THREE.MeshBasicMaterial({color: 0x00ff00})
    const cube = new THREE.Mesh(geometry, material)
    //scene.add(cube)

    let posEucRoots = rs.posRoots.map(r => mat.multVec(toEuc, r.rt))
    let eucRoots = posEucRoots.concat(posEucRoots.map(rt => vec.scale(rt, -1)))

    for (let root of eucRoots) {
        const arrow = new THREE.ArrowHelper(
            new THREE.Vector3(...root).normalize(),     // Direction
            new THREE.Vector3(0, 0, 0),     // Origin
            vec.norm(root),                              // Length
            0xffff00,                       // Colour

        )
        scene.add(arrow)
    }

    const light = new THREE.AmbientLight(0x404040); // soft white light
    scene.add(light);

    camera.position.z = 3 + Math.max(...eucRoots.map(vec.norm))

    const controls = new OrbitControls(camera, renderer.domElement)

    function animate() {
        requestAnimationFrame(animate)
        controls.update()
        renderer.render(scene, camera)
    }

    animate()
}
