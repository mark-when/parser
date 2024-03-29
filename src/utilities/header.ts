import { stringify } from "yaml";
import { parseHeader } from "..";

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

// tags.education.color -> blue
export function set(
  mw: string,
  key: string,
  value: string | Object | string[] | Object[] | undefined
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

  let indentation = 0;
  let searchRange: SearchRange = {
    startLine: 0,
    endLine: 0,
  };

  let headerlines: string[] = [];
  let offset = 0;
  for (const foldable of Object.values(foldables)) {
    if (foldable.type === "header") {
      headerlines = lines.slice(foldable.startLine, headerEndLineIndex);
      searchRange = {
        startLine: 0,
        endLine: headerlines.length,
      };
      offset = origLengthAtIndex[foldable.startLine];
      break;
    }
  }

  const lengthAtIndex: number[] = [];
  for (let i = 0; i < headerlines.length; i++) {
    if (i === 0) {
      lengthAtIndex.push(offset);
    }
    lengthAtIndex.push(
      1 + headerlines[i].length + lengthAtIndex[lengthAtIndex.length - 1] || 0
    );
  }

  let obj = header;
  for (let i = 0; i < path.length; i++) {
    const key = path[i];

    const stringToInsert = () =>
      stringify(objFromKeysAndValue(path.slice(i), value))
        .split("\n")
        .map((line) => (!!line ? "  ".repeat(indentation) + line : ""))
        .join("\n");

    if (obj[key]) {
      const from = findLine(
        headerlines,
        new RegExp(`^\\s{${indentation * 2}}${key}`),
        searchRange
      );
      const to = findLine(
        headerlines,
        new RegExp(`^\\s{0,${indentation * 2}}\\w+`),
        {
          startLine: from + 1,
          endLine: searchRange.endLine,
        }
      );
      searchRange = {
        startLine: from === -1 ? searchRange.startLine : from,
        endLine: to === -1 ? searchRange.endLine : to,
      };

      // Either this is the last or the current entry does not have children and
      // so we should replace the whole thing
      if (i === path.length - 1 || typeof obj[key] !== "object") {
        return {
          insert: stringToInsert(),
          from: lengthAtIndex[searchRange.startLine],
          to: lengthAtIndex[searchRange.endLine],
        };
      }
    } else {
      // Insert object here
      return {
        insert: stringToInsert(),
        from: lengthAtIndex[searchRange.endLine],
        to: lengthAtIndex[searchRange.endLine],
      };
    }
    obj = obj[key];
    indentation++;
  }
}
