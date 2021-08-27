/** A store for controlling a slider with a fixed minimum and maximum. */
export class RangeStore {
    private value: number
    private subscriptions = new Set<(value: number) => void>()
    constructor(readonly min: number, readonly max: number, init: number) {
        this.set(init)
    }
    set(newValue: number) {
        this.value = (newValue < this.min) ? this.min : (newValue > this.max) ? this.max : newValue
        for (let fn of this.subscriptions)
            fn(this.value)
    }
    subscribe(fn: (value: number) => void) {
        fn(this.value)
        this.subscriptions.add(fn)
        return () => {this.subscriptions.delete(fn)}
    }

}