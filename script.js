/**
 * Utility: Debounce function to improve performance
 */
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

/**
 * StorageManager: Handles local storage operations securely.
 */
class StorageManager {
    static CONTENT_KEY = 'markdown-studio-content-v4';
    static SETTINGS_KEY = 'markdown-studio-settings-v5'; // Bumped version for new schema

    static saveContent(content) {
        try { localStorage.setItem(this.CONTENT_KEY, content); } catch (e) { console.error("Storage limit reached"); }
    }

    static loadContent() {
        try { return localStorage.getItem(this.CONTENT_KEY); } catch (e) { return null; }
    }

    static saveSettings(settings) {
        try { localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings)); } catch (e) {}
    }

    static loadSettings(defaultSettings) {
        try {
            const raw = localStorage.getItem(this.SETTINGS_KEY);
            return raw ? { ...defaultSettings, ...JSON.parse(raw) } : defaultSettings;
        } catch (e) {
            return defaultSettings;
        }
    }
}

/**
 * MarkdownEngine: Handles Markdown parsing and sanitization.
 */
class MarkdownEngine {
    static init() {
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
    }

    static process(text) {
        let processedText = text || '';
        processedText = processedText.replace(/^---page---$/gm, '<div class="page-break"></div>');
        
        let rawHtml = (typeof marked !== 'undefined') ? marked.parse(processedText) : processedText;
        
        if (typeof DOMPurify !== 'undefined') {
            rawHtml = DOMPurify.sanitize(rawHtml);
        }
        return rawHtml;
    }
}

/**
 * DocumentFormatter: Handles RTL/LTR logic and layout adjustments.
 */
class DocumentFormatter {
    static isRTL(text) {
        const rtlChars = '\u0591-\u07FF\u200F\u202B\u202E\u4E00-\u9FFF\uFB1D-\uFDFD\uFE70-\uFEFC';
        const ltrChars = 'A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02B8\u0300-\u0590\u0800-\u1FFF\u200E\u202A\u202D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFAFF\uFE00-\uFE1F\uFE30-\uFE6F\uFF00-\uFFEF';
        
        const regex = new RegExp(`^[^${ltrChars}${rtlChars}]*([${rtlChars}])`);
        return regex.test(text);
    }

    static adjustBlockDirections(container) {
        const elements = container.querySelectorAll('p, li, h1, h2, h3, h4, h5, h6');
        elements.forEach(el => {
            const text = el.innerText || el.textContent || '';
            if (!text.trim()) return; 

            el.removeAttribute('dir');
            el.classList.remove('ltr-block');
            
            if (this.isRTL(text)) {
                el.setAttribute('dir', 'rtl');
            } else {
                el.setAttribute('dir', 'ltr');
                el.classList.add('ltr-block');
            }
        });
    }

    static updatePrintStyle(styleElement, settings) {
        // Calculate dynamic dimensions based on page size and orientation
        const sizes = {
            'A4': { w: 210, h: 297 },
            'Letter': { w: 215.9, h: 279.4 },
            'Legal': { w: 215.9, h: 355.6 }
        };
        
        let w = sizes[settings.pageSize]?.w || 210;
        let h = sizes[settings.pageSize]?.h || 297;
        
        if (settings.orientation === 'landscape') {
            const temp = w;
            w = h;
            h = temp;
        }

        styleElement.innerHTML = `
            @page { 
                size: ${settings.pageSize} ${settings.orientation}; 
                margin-top: ${settings.mT}mm;
                margin-bottom: ${settings.mB}mm;
                margin-left: ${settings.mL}mm;
                margin-right: ${settings.mR}mm;
            }
            .a4-sheet { 
                padding-top: ${settings.mT}mm;
                padding-bottom: ${settings.mB}mm;
                padding-left: ${settings.mL}mm;
                padding-right: ${settings.mR}mm;
            }
            :root {
                --doc-font-size: ${settings.fontSize}pt;
                --doc-line-height: ${settings.lineHeight};
                --page-width: ${w}mm;
                --page-height: ${h}mm;
                --doc-font-family: ${settings.fontFamily}, sans-serif;
            }
        `;
    }
}

/**
 * AppController: Glues the UI and logic together.
 */
class AppController {
    constructor() {
        this.defaultState = {
            mT: 20, mB: 20, mR: 20, mL: 20,
            fontSize: 12,
            lineHeight: 1.7,
            baseDir: 'rtl',
            marginLock: false,
            pageSize: 'A4',
            orientation: 'portrait',
            fontFamily: "'Cairo'"
        };
        
        this.state = StorageManager.loadSettings(this.defaultState);

        this.cacheDOM();
        this.init();
    }

    cacheDOM() {
        this.editor = document.getElementById('markdown-input');
        this.preview = document.getElementById('preview-container');
        this.printStyle = document.getElementById('dynamic-print-style');
        
        // Settings UI Inputs
        this.inputs = {
            mT: document.getElementById('margin-top'),
            mB: document.getElementById('margin-bottom'),
            mR: document.getElementById('margin-right'),
            mL: document.getElementById('margin-left'),
            fontSize: document.getElementById('input-font-size'),
            pageSize: document.getElementById('input-page-size'),
            orientation: document.getElementById('input-orientation'),
            fontFamily: document.getElementById('input-font-family')
        };
        
        // Settings Buttons & Icons
        this.btnsLine = document.querySelectorAll('.setting-btn-line');
        this.btnLockMargins = document.getElementById('btn-lock-margins');
        this.iconLockMargins = document.getElementById('icon-lock-margins');
        this.textPagePreview = document.getElementById('text-page-preview');
        this.btnResetSettings = document.getElementById('btn-reset-settings');
    }

    async init() {
        MarkdownEngine.init();
        this.applySettingsToUI();
        DocumentFormatter.updatePrintStyle(this.printStyle, this.state);
        await this.loadInitialContent();
        this.bindEvents();
    }

    render() {
        const rawHtml = MarkdownEngine.process(this.editor.value);
        this.preview.innerHTML = rawHtml;
        this.preview.setAttribute('dir', this.state.baseDir);
        
        DocumentFormatter.adjustBlockDirections(this.preview);
        
        if (window.hljs) {
            this.preview.querySelectorAll('pre code').forEach((block) => hljs.highlightElement(block));
        }
    }

    async loadInitialContent() {
        const saved = StorageManager.loadContent();
        if (saved && saved.trim().length > 0) {
            this.editor.value = saved;
            this.render();
        } else {
            try {
                const res = await fetch('default.md');
                this.editor.value = res.ok ? await res.text() : '# Welcome';
            } catch (err) { 
                this.editor.value = '# Welcome'; 
            }
            this.render();
        }
    }

    bindEvents() {
        // Editor Input with Debounce
        const debouncedRender = debounce(() => {
            this.render();
            StorageManager.saveContent(this.editor.value);
        }, 300);
        this.editor.addEventListener('input', debouncedRender);

        // Binding Settings Form Events
        this.bindSettingsEvents();

        this.bindModalsAndTabs();
        this.bindEditorActions();
    }

    bindSettingsEvents() {
        // Margins Binding with Lock Logic
        ['mT', 'mB', 'mR', 'mL'].forEach(key => {
            if (this.inputs[key]) {
                this.inputs[key].addEventListener('input', (e) => {
                    const val = parseFloat(e.target.value) || 0;
                    if (this.state.marginLock) {
                        this.state.mT = this.state.mB = this.state.mR = this.state.mL = val;
                        ['mT', 'mB', 'mR', 'mL'].forEach(k => {
                            if (this.inputs[k]) this.inputs[k].value = val;
                        });
                    } else {
                        this.state[key] = val;
                    }
                    this.updateSettings();
                });
            }
        });

        // Other Dropdowns and Number Inputs
        ['fontSize', 'pageSize', 'orientation', 'fontFamily'].forEach(key => {
            if (this.inputs[key]) {
                this.inputs[key].addEventListener('input', (e) => {
                    this.state[key] = key === 'fontSize' ? (parseFloat(e.target.value) || 0) : e.target.value;
                    this.updateSettings();
                    if (key === 'pageSize') this.applySettingsToUI(); // update mini A4 text
                });
            }
        });

        // Line Height Buttons
        this.btnsLine.forEach(btn => {
            btn.addEventListener('click', () => {
                this.state.lineHeight = btn.dataset.val;
                this.updateSettings();
                this.applySettingsToUI();
            });
        });

        // Lock Margins Button toggle
        this.btnLockMargins?.addEventListener('click', () => {
            this.state.marginLock = !this.state.marginLock;
            
            // If locking, force all to match 'margin-top' immediately
            if(this.state.marginLock) {
                const val = this.state.mT;
                this.state.mB = this.state.mR = this.state.mL = val;
            }
            
            this.applySettingsToUI();
            this.updateSettings();
        });

        // Reset Settings Button
        this.btnResetSettings?.addEventListener('click', () => {
            if(confirm('هل أنت متأكد من استعادة الإعدادات الافتراضية للتنسيق؟')) {
                // Keep the text direction but reset print layout
                const currentDir = this.state.baseDir;
                this.state = { ...this.defaultState, baseDir: currentDir };
                this.applySettingsToUI();
                this.updateSettings();
            }
        });
    }

    updateSettings() {
        DocumentFormatter.updatePrintStyle(this.printStyle, this.state);
        StorageManager.saveSettings(this.state);
    }

    applySettingsToUI() {
        // Update basic inputs
        Object.keys(this.inputs).forEach(key => {
            if(this.inputs[key]) this.inputs[key].value = this.state[key];
        });

        // Update Line Height active state
        this.btnsLine.forEach(btn => {
            const isActive = String(btn.dataset.val) === String(this.state.lineHeight);
            btn.className = isActive
                ? "setting-btn-line flex-1 py-1.5 text-sm bg-white shadow-sm font-bold text-indigo-700 rounded-md transition border border-indigo-100"
                : "setting-btn-line flex-1 py-1.5 text-sm rounded-md transition hover:bg-gray-200 text-gray-600";
        });

        // Update Lock Visuals
        if (this.iconLockMargins) {
            this.iconLockMargins.textContent = this.state.marginLock ? 'link' : 'link_off';
        }
        if (this.btnLockMargins) {
            this.btnLockMargins.classList.toggle('text-indigo-600', this.state.marginLock);
            this.btnLockMargins.classList.toggle('bg-indigo-50', this.state.marginLock);
            this.btnLockMargins.classList.toggle('border-indigo-200', this.state.marginLock);
            
            this.btnLockMargins.classList.toggle('text-gray-400', !this.state.marginLock);
            this.btnLockMargins.classList.toggle('bg-white', !this.state.marginLock);
            this.btnLockMargins.classList.toggle('border-gray-200', !this.state.marginLock);
        }

        // Update Mini Page Size text
        if (this.textPagePreview) {
            this.textPagePreview.textContent = this.state.pageSize;
        }
    }

    bindModalsAndTabs() {
        // Direction toggle
        document.getElementById('btn-direction')?.addEventListener('click', () => {
            this.state.baseDir = this.state.baseDir === 'rtl' ? 'ltr' : 'rtl';
            document.getElementById('icon-direction').textContent = this.state.baseDir === 'ltr' ? 'format_textdirection_l_to_r' : 'format_textdirection_r_to_l';
            this.render();
            this.updateSettings();
        });

        // Tabs
        const updateTabs = (isEditor) => {
            document.getElementById('tab-editor').className = isEditor ? "px-3 py-1 text-xs font-bold shadow-sm bg-white text-slate-800 rounded-md transition-all" : "px-3 py-1 text-xs font-bold text-slate-500 hover:text-slate-700 transition-all";
            document.getElementById('tab-preview').className = !isEditor ? "px-3 py-1 text-xs font-bold shadow-sm bg-white text-slate-800 rounded-md transition-all" : "px-3 py-1 text-xs font-bold text-slate-500 hover:text-slate-700 transition-all";
        };
        document.getElementById('tab-editor')?.addEventListener('click', () => {
            document.body.classList.remove('mobile-show-preview'); updateTabs(true);
        });
        document.getElementById('tab-preview')?.addEventListener('click', () => {
            document.body.classList.add('mobile-show-preview'); updateTabs(false);
        });

        // Settings Modal
        const modal = document.getElementById('settings-modal');
        const modalContent = document.getElementById('modal-content');
        
        const closeSettings = () => {
            modal.classList.add('opacity-0');
            modalContent.classList.remove('scale-100');
            modalContent.classList.add('scale-95');
            setTimeout(() => { modal.classList.remove('flex'); modal.classList.add('hidden'); }, 200);
        };

        document.getElementById('btn-settings')?.addEventListener('click', () => {
            modal.classList.remove('hidden'); modal.classList.add('flex');
            this.applySettingsToUI();
            requestAnimationFrame(() => {
                modal.classList.remove('opacity-0');
                modalContent.classList.remove('scale-95');
                modalContent.classList.add('scale-100');
            });
        });
        
        document.getElementById('btn-close-settings')?.addEventListener('click', closeSettings);
        document.getElementById('btn-save-settings')?.addEventListener('click', closeSettings);
        modal?.addEventListener('click', (e) => { if (e.target === modal) closeSettings(); });
    }

    bindEditorActions() {
        // File Upload
        const fileInput = document.getElementById('file-upload');
        document.getElementById('btn-upload')?.addEventListener('click', () => fileInput?.click());
        fileInput?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (e) => this.insertTextAtCursor(e.target.result);
            reader.readAsText(file);
        });

        // Paste
        document.getElementById('btn-paste')?.addEventListener('click', async () => {
            try { this.insertTextAtCursor(await navigator.clipboard.readText()); } 
            catch (err) { alert('صلاحية الوصول للحافظة مرفوضة'); }
        });

        // Clear
        document.getElementById('btn-clear')?.addEventListener('click', () => {
            if (this.editor.value && confirm('مسح كل المحتوى؟')) {
                this.editor.value = '';
                this.render();
                StorageManager.saveContent('');
            }
        });

        // Formatting Toolbar
        document.querySelectorAll('.md-toolbar-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;
                if (action) this.applyMarkdownFormatting(action);
            });
        });
    }

    insertTextAtCursor(textToInsert) {
        const start = this.editor.selectionStart;
        const end = this.editor.selectionEnd;
        const val = this.editor.value;
        this.editor.value = val.substring(0, start) + textToInsert + val.substring(end);
        this.editor.selectionStart = this.editor.selectionEnd = start + textToInsert.length;
        this.editor.focus();
        this.render(); 
        StorageManager.saveContent(this.editor.value);
    }

    applyMarkdownFormatting(action) {
        const start = this.editor.selectionStart;
        const end = this.editor.selectionEnd;
        const val = this.editor.value;
        const sel = val.slice(start, end);

        const wrap = (prefix, suffix, defaultText) => {
            const text = sel || defaultText || '';
            const insertion = prefix + text + suffix;
            this.editor.value = val.slice(0, start) + insertion + val.slice(end);
            this.editor.focus();
            if (sel) {
                this.editor.selectionStart = start + prefix.length;
                this.editor.selectionEnd = start + prefix.length + text.length;
            } else {
                this.editor.selectionStart = this.editor.selectionEnd = start + insertion.length;
            }
            this.render();
            StorageManager.saveContent(this.editor.value);
        };

        switch (action) {
            case 'bold': wrap('**', '**', 'نص عريض'); break;
            case 'italic': wrap('*', '*', 'نص مائل'); break;
            case 'inline-code': wrap('`', '`', 'كود'); break;
            case 'h2': 
                const lineStart = val.lastIndexOf('\n', start - 1) + 1;
                const lineEnd = val.indexOf('\n', end);
                const actualEnd = lineEnd === -1 ? val.length : lineEnd;
                const line = val.slice(lineStart, actualEnd);
                const newLine = line.startsWith('## ') ? line.substring(3) : '## ' + line;
                this.editor.value = val.substring(0, lineStart) + newLine + val.substring(actualEnd);
                this.editor.focus();
                this.render();
                StorageManager.saveContent(this.editor.value);
                break;
            case 'ul': wrap('\n- ', '', 'عنصر'); break;
            case 'ol': wrap('\n1. ', '', 'عنصر'); break;
            case 'code-block': wrap('\n```javascript\n', '\n```\n', '// code'); break;
            case 'pagebreak': wrap('\n---page---\n', '', ''); break;
        }
    }
}

// Bootstrap Application
document.addEventListener('DOMContentLoaded', () => new AppController());