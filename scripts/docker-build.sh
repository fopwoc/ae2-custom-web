#!/bin/sh
set -eu

VERSION=$(node scripts/resolve-version.mjs)
export VERSION

docker build --build-arg "VERSION=${VERSION}" --tag "ae2-terminal:${VERSION}" .
