import { ParsingContext } from "./ParsingContext";
import YAML from "yaml";
import { AMERICAN_DATE_FORMAT, EUROPEAN_DATE_FORMAT } from "./Types";

const stringEmailListToArray = (s: string) =>
  s
    .trim()
    .split(/ |,/)
    .filter((email) => !!email && email.includes("@"));

export function parseHeader(
  lines: string[],
  lengthAtIndex: number[],
  headerStartLineIndex: number,
  headerEndLineIndex: number,
  excludedHeaderLines: number[],
  context: ParsingContext
) {
  const headerLines = [];
  for (let i = headerStartLineIndex; i < headerEndLineIndex; i++) {
    if (!excludedHeaderLines.includes(i)) {
      headerLines.push(lines[i]);
    }
  }
  try {
    const parsedHeader = YAML.parse(headerLines.join("\n"));
    parsedHeader.dateFormat =
      parsedHeader.dateFormat === "d/M/y"
        ? EUROPEAN_DATE_FORMAT
        : AMERICAN_DATE_FORMAT;
    if (parsedHeader.view && typeof parsedHeader.view === "string") {
      parsedHeader.view = stringEmailListToArray(parsedHeader.view as string);
    }
    if (parsedHeader.edit && typeof parsedHeader.edit === "string") {
      parsedHeader.edit = stringEmailListToArray(parsedHeader.edit);
    }
    context.header = parsedHeader;
  } catch {
    context.header = { dateFormat: AMERICAN_DATE_FORMAT };
  }
  return context.header;
}
