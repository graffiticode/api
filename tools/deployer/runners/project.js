async function waitToCall({ pre = Promise.resolve(), fn, param }) {
  await pre;
  await fn(param);
}

export function buildRunProject({ installProject, buildProject, deployProject }) {
  return async function runProject({ name, config, context }) {
    try {
      context.installPromise = waitToCall({
        fn: installProject,
        param: { name, config, context },
      });
      context.buildPromise = waitToCall({
        pre: context.installPromise,
        fn: buildProject,
        param: { name, config, context },
      });
      context.deployPromise = waitToCall({
        pre: context.buildPromise,
        fn: deployProject,
        param: { name, config, context },
      });

      await context.deployPromise;

      return { err: false };
    } catch (err) {
      console.log(err.stack);
      console.log(`Failed to run project ${name}: ${err.message}`);
      console.log();
      console.log();
      console.log(err);
      console.log();
      console.log();
      return { err: true };
    }
  };
}

export function buildPostRunProject({ }) {
  return async function postRunProject({ projects }) {

  };
}
