export function findLine(
  lines: string[],
  regex: RegExp,
  searchRange: SearchRange
) {
  for (let i = searchRange.startLine; i < searchRange.endLine; i++) {
    if (regex.test(lines[i])) {
      return i;
    }
  }
  return -1;
}

export type SearchRange = {
  startLine: number;
  endLine: number;
};

export const objFromKeysAndValue = (keys: string[], value: any) => {
  const last = keys.pop()!;
  let obj = { [last]: value };
  for (let i = keys.length - 1; i >= 0; i--) {
    obj = { [keys[i]]: obj };
  }
  return obj;
};

export const parentAndFlowReplacer = (s: string) =>
  parenReplacer(s).replace(/(^|\W+)'(\[.*\])'(?:$|\W+)/g, "$1$2");

export const parenReplacer = (s: string) =>
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

export const hashReplacer = (s: string) =>
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

export function deepMergeAtPath(
  existingData: any,
  keyPath: string[],
  newValue: any
): any {
  if (keyPath.length === 0) {
    if (
      typeof existingData === "object" &&
      existingData !== null &&
      typeof newValue === "object" &&
      newValue !== null
    ) {
      return { ...existingData, ...newValue };
    }
    return newValue;
  }

  const [currentKey, ...remainingPath] = keyPath;
  const existingObj =
    typeof existingData === "object" && existingData !== null
      ? existingData
      : {};

  return {
    ...existingObj,
    [currentKey]: deepMergeAtPath(
      existingObj[currentKey],
      remainingPath,
      newValue
    ),
  };
}

export function getMergedValue(
  existingData: any,
  keyPath: string[],
  newValue: any,
  merge: boolean
): any {
  if (!merge || !existingData) {
    return newValue;
  }

  let current = existingData;
  for (const segment of keyPath) {
    if (current && typeof current === "object" && segment in current) {
      current = current[segment];
    } else {
      return newValue;
    }
  }

  if (
    typeof current === "object" &&
    current !== null &&
    typeof newValue === "object" &&
    newValue !== null
  ) {
    return { ...current, ...newValue };
  }

  return newValue;
}

function _hashReplacer(obj: any): any {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    return obj;
  }

  const result = { ...obj };

  for (const k of Object.keys(obj)) {
    if (typeof obj[k] === "string") {
      result[k] = hashReplacer(obj[k]);
    } else if (typeof obj[k] === "object" && obj[k] !== null) {
      result[k] = _hashReplacer(obj[k]);
    } else {
      result[k] = obj[k];
    }
  }

  return result;
}

// Helper function to deeply merge objects
export function setValue(existing: any, newObject: any, merge: boolean): any {
  // If not merging, just return the new object
  if (!merge) {
    return _hashReplacer(newObject);
  }

  // If either value is not an object, return the new value
  if (
    typeof existing !== "object" ||
    existing === null ||
    typeof newObject !== "object" ||
    newObject === null
  ) {
    return newObject;
  }

  const result = { ...existing };

  for (const key in newObject) {
    if (newObject.hasOwnProperty(key)) {
      const newValue = newObject[key];

      const correctedValue =
        typeof newValue === "string" ? hashReplacer(newValue) : newValue;

      if (
        merge &&
        typeof result[key] === "object" &&
        result[key] !== null &&
        typeof correctedValue === "object" &&
        correctedValue !== null
      ) {
        result[key] = setValue(result[key], correctedValue, merge);
      } else {
        result[key] = correctedValue;
      }
    }
  }

  return result;
}
