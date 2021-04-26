async function waitToCall({ pre = Promise.resolve(), fn, param }) {
  await pre;
  await fn(param);
}

export function buildRunProject({ log, installProject, buildProject, deployProject }) {
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
      log(err.stack);
      log(`Failed to run project ${name}: ${err.message}`);
      return { err: true };
    }
  };
}
