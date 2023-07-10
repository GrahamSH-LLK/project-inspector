<script>
  import "../../../app.css";
  import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
  import jsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";
  import Nav from "../../../components/Nav.svelte";

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
    Monaco = await import("monaco-editor");
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

    return () => {
      editor.dispose();
    };
  };
  let download;
  const load = async () => {
    const project = await SBDL.downloadProjectFromID(data.params.slug, {onProgress: progressCallback});
    createEditor();
    zip = await SBDL.JSZip.loadAsync(project.arrayBuffer);
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
    <button on:click={download}>download</button>
  </Nav>
  {#await load()}
    {progress.status}
    <progress value={progress.level}></progress>
  {:then data}
    <h1>{data.project.title}</h1>
    <div class="flex-grow min-w-96 fixed h-screen w-1/2">
      <div bind:this={divEl} class="h-full w-full" />
    </div>

    <div class="flex ml-[52%]">
      <table class="overflow-x-scroll">
        <thead>
          <tr>
            <th class="border border-slate-300" colspan="1">MD5</th>
            <th class="border border-slate-300" colspan="1">File type</th>
          </tr>
        </thead>
        <tbody>
          {#each Object.keys(data.zip.files) as file}
            <tr>
              <td class="border p-2 border-slate-300">
                {file.split(".")[0]}
              </td>
              <td class="border p-2 border-slate-300">
                {file.split(".")[1]}
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
