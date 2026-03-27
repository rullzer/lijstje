declare module 'morphdom' {
  type Options = {
    onBeforeElUpdated?: (fromEl: Element, toEl: Element) => boolean
    onBeforeNodeAdded?: (node: Node) => Node | false
    onBeforeNodeDiscarded?: (node: Node) => boolean
    childrenOnly?: boolean
  }
  function morphdom(from: Element, to: Element | string, options?: Options): Element
  export default morphdom
}
