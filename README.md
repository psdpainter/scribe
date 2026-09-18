# Scribe

A small, simple rich text editor built with vanilla JavaScript.

Scribe turns a div into a place to write, with just enough formatting to get your point across. No runtime dependencies, no themes, and no complicated setup.

## Getting started

Include the stylesheet, add a div, and create an editor:

```html
<link rel="stylesheet" href="./scribe.min.css">

<div id="editor" aria-label="Message"></div>

<script type="module">
    import Scribe from './scribe.min.js';

    const editor = new Scribe('#editor', {
        placeholder: 'Start writing...',
        toolbar: true
    });
</script>
```

Use `scribe.js` and `scribe.css` instead if you prefer the unminified files.

## The toolbar

Set `toolbar: true` to show all available options, or choose your own:

```js
const editor = new Scribe('#editor', {
    placeholder: 'What would you like to say?',
    toolbar: {
        options: [
            Scribe.Bold,
            Scribe.Italic,
            Scribe.List.Unordered,
            Scribe.List.Ordered,
            Scribe.Indent,
            Scribe.Link,
            Scribe.Clear
        ]
    }
});
```

Options appear in the order you provide them. Leave out `toolbar`, or set it to `false`, for an editor without a toolbar.

## Writing and formatting

- **Bold and italic:** format selected text, or the whole editor when nothing is selected.
- **Lists:** create bulleted or numbered lists.
- **Indent:** toggle indentation.
- **Links:** add or edit an HTTPS link. Clear its URL in the prompt to remove it.
- **Clear formatting:** remove formatting from selected text, or the whole editor when nothing is selected.

Pasted text leaves its original fonts, colors, and formatting behind. It follows Scribe’s styling and the formatting active where you paste.

## Make it your own

Scribe’s styles live in the `scribe` CSS layer. Override them in your own stylesheet to change the appearance:

```css
.scribe {
    min-block-size: 16rem;
    border-radius: 0.75rem;
    font-family: Georgia, serif;
}

.scribe-toolbar button[aria-pressed='true'] {
    background: #222;
    border-color: #222;
    color: #fff;
}
```

There’s no theme system to learn—just CSS.

## Reading the content

Get the formatted HTML directly from your div:

```js
const html = document.querySelector('#editor').innerHTML;
```

For plain text:

```js
const text = document.querySelector('#editor').innerText;
```

If you save and display user-written HTML in your application, sanitize it on the server before rendering it.

## Building the minified files

After downloading or cloning the repository:

```bash
npm install
npm run build
```

This generates `scribe.min.js` and `scribe.min.css`. The build tool is only needed for development.

## A small note

Scribe uses the browser’s built-in editing commands through `execCommand`, a deprecated API whose behavior can vary between browsers.

Clear formatting handles basic cases. Mixed lists and multiple levels of indentation may need additional cleanup.