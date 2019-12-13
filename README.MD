### jsx

write jsx in your html. only 1kb dep.

```js
// it returns a dom object.
const app = jsx`<div>Hello World!</div>` // <div>Hello World!</div>

document.body.append(app) // append it.
```

it's the same as:

```js
const app = document.createElement("div")
app.innerHTML = "Hello World!"
document.body.append(app)
```

or use `jsx.render`:

```js
jsx.render(app, document.body)
```

### Start

add it to the head. have a try!

```html
<script src="https://saber2pr.top/jsx/jsx.min.js"></script>
```

---

### Example

[demo](https://saber2pr.top/jsx/example)

```html
<html>
  <head>
    <!-- import jsx shim -->
    <script src="https://saber2pr.top/jsx/jsx.min.js"></script>
  </head>
  <body>
    <div id="root"></div>
    <script>
      // functional component
      const List = ({ list }) =>
        list.map(n => jsx`<li style=${{ color: "red" }}>${n}</li>`)

      // <ul />
      const Ul = jsx`<ul><${List} list=${[1, 2, 3]} /></ul>`

      // append to dom.
      document.getElementById("root").append(Ul)
    </script>
  </body>
</html>
```

#### 1. Ref

```js
const ref = {} // must be an object
const button = jsx`<button ref=${ref} onClick=${() =>
  console.log(ref.current)}>add</button>`

// functional ref handle
const button = jsx`<button ref=${btn => (ref.current = btn)} onClick=${() =>
  console.log(ref.current)}>add</button>`
```

> the ref could be passed from functional component to the functional component, no need forwardRef.(different from react)

#### 2. Fragment

```js
const paras = jsx`
  <${jsx.frag}>
    <p>1</p>
    <p>2</p>
    <p>3</p>
  </${jsx.frag}>` // #document-fragment

document.getElementById("root").append(paras)
```

#### 3. Lazy

```js
const fetchData = value =>
  new Promise(resolve => setTimeout(resolve, 1000, value))

const App = async ({ value }) => {
  const data = await fetchData(value)
  return jsx`<h1>${data}</h1>`
}

const Index = jsx`
  <${jsx.Suspense} fallback=${jsx`<p>loading...</p>`}>
    <${App} value=${"qwq"}/>
  </${jsx.Suspense}>`

document.getElementById("root").append(Index)
```

or import()

```js
const App = jsx.lazy(import("./app.js"))

// or return a default prop: () => Promise<{default: HTMLElement}>
const App = jsx.lazy(async ({ value }) => {
  const data = await fetchData(value)
  return {
    default: jsx`<h1>${data}</h1>`
  }
})
```

#### 4. createElement

```js
jsx.createElement(`div`, { id: "hello" }, "Hello World!") // <div id="hello">Hello World!</div>

const fontSize = 2
jsx.createElement(`h${fontSize}`, {}, "Hello World!") // <h2>Hello World!</h2>
```

### Reference

[htm](https://github.com/developit/htm)

> Author: saber2pr
