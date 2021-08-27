/** A queue supporting amortised O(1) enqueue and dequeue. */
export class Queue<T> {
    // The queue is implemented using two stacks. Enqueues append to "back", and dequeues happen from
    // the tail end of the "front" array. 
    private front: T[] = []
    private back: T[] = []

    /** Construct the queue, with optional initial contents. The first element of init
     * will be the first element dequeued. */
    constructor(init?: T[]) {
        if (init !== undefined)
            for (let i = 0; i < init.length; i++)
                this.front[i] = init[init.length - i - 1]
    }

    /** Requires that front is empty. Puts everything on the back onto the front in reverse order,
     * and clears the back. */
    private flip(): void {
        if (this.front.length > 0)
            throw new Error("flip(): front should be empty");
        
        for (let i = 0; i < this.back.length; i++)
            this.front[i] = this.back[this.back.length - i - 1]
        
        this.back.length = 0
    }

    /** Number of elements in the queue. */
    size(): number {
        return this.front.length + this.back.length
    }

    /** Add an element to the back of the queue. */
    enqueue(t: T): void {
        this.back.push(t)
    }

    /** Remove an element from the front of the queue, or error if the queue is empty. */
    dequeue(): T {
        if (this.front.length == 0 && this.back.length == 0)
            throw new Error("dequeue() from an empty queue.")
        
        if (this.front.length == 0)
            this.flip()
        
        return this.front.pop()!
    }
}
