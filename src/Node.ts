import { DateTime } from "luxon";
import { DateRange, Event, GroupStyle, Path, Range } from "./Types";

export type SomeNode = Node<NodeValue>;
export type NodeArray = Array<SomeNode>;
export type NodeValue = NodeArray | Event;
export type GroupRange = (DateRange & { maxFrom: DateTime }) | undefined;

export class Node<T extends NodeValue>
  implements Iterable<{ path: number[]; node: SomeNode }>
{
  constructor(value: T) {
    this.value = value;
  }

  value: T;
  prev?: SomeNode;
  next?: SomeNode;

  tags?: string[];
  title?: string;
  range?: GroupRange;
  startExpanded?: boolean;
  style?: GroupStyle;
  rangeInText?: Range;

  blankClone(): Node<T> {
    if (this.isEventNode()) {
      return new Node(this.value!);
    }
    const clone = new Node([] as NodeArray);
    clone.startExpanded = this.startExpanded;
    clone.tags = this.tags;
    clone.title = this.title;
    clone.style = this.style;
    clone.rangeInText = this.rangeInText;
    // @ts-ignore
    return clone;
  }

  eventValue() {
    return this.value as Event;
  }

  arrayValue() {
    return this.value as NodeArray;
  }

  /**
   * In order traversal of nodes regardless of whether
   * it's a group or not
   * @returns
   */
  [Symbol.iterator](): Iterator<{ path: number[]; node: SomeNode }> {
    let stack = [this as SomeNode];
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
          // Don't ask me why
          done: !value as true,
          value: {
            path: ourPath,
            node: value,
          },
        };
      },
    };
  }

  isEventNode() {
    return this.value instanceof Event;
  }

  get(path: Path): SomeNode | undefined {
    if (!path.length) {
      return this;
    }
    // If it wasn't us and we don't have any nodes to offer,
    // return undefined
    const arr = this.value as NodeArray;
    if (!arr.length || arr.length - 1 < path[0]) {
      return undefined;
    }
    return arr[path[0]].get(path.slice(1));
  }

  getLast(): { node: SomeNode; path: Path } {
    if (this.isEventNode()) {
      return { node: this, path: [] };
    }
    if (!this.arrayValue().length) {
      return { node: this, path: [] };
    }
    const indexOfLast = this.arrayValue().length - 1;
    const result = this.arrayValue()[indexOfLast].getLast();
    return {
      node: result.node,
      path: [indexOfLast, ...result.path],
    };
  }

  push(
    node: SomeNode,
    tail?: SomeNode,
    path?: Path
  ): { path: number[]; tail?: SomeNode } {
    if (!path || !path.length) {
      if (Array.isArray(this.value)) {
        this.value.push(node);

        if (Array.isArray(node.value)) {
          return {
            path: [this.value.length - 1, node.value.length],
            tail,
          };
        } else {
          if (tail) {
            tail.next = node;
            node.prev = tail;
          }
          return {
            path: [this.value.length - 1],
            tail: node,
          };
        }
      } else {
        throw new Error("Can't push onto event node");
      }
    } else {
      const { tail: newTail, path: newPath } = (this.value as NodeArray)[
        path[0]
      ].push(node, tail, path.slice(1));
      return {
        path: [path[0], ...newPath],
        tail: newTail,
      };
    }
  }

  flat() {
    return this.flatMap((n) => n);
  }

  flatMap<T>(mapper: (n: SomeNode) => T): Array<T> {
    if (Array.isArray(this.value)) {
      return this.value.flatMap((node) => node.flatMap(mapper));
    }
    return [mapper(this)];
  }

  /**
   * This should only be called once per tree, because it will cache the result
   * and return it on subsequent calls.
   */
  ranges(): GroupRange {
    if (!this.value) {
      return undefined;
    }

    if (this.isEventNode()) {
      return {
        ...this.eventValue().ranges.date,
        maxFrom: this.eventValue().ranges.date.fromDateTime,
      };
    }

    if (this.range) {
      return this.range;
    }

    const childRanges = (this.value as NodeArray).reduce((prev, curr) => {
      const currRange: GroupRange = curr.ranges();
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
    this.range = childRanges;
    return childRanges;
  }
}

// export class Cursor {
//   path: Path;
//   node: Node;

//   constructor(node: Node, path: Path) {
//     this.node = node;
//     this.path = path;
//   }

//   next(): Event | undefined {}

//   prev(): Event | undefined {
//     if (this.node.get(this.path)) {
//     }
//   }
// }

// export class MWNode {
//   value?: Event | MWNode[];

//   tags?: string[];
//   title?: string;
//   range?: {
//     min: DateTime;
//     max: DateTime;
//     latest: DateTime;
//   };
//   startExpanded?: boolean;
//   style?: GroupStyle;
//   rangeInText?: Range;

//   // parent?: Node;
//   // leftSibling?: Node
//   // rightSibling?: Node

//   constructor(value?: Event | MWNode[]) {
//     this.value = value;
//   }

//   get(path: Path): Event | MWNode[] {
//     return this._get(path, this.events);
//   }

//   _get(path: Path, events: EventGroup): EventGroup {
//     if (path.length === 0) {
//       return events;
//     }
//     return this._get(path.splice(1), events[path[0]] as EventGroup);
//   }

//   pushEventOrGroup(e: Event | EventGroup) {
//     const additionalNodeIndex = this._pushEventOrGroup(
//       e,
//       this.currentPath,
//       this.events
//     );
//     if (additionalNodeIndex !== -1) {
//       this.currentPath.push(additionalNodeIndex);
//     }
//   }

//   _pushEventOrGroup(
//     e: Event | EventGroup,
//     path: Path,
//     events: EventGroup
//   ): number {
//     if (path.length === 0) {
//       events.push(e);
//       if (Array.isArray(e)) {
//         return events.length - 1;
//       }
//       return -1;
//     } else {
//       return this._pushEventOrGroup(
//         e,
//         path.slice(1),
//         events[path[0]] as EventGroup
//       );
//     }
//   }
// }
