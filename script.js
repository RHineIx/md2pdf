// Default demo text (Arabic + code examples)
const DEFAULT_TEXT = `# 👋 مرحباً بك في "استوديو المستندات"

هذا المحرر المتطور يتيح لك كتابة التقارير، البحوث، والمقالات بتنسيق **Markdown** وتحويلها إلى ملفات **PDF** احترافية وجاهزة للطباعة فوراً.

## 🚀 مميزات هذا الإصدار (v3.0)
1. **تحكم كامل:** اضغط على أيقونة الإعدادات (⚙️) في الأعلى لتغيير **الهوامش**، **حجم الخط**، و **تباعد الأسطر** مع معاينة حية.
2. **تلوين الكود:** كتل الأكواد لـ JavaScript و Python وغيرها تظهر الآن بتلوين نحوي احترافي.
3. **شريط أدوات Markdown:** أزرار سريعة لعريض، مائل، عناوين، قوائم، كتل كود، و فاصل صفحات.
4. **حفظ تلقائي:** لا تقلق على عملك؛ يتم حفظ النص والإعدادات في المتصفح تلقائياً.
5. **دعم لغات أفضل:** يتم ضبط اتجاه الفقرات الإنجليزية واللاتينية تلقائياً إلى اليسار مع الحفاظ على العربية يميناً.

---

## 📝 مثال سريع على الأكواد

\`\`\`javascript
// JavaScript example (colored)
function welcomeUser(name) {
    console.log(\`Welcome, \${name}!\`);
}
welcomeUser("Markdown Studio Pro");
\`\`\`

\`\`\`python
# Python example (colored)
def add(a, b):
    return a + b

print(add(2, 3))
\`\`\`

يمكنك تجربة لغات أخرى مثل HTML و CSS أيضاً:

\`\`\`html
<!-- Simple HTML snippet -->
<h1>Hello Markdown Studio</h1>
<p>This is a paragraph in English.</p>
\`\`\`

---

## 📄 فاصل صفحات يدوي

اكتب في سطر منفصل الكود التالي لإجبار المحتوى على الانتقال إلى صفحة جديدة عند الطباعة:

\`---page---\`

مثال:

السطر الأخير في الصفحة الأولى.

---page---

# الصفحة الثانية 📄
هذه الصفحة بدأت هنا يدوياً.

تابع الكتابة هنا كما تشاء...
`;

// UI object to manage DOM and state
const UI = {
    // Main elements
    editor: document.getElementById('markdown-input'),
    preview: document.getElementById('preview-container'),

    // Tabs
    tabEditor: document.getElementById('tab-editor'),
    tabPreview: document.getElementById('tab-preview'),

    // Header buttons
    btnDir: document.getElementById('btn-direction'),
    iconDir: document.getElementById('icon-direction'),
    btnSettings: document.getElementById('btn-settings'),

    // Editor tools
    btnPaste: document.getElementById('btn-paste'),
    btnClear: document.getElementById('btn-clear'),
    toolbarButtons: document.querySelectorAll('.md-toolbar-btn'),

    // Settings modal
    modal: document.getElementById('settings-modal'),
    modalContent: document.getElementById('modal-content'),
    btnCloseSettings: document.getElementById('btn-close-settings'),
    btnSaveSettings: document.getElementById('btn-save-settings'),

    // Settings controls
    btnsMargin: document.querySelectorAll('.setting-btn-margin'),
    rangeFontSize: document.getElementById('range-font-size'),
    fontSizeDisplay: document.getElementById('font-size-display'),
    btnsLine: document.querySelectorAll('.setting-btn-line'),

    // Preview helpers
    printStyle: document.getElementById('dynamic-print-style'),
    miniPreview: document.getElementById('mini-preview-box'),

    // Internal state
    state: {
        margin: '20mm',
        previewPadding: '20px',
        fontSize: '12',
        lineHeight: '1.7',
        baseDir: 'rtl', // base direction for preview container
        storageKeyContent: 'markdown-studio-content-v3',
        storageKeySettings: 'markdown-studio-settings-v1'
    },

    // Initialize editor
    init() {
        // Configure marked options (syntax highlighting)
        this.configureMarked();

        // Load settings from localStorage if available
        this.loadSettings();

        // Load content from localStorage or use default text
        this.loadContent();

        // Initial render & styles
        this.render();
        this.updatePrintStyle();
        this.applySettingsButtonsState();

        // Register events
        this.events();
    },

    // Configure marked.js with highlight.js
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
                    } catch (e) {
                        // Fallback: return code as-is if highlighting fails
                        return code;
                    }
                    return code;
                }
            });
        }
    },

    // Render Markdown to HTML
    render() {
        let text = this.editor.value || '';

        // Replace manual page break markers with divs
        text = text.replace(/^---page---$/gm, '<div class="page-break"></div>');

        // Parse markdown to HTML
        this.preview.innerHTML = (typeof marked !== 'undefined')
            ? marked.parse(text)
            : text;

        // Ensure base direction
        this.preview.setAttribute('dir', this.state.baseDir);

        // Adjust block directions for Arabic / Latin
        this.adjustBlockDirections();

        // Apply syntax highlighting again (in case library is loaded after)
        if (window.hljs) {
            this.preview.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightElement(block);
            });
        }
    },

    // Auto-detect language and set direction for headings, paragraphs, list items
    adjustBlockDirections() {
        const arabicRegex = /[\u0600-\u06FF]/;
        const latinRegex = /[A-Za-z]/;

        const elements = this.preview.querySelectorAll(
            'p, li, h1, h2, h3, h4, h5, h6'
        );

        elements.forEach(el => {
            const text = el.innerText || el.textContent || '';
            const hasArabic = arabicRegex.test(text);
            const hasLatin = latinRegex.test(text);

            // Reset any previous custom direction
            el.removeAttribute('dir');
            el.classList.remove('ltr-block');

            if (hasArabic && !hasLatin) {
                // Pure Arabic: follow RTL
                el.setAttribute('dir', 'rtl');
            } else if (hasLatin && !hasArabic) {
                // Pure Latin / English: enforce LTR with helper class
                el.setAttribute('dir', 'ltr');
                el.classList.add('ltr-block');
            } else {
                // Mixed: leave it to base container direction
            }
        });
    },

    // Update print style and mini preview according to settings
    updatePrintStyle() {
        this.printStyle.innerHTML = `
            @page { size: A4; margin: ${this.state.margin}; }
            .a4-sheet { padding: ${this.state.margin}; }
            :root {
                --doc-font-size: ${this.state.fontSize}pt;
                --doc-line-height: ${this.state.lineHeight};
            }
        `;

        if (this.miniPreview) {
            this.miniPreview.style.fontSize = `${this.state.fontSize}pt`;
            this.miniPreview.style.lineHeight = this.state.lineHeight;
            this.miniPreview.style.padding = this.state.previewPadding;
        }
        if (this.fontSizeDisplay) {
            this.fontSizeDisplay.textContent = `${this.state.fontSize}pt`;
        }

        // Persist settings
        this.saveSettings();
    },

    // Event listeners
    events() {
        // Editor input: render + save
        this.editor.addEventListener('input', () => {
            this.render();
            this.saveContent();
        });

        // Tabs (mobile)
        this.tabEditor.addEventListener('click', () => {
            document.body.classList.remove('mobile-show-preview');
            this.updateTabStyles(true);
        });
        this.tabPreview.addEventListener('click', () => {
            document.body.classList.add('mobile-show-preview');
            this.updateTabStyles(false);
        });

        // Direction toggle button
        this.btnDir.addEventListener('click', () => {
            const newDir = this.state.baseDir === 'rtl' ? 'ltr' : 'rtl';
            this.state.baseDir = newDir;
            this.preview.setAttribute('dir', newDir);
            this.iconDir.textContent = newDir === 'ltr'
                ? 'format_textdirection_l_to_r'
                : 'format_textdirection_r_to_l';
            // Re-run direction adjustments
            this.adjustBlockDirections();
            this.saveSettings();
        });

        // Paste button
        if (this.btnPaste) {
            this.btnPaste.addEventListener('click', async () => {
                try {
                    const text = await navigator.clipboard.readText();
                    const start = this.editor.selectionStart;
                    const end = this.editor.selectionEnd;
                    const current = this.editor.value;
                    this.editor.value = current.substring(0, start) + text + current.substring(end);
                    this.editor.selectionStart = this.editor.selectionEnd = start + text.length;
                    this.editor.focus();
                    this.render();
                    this.saveContent();
                } catch (err) {
                    alert('يرجى السماح بالوصول للحافظة من إعدادات المتصفح.');
                }
            });
        }

        // Clear button
        if (this.btnClear) {
            this.btnClear.addEventListener('click', () => {
                if (this.editor.value && confirm('مسح كل المحتوى الحالي؟')) {
                    this.editor.value = '';
                    this.render();
                    this.saveContent();
                }
            });
        }

        // Markdown toolbar buttons
        if (this.toolbarButtons) {
            this.toolbarButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    const action = btn.dataset.action;
                    if (!action) return;
                    this.applyMarkdownAction(action);
                });
            });
        }

        // Settings modal open
        this.btnSettings.addEventListener('click', () => {
            this.modal.classList.remove('hidden');
            this.modal.classList.add('flex');
            this.applySettingsButtonsState();
            this.updatePrintStyle();

            // Animate in
            requestAnimationFrame(() => {
                this.modal.classList.remove('opacity-0');
                this.modalContent.classList.remove('scale-95');
                this.modalContent.classList.add('scale-100');
            });
        });

        // Settings modal close helpers
        const closeSettings = () => {
            this.modal.classList.add('opacity-0');
            this.modalContent.classList.remove('scale-100');
            this.modalContent.classList.add('scale-95');
            setTimeout(() => {
                this.modal.classList.remove('flex');
                this.modal.classList.add('hidden');
            }, 200);
        };

        this.btnCloseSettings.addEventListener('click', closeSettings);
        this.btnSaveSettings.addEventListener('click', closeSettings);

        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) closeSettings();
        });

        // Margin buttons
        this.btnsMargin.forEach(btn => {
            btn.addEventListener('click', () => {
                this.btnsMargin.forEach(b => {
                    b.className = "setting-btn-margin border-2 rounded-lg py-2 text-sm font-medium hover:bg-indigo-50 hover:border-indigo-200 transition";
                });
                btn.className = "setting-btn-margin border-2 border-indigo-600 bg-indigo-50 text-indigo-700 rounded-lg py-2 text-sm font-bold transition";

                this.state.margin = btn.dataset.val;
                this.state.previewPadding = btn.dataset.previewPadding;
                this.updatePrintStyle();
            });
        });

        // Font size slider
        this.rangeFontSize.addEventListener('input', (e) => {
            this.state.fontSize = e.target.value;
            this.updatePrintStyle();
        });

        // Line height buttons
        this.btnsLine.forEach(btn => {
            btn.addEventListener('click', () => {
                this.btnsLine.forEach(b => {
                    b.className = "setting-btn-line flex-1 py-1.5 text-sm rounded-md transition hover:bg-gray-200";
                });
                btn.className = "setting-btn-line flex-1 py-1.5 text-sm bg-white shadow-sm font-bold text-indigo-700 rounded-md transition";

                this.state.lineHeight = btn.dataset.val;
                this.updatePrintStyle();
            });
        });
    },

    // Apply active styles for settings buttons based on current state
    applySettingsButtonsState() {
        // Margin buttons
        this.btnsMargin.forEach(btn => {
            const isActive = btn.dataset.val === this.state.margin;
            btn.className = isActive
                ? "setting-btn-margin border-2 border-indigo-600 bg-indigo-50 text-indigo-700 rounded-lg py-2 text-sm font-bold transition"
                : "setting-btn-margin border-2 rounded-lg py-2 text-sm font-medium hover:bg-indigo-50 hover:border-indigo-200 transition";
        });

        // Line-height buttons
        this.btnsLine.forEach(btn => {
            const isActive = btn.dataset.val === this.state.lineHeight;
            btn.className = isActive
                ? "setting-btn-line flex-1 py-1.5 text-sm bg-white shadow-sm font-bold text-indigo-700 rounded-md transition"
                : "setting-btn-line flex-1 py-1.5 text-sm rounded-md transition hover:bg-gray-200";
        });

        // Font size slider
        if (this.rangeFontSize) {
            this.rangeFontSize.value = this.state.fontSize;
        }
        if (this.fontSizeDisplay) {
            this.fontSizeDisplay.textContent = `${this.state.fontSize}pt`;
        }
    },

    // Update tab UI
    updateTabStyles(isEditor) {
        if (isEditor) {
            this.tabEditor.className = "px-3 py-1 text-xs font-bold shadow-sm bg-white text-slate-800 rounded-md transition-all";
            this.tabPreview.className = "px-3 py-1 text-xs font-bold text-slate-500 hover:text-slate-700 transition-all";
        } else {
            this.tabPreview.className = "px-3 py-1 text-xs font-bold shadow-sm bg-white text-slate-800 rounded-md transition-all";
            this.tabEditor.className = "px-3 py-1 text-xs font-bold text-slate-500 hover:text-slate-700 transition-all";
        }
    },

    // Apply markdown formatting from toolbar
    applyMarkdownAction(action) {
        const textarea = this.editor;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const value = textarea.value;
        const selected = value.slice(start, end);

        // Helper to replace selection and keep caret
        const replaceSelection = (before, after, newText) => {
            const textBefore = value.slice(0, start);
            const textAfter = value.slice(end);
            const finalText = textBefore + before + (newText !== undefined ? newText : selected) + after + textAfter;
            const cursorPos = textBefore.length + before.length + (newText !== undefined ? newText.length : selected.length);
            textarea.value = finalText;
            textarea.focus();
            textarea.selectionStart = textarea.selectionEnd = cursorPos;
            this.render();
            this.saveContent();
        };

        switch (action) {
            case 'bold':
                replaceSelection('**', '**');
                break;

            case 'italic':
                replaceSelection('*', '*');
                break;

            case 'inline-code':
                replaceSelection('`', '`');
                break;

            case 'h2': {
                // Apply "## " at beginning of the current line
                const lineStart = value.lastIndexOf('\n', start - 1) + 1;
                const textBefore = value.slice(0, lineStart);
                const line = value.slice(lineStart, end);
                const textAfter = value.slice(end);
                const prefix = line.startsWith('## ') ? '' : '## ';
                const newLine = prefix + line;
                const finalText = textBefore + newLine + textAfter;
                textarea.value = finalText;
                const newCursor = lineStart + newLine.length;
                textarea.focus();
                textarea.selectionStart = textarea.selectionEnd = newCursor;
                this.render();
                this.saveContent();
                break;
            }

            case 'ul': {
                // Bullet list
                const lines = selected || 'عنصر قائمة';
                const processed = lines
                    .split('\n')
                    .map(l => l.trim() ? `- ${l.trim()}` : '')
                    .join('\n');
                replaceSelection('', '', processed);
                break;
            }

            case 'ol': {
                // Numbered list
                const lines = (selected || 'عنصر قائمة')
                    .split('\n')
                    .filter(l => l.trim().length > 0);
                const processed = lines
                    .map((l, idx) => `${idx + 1}. ${l.trim()}`)
                    .join('\n');
                replaceSelection('', '', processed);
                break;
            }

            case 'code-block': {
                const content = selected || '// اكتب الكود هنا';
                const block = `\n\`\`\`javascript\n${content}\n\`\`\`\n`;
                replaceSelection('', '', block);
                break;
            }

            case 'pagebreak': {
                const marker = '\n---page---\n';
                replaceSelection('', '', marker);
                break;
            }

            default:
                break;
        }
    },

    // Save content to localStorage
    saveContent() {
        try {
            localStorage.setItem(this.state.storageKeyContent, this.editor.value);
        } catch (e) {
            // Ignore storage errors
        }
    },

    // Load content from localStorage or default
    loadContent() {
        try {
            const saved = localStorage.getItem(this.state.storageKeyContent);
            if (saved && typeof saved === 'string' && saved.trim().length > 0) {
                this.editor.value = saved;
            } else {
                this.editor.value = DEFAULT_TEXT;
            }
        } catch (e) {
            this.editor.value = DEFAULT_TEXT;
        }
    },

    // Save settings to localStorage
    saveSettings() {
        try {
            const data = {
                margin: this.state.margin,
                previewPadding: this.state.previewPadding,
                fontSize: this.state.fontSize,
                lineHeight: this.state.lineHeight,
                baseDir: this.state.baseDir
            };
            localStorage.setItem(this.state.storageKeySettings, JSON.stringify(data));
        } catch (e) {
            // Ignore storage errors
        }
    },

    // Load settings from localStorage
    loadSettings() {
        try {
            const raw = localStorage.getItem(this.state.storageKeySettings);
            if (!raw) return;
            const data = JSON.parse(raw);
            if (!data) return;

            if (data.margin) this.state.margin = data.margin;
            if (data.previewPadding) this.state.previewPadding = data.previewPadding;
            if (data.fontSize) this.state.fontSize = String(data.fontSize);
            if (data.lineHeight) this.state.lineHeight = String(data.lineHeight);
            if (data.baseDir) this.state.baseDir = data.baseDir;
        } catch (e) {
            // Ignore parse errors
        }
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    UI.init();
});