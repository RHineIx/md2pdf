// Utility: Debounce function to improve performance
const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

const UI = {
    editor: document.getElementById('markdown-input'),
    preview: document.getElementById('preview-container'),
    
    // Tabs
    tabEditor: document.getElementById('tab-editor'),
    tabPreview: document.getElementById('tab-preview'),
    
    // Header
    btnDir: document.getElementById('btn-direction'),
    iconDir: document.getElementById('icon-direction'),
    btnSettings: document.getElementById('btn-settings'),
    
    // Editor Actions
    btnPaste: document.getElementById('btn-paste'),
    btnClear: document.getElementById('btn-clear'),
    toolbarButtons: document.querySelectorAll('.md-toolbar-btn'),
    btnUpload: document.getElementById('btn-upload'),
    fileInput: document.getElementById('file-upload'),
    
    // Settings
    modal: document.getElementById('settings-modal'),
    modalContent: document.getElementById('modal-content'),
    btnCloseSettings: document.getElementById('btn-close-settings'),
    btnSaveSettings: document.getElementById('btn-save-settings'),
    btnsLine: document.querySelectorAll('.setting-btn-line'),
    printStyle: document.getElementById('dynamic-print-style'),
    
    // Settings Inputs
    inputFontSize: document.getElementById('input-font-size'),
    marginTop: document.getElementById('margin-top'),
    marginBottom: document.getElementById('margin-bottom'),
    marginRight: document.getElementById('margin-right'),
    marginLeft: document.getElementById('margin-left'),

    state: {
        mT: 20, mB: 20, mR: 20, mL: 20,
        fontSize: 12,
        lineHeight: 1.7,
        baseDir: 'rtl',
        storageKeyContent: 'markdown-studio-content-v3',
        storageKeySettings: 'markdown-studio-settings-v2'
    },

    init() {
        this.configureMarked();
        this.loadSettings();
        this.updatePrintStyle();
        this.applySettingsButtonsState();
        this.loadContent();
        this.events();
    },

    configureMarked() {
        if (typeof marked !== 'undefined') {
            marked.setOptions({
                breaks: true,
                gfm: true,
                highlight: function (code, lang) {
                    try {
                        if (window.hljs) {
                            if (lang && hljs.getLanguage(lang)) {
                                return hljs.highlight(code, { language: lang }).value;
                            }
                            return hljs.highlightAuto(code).value;
                        }
                    } catch (e) { return code; }
                    return code;
                }
            });
        }
    },

    // Rendering Logic with Security (DOMPurify)
    render() {
        let text = this.editor.value || '';
        
        // Handle page breaks
        text = text.replace(/^---page---$/gm, '<div class="page-break"></div>');
        
        // Convert to HTML
        let rawHtml = (typeof marked !== 'undefined') ? marked.parse(text) : text;
        
        // Sanitize (Security Fix)
        if (typeof DOMPurify !== 'undefined') {
            rawHtml = DOMPurify.sanitize(rawHtml);
        }

        this.preview.innerHTML = rawHtml;
        this.preview.setAttribute('dir', this.state.baseDir);
        this.adjustBlockDirections();
        
        // Syntax Highlight
        if (window.hljs) {
            this.preview.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightElement(block);
            });
        }
    },

    adjustBlockDirections() {
        const arabicRegex = /[\u0600-\u06FF]/;
        const latinRegex = /[A-Za-z]/;
        const elements = this.preview.querySelectorAll('p, li, h1, h2, h3, h4, h5, h6');
        
        elements.forEach(el => {
            const text = el.innerText || el.textContent || '';
            const hasArabic = arabicRegex.test(text);
            const hasLatin = latinRegex.test(text);
            
            el.removeAttribute('dir');
            el.classList.remove('ltr-block');
            
            if (hasArabic && !hasLatin) {
                el.setAttribute('dir', 'rtl');
            } else if (hasLatin && !hasArabic) {
                el.setAttribute('dir', 'ltr');
                el.classList.add('ltr-block');
            }
        });
    },

    updatePrintStyle() {
        this.printStyle.innerHTML = `
            @page { 
                size: A4; 
                margin-top: ${this.state.mT}mm;
                margin-bottom: ${this.state.mB}mm;
                margin-left: ${this.state.mL}mm;
                margin-right: ${this.state.mR}mm;
            }
            .a4-sheet { 
                padding-top: ${this.state.mT}mm;
                padding-bottom: ${this.state.mB}mm;
                padding-left: ${this.state.mL}mm;
                padding-right: ${this.state.mR}mm;
            }
            :root {
                --doc-font-size: ${this.state.fontSize}pt;
                --doc-line-height: ${this.state.lineHeight};
            }
        `;
        if(this.inputFontSize) this.inputFontSize.value = this.state.fontSize;
        this.saveSettings();
    },

    events() {
        // Debounced Render for performance
        const debouncedRender = debounce(() => {
            this.render();
            this.saveContent();
        }, 300); // Wait 300ms after last keystroke

        this.editor.addEventListener('input', debouncedRender);

        // UI Events
        this.tabEditor.addEventListener('click', () => {
            document.body.classList.remove('mobile-show-preview');
            this.updateTabStyles(true);
        });
        this.tabPreview.addEventListener('click', () => {
            document.body.classList.add('mobile-show-preview');
            this.updateTabStyles(false);
        });

        // Direction Toggle
        this.btnDir.addEventListener('click', () => {
            this.state.baseDir = this.state.baseDir === 'rtl' ? 'ltr' : 'rtl';
            this.preview.setAttribute('dir', this.state.baseDir);
            this.iconDir.textContent = this.state.baseDir === 'ltr' ? 'format_textdirection_l_to_r' : 'format_textdirection_r_to_l';
            this.adjustBlockDirections();
            this.saveSettings();
        });

        // File Upload
        if (this.btnUpload && this.fileInput) {
            this.btnUpload.addEventListener('click', () => this.fileInput.click());
            this.fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (e) => {
                    const content = e.target.result;
                    const start = this.editor.selectionStart;
                    const end = this.editor.selectionEnd;
                    const val = this.editor.value;
                    
                    if (typeof start === 'number' && typeof end === 'number') {
                         this.editor.value = val.substring(0, start) + content + val.substring(end);
                         this.editor.selectionStart = this.editor.selectionEnd = start + content.length;
                    } else {
                        this.editor.value += content;
                    }
                    this.editor.focus();
                    this.render(); 
                    this.saveContent();
                    this.fileInput.value = '';
                };
                reader.readAsText(file);
            });
        }

        // Paste
        if (this.btnPaste) {
            this.btnPaste.addEventListener('click', async () => {
                try {
                    const text = await navigator.clipboard.readText();
                    const start = this.editor.selectionStart;
                    const end = this.editor.selectionEnd;
                    const val = this.editor.value;
                    this.editor.value = val.substring(0, start) + text + val.substring(end);
                    this.editor.selectionStart = this.editor.selectionEnd = start + text.length;
                    this.editor.focus();
                    this.render();
                    this.saveContent();
                } catch (err) { alert('Clipboard access denied'); }
            });
        }

        // Clear
        if (this.btnClear) {
            this.btnClear.addEventListener('click', () => {
                if (this.editor.value && confirm('مسح كل المحتوى؟')) {
                    this.editor.value = '';
                    this.render();
                    this.saveContent();
                }
            });
        }

        // Toolbar
        if (this.toolbarButtons) {
            this.toolbarButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    const action = btn.dataset.action;
                    if (action) this.applyMarkdownAction(action);
                });
            });
        }

        // Modal Logic
        const openSettings = () => {
            this.modal.classList.remove('hidden');
            this.modal.classList.add('flex');
            this.applySettingsButtonsState();
            requestAnimationFrame(() => {
                this.modal.classList.remove('opacity-0');
                this.modalContent.classList.remove('scale-95');
                this.modalContent.classList.add('scale-100');
            });
        };
        const closeSettings = () => {
            this.modal.classList.add('opacity-0');
            this.modalContent.classList.remove('scale-100');
            this.modalContent.classList.add('scale-95');
            setTimeout(() => {
                this.modal.classList.remove('flex');
                this.modal.classList.add('hidden');
            }, 200);
        };

        this.btnSettings.addEventListener('click', openSettings);
        this.btnCloseSettings.addEventListener('click', closeSettings);
        this.btnSaveSettings.addEventListener('click', closeSettings);
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) closeSettings();
        });

        // Settings Inputs
        const marginInputs = [
            { el: this.marginTop, key: 'mT' },
            { el: this.marginBottom, key: 'mB' },
            { el: this.marginLeft, key: 'mL' },
            { el: this.marginRight, key: 'mR' }
        ];
        marginInputs.forEach(item => {
            item.el.addEventListener('input', (e) => {
                this.state[item.key] = e.target.value;
                this.updatePrintStyle();
            });
        });

        this.inputFontSize.addEventListener('input', (e) => {
            this.state.fontSize = e.target.value;
            this.updatePrintStyle();
        });

        this.btnsLine.forEach(btn => {
            btn.addEventListener('click', () => {
                this.state.lineHeight = btn.dataset.val;
                this.updatePrintStyle();
                this.applySettingsButtonsState();
            });
        });
    },

    applySettingsButtonsState() {
        if(this.marginTop) this.marginTop.value = this.state.mT;
        if(this.marginBottom) this.marginBottom.value = this.state.mB;
        if(this.marginLeft) this.marginLeft.value = this.state.mL;
        if(this.marginRight) this.marginRight.value = this.state.mR;
        if(this.inputFontSize) this.inputFontSize.value = this.state.fontSize;

        this.btnsLine.forEach(btn => {
            const isActive = String(btn.dataset.val) === String(this.state.lineHeight);
            btn.className = isActive
                ? "setting-btn-line flex-1 py-1.5 text-sm bg-white shadow-sm font-bold text-indigo-700 rounded-md transition border border-indigo-100"
                : "setting-btn-line flex-1 py-1.5 text-sm rounded-md transition hover:bg-gray-200 text-gray-600";
        });
    },

    updateTabStyles(isEditor) {
        const activeClass = "px-3 py-1 text-xs font-bold shadow-sm bg-white text-slate-800 rounded-md transition-all";
        const inactiveClass = "px-3 py-1 text-xs font-bold text-slate-500 hover:text-slate-700 transition-all";
        
        this.tabEditor.className = isEditor ? activeClass : inactiveClass;
        this.tabPreview.className = !isEditor ? activeClass : inactiveClass;
    },

    applyMarkdownAction(action) {
        const textarea = this.editor;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const val = textarea.value;
        const sel = val.slice(start, end);

        const replace = (str) => {
            const newVal = val.slice(0, start) + str + val.slice(end);
            textarea.value = newVal;
            textarea.focus();
            const newCursor = start + str.length;
            textarea.selectionStart = textarea.selectionEnd = newCursor;
            this.render();
            this.saveContent();
        };
        
        // Complex replace keeping selection
        const wrap = (prefix, suffix, defaultText) => {
            const text = sel || defaultText || '';
            const insertion = prefix + text + suffix;
            textarea.value = val.slice(0, start) + insertion + val.slice(end);
            textarea.focus();
            if (sel) {
                // Keep selection highlighted
                textarea.selectionStart = start + prefix.length;
                textarea.selectionEnd = start + prefix.length + text.length;
            } else {
                // Cursor after insertion
                textarea.selectionStart = textarea.selectionEnd = start + insertion.length;
            }
            this.render();
            this.saveContent();
        };

        switch (action) {
            case 'bold': wrap('**', '**', 'نص عريض'); break;
            case 'italic': wrap('*', '*', 'نص مائل'); break;
            case 'inline-code': wrap('`', '`', 'كود'); break;
            case 'h2': 
                // Always start of line logic for headers
                const lineStart = val.lastIndexOf('\n', start - 1) + 1;
                const lineEnd = val.indexOf('\n', end);
                const actualEnd = lineEnd === -1 ? val.length : lineEnd;
                const line = val.slice(lineStart, actualEnd);
                const newLine = line.startsWith('## ') ? line.substring(3) : '## ' + line;
                textarea.value = val.substring(0, lineStart) + newLine + val.substring(actualEnd);
                textarea.focus();
                this.render();
                this.saveContent();
                break;
            case 'ul': wrap('\n- ', '', 'عنصر'); break;
            case 'ol': wrap('\n1. ', '', 'عنصر'); break;
            case 'code-block': wrap('\n```javascript\n', '\n```\n', '// code'); break;
            case 'pagebreak': wrap('\n---page---\n', '', ''); break;
        }
    },

    saveContent() {
        try { localStorage.setItem(this.state.storageKeyContent, this.editor.value); } catch (e) {}
    },

    async loadContent() {
        try {
            const saved = localStorage.getItem(this.state.storageKeyContent);
            if (saved && typeof saved === 'string' && saved.trim().length > 0) {
                this.editor.value = saved;
                this.render();
            } else {
                try {
                    const res = await fetch('default.md');
                    if (!res.ok) throw new Error();
                    this.editor.value = await res.text();
                } catch (err) { this.editor.value = '# Welcome'; }
                this.render();
            }
        } catch (e) { this.render(); }
    },

    saveSettings() {
        try {
            const { mT, mB, mL, mR, fontSize, lineHeight, baseDir } = this.state;
            localStorage.setItem(this.state.storageKeySettings, JSON.stringify({ mT, mB, mL, mR, fontSize, lineHeight, baseDir }));
        } catch (e) {}
    },

    loadSettings() {
        try {
            const raw = localStorage.getItem(this.state.storageKeySettings);
            if (!raw) return;
            const d = JSON.parse(raw);
            if (d.mT) Object.assign(this.state, d);
        } catch (e) {}
    }
};

document.addEventListener('DOMContentLoaded', () => UI.init());


