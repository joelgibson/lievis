/** The user implements as many of these as they like. Each is passed some "processed"
 * information, for example the drag handler is passed a delta-x and delta-y coordinate
 * change for the drag, and each is also passed the event that triggered it (for the
 * purposes of checking preventDefault etc).
 */
type InteractionHandlers = {
    /** Mouse hovering over the point (x, y). This is mutually exclusive with drag/pinch etc,
     * ie if we are in a drag or pinch this hover will not fire. */
    hover(x: number, y: number, e: PointerEvent): void

    /** Mouse hovering over the point (x, y), even during a drag. This event will still not
     * fire during a pinch. (This allows two fingers to be used for moving...). */
    hoverUnconditional(x: number, y: number, e: PointerEvent): void

    /** Click or touch once the point (x, y). */
    click(x: number, y: number, e: PointerEvent): void

    /** Click-and-drag or touch-and-drag by a delta (dx, dy).  */
    drag(dx: number, dy: number, e: PointerEvent): void

    /** Multitouch pinch (or other two-pointer movement) with fixed point (fx, fy) being the pointer
     * that has not moved, and the moving pointer moved from old coordinate (ox, oy) to new coordinate
     * (nx, ny). */
    pinch(fx: number, fy: number, ox: number, oy: number, nx: number, ny: number, e: PointerEvent): void

    /** A mouse wheel event, translated into a "delta scale" (i.e. something you multiply
     * onto a scale factor. */
    wheel(cx: number, cy: number, ds: number, e: WheelEvent): void
}

/** Function to make it more convenient to declare a svelte action. */
export function createInteractionHandlers(handlers: Partial<InteractionHandlers>) {
    return (elt) => attachInteractionHandlers(elt, handlers)
}

/** Turn on to log a bunch of stuff to the console. */
const DEBUG = false

export function attachInteractionHandlers(elt: HTMLBaseElement, handlers: Partial<InteractionHandlers>) {
    // Maintain a stack of currently active pointers, their ids, and their last known positions.
    // We also record the number of times a pointer has moved, so we can distinguish a touch from a drag.
    let stack: {id: number, x: number, y: number, moves: number}[] = []

    // Utility function for removing all pointers of a certain ID from the stack (we would expect the stack
    // to contain only one, but this is hedging against some unforseen issue of "stuck" pointers).
    function removeId(id: number) {
        for (let i = 0; i < stack.length; i++)
            if (stack[i].id == id)
                stack.splice(i, 1)
    }

    elt.addEventListener('pointercancel', pointerCancel)
    elt.addEventListener('pointerdown', pointerDown)
    elt.addEventListener('pointermove', pointerMove)

    // From my reading of https://www.w3.org/TR/pointerevents/#the-pointerup-event, it seems like the only
    // events we should actually need to listen to are pointerup and pointercancel. But some testing on Chrome
    // (right-click and inspect element, return to find a pointer sticking around) suggests that we actually need
    // to bind the pointerleave and pointerout events as well.
    elt.addEventListener('pointerup', pointerUp)
    elt.addEventListener('pointerleave', pointerUp)
    elt.addEventListener('pointerout', pointerUp)

    elt.addEventListener('wheel', wheel)

    return {
        destroy() {
            elt.removeEventListener('pointercancel', pointerCancel)
            elt.removeEventListener('pointerdown', pointerDown)
            elt.removeEventListener('pointermove', pointerMove)
            elt.removeEventListener('pointerup', pointerUp)
            elt.removeEventListener('pointerleave', pointerUp)
            elt.removeEventListener('pointerout', pointerUp)
            elt.removeEventListener('wheel', wheel)
        }
    }

    function pointerDown(event: PointerEvent) {
        stack.push({id: event.pointerId, x: event.offsetX, y: event.offsetY, moves: 0})
        elt.setPointerCapture(event.pointerId)

        if (DEBUG)
            console.log(event.type, event.pointerId, JSON.stringify(stack))
    }

    function pointerMove(event: PointerEvent) {
        if (handlers.hoverUnconditional && stack.length <= 1)
            handlers.hoverUnconditional(event.offsetX, event.offsetY, event)

        let index = stack.findIndex(({id}) => event.pointerId == id)

        // Here we need to distinguish a hover versus a pan versus a pinch.
        // A hover is happening when there are no active pointers (an empty stack).
        // A pan is happening if there is only a single active, a pinch involves two (or more ignored) pointers.
        if (stack.length == 0 && handlers.hover) {
            handlers.hover(event.offsetX, event.offsetY, event)
        } else if (stack.length == 1 && handlers.drag) {
            handlers.drag(event.offsetX - stack[0].x, event.offsetY - stack[0].y, event)
        } else if (index <= 1 && handlers.pinch) {
            // We will only use the first two pointers. Whatever pointer is currently moving (the one we are in
            // the handler for) is 'index', the other is 'fixPt'.
            let fixPt = 1 - index

            handlers.pinch(stack[fixPt].x, stack[fixPt].y, stack[index].x, stack[index].y, event.offsetX, event.offsetY, event)
        }

        if (index >= 0) {
            stack[index].x = event.offsetX
            stack[index].y = event.offsetY
            stack[index].moves += 1
        }

        if (DEBUG)
            console.log(event.type, event.pointerId, JSON.stringify(stack))
    }

    function pointerUp(event: PointerEvent) {
        let index = stack.findIndex(({id}) => event.pointerId == id)
        if (index >= 0 && event.isPrimary && stack[index].moves <= 2 && handlers.click)
                handlers.click(event.offsetX, event.offsetY, event)

        removeId(event.pointerId)

        if (DEBUG)
            console.log(event.type, event.pointerId, JSON.stringify(stack))
    }

    function pointerCancel(event: PointerEvent) {
        removeId(event.pointerId)

        if (DEBUG)
            console.log(event.type, event.pointerId, JSON.stringify(stack))
    }

    function wheel(this: HTMLBaseElement, event: WheelEvent) {
        // For some reason, on my laptop that has a trackpad, holding shift and scrolling with the trackpad changes
        // deltaY, but holding shift and scrolling with a mouse changes deltaX. On my desktop computer, holding shift
        // and scrolling with a mouse changes deltaY. (!?) Add them both together to hopefully be safe.
        if (handlers.wheel) {
            let scale = Math.pow(2, - (event.deltaY + event.deltaX) / 100)
            handlers.wheel(event.offsetX, event.offsetY, scale, event)
        }
    }
}
