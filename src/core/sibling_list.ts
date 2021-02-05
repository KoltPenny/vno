import { Component, SibList } from "../lib/newtypes.ts";

/**
 * #region SiblingList
 * is a data structure that mimics a linked list
 * it is attached to a parent component's "child"
 * property & attaches all siblings to eachother
 * #endregion
 */
class SiblingList implements SibList {
  public head: Component | null;
  public tail: Component;

  constructor() {
    this.head = null;
    this.tail = (null as unknown as Component);
  }
  /**
   * add will attach the newest sibling to the end of the list
   * @param {ComponentInterface} component
   */
  public add(component: Component): void {
    if (!this.head) {
      this.head = component;
      this.tail = component;
    } else {
      this.tail.sibling = component;
      this.tail = component;
      this.tail.sibling = null;
    }
  }

  /**
   * scrub will remove a sibling from a list
   * and remove its associations to its siblings
   * @param {string} label
   */
  public scrub(label: string): boolean {
    if (!this.head) return false;

    let removed, current, prev;
    // if the label matches the head, remove the head
    if (this.head.label === label) {
      removed = this.head;

      // if the head has a sibling,
      // it becomes the head, otherwise the list is null
      if (this.head.sibling) this.head = this.head.sibling;
      else this.head = null;
      // ensure that the removed component has no attachments
      removed.sibling = null;
      return true;
    }

    // assign current and previous to iterate
    if (this.head.sibling) {
      current = this.head.sibling;
      prev = this.head;
    } else {
      return false;
    }

    while (current.sibling) {
      // if a match is made
      if (current.label === label) {
        removed = current;
        // remove current and attach previous to its sibling
        prev.sibling = current.sibling;
        // ensure no attachments
        removed.sibling = null;
        return true;
      }
      // if no match is made, continue iteration
      prev = current;
      current = current.sibling;
    }

    // if the tail matches the label
    if (current.label === label) {
      removed = current;
      // the tail is assigned to prev
      this.tail = prev;
      this.tail.sibling = null;
      // ensure no attachments
      removed.sibling = null;
      return true;
    }

    return false;
  }
}

export default SiblingList;
