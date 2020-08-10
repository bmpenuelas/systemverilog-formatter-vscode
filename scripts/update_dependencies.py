#!/usr/bin/python3

# Download the pre-built binaries and extract them

import os
import shutil
import subprocess
import json


RELEASE_DIR = 'verible_release'
RELEASE_INFO_FILE = 'verible_release_info.json'
GET_RELEASES_CMD = 'curl -s https://api.github.com/repos/google/verible/releases/latest | jq -r ".assets[].name"'
GET_TAG_CMD = 'curl -s https://api.github.com/repos/google/verible/releases/latest | grep -oP \'"tag_name": "\K(.*)(?=")\''


releases = subprocess.check_output(
    GET_RELEASES_CMD, shell=True).decode('utf8').strip().split('\n')
tag = subprocess.check_output(GET_TAG_CMD, shell=True).decode('utf8').strip()

if os.path.exists(RELEASE_DIR):
    shutil.rmtree(RELEASE_DIR)
os.mkdir(RELEASE_DIR)

release_subdirs = [item[8 + len(tag) + 1:-7] for item in releases]

for index, item in enumerate(releases):
    download_url = 'https://github.com/google/verible/releases/download/' + tag + '/' + item
    item_dir = release_subdirs[index]
    item_output_dir = os.path.join(RELEASE_DIR, item_dir)
    os.mkdir(item_output_dir)
    download_command = 'wget -c ' + download_url + \
        ' -O - | tar -xz -C ' + item_output_dir + ' '
    result = subprocess.check_output(
        download_command, shell=True).decode('utf8').strip()
    print(download_command)
    containing_dir = os.path.join(
        item_output_dir, os.listdir(item_output_dir)[0])
    output_contents = os.listdir(containing_dir)
    shutil.rmtree(os.path.join(containing_dir, 'share', 'man'))

    print()


release_info = {
    'tag': tag,
    'release_subdirs': release_subdirs,
}

with open(RELEASE_INFO_FILE, 'w') as output_file:
    output_file.write(json.dumps(release_info, indent=4))
