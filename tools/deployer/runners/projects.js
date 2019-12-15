export default function buildRunProjects({ runProject }) {
  return async function runProjects({ config }) {
    let projects = [];
    if (config.projects) {
      projects = Object.keys(config.projects).map((name) => {
        return {
          name,
          config: config.projects[name],
          context: { config },
        }
      });
    }

    if (projects.length <= 0) {
      console.log('No projects');
      return;
    }

    await Promise.all(projects.map(p => runProject(p)));
  };
}