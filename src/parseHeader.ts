import { Foldable, ParsingContext } from "./ParsingContext.js";
import * as YAML from "yaml";
import {
  AMERICAN_DATE_FORMAT,
  EUROPEAN_DATE_FORMAT,
  Range,
  RangeType,
} from "./Types.js";
import { checkComments } from "./lineChecks/checkComments.js";
import {
  BCE_START_REGEX,
  EDTF_START_REGEX,
  EVENT_START_REGEX,
  GROUP_START_REGEX,
} from "./regex.js";
import { parseZone } from "./zones/parseZone.js";
import {
  checkHeaderTags,
  propertyHexReplacer,
} from "./lineChecks/checkTags.js";

const stringEmailListToArray = (s: string) =>
  s
    .trim()
    .split(/ |,/)
    .filter(
      (email) =>
        (!!email && email.includes("@")) || email === "*" || email === "\\*"
    );

const headerKeyRegex = /^([^:]+)(:)(?:\s|$)/;
const propertyKeyRegex = /^(?!-)\s*([\w\-\.]+)(:)(?:\s|$)/;
const headerValueRegex = /(:)\s+(.+)$/;

const eventsStarted = (line: string) =>
  !!line.match(EDTF_START_REGEX) ||
  !!line.match(EVENT_START_REGEX) ||
  !!line.match(BCE_START_REGEX) ||
  !!line.match(GROUP_START_REGEX);

const threeDashRegex = /^---/;

export function parseProperties(
  lines: string[],
  lengthAtIndex: number[],
  i: number,
  context: ParsingContext
) {
  let propertiesStartLineIndex = i;
  let propertiesEndLineIndex = propertiesStartLineIndex;

  let firstPropertiesLineIndexWithText = -1;
  let lastPropertiesLineIndexWithText = -1;

  const propertyRanges = [];
  const propertyLines = [];

  let hasThreeDashStart = false;
  const threeDashRanges = [];

  let line = lines[propertiesStartLineIndex];
  while (typeof line !== "undefined") {
    if (!hasThreeDashStart && eventsStarted(line)) {
      break;
    }

    const isThreeDash = line.match(threeDashRegex);
    if (isThreeDash) {
      const range = {
        type: RangeType.FrontmatterDelimiter,
        from: lengthAtIndex[propertiesEndLineIndex],
        to: lengthAtIndex[propertiesEndLineIndex] + 4,
      };
      threeDashRanges.push(range);
      if (!hasThreeDashStart) {
        propertiesStartLineIndex = propertiesEndLineIndex;
        hasThreeDashStart = true;
      } else {
        if (threeDashRanges.length === 2) {
          context.ranges.push(threeDashRanges[0]);
          context.ranges.push(threeDashRanges[1]);
        }
        break;
      }
    }

    const isComment = checkComments(
      line,
      propertiesEndLineIndex,
      lengthAtIndex,
      context
    );

    if (!isComment) {
      line = propertyHexReplacer(line);
    }
    if (!isComment && !isThreeDash) {
      const keyMatch = line.match(propertyKeyRegex);
      if (keyMatch) {
        const from = lengthAtIndex[propertiesEndLineIndex];
        const leadingWhitespaceLength =
          keyMatch.index! + keyMatch[0].indexOf(keyMatch[1]);

        propertyRanges.push({
          type: RangeType.PropertyKey,
          from: from + leadingWhitespaceLength, // Add the whitespace offset
          to: from + leadingWhitespaceLength + keyMatch[1].length,
        });
        propertyRanges.push({
          type: RangeType.PropertyKeyColon,
          from: from + leadingWhitespaceLength + keyMatch[1].length,
          to: from + leadingWhitespaceLength + keyMatch[1].length + 1,
        });
        propertyRanges.push({
          type: RangeType.PropertyValue,
          from: from + leadingWhitespaceLength + keyMatch[1].length + 1,
          to: from + line.length,
        });
        propertyLines.push(line);
        if (firstPropertiesLineIndexWithText === -1) {
          firstPropertiesLineIndexWithText = propertiesEndLineIndex;
        }
        lastPropertiesLineIndexWithText = propertiesEndLineIndex;
      } else if (!hasThreeDashStart) {
        break;
      }
    } else if (!hasThreeDashStart) {
      break;
    }
    line = lines[++propertiesEndLineIndex];
  }

  let properties = {} as any;
  let propOrder: string[] = [];
  let range: Range | undefined;
  if (propertyLines.length) {
    range = {
      from: lengthAtIndex[firstPropertiesLineIndexWithText],
      to:
        lengthAtIndex[lastPropertiesLineIndexWithText] +
        lines[lastPropertiesLineIndexWithText].length,
      type: RangeType.Properties,
    };
    try {
      const map = YAML.parse(propertyLines.join("\n"), {
        mapAsMap: true,
      }) as Map<any, any>;
      propOrder = (() => {
        const o = [];
        for (const k of map.keys()) {
          o.push(k);
        }
        return o;
      })();
      properties = deepMapToObject(map);
      context.ranges.push(...propertyRanges);
    } catch (e) {
      if (e instanceof YAML.YAMLParseError) {
        context.parseMessages.push({
          type: "error",
          pos: e.pos.map((index) => lengthAtIndex[i] + index) as [
            number,
            number
          ],
          message: e.message,
        });
      }
      console.error(e);
    }
  }

  if (threeDashRanges.length === 2) {
    const index = lengthAtIndex[propertiesStartLineIndex];
    const to = lengthAtIndex[propertiesEndLineIndex] - 1;
    context.foldables[index] = {
      startLine: propertiesStartLineIndex,
      startIndex: index,
      endIndex: to,
      type: "header",
      foldStartIndex: threeDashRanges.length === 2 ? index + 3 : index,
    };
  } else if (firstPropertiesLineIndexWithText >= 0) {
    if (
      lastPropertiesLineIndexWithText >= 0 &&
      lastPropertiesLineIndexWithText !== firstPropertiesLineIndexWithText
    ) {
      const index = lengthAtIndex[firstPropertiesLineIndexWithText];
      const to =
        lengthAtIndex[lastPropertiesLineIndexWithText] +
        lines[lastPropertiesLineIndexWithText].length;
      const foldable: Foldable = {
        startLine: firstPropertiesLineIndexWithText,
        startIndex: index,
        endIndex: to,
        type: "header",
        foldStartIndex: index,
      };
      context.foldables[index] = foldable;
    }
  }

  return {
    properties,
    propOrder,
    i: propertiesEndLineIndex,
    range,
  };
}

function deepMapToObject(map: Map<any, any>) {
  const obj = {} as any;
  for (const [key, value] of map.entries()) {
    if (value instanceof Map) {
      obj[key] = deepMapToObject(value);
    } else if (
      typeof value === "object" &&
      value !== null &&
      !Array.isArray(value)
    ) {
      obj[key] = deepMapToObject(new Map(Object.entries(value)));
    } else {
      obj[key] = value;
    }
  }
  return obj;
}

export function parseHeader(
  lines: string[],
  lengthAtIndex: number[],
  context: ParsingContext
) {
  let headerStartLineIndex = 0;
  let headerEndLineIndex = headerStartLineIndex;

  let firstHeaderLineIndexWithText = -1;
  let lastHeaderLineIndexWithText = -1;

  let hasThreeDashStart = false;
  const headerLines = [];
  const headerRanges = [];

  const threeDashRanges = [];

  let line = lines[headerStartLineIndex];
  while (typeof line !== "undefined") {
    // If we're using three dash syntax, we're not stopping until
    // we see the ending token
    if (!hasThreeDashStart && eventsStarted(line)) {
      break;
    }

    const isThreeDash = line.match(threeDashRegex);
    if (isThreeDash) {
      const range = {
        type: RangeType.FrontmatterDelimiter,
        from: lengthAtIndex[headerEndLineIndex],
        to: lengthAtIndex[headerEndLineIndex] + 4,
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
    const isComment = checkComments(
      line,
      headerEndLineIndex,
      lengthAtIndex,
      context
    );
    if (!isComment) {
      line = checkHeaderTags(line, headerEndLineIndex, lengthAtIndex, context);
      headerLines.push(line);
    }
    if (!isComment && !isThreeDash) {
      // check for syntax highlighting
      const keyMatch = line.match(headerKeyRegex);
      if (keyMatch) {
        headerRanges.push({
          type: RangeType.HeaderKey,
          from: lengthAtIndex[headerEndLineIndex],
          to: lengthAtIndex[headerEndLineIndex] + keyMatch[1].length,
        });
        headerRanges.push({
          type: RangeType.HeaderKeyColon,
          from: lengthAtIndex[headerEndLineIndex] + keyMatch[1].length,
          to: lengthAtIndex[headerEndLineIndex] + keyMatch[1].length + 1,
        });
      }
      const valueMatch = line.match(headerValueRegex);
      let index;
      if (valueMatch) {
        if (keyMatch) {
          index =
            keyMatch[0].length +
            line.substring(keyMatch[0].length).indexOf(valueMatch[2]);
        } else {
          index = line.indexOf(valueMatch[2]);
        }
      } else if (keyMatch) {
        index = -1;
      } else {
        index = 0;
      }
      if (index >= 0) {
        headerRanges.push({
          type: RangeType.HeaderValue,
          from: lengthAtIndex[headerEndLineIndex] + index,
          to:
            lengthAtIndex[headerEndLineIndex] +
            index +
            (valueMatch ? valueMatch[2].length : line.length),
        });
      }
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
    if (parsedHeader.view && typeof parsedHeader.view === "string") {
      parsedHeader.view = stringEmailListToArray(parsedHeader.view as string);
    }
    if (parsedHeader.edit && typeof parsedHeader.edit === "string") {
      parsedHeader.edit = stringEmailListToArray(parsedHeader.edit);
    }

    if (
      typeof parsedHeader.timezone !== "undefined" ||
      typeof parsedHeader.tz !== "undefined"
    ) {
      if (!parseZone(parsedHeader.timezone ?? parsedHeader.tz, context.cache)) {
        for (let i = headerStartLineIndex; i < lines.length; i++) {
          const timezoneDefs = ["timezone:", "tz:"];
          for (let j = 0; j < timezoneDefs.length; j++) {
            const timezoneDef = timezoneDefs[j];
            if (lines[i].startsWith(timezoneDef)) {
              const specifiedTimezone = lines[i]
                .substring(timezoneDef.length)
                .trim();
              const start =
                lengthAtIndex[i] + lines[i].indexOf(specifiedTimezone);
              const end = start + specifiedTimezone.length;
              context.parseMessages.push({
                type: "error",
                pos: [start, end],
                message: `Invalid timezone "${specifiedTimezone}"`,
              });
            }
          }
        }
      }
    }

    // We're only going to push our ranges if the parsing was successful
    context.ranges.push(...headerRanges);
    context.header = parsedHeader;
  } catch (e) {
    if (e instanceof YAML.YAMLParseError) {
      context.parseMessages.push({
        type: "error",
        pos: e.pos,
        message: e.message,
      });
    }
    context.header = {};
  }

  let start: number, end: number;
  if (threeDashRanges.length === 2) {
    const index = lengthAtIndex[headerStartLineIndex];
    start = index;
    end = lengthAtIndex[headerEndLineIndex] - 1;
    context.foldables[index] = {
      startLine: headerStartLineIndex,
      startIndex: start,
      endIndex: end,
      type: "header",
      foldStartIndex: threeDashRanges.length === 2 ? index + 3 : index,
    };
  } else if (firstHeaderLineIndexWithText >= 0) {
    if (
      lastHeaderLineIndexWithText >= 0 &&
      lastHeaderLineIndexWithText !== firstHeaderLineIndexWithText
    ) {
      start = lengthAtIndex[firstHeaderLineIndexWithText];
      end = lengthAtIndex[lastHeaderLineIndexWithText + 1] - 1;
      const foldable: Foldable = {
        startLine: firstHeaderLineIndexWithText,
        startIndex: start,
        endIndex: end,
        type: "header",
        foldStartIndex: start,
      };
      context.foldables[start] = foldable;
    }
  }

  const hasSomeText = lines.length > 0 || lines[0].length > 0;
  if (!context.header.timezone && hasSomeText) {
    context.documentMessages.push({
      type: "warning",
      message:
        "Timezone not specified. Specifying a `timezone` in the header is highly recommended.",
    });
  }

  return headerEndLineIndex;
}
