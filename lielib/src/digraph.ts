import { arr } from './arr'
import {maps} from './maps'
import { mat, Mat } from "./linear"


export namespace digraph {
    type INode<K, V> = {index: number, key: K, data: V}
    type IEdge<K, V, E> = {index: number, src: INode<K, V>, dst: INode<K, V>, data: E}

    /** A digraph implements a directed graph, allowing self-loops but not allowing
     * parallel edges. Each node has a unique key of type K, and each edge is
     * identified uniquely by an ordered pair of keys.
     *
     * An enumeration is also kept, indexing both nodes and edges, consistent with
     * the ordering in which nodes() and edges() are returned. The reason that this
     * is done is that some graph-theoretic algorithms are much easier to write in
     * Javascript if the vertex set is just [0, N).
     */
    export class Digraph<K, V, E> {
        private _nodeArray: INode<K, V>[] = []
        private _nodeMap: maps.IMap<K, INode<K, V>>

        private _edgeArray: IEdge<K, V, E>[] = []

        private _fwdEdgeMap: maps.IMap<K, maps.IMap<K, IEdge<K, V, E>>>

        private _fwdEdges: IEdge<K, V, E>[][] = []
        private _bakEdges: IEdge<K, V, E>[][] = []
        private _fwdAdj: number[][] = []
        private _bakAdj: number[][] = []

        nodes() { return this._nodeArray }
        edges() { return this._edgeArray }
        nodeCount() { return this._nodeArray.length }
        edgeCount() { return this._edgeArray.length }
        outDeg(nodeIdx: number) { return this._fwdAdj[nodeIdx].length }
        inDeg(nodeIdx: number) { return this._bakAdj[nodeIdx].length }
        outNeigh(nodeIdx: number) { return this._fwdAdj[nodeIdx] }
        inNeigh(nodeIdx: number) { return this._bakAdj[nodeIdx] }
        outEdges(nodeIdx: number) { return this._fwdEdges[nodeIdx] }
        inEdges(nodeIdx: number) { return this._bakEdges[nodeIdx] }

        hasNode(k: K) { return this._nodeMap.contains(k) }
        getNode(k: K) { return this._nodeMap.get(k) }

        hasEdge(srcKey: K, dstKey: K) {
            return this._fwdEdgeMap.contains(srcKey) && this._fwdEdgeMap.get(srcKey).contains(dstKey)
        }
        getEdge(srcKey: K, dstKey: K) {
            return this._fwdEdgeMap.get(srcKey).get(dstKey)
        }

        constructor(
            readonly makeMap: <T>() => maps.IMap<K, T>,
        ) {
            this._nodeMap = makeMap()
            this._fwdEdgeMap = makeMap()
        }

        addNode(key: K, data: V) {
            if (this.hasNode(key)) {
                this.getNode(key).data = data
                return
            }

            let index = this._nodeArray.length
            let node = {key, data, index}

            this._nodeArray[index] = node
            this._nodeMap.set(key, node)

            this._fwdEdgeMap.set(key, this.makeMap())

            this._fwdEdges[index] = []
            this._bakEdges[index] = []
            this._fwdAdj[index] = []
            this._bakAdj[index] = []
        }

        addEdge(srcKey: K, dstKey: K, data: E) {
            if (this.hasEdge(srcKey, dstKey)) {
                let edge = this.getEdge(srcKey, dstKey)
                edge.data = data
                return
            }

            let index = this._edgeArray.length
            let src = this.getNode(srcKey)
            let dst = this.getNode(dstKey)
            let edge = {src, dst, index, data}

            this._edgeArray[index] = edge
            this._fwdEdgeMap.get(srcKey).set(dstKey, edge)

            this._fwdEdges[src.index].push(edge)
            this._bakEdges[dst.index].push(edge)

            this._fwdAdj[src.index].push(dst.index)
            this._bakAdj[dst.index].push(src.index)
        }
    }

    export function inducedSubgraph<K, V, E>(G: Digraph<K, V, E>, pred: (node: INode<K, V>) => boolean): Digraph<K, V, E> {
        let newG = new Digraph<K, V, E>(G.makeMap)

        for (let node of G.nodes())
            if (pred(node))
                newG.addNode(node.key, node.data)

        for (let edge of G.edges())
            if (pred(edge.src) && pred(edge.dst))
                newG.addEdge(edge.src.key, edge.dst.key, edge.data)

        return newG
    }

    /** Return the transitive closure matrix, where A(i, j) = 1 iff there is a path i -> j. */
    function transitiveClosureMatrix<K, V, E>(G: Digraph<K, V, E>): Mat {
        let V = G.nodeCount()
        let pathTo: number[][] = arr.fromFunc(V, () => arr.constant(V, 0))
        for (let node of G.nodes())
            pathTo[node.index][node.index] = 1
        for (let edge of G.edges())
            pathTo[edge.src.index][edge.dst.index] = 1

        for (let k = 0; k < V; k++)
            for (let i = 0; i < V; i++)
                for (let j = 0; j < V; j++)
                    if (pathTo[i][k] + pathTo[k][j] == 2)
                        pathTo[i][j] = 1

        return mat.fromRows(pathTo)
    }

    /** Predicate testing whether a digraph is topologically ordered, in that edges always point
     * from lower indexed vertices to higher indexed vertices.
     */
     export function isTopologicallyOrdered<K, V, E>(G: Digraph<K, V, E>): boolean {
        return G.edges().every(({src, dst}) => src.index <= dst.index)
    }

    /** Compute the lengths of longest paths in the DAG, starting from some vertex. The DAG must be topologically ordered first. Negative numbers indicate that there is no path. */
    function longestPathsDAG<K, V, E>(G: Digraph<K, V, E>, u: number): number[] {
        let lengths: number[] = arr.constant(G.nodeCount(), 0 - G.nodeCount() - 1)
        lengths[u] = 0
        for (let i = u + 1; i < G.nodeCount(); i++)
            for (let n of G.inNeigh(i))
                lengths[i] = Math.max(lengths[i], 1 + lengths[n])

        return lengths
    }

    /** The transitive reduction of a DAG prunes it down to "covering relations". */
    export function transitiveReduction<K, V, E>(G: Digraph<K, V, E>): Digraph<K, V, E> {
        if (!isTopologicallyOrdered(G))
            throw new Error("Graph must be topologically ordered first.")

        let keptEdges = arr.constant(G.edgeCount(), true)
        for (let u = 0; u < G.nodeCount(); u++) {
            let lengths = longestPathsDAG(G, u)
            for (let edge of G.outEdges(u))
                if (lengths[edge.dst.index] > 1)
                    keptEdges[edge.index] = false
        }

        let newG = new Digraph<K, V, E>(G.makeMap)
        for (let node of G.nodes())
            newG.addNode(node.key, node.data)

        for (let edge of G.edges())
            if (keptEdges[edge.index])
                newG.addEdge(edge.src.key, edge.dst.key, edge.data)

        if (!mat.equal(transitiveClosureMatrix(G), transitiveClosureMatrix(newG)))
            throw new Error("Transitive closures not equal")

        return newG
    }

    /** Lay out a partially ordered set which is already in topological order. */
    export interface LayoutSettings {
        horizDist: number
        vertDist: number

        /** "Down" means that the poset increases down the page. */
        orientation: 'down' | 'up'
    }
    const defaultLayoutSettings: LayoutSettings = {
        horizDist: 20,
        vertDist: 40,
        orientation: 'down',
    }

    /** The graph is laid out in a width x height box, in usual screen coordinates (x increases
     * to the right of the page, y increases down the page). Coordinates will come out in the box
     * [0, width] x [0, height], and a margin will most likely need to be added around the picture. */
    export interface GraphLayout<K, V, E> {
        graph: Digraph<K, V, E>
        width: number
        height: number
        level(n: INode<K, V>): number
        nodeX(n: INode<K, V>): number
        nodeY(n: INode<K, V>): number
    }
    export function layoutPoset<K, V, E>(G: Digraph<K, V, E>, options?: Partial<LayoutSettings>): GraphLayout<K, V, E> {
        if (!isTopologicallyOrdered(G))
            throw new Error("Graph should be topolgically ordered first, src <= dst.")

        let opts: LayoutSettings = (options === undefined)
            ? defaultLayoutSettings
            : {...defaultLayoutSettings, ...options}

        // Try to make "levels" in the most straightforward way, using a BFS from all source nodes.
        let nodeLevel = arr.constant(G.nodes.length, -1)
        let nodeIndexInLevel = arr.constant(G.nodes.length, -1)
        let nodesByLevel: number[][] = []
        let addNodeToLevel = (n: number, level: number) => {
            if (nodeLevel[n] >= 0)
                return

            while (level >= nodesByLevel.length)
                nodesByLevel.push([])

            nodeLevel[n] = level
            nodeIndexInLevel[n] = nodesByLevel[level].length
            nodesByLevel[level].push(n)
        }

        let sources = G.nodes().filter(n => G.inDeg(n.index) == 0)
        for (let n of sources)
            addNodeToLevel(n.index, 0)

        for (let level = 0; level < nodesByLevel.length; level++)
            for (let n of nodesByLevel[level])
                for (let v of G.outNeigh(n))
                    addNodeToLevel(v, level + 1)

        const width = Math.max(...nodeIndexInLevel) * opts.horizDist
        const height = (nodesByLevel.length - 1) * opts.vertDist
        return {
            graph: G,
            level(n: INode<K, V>) { return nodeLevel[n.index] },
            nodeX(n: INode<K, V>) {
                let level = nodeLevel[n.index]
                return width/2 + opts.horizDist * (nodeIndexInLevel[n.index] - nodesByLevel[level].length / 2 + 1/2)
            },
            nodeY(n: INode<K, V>) {
                let pos = opts.vertDist * nodeLevel[n.index]
                return (opts.orientation == 'down') ? pos : height - pos;
            },
            width,
            height,
        }
    }
}
