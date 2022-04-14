<script lang="ts">
    type Option = {text: string, value: any}

    export let options: Option[]
    export let value: any
</script>

<style>
    div {
        display: flex;
        flex-direction: column;
    }

    :root { --radius: 5px; }
    button:first-child { border-top-left-radius: var(--radius); }
    button:first-child { border-top-right-radius: var(--radius); }
    button:last-child { border-bottom-left-radius: var(--radius); }
    button:last-child { border-bottom-right-radius: var(--radius); }

    button { width: 5em;}
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
