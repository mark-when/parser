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

// Helper function to set a value at a nested path in an object
export function setValueAtPath(
  obj: any,
  keyPath: string[],
  value: any,
  merge: boolean
): any {
  if (keyPath.length === 0) {
    return value;
  }

  const result = { ...obj };
  const [firstKey, ...restPath] = keyPath;

  if (restPath.length === 0) {
    // Final key - set the value (with merge if needed)
    const correctedValue =
      typeof value === "string" ? hashReplacer(value) : value;
    if (
      merge &&
      typeof result[firstKey] === "object" &&
      typeof value === "object"
    ) {
      result[firstKey] = { ...result[firstKey], ...value };
    } else {
      result[firstKey] = correctedValue;
    }
  } else {
    // Intermediate key - recurse
    result[firstKey] = setValueAtPath(
      result[firstKey] || {},
      restPath,
      value,
      merge
    );
  }

  return result;
}
