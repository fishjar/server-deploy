#!/bin/bash

set -o errexit

if [ "$#" -ne 1 ]; then
    echo Missing version parameter
    echo Usage: build.sh \<version\>
    exit 1
fi

VERSION=$1
SCRIPTDIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )

pushd "$SCRIPTDIR/app1"
  docker build -t "10.10.10.10/testprj/app1-v1:${VERSION}" .
popd

pushd "$SCRIPTDIR/app2"
  docker build -t "10.10.10.10/testprj/app2-v1:${VERSION}" .
popd

pushd "$SCRIPTDIR/gw1"
  docker build -t "10.10.10.10/testprj/gw1-v1:${VERSION}" .
popd

pushd "$SCRIPTDIR/gw2"
  docker build -t "10.10.10.10/testprj/gw2-v1:${VERSION}" .
popd

