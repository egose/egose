const path = require('path');
const _ = require('lodash');
const fse = require('fs-extra');
const { execSync } = require('child_process');
const glob = require('glob');
const { argv } = require('yargs');

const { version } = argv;

const VER_PLACEHOLDER = '0.0.0-PLACEHOLDER';

const parseJson = (dir) => {
  const content = fse.readFileSync(dir).toString('utf-8');
  return JSON.parse(content);
};

const writeJson = (dir, object) => {
  fse.writeFileSync(dir, Buffer.from(JSON.stringify(object, null, 2), 'utf-8'));
};

const packageRoot = path.join(__dirname, '../packages');

glob(`${packageRoot}/*/package.json`, null, (err, files) => {
  files.forEach((file) => {
    const dir = file.substring(0, file.lastIndexOf('/'));
    execSync(`cd ${dir} && make build`);

    const publishDir = `${dir}/lib`;
    const publishFile = `${publishDir}/package.json`;
    const pjson = parseJson(publishFile);

    ['version', 'dependencies', 'peerDependencies'].forEach((type) => {
      if (!pjson[type]) return;

      if (_.isString(pjson[type])) {
        if (pjson[type] === VER_PLACEHOLDER) pjson[type] = version;
      } else if (_.isPlainObject(pjson[type])) {
        _.each(pjson[type], (val, key) => {
          if (val === VER_PLACEHOLDER) pjson[type][key] = version;
        });
      }
    });

    writeJson(publishFile, pjson);
    execSync(`cd ${publishDir} && npm publish --access public`);
  });
});
