<script lang="ts">
    type Option = {text: string, value: any}

    export let options: Option[]
    export let value: any
</script>

<style>
    :root { --radius: 5px; }
    button:first-child { border-top-left-radius: var(--radius); }
    button:first-child { border-bottom-left-radius: var(--radius); }
    button:last-child { border-top-right-radius: var(--radius); }
    button:last-child { border-bottom-right-radius: var(--radius); }
    button:not(:first-child) { border-left: none; }

    button { min-width: 2em;}
</style>

<div>
    {#each options as {text, value: val}}
        <button
            type="button"
            class:selected={val == value}
            on:click={() => value = val}
            >{text}</button>
    {/each}
</div>
