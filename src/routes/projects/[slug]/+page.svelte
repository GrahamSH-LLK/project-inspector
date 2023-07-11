<script>
  import "../../../app.css";
  import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
  import jsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";
  import Nav from "../../../components/Nav.svelte";
  //import 'monaco-editor/esm/vs/editor/browser/controller/coreCommands.js';
  import 'monaco-editor/esm/vs/editor/contrib/find/browser/findController.js';
  //import * as Monaco from 'monaco-editor/esm/vs/editor/editor.api.js';
  import 'monaco-editor/esm/vs/language/json/monaco.contribution.js';
  import {onMount} from 'svelte'
  export let data;
  window.data = data;
  let SOUND = ["mp3", "wav", "ogg"];
  const TEXT = ["json"];
  const IMAGE = ["png", "jpg", "jpeg", "gif", "svg", "bmp", "webp"];

  const toBase64 = async (file, zip) => {
    return await zip.file(file).async("base64");
  };
  const toText = async (file) => {
    return await zip.file(file).async("text");
  };
  let subscriptions = [];
  export let content;
  let divEl;
  let editor;
  let Monaco;
  let zip;
  const update = (x) => {
    zip.file("project.json", x);
  };
  let progress = { level: 0, status: "" };
  const progressCallback = (type, loaded, total) => {
    let text = type;
    if (type === "metadata") {
      text = "⏳ Downloading project metadata...";
    } else if (type === "project") {
      text = "⏳ Downloading project data...";
    } else if (type === "assets") {
      text = `⏳ Downloading assets (${loaded}/${total})...`;
      //setProgress();
    } else if (type === "compress") {
      text = "⏳ Compressing project...";
    } else {
      console.warn(`Unknown progress type: ${type}`);
    }
    progress.status = text;
    progress.level = loaded / total;
  };
  let createEditor = async () => {
    self.MonacoEnvironment = {
      getWorker: function (_moduleId, label) {
        if (label === "json") {
          return new jsonWorker();
        }
        return new editorWorker();
      },
    };
    Monaco = await import("monaco-editor/esm/vs/editor/editor.api.js");
    editor = Monaco.editor.create(divEl, {
      value: "",
      language: "json",
      theme: "vs-light",
      readOnly: false,
    });
    window.editor = editor;
    editor.onDidChangeModelContent(() => {
      const text = editor.getValue();
      subscriptions.forEach((sub) => sub(text));
    });
    content = {
      subscribe(func) {
        subscriptions.push(func);
        return () => {
          subscriptions = subscriptions.filter((sub) => sub != func);
        };
      },
      set(val) {
        editor.setValue(val);
      },
    };
    console.log(editor);
    content.subscribe(update);
    /**/

    return () => {
      editor.dispose();
    };
  };
  const filenameToJSONObj = async (filename) => {
    const json = JSON.parse(
          await toText(
            Object.keys(zip.files).findLast((x) => x.includes("json"))
          )
        ).targets.reduce(function (acc, obj) { return [...acc, ...obj.sounds, ...obj.costumes] ; }, [])
    //const reduced = json.targets.reduce(function (acc, obj) { return [...acc, ...obj.sounds, ...obj.costumes] ; }, []);
    const found = json.findLast((x) => {return x.md5ext == filename});
    //console.log(reduced, found, filename)
    return found;


  }

  let download;
  const load = async () => {
    const project = await SBDL.downloadProjectFromID(data.params.slug, {onProgress: progressCallback});
    //createEditor();


    zip = await SBDL.JSZip.loadAsync(project.arrayBuffer);
    editor.setValue(
      JSON.stringify(
        JSON.parse(
          await toText(
            Object.keys(zip.files).findLast((x) => x.includes("json"))
          )
        ),
        null,
        2
      )
    );
    download = async () => {
      const blob = await zip.generateAsync({ type: "blob" });
      const a = document.createElement("a");
      a.href = window.URL.createObjectURL(blob);
      a.download = "project.sb3";
      a.click();
    };

    return { project, zip };
  };
</script>

<div class="app">
  <Nav>
    <button on:click={download}><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6 text-white mx-2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
    </button>
  </Nav>
  <div class="flex-grow min-w-96 fixed h-screen w-1/2">
    <div bind:this={divEl} class="editor h-full w-full" />
  </div>
  {#await createEditor()}
  loading editor
  {:catch}
  loading failed
  {/await}

  {#await load()}
  <div class="flex h-full w-full justify-end align-middle">
    <div>
    {progress.status}
    <progress value={progress.level}></progress>
  </div>
    </div>
  {:then data}
  

    <div class="flex ml-[52%] flex-col">
        <h1>{data.project.title}</h1>

      <table class="overflow-x-scroll text-xs">
        <thead>
          <tr>
            <th class="border border-slate-300" colspan="1">MD5</th>
            <th class="border border-slate-300" colspan="1">File type</th>
            <th class="border border-slate-300" colspan="1">Name</th>
            <th class="border border-slate-300" colspan="1">URL</th>
            <th class="border border-slate-300" colspan="1">Preview</th>



          </tr>
        </thead>
        <tbody>
          {#each Object.keys(data.zip.files) as file}
          {#if file != 'project.json'}

            <tr>

              <td class="border p-2 border-slate-300">
                {file.split(".")[0]}
              </td>
              <td class="border p-2 border-slate-300">
                {file.split(".")[1]}
              </td>
              <td class="border p-2 border-slate-300">
                {#await filenameToJSONObj(file)}
                <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {:then data}
                {data.name}
                {/await}
              </td>
              <td class="border p-2 border-slate-300"
                ><a
                  class="text-[#855cd6]"
                  href={`https://cdn.assets.scratch.mit.edu/internalapi/asset/${file}/get/`}
                  target="_blank">URL</a
                ></td
              >
              <td class="border border-slate-300">
                {#if SOUND.includes(file.split(".").pop())}
                  {#await toBase64(file, data.zip) then b64}
                    <audio controls>
                      <source
                        src={"data:;base64," + b64}
                        type={"audio/" + file.split(".").pop()}
                      /></audio
                    >
                  {/await}
                {:else if IMAGE.includes(file.split(".").pop())}
                  {#await toBase64(file, data.zip) then b64}
                    <img
                      class="max-h-32"
                      src={`data:image/${file
                        .split(".")
                        .pop()
                        .replaceAll("svg", "svg+xml")};base64,` + b64}
                    />
                  {/await}
                {/if}
              </td>
            </tr>
            {/if}
          {/each}
        </tbody>
      </table>
    </div>
  {/await}
</div>
<svelte:window
  on:resize={() => {
    editor.layout({ width: 0, height: 0 });
    window.requestAnimationFrame(() => {
      const rect = divEl.parentElement.getBoundingClientRect();
      editor.layout({ width: rect.width, height: rect.height });
    });
  }}
/>
