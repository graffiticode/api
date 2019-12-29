export function buildRunProject({ installProject, buildProject, deployProject }) {
  return async function runProject(project) {
    await installProject(project);
    await buildProject(project);
    await deployProject(project);
  };
}

export function buildPostRunProject({  }) {
  return async function postRunProject({ projects }) {

  };
}
