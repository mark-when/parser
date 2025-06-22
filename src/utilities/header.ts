import { stringify } from "yaml";
import { parse, parseHeader } from "../parse.js";
import { Eventy, get, isEvent, Path } from "../Types.js";
import { linesAndLengths } from "../lines.js";

function findLine(lines: string[], regex: RegExp, searchRange: SearchRange) {
  for (let i = searchRange.startLine; i < searchRange.endLine; i++) {
    if (regex.test(lines[i])) {
      return i;
    }
  }
  return -1;
}

type SearchRange = {
  startLine: number;
  endLine: number;
};

const objFromKeysAndValue = (keys: string[], value: any) => {
  const last = keys.pop()!;
  let obj = { [last]: value };
  for (let i = keys.length - 1; i >= 0; i--) {
    obj = { [keys[i]]: obj };
  }
  return obj;
};

const parentAndFlowReplacer = (s: string) =>
  parenReplacer(s).replace(/(^|\W+)'(\[.*\])'(?:$|\W+)/g, "$1$2");

const parenReplacer = (s: string) =>
  s.replace(
    /(^|\W+)\)(\w+)/g,
    (
      match: string,
      preHashWhitespace: string,
      tagName: string,
      offset: number,
      str: string
    ) => `${preHashWhitespace}#${tagName}`
  );

const hashReplacer = (s: string) =>
  s.replace(
    /(^|\W+)#(\w+)/g,
    (
      match: string,
      preHashWhitespace: string,
      tagName: string,
      offset: number,
      str: string
    ) => `${preHashWhitespace})${tagName}`
  );

// tags.education.color -> blue
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

  let additionalNewlines = 0;
  for (let j = headerEndLine - 1; j >= headerStartLine; j--) {
    if (/^\s*$/.test(lines[j])) {
      additionalNewlines++;
    } else {
      break;
    }
  }

  // Calculate positions for replacement
  const from = offset;
  const change: { from: number; to?: number; insert: string } = {
    insert: yamlString + "\n".repeat(additionalNewlines),
    from,
  };
  const toPos = origLengthAtIndex[headerEndLine];
  if (toPos) {
    change.to = toPos;
  }
  return change;
}

function findEventyLine(
  eventy: Eventy,
  lines: string[],
  lengthAtIndex: number[]
) {
  const startIndex = eventy.textRanges.whole.from;
  for (let i = 0; i < lines.length; i++) {
    if (lengthAtIndex[i] <= startIndex && lengthAtIndex[i + 1] > startIndex) {
      return i;
    }
  }
}

export function entrySet(
  mw: string,
  path: Path,
  key: string,
  value: string | Object | string[] | Object[] | undefined,
  merge: boolean = false
) {
  const { lines, lengthAtIndex } = linesAndLengths(mw);

  const parsed = parse(lines);
  const eventy = get(parsed.events, path);
  if (!eventy) {
    throw new Error("No eventy found at path");
  }

  const eventyLineIndex = findEventyLine(eventy, lines, lengthAtIndex);
  if (typeof eventyLineIndex !== "number") {
    throw new Error("Unable to find line number for index " + eventyLineIndex);
  }

  const indentation = path.length;
  const insertPosition = lengthAtIndex[eventyLineIndex + 1];
  const keyPath = key.split(".");

  const obj = objFromKeysAndValue(
    keyPath,
    typeof value === "string" ? hashReplacer(value) : value
  );

  let yamlString = stringify(obj, (k, v) => {
    if (Array.isArray(v)) {
      return `[${v.map((i) => JSON.stringify(i)).join(", ")}]`;
    }
    return v;
  })
    .split("\n")
    .map((line: string) =>
      !!line ? "  ".repeat(indentation) + parenReplacer(line) : ""
    )
    .join("\n");

  if (insertPosition === mw.length && mw.substring(mw.length - 1) !== "\n") {
    yamlString = "\n" + yamlString;
  }

  return {
    insert: yamlString,
    from: insertPosition,
    to: insertPosition,
  };
}

// export function entriesSet(
//   mw: string,
//   sets: {
//     path: Path;
//     key: string;
//     value: string | Object | string[] | Object[] | undefined;
//     merge?: boolean;
//   }[]
// ) {

// }
