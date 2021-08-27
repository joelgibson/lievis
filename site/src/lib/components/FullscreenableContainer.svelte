<!-- FullscreenableContainer

This container is a wrapping <div> element. By default it is position:relative (provides a basepoint
for nested absolutely positioned elements), and expands to 100% width and height. So, it should be
placed into something which externally constrains its size to something reasonable.

When put into fullscreen mode, it will instead become position:fixed and take over the page, hiding
the document scrollbar.

It also produces 'resize' events using a ResizeObserver, which fire whenever its size changes (either
by going to and from fullscreen, or by other resizes coming from window dimension changes).
-->

<script lang="ts">
    import { createEventDispatcher } from 'svelte';

    export let fullscreen = false

    const dispatch = createEventDispatcher()

    function resizeListener(div: HTMLDivElement) {
        let observer = new ResizeObserver(() => dispatch('resize', {width: div.clientWidth, height: div.clientHeight}))
        let destroy = () => observer.disconnect()
        observer.observe(div)
        return {destroy}
    }
</script>

<!-- Remove the scrollbar from the page while in fullscreen mode. -->
<svelte:head>
    {#if fullscreen}
        <style>
            body { overflow: hidden; }
        </style>
    {/if}
</svelte:head>

<style>
    div { position: relative; width: 100%; height: 100%; z-index: 1; }
    div.fullscreen { position: fixed; width: 100vw; height: 100vh; left: 0; top: 0; background-color: white;}
</style>

<div class:fullscreen use:resizeListener>
    <slot></slot>
</div>