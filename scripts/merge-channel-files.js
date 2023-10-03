// @ts-check

// The script should be invoked with the path to a folder that contains the two files as an argument. The filenames in the folder should be:
//  - stable-mac-X64.yml
//  - stable-mac-ARM64.yml
// The merged file will be saved to the folder with the name stable-mac.yml and that file can then be uploaded to S3
// The input files will be deleted if the `--no-cleanup` argument is missing.
// Usage `node ./scripts/merge-channel-files.js ./path/to/folder/with/channel/files --no-cleanup`

const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(
    `Usage:
merge-channel-files.js [FLAG]...

Flags:
      --channel <name>     The name of the update channel.
  -h, --help               Print help for the script
      --input <path>       The path of the folder that contains the files to merge.
`
  );
  process.exit(0);
}

const channelFlagIndex = process.argv.indexOf('--channel');

let channel;
if (channelFlagIndex > -1) {
  channel = process.argv[channelFlagIndex + 1];
} else {
  console.error('Missing required --channel flag');
  process.exit(1);
}

const inputFlagIndex = process.argv.indexOf('--input');

let channelFilesFolder;
if (inputFlagIndex > -1) {
  channelFilesFolder = process.argv[inputFlagIndex + 1];
} else {
  console.error('Missing required --input flag');
  process.exit(1);
}

// Staging file filename suffixes are named according to `runner.arch`.
// https://docs.github.com/en/actions/learn-github-actions/contexts#runner-context
const x86ChannelFilePath = path.join(
  channelFilesFolder,
  channel + '-mac-X64.yml'
);
const arm64ChannelFilePath = path.join(
  channelFilesFolder,
  channel + '-mac-ARM64.yml'
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
  path.join(channelFilesFolder, channel + '-mac.yml'),
  yaml.dump(mergedData, { lineWidth: -1 })
);

// Clean up
fs.rmSync(x86ChannelFilePath);
fs.rmSync(arm64ChannelFilePath);
