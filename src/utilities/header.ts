import { stringify } from "yaml";
import { parseHeader } from "../parse.js";

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
      stringify(
        objFromKeysAndValue(
          path.slice(i),
          typeof value === "string" ? hashReplacer(value) : value
        )
      )
        .split("\n")
        .map((line: string) =>
          !!line ? "  ".repeat(indentation) + parenReplacer(line) : ""
        )
        .join("\n");

    if (obj[key]) {
      const from = findLine(
        headerlines,
        new RegExp(
          `^\\s{${indentation * 2}}(${key.replace(")", "\\)")}|${key.replace(
            ")",
            "#"
          )})`
        ),
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
        let additionalNewlines = 0;
        for (let j = searchRange.endLine - 1; j >= searchRange.startLine; j--) {
          if (/^\s*$/.test(headerlines[j])) {
            additionalNewlines++;
          } else {
            break;
          }
        }
        return {
          insert: stringToInsert() + "\n".repeat(additionalNewlines),
          from: lengthAtIndex[searchRange.startLine] || 0,
          to: lengthAtIndex[searchRange.endLine] || 0,
        };
      }
    } else {
      // Insert object here
      return {
        insert: stringToInsert(),
        from: lengthAtIndex[searchRange.endLine] || 0,
        to: lengthAtIndex[searchRange.endLine] || 0,
      };
    }
    obj = obj[key];
    indentation++;
  }
}
