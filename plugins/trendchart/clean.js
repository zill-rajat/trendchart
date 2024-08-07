const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const readdir = promisify(fs.readdir);

const rimraf = require('rimraf');

const PUBLIC_PATH = path.resolve(__dirname, 'public');

clean();

async function clean() {
  let files, rmPromises;
  files = await readdir(PUBLIC_PATH);
  rmPromises = files
    .filter(file => (file !== 'translations') && (file !== 'index.html'))
    .map(file => rm(path.resolve(PUBLIC_PATH, file)));
  await Promise.all(rmPromises);
}

function rm(filePath) {
  return new Promise((resolve, reject) => {
    rimraf(filePath, err => {
      if(err) {
        return reject(err);
      }
      resolve();
    });
  });
}
