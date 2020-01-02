import { displayTextWithSpinner, delay } from './index';

const DURATION_MIN = 10;
const DURATION_MAX = 50;

function getRandomInt({min=0,max=100}) {
  return Math.floor(Math.random() * (max-min)) + min;
}

async function run({text}) {
  await delay(getRandomInt({max: 5}));
  let {updateText, cancel} = displayTextWithSpinner({text: `Installing ${text}...`});
  await delay(getRandomInt({min: DURATION_MIN, max: DURATION_MAX}));
  updateText(`Installed ${text}`);
  cancel('done');

  await delay(getRandomInt({max: 5}));
  let {updateText, cancel} = displayTextWithSpinner({text: `Building ${text}...`});
  await delay(getRandomInt({min: DURATION_MIN, max: DURATION_MAX}));
  updateText(`Built ${text}`);
  cancel('done');

  await delay(getRandomInt({max: 5}));
  let {updateText, cancel} = displayTextWithSpinner({text: `Deploying ${text}...`});
  await delay(getRandomInt({min: DURATION_MIN, max: DURATION_MAX}));
  updateText(`Deploying ${text}`);
  cancel('done');
}

describe('util', () => {
  describe('displayTextWithSpinner', () => {
    it('smoke', async () => {
      await Promise.all([
        run({text: 'L0'}),
        run({text: 'L1'}),
        run({text: 'api'}),
      ]);
    });
  });
});
