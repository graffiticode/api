import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import logUpdate from 'log-update';
import { dots } from 'cli-spinners';

export function displayTextWithSpinner({ text, spinner = dots }) {
  let i = 0;
  const handler = () => {
    logUpdate(`${text} ${spinner.frames[i]}`)
    i = ++i % spinner.frames.length;
  };
  handler();
  const intervalId = setInterval(handler, spinner.interval);
  return {
    cancel: (suffix) => {
      clearInterval(intervalId)
      logUpdate.clear();
      console.log(`${text} ${suffix}`);
    },
    updateText: (newText) => { text = newText },
  };
}

export function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

export async function mkdtemp({ prefix, options }) {
  return await fs.mkdtemp(path.join(os.tmpdir(), `${prefix}-`), options);
}
