const semver = require('semver');
const { exec } = require('child_process');

const COMPATIBILITY_OPTIONS = 'NODE_OPTIONS=--openssl-legacy-provider';

function compatibilityExecute(command) {
    if (semver.satisfies(process.version, '>= 17')) {
        command = `${command}`;
    }

    const child = exec(command, (err) => {
        if(err) {
            console.error(err);
        }
    });
    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);
}

module.exports = compatibilityExecute;
