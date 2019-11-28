/*
 * @Author: saber2pr
 * @Date: 2019-11-24 16:13:57
 * @Last Modified by: saber2pr
 * @Last Modified time: 2019-11-28 16:17:06
 */
const jsx = (() => {
  const flat1 = arr => [].concat(...arr)
  const flat2 = arr => flat1(flat1(arr))
  const createDOMElement = type => document.createElement(type)
  const createDOMFragment = () => document.createDocumentFragment()
  const assign = Object.assign
  const has = (array, item) => array.includes(item)
  const toAttr = obj =>
    Object.entries(obj).reduce((rec, [k, v]) => {
      if (!has(["ref", "style"], k))
        rec[has(["class", "classname"], k) ? "className" : k] = v
      return rec
    }, {})
  const flatList = children =>
    flat2(children).filter(ch =>
      typeof ch === "string" ? ch.replace(/ |\r?\n|\r/g, "") : 1
    )

  const render = vnode => {
    const { type, props, children } = vnode
    const dom =
      type === jsx.frag
        ? createDOMFragment()
        : assign(createDOMElement(type), toAttr(props))
    if (props.style) assign(dom.style, props.style)
    dom.append(...children)
    if (props.ref) props.ref.call ? props.ref(dom) : (props.ref.current = dom)
    return dom
  }

  const createElement = (type, props, ...children) => {
    children = flatList(children)
    return type.call
      ? type({ ...props, children: children[1] ? children : children[0] })
      : render({ type, props, children })
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
  renderer.frag = Symbol()
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
    container.append(component)
  }

  return renderer
})()
