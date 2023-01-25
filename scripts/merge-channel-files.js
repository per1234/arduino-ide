// @ts-check

const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

if (process.argv.length !== 3) {
  console.error('Missing channel files folder path argument.');
  process.exit(1);
}

const channelFilesFolder = process.argv[2];
// Staging file filename suffixes are named according to `runner.arch`.
// https://docs.github.com/en/actions/learn-github-actions/contexts#runner-context
const x86ChannelFilePath = path.join(channelFilesFolder, 'stable-mac-X64.yml');
const arm64ChannelFilePath = path.join(
  channelFilesFolder,
  'stable-mac-ARM64.yml'
);

const x86Data = yaml.load(
  fs.readFileSync(x86ChannelFilePath, { encoding: 'utf8' })
);
const arm64Data = yaml.load(
  fs.readFileSync(arm64ChannelFilePath, { encoding: 'utf8' })
);

const mergedData = x86Data;
mergedData['files'] = mergedData['files'].concat(arm64Data['files']);

fs.writeFileSync(
  path.join(channelFilesFolder, 'stable-mac.yml'),
  yaml.dump(mergedData, { lineWidth: -1 })
);

// Clean up
fs.rmSync(x86ChannelFilePath);
fs.rmSync(arm64ChannelFilePath);
