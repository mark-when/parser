import { stringify } from "yaml";
import { linesAndLengths } from "../lines.js";
import { Eventy, Path, get } from "../Types.js";
import { setValue, parentAndFlowReplacer } from "./yaml.js";
import { parse } from "../parse.js";

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
  value: Record<string, string | Object | string[] | Object[] | undefined>,
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

  // Update the eventy's properties
  const updatedProperties = setValue(eventy.properties, value, merge);

  // Generate YAML for the updated properties
  let yamlString = "";
  if (Object.keys(updatedProperties).length > 0) {
    yamlString = stringify(updatedProperties, (k, v) => {
      if (Array.isArray(v)) {
        return `[${v.map((i) => JSON.stringify(i)).join(", ")}]`;
      }
      if (typeof v === "object" && Object.keys(v).length === 0) {
        return "";
      }
      return v;
    })
      .split("\n")
      .filter((l) => !!l && l !== "{}")
      .map((line: string) =>
        line ? "  ".repeat(indentation) + parentAndFlowReplacer(line) : ""
      )
      .join("\n");
  }

  if (insertPosition === mw.length && mw.substring(mw.length - 1) !== "\n") {
    yamlString = "\n" + yamlString;
  }

  // Use the properties text range to replace just the properties section
  const propertiesRange = eventy.textRanges.properties;
  const from = eventy.textRanges.properties?.from ?? insertPosition;
  const change: { from: number; to?: number; insert: string } = {
    insert: yamlString,
    from,
  };
  if (propertiesRange?.to) {
    change.to = propertiesRange.to;
  } else {
    change.insert += "\n";
  }

  return change;
}
