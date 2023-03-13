#!/bin/sh
":" //#;exec /usr/bin/env node --input-type=module --experimental-specifier-resolution=node --no-warnings - "$@" < "$0"
import path from "path";
import { readFileSync } from "fs";
import { parse } from "./lib/index.js";
import { exit, stdout } from "process";

if (process.argv.length <= 2) {
  console.error("Missing arguments - provide markwhen file or text");
  exit()
}

let text;
try {
  text = readFileSync(path.resolve("./", process.argv[2]), "utf-8");
} catch (e) {
  text = process.argv[2];
}

stdout.write(JSON.stringify(parse(text)));
