export function buildRunProject({ installProject, buildProject, deployProject }) {
  return async function runProject({ name, config, context }) {
    try {
      await installProject({ name, config, context });
      await buildProject({ name, config, context });
      await deployProject({ name, config, context });
      return { err: false };
    } catch(err) {
      console.log(`Failed to run project ${name}: ${err.message}`);
      return { err: true };
    }
  };
}

export function buildPostRunProject({  }) {
  return async function postRunProject({ projects }) {

  };
}
