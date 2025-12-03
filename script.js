const DEFAULT_TEXT = `# 👋 مرحباً بك في "استوديو المستندات"

هذا المحرر المتطور يتيح لك كتابة التقارير، البحوث، والمقالات بتنسيق **Markdown** وتحويلها إلى ملفات **PDF** احترافية وجاهزة للطباعة فوراً.

## 🚀 مميزات هذا الإصدار (v3.0)
1. **تحكم كامل:** اضغط على أيقونة الإعدادات (⚙️) في الأعلى لتغيير **الهوامش**، **حجم الخط**، و **تباعد الأسطر** مع معاينة حية.
2. **طباعة ذكية:** تم حل مشاكل قص النصوص؛ الصفحات الجديدة تبدأ بهوامش سليمة تلقائياً.
3. **أدوات سريعة:** استخدم أزرار "نسخ" و "مسح" في شريط الأدوات لتسهيل العمل.

---

## 📝 دليل الكتابة السريع

### 1. تنسيق النصوص
يمكنك جعل النص **عريضاً** (بوضع نجمتين) أو *مائلاً* (بنجمة واحدة) أو ~~مشطوباً~~ بسهولة.

### 2. القوائم
* هذه قائمة نقطية.
* عنصر آخر في القائمة.
    * عنصر فرعي (مسافة بادئة).

1. هذه قائمة مرقمة.
2. الخطوة الثانية.

### 3. الاقتباسات المميزة
> "الإتقان هو أن تفعل الشيء الصحيح حتى عندما لا يراقبك أحد."
> — *عبارة تظهر بخلفية رمادية أنيقة وحد جانبي ملون.*

### 4. الجداول (منسقة تلقائياً)
| م | الخدمة | السعر | الحالة |
| :--- | :--- | :--- | :--- |
| 1 | تصميم شعار | $50 | ✅ مكتمل |
| 2 | برمجة موقع | $200 | ⏳ قيد العمل |

### 5. الأكواد البرمجية
\`\`\`javascript
// مثال على كود يظهر بخلفية داكنة وتنسيق احترافي
function welcomeUser() {
    alert("أهلاً بك في استوديو المستندات");
}
\`\`\`

---

## 📄 كيفية فصل الصفحات يدوياً
البرنامج يقوم بإنشاء صفحات جديدة تلقائياً عند امتلاء الورقة، ولكن إذا أردت إجبار النص على الانتقال لصفحة جديدة، اكتب هذا الكود في سطر منفصل:
\`---page---\`

شاهد النتيجة في الأسفل 👇

---page---

# الصفحة الثانية 📄
هذه الصفحة بدأت هنا يدوياً.

لاحظ أن **الهوامش العلوية** مضبوطة بدقة (2 سم) ولن يلتصق النص بحافة الورقة، وذلك بفضل نظام الطباعة الذكي الجديد.

يمكنك الاستمرار في الكتابة هنا...
`;

const UI = {
    // العناصر الرئيسية
    editor: document.getElementById('markdown-input'),
    preview: document.getElementById('preview-container'),
    
    // التبويبات
    tabEditor: document.getElementById('tab-editor'),
    tabPreview: document.getElementById('tab-preview'),
    
    // الأزرار العلوية
    btnDir: document.getElementById('btn-direction'),
    iconDir: document.getElementById('icon-direction'),
    btnSettings: document.getElementById('btn-settings'),
    
    // أدوات المحرر
    btnPaste: document.getElementById('btn-paste'),
    btnClear: document.getElementById('btn-clear'),

    // نافذة الإعدادات
    modal: document.getElementById('settings-modal'),
    modalContent: document.getElementById('modal-content'),
    btnCloseSettings: document.getElementById('btn-close-settings'),
    btnSaveSettings: document.getElementById('btn-save-settings'),
    
    // أدوات التحكم بالإعدادات
    btnsMargin: document.querySelectorAll('.setting-btn-margin'),
    rangeFontSize: document.getElementById('range-font-size'),
    fontSizeDisplay: document.getElementById('font-size-display'),
    btnsLine: document.querySelectorAll('.setting-btn-line'),
    
    // عناصر المعاينة
    printStyle: document.getElementById('dynamic-print-style'),
    miniPreview: document.getElementById('mini-preview-box'),

    // الحالة الافتراضية
    state: {
        margin: '20mm',
        previewPadding: '20px',
        fontSize: '12',
        lineHeight: '1.7'
    },

    init() {
        this.editor.value = DEFAULT_TEXT;
        this.render();
        this.updatePrintStyle();
        this.events();
    },

    render() {
        let text = this.editor.value;
        // استبدال فاصل الصفحات
        text = text.replace(/^---page---$/gm, '<div class="page-break"></div>');
        this.preview.innerHTML = marked.parse(text);
    },

    // تحديث CSS ديناميكياً
    updatePrintStyle() {
        // 1. تحديث الستايل العام والطباعة
        this.printStyle.innerHTML = `
            @page { size: A4; margin: ${this.state.margin}; }
            .a4-sheet { padding: ${this.state.margin}; }
            :root {
                --doc-font-size: ${this.state.fontSize}pt;
                --doc-line-height: ${this.state.lineHeight};
            }
        `;

        // 2. تحديث المعاينة الحية في النافذة
        if(this.miniPreview) {
            this.miniPreview.style.fontSize = `${this.state.fontSize}pt`;
            this.miniPreview.style.lineHeight = this.state.lineHeight;
            this.miniPreview.style.padding = this.state.previewPadding;
            
            if(this.fontSizeDisplay) {
                this.fontSizeDisplay.textContent = `${this.state.fontSize}pt`;
            }
        }
    },

    events() {
        // الكتابة
        this.editor.addEventListener('input', () => this.render());

        // التبويبات (موبايل)
        this.tabEditor.addEventListener('click', () => {
            document.body.classList.remove('mobile-show-preview');
            this.updateTabStyles(true);
        });
        this.tabPreview.addEventListener('click', () => {
            document.body.classList.add('mobile-show-preview');
            this.updateTabStyles(false);
        });

        // تغيير الاتجاه (مع تغيير الأيقونة)
        this.btnDir.addEventListener('click', () => {
            const current = this.preview.getAttribute('dir') || 'rtl';
            const newDir = current === 'rtl' ? 'ltr' : 'rtl';
            this.preview.setAttribute('dir', newDir);
            
            // تبديل الأيقونة
            this.iconDir.textContent = newDir === 'ltr' ? 'format_textdirection_l_to_r' : 'format_textdirection_r_to_l';
        });

        // زر اللصق
        if(this.btnPaste) {
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
                } catch (err) { alert('يرجى السماح بالوصول للحافظة'); }
            });
        }

        // زر المسح
        if(this.btnClear) {
            this.btnClear.addEventListener('click', () => {
                if(this.editor.value && confirm('مسح الكل؟')) {
                    this.editor.value = '';
                    this.render();
                }
            });
        }

        // --- إدارة نافذة الإعدادات ---
        
        // فتح
        this.btnSettings.addEventListener('click', () => {
            this.modal.classList.remove('hidden');
            this.modal.classList.add('flex');
            this.updatePrintStyle(); // تحديث المعاينة عند الفتح
            setTimeout(() => {
                this.modal.classList.remove('opacity-0');
                this.modalContent.classList.remove('scale-95');
                this.modalContent.classList.add('scale-100');
            }, 10);
        });

        // إغلاق
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
            if(e.target === this.modal) closeSettings();
        });

        // التحكم بالهوامش
        this.btnsMargin.forEach(btn => {
            btn.addEventListener('click', () => {
                // تحديث شكل الأزرار
                this.btnsMargin.forEach(b => b.className = "setting-btn-margin border-2 rounded-lg py-2 text-sm font-medium hover:bg-indigo-50 hover:border-indigo-200 transition");
                btn.className = "setting-btn-margin border-2 border-indigo-600 bg-indigo-50 text-indigo-700 rounded-lg py-2 text-sm font-bold transition";
                
                // تحديث القيم
                this.state.margin = btn.dataset.val;
                this.state.previewPadding = btn.dataset.previewPadding;
                this.updatePrintStyle();
            });
        });

        // التحكم بحجم الخط
        this.rangeFontSize.addEventListener('input', (e) => {
            this.state.fontSize = e.target.value;
            this.updatePrintStyle();
        });

        // التحكم بتباعد الأسطر
        this.btnsLine.forEach(btn => {
            btn.addEventListener('click', () => {
                this.btnsLine.forEach(b => b.className = "setting-btn-line flex-1 py-1.5 text-sm rounded-md transition hover:bg-gray-200");
                btn.className = "setting-btn-line flex-1 py-1.5 text-sm bg-white shadow-sm font-bold text-indigo-700 rounded-md transition";
                
                this.state.lineHeight = btn.dataset.val;
                this.updatePrintStyle();
            });
        });
    },

    updateTabStyles(isEditor) {
        if(isEditor) {
            this.tabEditor.className = "px-3 py-1 text-xs font-bold shadow-sm bg-white text-slate-800 rounded-md transition-all";
            this.tabPreview.className = "px-3 py-1 text-xs font-bold text-slate-500 hover:text-slate-700 transition-all";
        } else {
            this.tabPreview.className = "px-3 py-1 text-xs font-bold shadow-sm bg-white text-slate-800 rounded-md transition-all";
            this.tabEditor.className = "px-3 py-1 text-xs font-bold text-slate-500 hover:text-slate-700 transition-all";
        }
    }
};

document.addEventListener('DOMContentLoaded', () => UI.init());