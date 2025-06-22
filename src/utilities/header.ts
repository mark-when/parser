import { stringify } from "yaml";
import { parseHeader } from "../parse.js";
import { parenReplacer, setValueAtPath } from "./yaml.js";

export function set(
  mw: string,
  key: string,
  value: string | Object | string[] | Object[] | undefined,
  merge: boolean = false
) {
  const path = key.split(".");
  const {
    header,
    ranges,
    foldables,
    headerEndLineIndex,
    lines,
    lengthAtIndex: origLengthAtIndex,
  } = parseHeader(mw);

  // Find the header section
  let headerStartLine = 0;
  let headerEndLine = headerEndLineIndex;
  let offset = 0;

  for (const foldable of Object.values(foldables)) {
    if (foldable.type === "header") {
      headerStartLine = foldable.startLine;
      if (lines[headerStartLine].startsWith("---")) {
        headerStartLine++;
      }
      offset = origLengthAtIndex[headerStartLine];
      break;
    }
  }

  // Create updated header object
  const updatedHeader = setValueAtPath(header, path, value, merge);

  // Convert to YAML string with proper formatting
  const yamlString = stringify(updatedHeader)
    .split("\n")
    .map((line: string) => (line ? parenReplacer(line) : ""))
    .join("\n");

  // Calculate positions for replacement
  const from = offset;
  const change: { from: number; to?: number; insert: string } = {
    insert: yamlString,
    from,
  };
  const toPos = origLengthAtIndex[headerEndLine];
  if (toPos) {
    change.to = toPos;
  }
  return change;
}
