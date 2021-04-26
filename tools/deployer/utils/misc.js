import fs, { promises as fsPromise } from 'fs';
import path from 'path';
import { promisify } from 'util';
import { dots } from 'cli-spinners';

if (!fsPromise) {
  fsPromise = {
    copyFile: promisify(fs.copyFile),
    mkdtemp: promisify(fs.mkdtemp),
    readdir: promisify(fs.readdir),
    readFile: promisify(fs.readFile),
    rmdir: promisify(fs.rmdir),
    stat: promisify(fs.stat),
    unlink: promisify(fs.unlink),
    writeFile: promisify(fs.writeFile),
  };
}

export function buildPrintLines({ lines, logUpdate }) {
  return function printLines() {
    if (lines.length < 1) {
      logUpdate.clear();
      return;
    }
    const text = lines.reduce((prev, { text, spinner, frameIndex }, index) => {
      if (index !== 0) {
        prev += '\n';
      }
      return prev + `${text} ${spinner.frames[frameIndex]}`;
    }, '');
    logUpdate(text);
  };
}
function buildCancel({ log, info, lines, printLines, logUpdate }) {
  return function cancel(suffix) {
    const index = lines.indexOf(info);
    if (index < 0) {
      return;
    }
    lines.splice(index, 1);
    clearInterval(info.updateFrameInterval);
    logUpdate.clear();
    log(`${info.text} ${suffix}`);
    printLines();
  };
}
function buildUpdateText({ info, printLines }) {
  return function updateText(text) {
    info.text = text;
    printLines();
  };
}
function buildUpdateFrame({ info, printLines }) {
  return function updateFrame() {
    info.frameIndex = ++info.frameIndex % info.spinner.frames.length;
    printLines();
  };
}

export function buildDisplayTextWithSpinner({ log, lines, printLines, logUpdate }) {
  return function displayTextWithSpinner({ text, spinner = dots }) {
    const info = {
      text,
      spinner,
      frameIndex: 0,
    };
    lines.push(info);
    const updateFrame = buildUpdateFrame({ info, printLines });
    info.updateFrameInterval = setInterval(updateFrame, spinner.interval)

    const cancel = buildCancel({ log, info, lines, printLines, logUpdate });
    const updateText = buildUpdateText({ info, printLines });
    return {
      cancel,
      updateText,
    };
  };
}

export function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

export async function rmdirRecursive(dirpath) {
  const files = await fsPromise.readdir(dirpath);
  const filepaths = files.map(file => path.join(dirpath, file));
  const stats = await Promise.all(filepaths.map((filepath) => fsPromise.stat(filepath)));
  const combined = filepaths.map((filepath, i) => {
    return { filepath, stat: stats[i] };
  });
  await Promise.all(combined.filter(({ stat }) => stat.isDirectory()).map(({ filepath }) => rmdirRecursive(filepath)));
  await Promise.all(combined.filter(({ stat }) => stat.isFile()).map(({ filepath }) => fsPromise.unlink(filepath)));
  await fsPromise.rmdir(dirpath);
}

export function buildMakeSettablePromise({ }) {
  return function makeSettablePromise({ }) {
    let resolve;
    let reject;
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return {
      resolve,
      reject,
      promise,
    };
  };
}

export {
  fsPromise,
};
