#!/bin/bash

# Install self-hosted GitHub Actions runner on macOS Apple Silicon machine
# See:
# - https://docs.github.com/actions/hosting-your-own-runners/adding-self-hosted-runners#adding-a-self-hosted-runner-to-a-repository
# - https://docs.github.com/en/actions/hosting-your-own-runners/configuring-the-self-hosted-runner-application-as-a-service

runner_folder="${HOME}/actions-runner"

mkdir "$runner_folder"
cd "$runner_folder" || exit 1
# Download the latest runner package
brew install jq
runner_tag="$(curl -s -X GET 'https://api.github.com/repos/actions/runner/releases/latest' | jq -r '.tag_name')"
runner_version="${runner_tag:1}"
runner_file="actions-runner-osx-arm64-${runner_version}.tar.gz"
curl -O -L "https://github.com/actions/runner/releases/download/${runner_tag}/${runner_file}"
# Extract the installer
tar xzf "./$runner_file"

# Create the runner
# See: https://docs.github.com/en/actions/hosting-your-own-runners/using-labels-with-self-hosted-runners#programmatically-assign-labels
./config.sh \
	--labels ec2,mac2,arduino_arduino-ide \
	--token "$RUNNER_REGISTRATION_TOKEN" \
	--unattended \
	--url "https://github.com/$REPO_SLUG"

# Install the runner service
./svc.sh install
