import { Foldable, ParsingContext } from "./ParsingContext.js";
import * as YAML from "yaml";
import {
  AMERICAN_DATE_FORMAT,
  EUROPEAN_DATE_FORMAT,
  RangeType,
} from "./Types.js";
import { checkComments } from "./lineChecks/checkComments.js";
import {
  BCE_START_REGEX,
  EDTF_START_REGEX,
  EVENT_START_REGEX,
  GROUP_START_REGEX,
} from "./regex.js";
import { Caches } from "./Cache.js";
import { parseTopLevelHeaderZone } from "./zones/parseZone.js";
import { checkHeaderTags } from "./lineChecks/checkTags.js";

const stringEmailListToArray = (s: string) =>
  s
    .trim()
    .split(/ |,/)
    .filter(
      (email) =>
        (!!email && email.includes("@")) || email === "*" || email === "\\*"
    );

const headerKeyRegex = /^([^:]+)(:)(?:\s|$)/;
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
  context: ParsingContext,
  cache?: Caches
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

  const propertyKeyRegex = /^(?!-)\s*(\w+)(:)(?:\s|$)/;
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

    if (!isComment && !isThreeDash) {
      const keyMatch = line.match(propertyKeyRegex);
      if (keyMatch) {
        const from = lengthAtIndex[propertiesEndLineIndex];
        propertyRanges.push({
          type: RangeType.PropertyKey,
          from,
          to: from + keyMatch[1].length,
        });
        propertyRanges.push({
          type: RangeType.PropertyKeyColon,
          from: from + keyMatch[1].length,
          to: from + keyMatch[1].length + 1,
        });
        propertyRanges.push({
          type: RangeType.PropertyValue,
          from: from + keyMatch[1].length + 1,
          to: from + line.length,
        });
        propertyLines.push(line);
        if (firstPropertiesLineIndexWithText === -1) {
          firstPropertiesLineIndexWithText = propertiesEndLineIndex;
        }
        propertiesEndLineIndex++;

        line = lines[propertiesEndLineIndex];
      } else if (!hasThreeDashStart) {
        break;
      }
      // const valueMatch = line.match(headerValueRegex);
      // if (valueMatch) {
      //   const index = line.indexOf(valueMatch[0]);
      // propertyRanges.push({
      //   type: RangeType.PropertyValue,
      //   from: lengthAtIndex[propertiesEndLineIndex] + index,
      //   to:
      //     lengthAtIndex[propertiesEndLineIndex] +
      //     index +
      //     valueMatch[0].length,
      // });
      // }

      if (keyMatch) {
        // A key match is what determines if this is a set of properties
        // We do this here so valueMatch still has access to the line
      }
    } else if (!hasThreeDashStart) {
      break;
    }
  }

  let properties: any[] = [];
  if (propertyLines.length) {
    try {
      const map = YAML.parse(propertyLines.join("\n"), {
        mapAsMap: true,
      }) as Map<any, any>;
      properties = mapToArrays(map);
      context.ranges.push(...propertyRanges);
    } catch (e) {
      console.error(e);
    }
  }

  if (threeDashRanges.length === 2) {
    const index = lengthAtIndex[propertiesStartLineIndex];
    context.foldables[index] = {
      startLine: propertiesStartLineIndex,
      startIndex: index,
      endIndex: lengthAtIndex[propertiesEndLineIndex] - 1,
      type: "header",
      foldStartIndex: threeDashRanges.length === 2 ? index + 3 : index,
    };
  } else if (firstPropertiesLineIndexWithText >= 0) {
    if (
      lastPropertiesLineIndexWithText >= 0 &&
      lastPropertiesLineIndexWithText !== firstPropertiesLineIndexWithText
    ) {
      const index = lengthAtIndex[firstPropertiesLineIndexWithText];
      const foldable: Foldable = {
        startLine: firstPropertiesLineIndexWithText,
        startIndex: index,
        endIndex: lengthAtIndex[lastPropertiesLineIndexWithText + 1] - 1,
        type: "header",
        foldStartIndex: index,
      };
      context.foldables[index] = foldable;
    }
  }

  return {
    properties,
    i: propertiesEndLineIndex,
  };
}

function mapToArrays(map: Map<any, any>): any[] {
  let arr: any[] = [];
  map.forEach((value, key) => {
    if (value instanceof Map) {
      arr.push([key, mapToArrays(value)]);
    } else {
      arr.push([key, value]);
    }
  });
  return arr;
}

export function parseHeader(
  lines: string[],
  lengthAtIndex: number[],
  context: ParsingContext,
  cache?: Caches
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
    parseTopLevelHeaderZone(parsedHeader, context, cache);
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

  if (!context.header.timezone) {
    context.parseMessages.push({
      type: "warning",
      pos: [0],
      message:
        "Timezone not specified. Specifying a `timezone` in the header is highly recommended.",
    });
  }

  return headerEndLineIndex;
}
