export default class Scribe {
    static Bold = 'bold';
    static List = Object.freeze({
        Unordered: 'insertUnorderedList',
        Ordered: 'insertOrderedList'
    });
    static Indent = 'indent';
    static Italic = 'italic';
    static Clear = 'removeFormat';
    static Link = 'createLink';

    constructor(selector, config = {}) {
        this.el = document.querySelector(selector);
        this.config = {
            placeholder: 'Start writing...',
            toolbar: false,
            ...config
        };
        this.range = null;

        if (!this.el || this.el.tagName !== 'DIV') {
            throw new Error(`Scribe requires a div matching "${selector}".`);
        }

        this.el.classList.add('scribe');
        this.el.contentEditable = 'true';
        this.el.setAttribute('role', 'textbox');
        this.el.setAttribute('aria-multiline', 'true');
        this.el.setAttribute('aria-placeholder', this.config.placeholder);
        this.el.dataset.placeholder = this.config.placeholder;

        this.el.addEventListener('input', () => {
            this.save();
            this.update();
        });

        this.el.addEventListener('paste', event => {
            event.preventDefault();

            const text = event.clipboardData?.getData('text/plain');

            if (!text) return;

            this.save();
            this.restore();

            document.execCommand('insertText', false, text);

            this.save();
            this.update();
        });

        this.el.addEventListener('keyup', () => this.save());
        this.el.addEventListener('mouseup', () => this.save());
        this.el.addEventListener('focusout', () => this.save());

        this.onSelectionChange = () => this.save();

        document.addEventListener('selectionchange', this.onSelectionChange);

        if (this.config.toolbar) {
            this.createToolbar();
        }

        this.update();
    }

    createToolbar() {
        const options = new Map([
            [Scribe.Bold, 'Bold'],
            [Scribe.Italic, 'Italic'],
            [Scribe.List.Unordered, 'Bulleted list'],
            [Scribe.List.Ordered, 'Numbered list'],
            [Scribe.Indent, 'Indent'],
            [Scribe.Clear, 'Clear'],
            [Scribe.Link, 'Link']
        ]);

        const currentColor = 'currentColor';

        const icons = new Map([
            [Scribe.Bold, `
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="${currentColor}"><path d="M272-200v-560h221q65 0 120 40t55 111q0 51-23 78.5T602-491q25 11 55.5 41t30.5 90q0 89-65 124.5T501-200H272Zm121-112h104q48 0 58.5-24.5T566-372q0-11-10.5-35.5T494-432H393v120Zm0-228h93q33 0 48-17t15-38q0-24-17-39t-44-15h-95v109Z"/></svg>    
            `],
            [Scribe.Indent, `
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="${currentColor}"><path d="M120-120v-80h720v80H120Zm320-160v-80h400v80H440Zm0-160v-80h400v80H440Zm0-160v-80h400v80H440ZM120-760v-80h720v80H120Zm0 440v-320l160 160-160 160Z"/></svg>    
            `],
            [Scribe.Clear, `
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="${currentColor}"><path d="M120-280v-80h560v80H120Zm80-160v-80h560v80H200Zm80-160v-80h560v80H280Z"/></svg>
            `],
            [Scribe.Link, `
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="${currentColor}"><path d="M440-280H280q-83 0-141.5-58.5T80-480q0-83 58.5-141.5T280-680h160v80H280q-50 0-85 35t-35 85q0 50 35 85t85 35h160v80ZM320-440v-80h320v80H320Zm200 160v-80h160q50 0 85-35t35-85q0-50-35-85t-85-35H520v-80h160q83 0 141.5 58.5T880-480q0 83-58.5 141.5T680-280H520Z"/></svg>
            `],
            [Scribe.Italic, `
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="${currentColor}"><path d="M200-200v-100h160l120-360H320v-100h400v100H580L460-300h140v100H200Z"/></svg>
            `],
            [Scribe.List.Ordered, `
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="${currentColor}"><path d="M120-80v-60h100v-30h-60v-60h60v-30H120v-60h120q17 0 28.5 11.5T280-280v40q0 17-11.5 28.5T240-200q17 0 28.5 11.5T280-160v40q0 17-11.5 28.5T240-80H120Zm0-280v-110q0-17 11.5-28.5T160-510h60v-30H120v-60h120q17 0 28.5 11.5T280-560v70q0 17-11.5 28.5T240-450h-60v30h100v60H120Zm60-280v-180h-60v-60h120v240h-60Zm180 440v-80h480v80H360Zm0-240v-80h480v80H360Zm0-240v-80h480v80H360Z"/></svg>
            `],
            [Scribe.List.Unordered, `
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="${currentColor}"><path d="M360-200v-80h480v80H360Zm0-240v-80h480v80H360Zm0-240v-80h480v80H360ZM200-160q-33 0-56.5-23.5T120-240q0-33 23.5-56.5T200-320q33 0 56.5 23.5T280-240q0 33-23.5 56.5T200-160Zm0-240q-33 0-56.5-23.5T120-480q0-33 23.5-56.5T200-560q33 0 56.5 23.5T280-480q0 33-23.5 56.5T200-400Zm-56.5-263.5Q120-687 120-720t23.5-56.5Q167-800 200-800t56.5 23.5Q280-753 280-720t-23.5 56.5Q233-640 200-640t-56.5-23.5Z"/></svg>
            `]
        ]);

        const formats = this.config.toolbar === true
            ? [...options.keys()]
            : this.config.toolbar.options ?? [...options.keys()];

        if (!Array.isArray(formats)) {
            throw new Error('Scribe toolbar.format must be an array.');
        }

        if (formats.some(format => !options.has(format))) {
            throw new Error('Scribe received an unsupported toolbar format.');
        }

        if (!formats.length) {
            return;
        }

        this.toolbar = document.createElement('div');
        this.toolbar.className = 'scribe-toolbar';
        this.toolbar.setAttribute('role', 'group');
        this.toolbar.setAttribute('aria-label', 'Text formatting');

        for (const format of new Set(formats)) {
            const button = document.createElement('button');

            button.type = 'button';
            button.dataset.format = format;
            // button.textContent = options.get(format);

            const label = options.get(format);
            const icon = icons.get(format);

            button.setAttribute('aria-label', label);

            if (icon) {
                button.innerHTML = icon;
            } else {
                button.textContent = label;
            }
            
            button.title = format === Scribe.Indent
                ? 'Toggle indentation'
                : options.get(format);

            // Keep the editor selection when clicking a button.
            button.addEventListener('mousedown', event => {
                if (event.button === 0) {
                    event.preventDefault();
                }
            });

            button.addEventListener('click', () => this.format(format));

            this.toolbar.append(button);
        }

        this.el.before(this.toolbar);
    }

    updateToolbar() {
        if (!this.toolbar) return;

        const selection = window.getSelection();

        if (!selection?.rangeCount) return;
        if (!this.el.contains(selection.getRangeAt(0).commonAncestorContainer)) return;

        for (const button of this.toolbar.querySelectorAll('[data-format]')) {
            const command = button.dataset.format;

            if (command === Scribe.Clear) continue;

            let active;

            if (command === Scribe.Link) {
                active = Boolean(this.getLink());
            } else if (command === Scribe.Indent) {
                active = this.isIndented();
            } else {
                active = document.queryCommandState(command);
            }

            button.setAttribute('aria-pressed', String(active));
        }
    }

    save() {
        const selection = window.getSelection();

        if (!selection?.rangeCount) return;

        // Ignore selections belonging entirely to another control.
        const anchorInside = this.el.contains(selection.anchorNode);
        const focusInside = this.el.contains(selection.focusNode);

        if (!anchorInside && !focusInside && document.activeElement !== this.el) {
            return;
        }

        const range = selection.getRangeAt(0).cloneRange();

        if (!range.intersectsNode(this.el)) return;

        // Keep the portion inside Scribe when a drag extends outside it.
        const bounds = document.createRange();

        bounds.selectNodeContents(this.el);

        if (range.compareBoundaryPoints(Range.START_TO_START, bounds) < 0) {
            range.setStart(bounds.startContainer, bounds.startOffset);
        }

        if (range.compareBoundaryPoints(Range.END_TO_END, bounds) > 0) {
            range.setEnd(bounds.endContainer, bounds.endOffset);
        }

        this.range = range;

        this.updateToolbar();
    }

    restore() {
        // Clone before focusing: focus can change the live selection.
        let range = this.range?.cloneRange();

        if (!range || !this.el.contains(range.startContainer) || !this.el.contains(range.endContainer)) {
            range = document.createRange();
            range.selectNodeContents(this.el);
            range.collapse(false);
        }

        this.el.focus({ preventScroll: true });

        const selection = window.getSelection();

        selection.removeAllRanges();
        selection.addRange(range);

        this.range = range.cloneRange();
    }

    format(command) {
        if (command === Scribe.Link) {
            this.editLink();
            return;
        }

        this.save();
        this.restore();

        const selection = window.getSelection();
        const global = selection.isCollapsed && (
            command === Scribe.Bold ||
            command === Scribe.Italic ||
            command === Scribe.Clear
        );
        const caret = global ? selection.getRangeAt(0).cloneRange() : null;

        if (global) {
            const range = document.createRange();

            range.selectNodeContents(this.el);
            selection.removeAllRanges();
            selection.addRange(range);
        }

        if (command === Scribe.Clear) {
            const unordered = document.queryCommandState('insertUnorderedList');
            const ordered = document.queryCommandState('insertOrderedList');

            document.execCommand('removeFormat', false, null);
            document.execCommand('unlink', false, null);

            if (unordered) {
                document.execCommand('insertUnorderedList', false, null);
            }

            if (ordered) {
                document.execCommand('insertOrderedList', false, null);
            }

            document.execCommand('outdent', false, null);
        } else {
            if (command === Scribe.Indent) {
                command = this.isIndented() ? 'outdent' : 'indent';
            }

            document.execCommand(command, false, null);
        }

        if (caret) {
            selection.removeAllRanges();
            selection.addRange(caret);
        }

        this.save();
        this.update();
    }

    getLink() {
        const selection = window.getSelection();

        if (!selection?.rangeCount) return null;

        const range = selection.getRangeAt(0);
        const node = range.startContainer;
        const el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
        const link = el?.closest('a');

        if (!link || !this.el.contains(link)) return null;
        if (!link.contains(range.endContainer)) return null;

        return link;
    }

    editLink() {
        this.save();
        this.restore();

        const selection = window.getSelection();
        const range = selection.getRangeAt(0).cloneRange();
        const link = this.getLink();
        const message = link
            ? 'Edit the HTTPS URL. Leave blank to remove the link:'
            : 'Enter a URL using https://:';

        let value = window.prompt(message, link?.getAttribute('href') ?? '');
        let url = null;

        while (value !== null && value.trim()) {
            try {
                if (/[\u0000-\u001f\u007f]/.test(value)) {
                    throw new Error('Invalid URL.');
                }

                url = new URL(value.trim());

                if (url.protocol !== 'https:') {
                    throw new Error('Only HTTPS URLs are allowed.');
                }

                break;
            } catch {
                url = null;
                value = window.prompt('Enter a valid https:// URL:', value);
            }
        }

        // Restore the original selection after the prompt closes.
        this.range = range;
        this.restore();

        if (value === null || (!value.trim() && !link)) {
            this.save();
            return;
        }

        // Editing or removing an existing link affects the entire link.
        if (link) {
            const range = document.createRange();

            range.selectNodeContents(link);
            selection.removeAllRanges();
            selection.addRange(range);
        }

        if (!value.trim()) {
            document.execCommand('unlink', false, null);
        } else if (selection.isCollapsed) {
            // Build and serialize a controlled element; never interpolate raw HTML.
            const anchor = document.createElement('a');

            anchor.href = url.href;
            anchor.target = '_self';
            anchor.textContent = value.trim();

            document.execCommand('insertHTML', false, anchor.outerHTML);
        } else {
            document.execCommand('createLink', false, url.href);

            const range = selection.getRangeAt(0);

            for (const anchor of this.el.querySelectorAll('a')) {
                if (range.intersectsNode(anchor)) {
                    anchor.target = '_self';
                }
            }
        }

        this.save();
        this.update();
    }

    isIndented() {
        const node = this.range.startContainer;
        let el = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;

        // Detect indentation created by the browser inside this editor.
        while (el && el !== this.el) {
            if (el.matches('blockquote')) {
                return true;
            }

            if (parseFloat(el.style.marginLeft) > 0 || parseFloat(el.style.marginInlineStart) > 0) {
                return true;
            }

            if (el.matches('ul, ol')) {
                const parent = el.parentElement.closest('ul, ol');

                if (parent && this.el.contains(parent)) {
                    return true;
                }
            }

            el = el.parentElement;
        }

        return false;
    }

    update() {
        const text = this.el.textContent.trim();
        const media = this.el.querySelector('img, video, audio, iframe, svg, canvas, hr, table');

        this.el.dataset.empty = String(!text && !media);
    }

    destroy() {
        document.removeEventListener('selectionchange', this.onSelectionChange);

        this.toolbar?.remove();
        this.el.removeAttribute('contenteditable');
        this.el.classList.remove('scribe');
        this.range = null;
    }
}