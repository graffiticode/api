export default function buildRunProjects({ runProject, postRunProject }) {
  return async function runProjects({ config }) {
    let projects = [];
    if (config.projects) {
      projects = Object.keys(config.projects).map((name) => {
        return {
          name,
          config: config.projects[name],
          context: {
            config,
            callbacks: []
          }
        }
      });
    }

    if (projects.length <= 0) {
      console.log('No projects');
      return;
    }

    await Promise.all(projects.map(p => runProject(p)));

    await Promise.all(projects.reduce((callbacks, project) => [...callbacks, ...project.context.callbacks], []).map(c => c(projects)));

    await Promise.all(projects.filter(p => p.config.postRun).map(p => postRunProject(projects)));
  };
}