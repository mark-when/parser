import { readFileSync, writeFileSync } from "fs";
import { argv } from "process";

function bump(which) {
  which = ["major", "minor", "patch"].includes(which) ? which : 'patch'

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
    /const version = ".*";?/,
    `const version = "${newVersion}";`
  );
  if (updated === parser) {
    throw new Error("Replacement not found in parser")
  }
  writeFileSync("src/parse.ts", updated);
}

const newVersion = bump(argv[2]);
bumpParser(newVersion);
