import { readFileSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { argv } from "process";
import { fileURLToPath } from "url";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const packagePath = resolve(packageRoot, "package.json");
const parserPath = resolve(packageRoot, "src/parse.ts");
const bumpTypes = ["major", "minor", "patch"];

function bump(which) {
  if (!bumpTypes.includes(which)) {
    throw new Error(`Expected one of: ${bumpTypes.join(", ")}`);
  }

  const pck = readFileSync(packagePath, "utf-8");
  const pack = JSON.parse(pck);
  const version = pack.version;
  const match = version.match(/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/);
  if (!match) {
    throw new Error(`Expected a SemVer version in package.json, got: ${version}`);
  }

  let [, maj, min, pat] = match;

  if (which === "major") {
    maj = `${parseInt(maj) + 1}`;
    min = "0";
    pat = "0";
  } else if (which === "minor") {
    min = `${parseInt(min) + 1}`;
    pat = "0";
  } else {
    pat = `${parseInt(pat) + 1}`;
  }

  const newVersion = `${maj}.${min}.${pat}`;
  pack.version = newVersion;

  return {
    previousVersion: version,
    newVersion,
    packageJson: JSON.stringify(pack, null, 2) + "\n",
  };
}

function bumpParser(newVersion) {
  const parser = readFileSync(parserPath, "utf-8");
  const updated = parser.replace(
    /^const version = "[^"]+";$/m,
    `const version = "${newVersion}";`
  );
  if (updated === parser) {
    throw new Error("Parser version declaration not found");
  }
  return updated;
}

const { previousVersion, newVersion, packageJson } = bump(argv[2]);
const parser = bumpParser(newVersion);

writeFileSync(packagePath, packageJson);
writeFileSync(parserPath, parser);
console.log(`Bumped parser from ${previousVersion} to ${newVersion}`);
