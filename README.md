# highline

[![Build Status](https://travis-ci.org/christophercliff/highline.png?branch=master)](https://travis-ci.org/christophercliff/highline)

Transforms GitHub links in a Markdown document into code blocks.

## Installation

```
npm install highline
```

## Usage

```js
var highline = require('highline')

highline(input, options)
    .then(function (ouput) {  }, function (err) {})
```

### **`input`** `String`

The markdown string.

### **`options`** `Object`

- **`template`** `Function`

    A function with the signature `function (data) {}` where data has the shape:

    - **`code`** `String` The lines of source code.
    - **`label`** `String` The link text.
    - **`url`** `String` The link URL.

    Should return the replacement text.

## Example

Input:

    [Source](https://github.com/your-username/your-project/blob/5d5f139799bf5ac91c99322634981ebba69aa7fa/path/to/your/file.js#L1)

Output:

    ```js
    var hello = 'world!'
    ```

## Tests

```
$ npm test
```

## License

See [LICENSE](https://github.com/christophercliff/highline/blob/master/LICENSE.md).
