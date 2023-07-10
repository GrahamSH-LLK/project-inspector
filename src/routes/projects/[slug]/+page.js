//import sbdl from "@turbowarp/sbdl";
export const ssr = false;

export async function load({ params }) {
  let projectData;
  let options = {
    processJSON: (type, pD) => {
      //console.log(pD);
      //projectData = pD;
    },
  };
  let project = await SBDL.downloadProjectFromID(params.slug, options);
  const blob = new Blob([project.arrayBuffer], {
    type: `application/x.scratch.${project.type}`,
  });
  
  console.log(blob);
  const zip = await SBDL.JSZip.loadAsync(project.arrayBuffer);

  return { project, zip };
}
