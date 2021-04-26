import { runProjects, makeConfig } from './runners';

async function run() {
  try {
    const config = await makeConfig();
    await runProjects({ config });
  } catch (err) {
    console.log(`Failed to run deployer: ${err.message}`);
  }
}

if (!module.parent) {
  run();
}
