import { Foldable, ParsingContext } from "./ParsingContext.js";
import * as YAML from "yaml";
import {
  AMERICAN_DATE_FORMAT,
  EUROPEAN_DATE_FORMAT,
  RangeType,
} from "./Types.js";
import { checkComments } from "./lineChecks/checkComments.js";
import {
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

  const propertyKeyRegex = /^(?!-)([^:]+)(:)(?:\s|$)/;
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

  let properties = {};
  if (propertyLines.length) {
    try {
      const joined = propertyLines.join("\n");
      const result = YAML.parseDocument(joined);
      const from = lengthAtIndex[i];
      // YAML.visit(result, {
      //   Pair: (_, node, path) => {
      //     const key = () => node.key as YAML.Node;
      //     const value = () => node.value as YAML.Node;
      //     context.ranges.push({
      //       type: RangeType.PropertyKey,
      //       from: from + key().range![0],
      //       to: from + key().range![1],
      //     });
      //     context.ranges.push({
      //       type: RangeType.PropertyValue,
      //       from: from + value().range![0],
      //       to: from + value().range![1],
      //     });
      //   },
      // });
      // result.contents;
      properties = YAML.parse(propertyLines.join("\n"));
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
      const index = valueMatch
        ? line.indexOf(valueMatch[2])
        : keyMatch
        ? -1
        : 0;
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
