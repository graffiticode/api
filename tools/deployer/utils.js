import fs, { promises as fsPromise } from 'fs';
import os from 'os';
import path from 'path';
import { promisify } from 'util';
import logUpdate from 'log-update';
import { dots } from 'cli-spinners';

if (!fsPromise) {
  fsPromise = {
    mkdtemp: promisify(fs.mkdtemp),
    readdir: promisify(fs.readdir),
    readFile: promisify(fs.readFile),
    rmdir: promisify(fs.rmdir),
    stat: promisify(fs.stat),
    unlink: promisify(fs.unlink),
    writeFile: promisify(fs.writeFile),
  };
}

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

export async function rmdirRecursive(dirpath) {
  const files = await fsPromise.readdir(dirpath);
  const stats = await Promise.all(files.map(file => path.join(dirpath, file)).map(fsPromise.stat));
  const combined = files.map((file, i) => {
    return { file: path.join(dirpath, file), stat: stats[i] };
  });
  await Promise.all(combined.filter(({ stat }) => stat.isDirectory()).map(({ file }) => rmdirRecursive(file)));
  await Promise.all(combined.filter(({ stat }) => stat.isFile()).map(({ file }) => fsPromise.unlink(file)));
  await fsPromise.rmdir(dirpath);
}

export {
  fsPromise,
};
