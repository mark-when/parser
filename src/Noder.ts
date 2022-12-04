import { GroupRange, NodeArray, SomeNode, Node, NodeValue } from "./Node";
import { Event, Path, toDateRange } from "./Types";

export const iterate = (node: SomeNode) => {
  return {
    [Symbol.iterator](): Iterator<{ path: number[]; node: SomeNode }> {
      let stack = [node];
      let path = [] as number[];
      let pathInverted = [] as number[];

      return {
        next() {
          const ourPath = [...pathInverted];
          const value = stack.shift();
          if (Array.isArray(value?.value)) {
            stack = value!.value.concat(stack);
            path.push(value!.value.length);
            pathInverted.push(0);
          } else {
            path[path.length - 1] -= 1;
            pathInverted[pathInverted.length - 1] += 1;
            while (path[path.length - 1] <= 0) {
              path.pop();
              path[path.length - 1] -= 1;
              pathInverted.pop();
              pathInverted[pathInverted.length - 1] += 1;
            }
          }
          return {
            done: !value as true,
            value: {
              path: ourPath,
              node: value,
            },
          };
        },
      };
    },
  };
};

export const push = (
  node: SomeNode,
  onto: SomeNode,
  path?: Path,
  tail?: SomeNode
): { path: number[]; tail?: SomeNode } => {
  if (!path || !path.length) {
    if (Array.isArray(onto.value)) {
      onto.value.push(node);

      if (Array.isArray(node.value)) {
        return {
          path: [onto.value.length - 1, node.value.length],
          tail,
        };
      } else {
        return {
          path: [onto.value.length - 1],
          tail: node,
        };
      }
    } else {
      throw new Error("Can't push onto event node");
    }
  } else {
    const { tail: newTail, path: newPath } = push(
      node,
      (onto.value as NodeArray)[path[0]],
      path.slice(1),
      tail
    );
    return {
      path: [path[0], ...newPath],
      tail: newTail,
    };
  }
};

export const get = (root: SomeNode, path: Path): SomeNode | undefined => {
  if (!path.length) {
    return root;
  }
  // If it wasn't us and we don't have any nodes to offer,
  // return undefined
  const arr = root.value as NodeArray;
  if (!arr.length || arr.length - 1 < path[0]) {
    return undefined;
  }
  return get(arr[path[0]], path.slice(1));
};

export const getLast = (node: SomeNode): { node: SomeNode; path: Path } => {
  if (!Array.isArray(node.value)) {
    return { node, path: [] };
  }
  if (!node.value.length) {
    return { node, path: [] };
  }
  const indexOfLast = node.value.length - 1;
  const result = getLast(node.value[indexOfLast]);
  return {
    node: result.node,
    path: [indexOfLast, ...result.path],
  };
};

export const flat = (node: SomeNode) => flatMap(node, (n) => n);

export const flatMap = <T>(
  node: SomeNode,
  mapper: (n: SomeNode) => T
): Array<T> => {
  if (Array.isArray(node.value)) {
    return node.value.flatMap((n) => flatMap(n, mapper));
  }
  return [mapper(node)];
};

export const eventRange = (e: Event) => toDateRange(e.dateRangeIso);

export const ranges = (root: SomeNode): GroupRange => {
  if (!root.value) {
    return undefined;
  }

  if (!Array.isArray(root.value)) {
    return {
      ...eventRange(root.value),
      maxFrom: eventRange(root.value).fromDateTime,
    };
  }

  const childRanges = (root.value as NodeArray).reduce((prev, curr) => {
    const currRange: GroupRange = ranges(curr);
    if (!prev) {
      return currRange;
    }
    if (!currRange) {
      return currRange;
    }

    const min =
      +currRange.fromDateTime < +prev.fromDateTime
        ? currRange.fromDateTime
        : prev.fromDateTime;
    const max =
      +currRange.toDateTime > +prev.toDateTime
        ? currRange.toDateTime
        : prev.toDateTime;
    const maxFrom =
      +currRange.maxFrom > +prev.maxFrom ? currRange.maxFrom : prev.maxFrom;

    const range = {
      fromDateTime: min,
      toDateTime: max,
      maxFrom,
    };
    return range;
  }, undefined as GroupRange);

  return childRanges;
};

export const blankClone = (node: SomeNode): SomeNode => {
  if (!Array.isArray(node.value)) {
    return new Node(node.value!);
  }
  const clone = new Node([] as NodeArray);
  clone.startExpanded = node.startExpanded;
  clone.tags = node.tags;
  clone.title = node.title;
  clone.style = node.style;
  clone.rangeInText = node.rangeInText;
  return clone;
};

export const eventValue = (node: Node<Event> | undefined) => {
  return node?.value as Event;
};

export const arrayValue = (node: Node<NodeArray> | undefined) => {
  return node?.value as NodeArray;
};

export const isEventNode = <T extends NodeValue>(
  node: Node<T>
  // @ts-ignore
): node is Node<Event> => {
  return !Array.isArray(node.value);
};
