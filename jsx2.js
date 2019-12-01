/*
 * @Author: saber2pr
 * @Date: 2019-11-24 16:13:57
 * @Last Modified by: saber2pr
 * @Last Modified time: 2019-12-01 16:05:15
 */
const jsx = (() => {
  const flat1 = arr => [].concat(...arr)
  const flat2 = arr => flat1(flat1(arr))
  const createDOMElement = type => document.createElement(type)
  const createDOMFragment = () => document.createDocumentFragment()
  const createTextNode = value => document.createTextNode(value)
  const assign = Object.assign
  const has = (array, item) => array.includes(item)
  const setNextTick = setTimeout

  const Text_Type = Symbol("text")
  const Fragment_Type = Symbol("fragment")

  const toAttr = obj =>
    Object.entries(obj).reduce((rec, [k, v]) => {
      if (!has(["ref", "style"], k))
        rec[has(["class", "classname"], k) ? "className" : k] = v
      return rec
    }, {})

  const flatList = children =>
    flat2(children).reduce((acc, ch) => {
      if (typeof ch === "number") {
        return acc.concat({ type: Text_Type, props: { nodeValue: ch } })
      }
      if (typeof ch === "string") {
        if (!ch.replace(/ |\r?\n|\r/g, "")) return acc
        return acc.concat({ type: Text_Type, props: { nodeValue: ch } })
      }
      return acc.concat(ch)
    }, [])

  const createElement = (type, props, ...children) => {
    children = flatList(children)
    return type.call
      ? createHook(type)({
          ...props,
          children: children[1] ? children : children[0]
        })
      : { type, props, children }
  }

  const CACHE = {}
  const TEMPLATE = createDOMElement("template")
  const reg = /(\$_h\[\d+\])/g

  const createRenderer = h => (...args) => {
    const tpl = CACHE[args[0]] || (CACHE[args[0]] = build(args[0]))
    return tpl(h, args)
  }

  const build = statics => {
    let str = statics[0],
      i = 1
    while (i < statics.length) {
      str += "$_h[" + i + "]" + statics[i++]
    }

    TEMPLATE.innerHTML = str
      .replace(/<(?:(\/)\/|(\/?)(\$_h\[\d+\]))/g, "<$1$2c c@=$3")
      .replace(/<([\w:-]+)(\s[^<>]*?)?\/>/gi, "<$1$2></$1>")
      .trim()
    return Function(
      "h",
      "$_h",
      "return " + walk((TEMPLATE.content || TEMPLATE).firstChild)
    )
  }

  const walk = n => {
    if (n.nodeType !== 1) {
      if (n.nodeType === 3 && n.data) return field(n.data, ",")
      return "null"
    }
    let nodeName = `"${n.localName}"`,
      str = "{",
      sub = "",
      end = "}"
    for (let i = 0; i < n.attributes.length; i++) {
      const { name, value } = n.attributes[i]
      if (name == "c@") {
        nodeName = value
        continue
      }
      str += `${sub}"${name}":${value ? field(value, "+") : true}`
      sub = ","
    }
    str = "h(" + nodeName + "," + str + end
    let child = n.firstChild
    while (child) {
      str += "," + walk(child)
      child = child.nextSibling
    }
    return str + ")"
  }

  const field = (value, sep) => {
    const matches = value.match(reg)
    let strValue = JSON.stringify(value)
    if (matches != null) {
      if (matches[0] === value) return value
      strValue = strValue
        .replace(reg, `"${sep}$1${sep}"`)
        .replace(/"[+,]"/g, "")
      if (sep === ",") strValue = `[${strValue}]`
    }
    return strValue
  }

  const renderer = createRenderer(createElement)
  renderer.frag = Fragment_Type
  renderer.createElement = createElement

  renderer.Suspense = ({ fallback, children }) => {
    children.then(dom => {
      const container = fallback.parentNode
      container.replaceChild(dom, fallback)
    })
    return fallback
  }

  renderer.lazy = lazyComponent => props =>
    lazyComponent(props).then(component => component.default)

  renderer.render = (component, container) => {
    container.innerHTML = ""
    container.append(renderRoot(component))
  }

  const buildList = (root, stack = [root]) => {
    const list = []
    while (stack.length) {
      const node = stack.pop()
      list.push(node)
      node.children && stack.push(...node.children)
    }
    return list
  }

  const diff = instance => {
    const owner = instance.constructor
    const list = buildList(instance)
    for (let i = 0; i < list.length; ++i) {
      diffNode(list[i], owner.map[i])
    }
    owner.map = list
  }

  const diffNode = (ins, alter) => {
    const { type: insType, props: insProps } = ins
    const { type: alterType, props: alterProps, stateNode } = alter
    if (insType === alterType) {
      for (const key in alterProps) {
        if (insProps[key] !== alterProps[key]) {
          stateNode[key] = insProps[key]
        }
      }
      ins.stateNode = stateNode
    }
  }

  const createHook = fc => vnode => {
    fc.useState = init => {
      if (!("state" in fc)) fc.state = init
      const setState = state => {
        if (state !== fc.state) {
          if (!fc.map) fc.map = buildList(fc.instance)
          fc.state = state
          diff(createInstance(fc, vnode))
        }
      }
      return [
        fc.state,
        fc.node ? setState : state => setNextTick(setState, 0, state)
      ]
    }

    return createInstance(fc, vnode)
  }

  const createInstance = (fc, vnode) => {
    const instance = fc(vnode)
    instance.constructor = fc
    fc.instance = instance
    return instance
  }

  const renderRoot = vnode => {
    const { type, props, children } = vnode

    if (type === Fragment_Type) {
      const dom = createDOMFragment()
      dom.append(...children.map(renderRoot))
      vnode.stateNode = dom
      return dom
    }

    if (type === Text_Type) {
      const dom = createTextNode(props.nodeValue)
      vnode.stateNode = dom
      return dom
    }

    const dom = assign(createDOMElement(type), toAttr(props))
    vnode.stateNode = dom
    dom.append(...children.map(renderRoot))

    if (props.style) assign(dom.style, props.style)
    if (props.ref) props.ref.call ? props.ref(dom) : (props.ref.current = dom)

    return dom
  }

  return renderer
})()
