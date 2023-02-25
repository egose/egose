const path = require('path');
const { execSync } = require('child_process');
const _ = require('lodash');
const fse = require('fs-extra');
const glob = require('glob');
const { argv } = require('yargs');

let { tag } = argv;
if (!tag) throw Error('tag not supplied');

if (tag.startsWith('v')) tag = tag.substring(1);
console.log(`target tag ${tag}`);

const VER_PLACEHOLDER = '0.0.0-PLACEHOLDER';
const PUBLISH_DIR = 'dist';

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
    execSync(`cd ${dir} && yarn bundle`);

    const publishDir = `${dir}/${PUBLISH_DIR}`;
    const originalPackageJSON = `${dir}/package.json`;
    const targetPackageJSON = `${publishDir}/package.json`;
    let packageData = parseJson(originalPackageJSON);

    ['version', 'dependencies', 'peerDependencies'].forEach((type) => {
      if (!packageData[type]) return;

      if (_.isString(packageData[type])) {
        if (packageData[type] === VER_PLACEHOLDER) packageData[type] = tag;
      } else if (_.isPlainObject(packageData[type])) {
        _.each(packageData[type], (val, key) => {
          if (val === VER_PLACEHOLDER) packageData[type][key] = tag;
        });
      }
    });

    packageData = _.pick(packageData, [
      'name',
      'version',
      'description',
      'keywords',
      'homepage',
      'bugs',
      'license',
      'author',
      'sideEffects',
      'repository',
      'dependencies',
      'peerDependencies',
      'publishConfig',
      'release',
      'engines',
      'main',
      'module',
      'types',
      'exports',
    ]);

    ['LICENSE', 'README.md'].forEach((file) => {
      execSync(`cp ${dir}/${file} ${publishDir}/${file}`);
    });

    writeJson(targetPackageJSON, {
      ...packageData,
      main: './index.js',
      module: './index.mjs',
      types: './index.d.ts',
      exports: {
        '.': {
          require: './index.js',
          import: './index.mjs',
          types: './index.d.ts',
        },
      },
    });
    // execSync(`cd ${publishDir} && npm publish --access public`);
  });
});
