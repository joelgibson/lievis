<!-- InteractiveMap

    The role of the InteractiveMap is to provide a base (svg, controls, fullscreenable) for the other map-like
    components, and also deal with user interactions like hovering, clicking, panning, and zooming. The main
    output property is userPort, which is updated any time the width, height, or user-applied transformation
    changes. The other outputs are in the form of events which return [x, y] coordinates, namely
      - 'pointSelected', triggered on a user click.
      - 'pointHovered', triggered when the user mouses over.
-->

<script lang="ts">
    import {aff, vec} from 'lielib'
    import {createEventDispatcher} from 'svelte'
    import FullscreenableContainer from '$lib/components/FullscreenableContainer.svelte'
    import {createInteractionHandlers} from '$lib/pointer-interactions'
    import ButtonGroup from '$lib/components/ButtonGroup.svelte'

    // Read-only input parameters controlling how much we can zoom.
    export let minScale = 1, maxScale = 80, initScale = 40

    // Write-only output parameter for the user viewport
    export let userPort: {width: number, height: number, aff: aff.Aff2}

    // In fullscreen mode?
    export let fullscreen = false

    // Controls shown
    export let controlsShown = true

    // SVG Element
    export let svgElem: null | SVGElement = null

    // On touch devices, which movement mode?
    let panMode: 'frozen' | 'pan-zoom' | 'free' = 'pan-zoom'

    const dispatch = createEventDispatcher()
    const pointerHandlers = createInteractionHandlers({
        click(x: number, y: number, e: PointerEvent) {
            dispatch('pointHovered', [x, y])
            dispatch('pointSelected', [x, y])
        },
        hover(x: number, y: number) {
            dispatch('pointHovered', [x, y])
        },
        hoverUnconditional(x: number, y: number) {
            if (panMode == 'frozen') {
                dispatch('pointHovered', [x, y])
                dispatch('pointSelected', [x, y])
            }
        },
        drag(dx: number, dy: number) {
            if (panMode != 'frozen')
                userPort.aff = userPort.aff.translate(dx, dy)
        },
        wheel(cx: number, cy: number, ds: number, e: WheelEvent) {
            if (panMode != 'frozen' && (e.shiftKey || fullscreen)) {
                userPort.aff = userPort.aff
                    .translate(-cx, -cy)
                    .scale(ds, ds)
                    .clampScale(minScale, maxScale)
                    .translate(cx, cy)

                e.preventDefault()
            }
        },
        pinch(fx: number, fy: number, ox: number, oy: number, nx: number, ny: number) {
            // If we're in pan-zoom mode, translate the centre of the pinch and scale around that.
            if (panMode == 'pan-zoom' || panMode == 'frozen') {
                let scale = vec.norm([fx - nx, fy - ny]) / vec.norm([fx - ox, fy - oy])
                let oc = [(fx + ox) / 2, (fy + oy) / 2]
                let nc = [(fx + nx) / 2, (fy + ny) / 2]
                userPort.aff = userPort.aff
                    .translate(-oc[0], -oc[1])
                    .scale(scale, scale)
                    .clampScale(minScale, maxScale)
                    .translate(nc[0], nc[1])
            }

            // Otherwise in free mode, perform the complex multiplication which will exactly move
            // (ox, oy) to (nx, ny) keeping (fx, fy) fixed.
            if (panMode == 'free') {
                // Let a be the complex vector from fixPt to the old moving point.
                let ax = ox - fx
                let ay = oy - fy
                let aNorm2 = ax*ax + ay*ay

                // let b be the complex vector from fixPt to the new moving point.
                let bx = nx - fx
                let by = ny - fy

                // We want the complex number b/a = b(conj a)/|a|^2
                let re = (ax*bx + ay*by) / aNorm2
                let im = (ax*by - ay*bx) / aNorm2

                userPort.aff = userPort.aff
                    .translate(-fx, -fy)
                    .complex(re, im)
                    .clampScale(minScale, maxScale)
                    .translate(fx, fy)
            }
        }
    })

    // Resizing makes the centre keep the same position.
    function resize(newWidth: number, newHeight: number) {
        let newAff = userPort.aff
            .translate(newWidth/2-userPort.width/2, newHeight/2-userPort.height/2)

        userPort = {width: newWidth, height: newHeight, aff: newAff}
    }

    function recentre() {
        let [x, y] = userPort.aff.xy([0, 0])
        userPort.aff = userPort.aff
            .translate(userPort.width/2-x, userPort.height/2 - y)
    }

    // Make sure we set this when props change.
    $: userPort = {width: 0, height: 0, aff: aff.Aff2.id.scale(initScale, -initScale)}
</script>

<style>
    svg {
        position: absolute;
        top: 0;
        left: 0;
    }
    div.pointeroverlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;

        /** Disable default touch actions, make unselectable. */
        touch-action: none;
        -webkit-user-select: none;
    }
    div.controls {
        position: absolute;
        top: 5px;
        left: 5px;

        border: 1px solid #aaa;
        background-color: white;

        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        font-size: 0.8rem;

        display: flex;
        flex-direction: column;
        padding: 5px;
    }
    div.overlay {
        position: absolute;
        top: 0;
        left: 0;
    }
    div.buttons {
        display: flex;
    }
    div.buttons button {
        width: 2em;
    }
    div.buttons > :global(*:not(:first-child)) {
        margin-left: 5px;
    }
</style>

<FullscreenableContainer
    bind:fullscreen
    on:resize={event => resize(event.detail.width, event.detail.height)}
    >
    <svg
        width={userPort.width}
        height={userPort.height}
        bind:this={svgElem}
        >

        <!-- Slot in svg contents here. -->
        <slot name="svg"></slot>
    </svg>

    <slot name="other"></slot>

    <div class="overlay">
        <slot name="overlay"></slot>
    </div>

    <!-- A transparent overlay over the top of everything, responsible for dealing with pointer events. -->
    <div
        class="pointeroverlay"
        use:pointerHandlers
        on:dblclick={(e) => dispatch('pointDeselected')}
        />

    <div class="controls">
        <div class="buttons">
            <button
                on:click={() => controlsShown = !controlsShown}
                title="Show/Hide controls"
                >
                {#if controlsShown}−{:else}+{/if}
            </button>
            <button
                on:click={() => fullscreen = !fullscreen}
                title="Enter/Leave fullscreen"
                >
                ⤡
            </button>
            <button
                on:click={recentre}
                title="Re-centre"
                >
                ◎
            </button>
            {#if window.navigator.maxTouchPoints}
                <ButtonGroup
                    options={[
                        {text: "Frozen", value: 'frozen'},
                        {text: "Pan/Zoom", value: 'pan-zoom'},
                        {text: "Free", value: 'free'},
                    ]}
                    bind:value={panMode}
                    />
            {/if}
        </div>

        <!-- Slot in whatever controls here. -->
        {#if controlsShown}
            <slot name="controls"></slot>
        {/if}
    </div>
</FullscreenableContainer>
