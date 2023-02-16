import { Foldable, ParsingContext } from "./ParsingContext";
import YAML from "yaml";
import { AMERICAN_DATE_FORMAT, EUROPEAN_DATE_FORMAT, RangeType } from "./Types";
import { checkComments } from "./lineChecks/checkComments";
import { checkTagColors } from "./lineChecks/checkTagColors";
import {
  EDTF_START_REGEX,
  EVENT_START_REGEX,
  GROUP_START_REGEX,
  PAGE_BREAK_REGEX,
} from "./regex";

const stringEmailListToArray = (s: string) =>
  s
    .trim()
    .split(/ |,/)
    .filter((email) => !!email && email.includes("@"));

export function parseHeader(
  lines: string[],
  lengthAtIndex: number[],
  startLineIndex: number,
  context: ParsingContext
) {
  let headerStartLineIndex = startLineIndex;
  let headerEndLineIndex = headerStartLineIndex;

  let firstHeaderLineIndexWithText = -1;
  let lastHeaderLineIndexWithText = -1;

  const eventsStarted = (line: string) =>
    !!line.match(EDTF_START_REGEX) ||
    !!line.match(EVENT_START_REGEX) ||
    !!line.match(GROUP_START_REGEX) ||
    !!line.match(PAGE_BREAK_REGEX);

  const threeDashRegex = /^---/;
  let hasThreeDashStart = false;
  const headerLines = [];

  const threeDashRanges = [];

  let line = lines[headerStartLineIndex];
  while (typeof line !== "undefined") {
    // If we're using three dash syntax, we're not stopping until
    // we see the ending token...
    if (!hasThreeDashStart && eventsStarted(line)) {
      break;
    }
    // ... unless it's a page break
    if (hasThreeDashStart && !!line.match(PAGE_BREAK_REGEX)) {
      break;
    }
    if (line.match(threeDashRegex)) {
      const range = {
        type: RangeType.FrontmatterDelimiter,
        from: lengthAtIndex[headerEndLineIndex],
        to: lengthAtIndex[headerEndLineIndex] + 4,
        lineFrom: {
          line: headerEndLineIndex,
          index: 0,
        },
        lineTo: {
          line: headerEndLineIndex,
          index: 4,
        },
      };
      threeDashRanges.push(range);
      if (!hasThreeDashStart) {
        headerStartLineIndex = headerEndLineIndex;
        hasThreeDashStart = true;
      } else {
        if (threeDashRanges.length === 2) {
          context.ranges.push(threeDashRanges[0]);
          context.ranges.push(threeDashRanges[1]);
        }
        break;
      }
    }
    if (
      !(
        checkComments(line, headerEndLineIndex, lengthAtIndex, context) ||
        checkTagColors(line, headerEndLineIndex, lengthAtIndex, context)
      )
    ) {
      headerLines.push(line);
    }
    if (line.length) {
      if (firstHeaderLineIndexWithText === -1) {
        firstHeaderLineIndexWithText = headerEndLineIndex;
      }
      lastHeaderLineIndexWithText = headerEndLineIndex;
    }
    headerEndLineIndex++;
    line = lines[headerEndLineIndex];
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

  if (threeDashRanges.length === 2) {
    const index = lengthAtIndex[headerStartLineIndex];
    context.foldables[index] = {
      startLine: headerStartLineIndex,
      startIndex: index,
      endIndex: lengthAtIndex[headerEndLineIndex] - 1,
      type: "header",
      foldStartIndex: threeDashRanges.length === 2 ? index + 3 : index,
    };
  } else if (firstHeaderLineIndexWithText >= 0) {
    if (
      lastHeaderLineIndexWithText >= 0 &&
      lastHeaderLineIndexWithText !== firstHeaderLineIndexWithText
    ) {
      const index = lengthAtIndex[firstHeaderLineIndexWithText];
      const foldable: Foldable = {
        startLine: firstHeaderLineIndexWithText,
        startIndex: index,
        endIndex: lengthAtIndex[lastHeaderLineIndexWithText + 1] - 1,
        type: "header",
        foldStartIndex: index,
      };
      context.foldables[index] = foldable;
    }
  }

  return headerEndLineIndex;
}
