#!/usr/bin/python3

# Download the pre-built binaries and extract them

import os
import shutil
import subprocess
import pathlib
import json
import re


RELEASE_DIR = 'verible_release'
RELEASE_INFO_FILE = 'verible_release_info.json'
PACKAGE_JSON_PATH = 'package.json'
VERIBLE_ARCHIVE_JSON_PATH = 'verible_archive_info.json'
GET_RELEASES_CMD = 'curl -s https://api.github.com/repos/chipsalliance/verible/releases/latest | jq -r ".assets[].name"'
GET_TAG_CMD = 'curl -s https://api.github.com/repos/chipsalliance/verible/releases/latest | grep -oP \'"tag_name": "\K(.*)(?=")\''


def remove_extensions(file_list):
    cleaned_list = []
    for file_name in file_list:
        cleaned_name = re.sub(r'\.tar\.gz$|\.zip$', '', file_name)
        cleaned_list.append(cleaned_name)
    return cleaned_list


releases = subprocess.check_output(
    GET_RELEASES_CMD, shell=True).decode('utf8').strip().splitlines()
tag = subprocess.check_output(GET_TAG_CMD, shell=True).decode('utf8').strip()

if os.path.exists(RELEASE_DIR):
    shutil.rmtree(RELEASE_DIR)
os.mkdir(RELEASE_DIR)

print('releases', releases)
release_subdirs = [item[8 + len(tag) + 1:] for item in releases]

release_info = {
    'tag': tag,
    'release_subdirs': ['none'] + release_subdirs,
    'release_binaries': {},
}
print('release_info', release_info)

# Download all releases
for index, item in enumerate(releases):
    download_url = f'https://github.com/chipsalliance/verible/releases/download/{tag}/{item}'
    item_output_dir = os.path.join(RELEASE_DIR, release_subdirs[index])
    item_download_path = os.path.join(RELEASE_DIR, item)
    os.mkdir(item_output_dir)

    # NOTE: Linux and Windows releases are compressed using different formats
    # Download compressed file
    command = " ".join(['wget -O', item_download_path, download_url])
    print('command', command)
    result = subprocess.check_output(
        command, shell=True).decode('utf8').strip()

    # Extract compressed file
    command = f'7z x {item_download_path} -so | 7z x -aoa -si -ttar -o"{item_output_dir}"' if '.tar' in item else f'unzip {item_download_path} -d {item_output_dir}'
    print('command', command)
    try:
        result = subprocess.check_output(
            command, shell=True).decode('utf8').strip()
    except Exception as ex:
        print(ex)

    # Remove compressed file
    command = " ".join(['rm', item_download_path])
    print('command', command)
    result = subprocess.check_output(
        command, shell=True).decode('utf8').strip()

    containing_dir = os.path.join(
        item_output_dir, os.listdir(item_output_dir)[0])
    output_bin_dir = os.path.join(containing_dir, 'bin')

    # Linux and Windows releases have different directory structures
    # (assume all Linux releases are compressed using .tar.gz)
    print('item', item)
    if '.tar' in item:
        shutil.rmtree(os.path.join(containing_dir, 'share', 'man'))
        release_info['release_binaries'][item] = str(pathlib.PurePosixPath(os.path.join(
            output_bin_dir, 'verible-verilog-format'))).replace('\\', '/')
    # (assume all the non-Linux releases have the same flat structure,
    # only one (win64) exists for now)
    else:
        os.mkdir(output_bin_dir)
        for content in os.listdir(containing_dir):
            shutil.move(os.path.join(containing_dir, content),
                        output_bin_dir)
        release_info['release_binaries'][item] = str(pathlib.PureWindowsPath(os.path.join(
            output_bin_dir, 'verible-verilog-format.exe')))

# Add the archived versions
with open(os.path.join('.', VERIBLE_ARCHIVE_JSON_PATH), 'r') as archive_json_file:
    archive_json = json.load(archive_json_file)
    release_info["release_subdirs"] += archive_json['archive_subdirs']
    release_info["release_binaries"].update(archive_json['archive_binaries'])

print('release_info', release_info)

# Save release info as JSON file
with open(RELEASE_INFO_FILE, 'w') as output_file:
    output_file.write(json.dumps(release_info, indent=4))

# Update the available releases in the options in package.json
with open(os.path.join('.', PACKAGE_JSON_PATH), 'r') as pkg_json_file:
    pkg_json = json.load(pkg_json_file)
with open(os.path.join('.', PACKAGE_JSON_PATH), 'w') as pkg_json_file:
    subdirs_wo_extension = remove_extensions(release_info["release_subdirs"])
    print('Options for package.json', subdirs_wo_extension)
    pkg_json['contributes']['configuration']['properties'][
        "systemverilogFormatter.veribleBuild"]["enum"] = subdirs_wo_extension
    pkg_json_file.write(json.dumps(pkg_json, indent=2))
