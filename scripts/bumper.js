import { readFile, readFileSync, writeFileSync } from "fs";
import { argv } from "process";

function bump(which) {
  if (!["major", "minor", "patch"].includes(which)) {
    throw new Error(`${which} not one of 'major', 'minor', or 'patch`);
  }

  const pck = readFileSync("package.json", "utf-8");
  const pack = JSON.parse(pck);
  const version = pack.version;
  let [maj, min, pat] = version.split(".");

  if (which === "major") {
    maj = `${parseInt(maj) + 1}`;
  } else if (which === "minor") {
    min = `${parseInt(min) + 1}`;
  } else {
    pat = `${parseInt(pat) + 1}`;
  }

  const newVersion = `${maj}.${min}.${pat}`;
  pack.version = newVersion;

  writeFileSync("package.json", JSON.stringify(pack, null, 2));

  return newVersion;
}

function bumpParser(newVersion) {
  const parser = readFileSync("src/parse.ts", "utf-8");
  const updated = parser.replace(
    /^const version = ".*";?$/,
    `const version = "${newVersion}";`
  );
  writeFileSync("src/parse.ts", updated);
}

const newVersion = bump(argv[2]);
bumpParser(newVersion);
