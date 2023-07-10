<script>
  import "../app.css";
  import Nav from "../components/Nav.svelte";
  let id;
  import { goto } from '$app/navigation';

  const goToProject = () => {
    let cleanId = id.replace('https://scratch.mit.edu/projects/', '');
    goto(`/projects/${cleanId}`)
  }
</script>

<Nav />
<div class="app">
  <input
    type="text"
    placeholder="104"
    bind:value={id}
    class="block bg-white w-64 border border-slate-300 rounded-md py-4 pl-3 pr-3 shadow-sm placeholder:italic text-2xl placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-sky-500 focus:ring-1 "
  />
  <button class="py-2 font-semibold text-sm bg-plurple text-white rounded-full shadow-sm px-4" on:click={goToProject}>Inspect</button>
</div>
