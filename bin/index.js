#!/usr/bin/env sh
J=S//;echo "\n\n$(sed "1,2d" "$0")"|node --input-type=module "$@";exit $?

import { version } from 'process';
import { parse } from "./lib/index.js"
console.log(`Running Node ${version} in ESM mode!`);