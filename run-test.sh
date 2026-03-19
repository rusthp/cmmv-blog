#!/bin/bash
export PATH="/home/rusthp/.local/share/fnm/node-versions/v22.15.0/installation/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
cd /mnt/b/cmmv-blog
node node_modules/.bin/vitest --run --reporter=verbose tests/feed-images.test.ts
