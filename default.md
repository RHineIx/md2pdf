# 🚀 مرحباً بك في Markdown Studio Pro

هذا المحرر المتطور مصمم لكتابة التقارير، البحوث، والمستندات التقنية بتنسيق **Markdown** وتحويلها إلى ملفات **PDF** احترافية وجاهزة للطباعة بكل سهولة وموثوقية.

---

## 🎨 إمكانيات التخصيص الجديدة (الإعدادات ⚙️)
لقد قمنا بتحديث استوديو الإعدادات ليمنحك تحكماً دقيقاً (Micro-management) في مخرجاتك:
- **مقاس الورقة والاتجاه:** اختر بين (A4, Letter, Legal) بوضع أفقي أو عمودي.
- **الربط الذكي للهوامش (🔗):** اضغط على أيقونة القفل في المنتصف لتغيير جميع الهوامش بنقرة واحدة معاً.
- **الخطوط (Typography):** اختر بين خطوط احترافية مدعومة بالكامل مثل `Cairo` أو `Tajawal`، مع تحكم مباشر في حجم الخط وتباعد الأسطر لراحتك.

## 🌍 الدعم الذكي للغات (RTL & LTR)
يتمتع المحرر بخوارزمية قوية (First Strong Character) تكتشف لغة الفقرة تلقائياً لضبط الاتجاه دون أي تدخل منك:

هذه فقرة باللغة العربية، يتم محاذاتها تلقائياً إلى اليمين (RTL) بشكل سليم وأنيق، حتى لو احتوت على كلمات إنجليزية مثل `Markdown` أو `Tailwind`.

This is an English paragraph. The editor automatically detects the Latin characters and aligns it to the left (LTR) flawlessly, ensuring your technical documents look perfect and professional.

---

## 📊 العناصر الهيكلية والمتقدمة

### 1. الجداول (Tables)
يتم تنسيق الجداول بشكل احترافي، وقد تمت برمجتها لمنع انقسامها (Page Break Avoid) بين الصفحات عند الطباعة:

| الميزة التقنية | الوصف والفائدة | حالة الاعتماد |
|----------------|----------------|---------------|
| **محرك الطباعة** | تصدير PDF نقي قابل للتحديد عبر `window.print` | ✅ مستقر |
| **الهوامش** | ربط ذكي وتعديل مرئي (Visual Editor) | ✅ مستقر |
| **الأكواد** | تلوين نحوي (Syntax Highlighting) لعدة لغات | ✅ مستقر |

### 2. الاقتباسات (Blockquotes)
> "الاستقرار أولاً: الأكواد النظيفة والأدوات الموثوقة هي الأساس لبناء مشاريع جاهزة للإنتاج (Production-ready)."
> — *دليل تطوير استوديو Markdown*

### 3. القوائم المتداخلة (Nested Lists)
* **تنسيقات النصوص الأساسية:**
  * خط عريض (**Bold Text**)
  * خط مائل (*Italic Text*)
  * نص مشطوب (~~Strikethrough~~)
* **دورة عمل المشروع:**
  1. التحليل المعماري وتحديد المخاطر.
  2. كتابة الأكواد بهيكلة (OOP).
  3. المراجعة والاختبار النهائي للطباعة.

---page---

## 💻 تلوين الأكواد (Syntax Highlighting)
ندعم الآن تلوين الأكواد بشكل مدمج، مع حماية كتلة الكود (Code Block) من الانقسام المزعج بين صفحتين عند تصدير الـ PDF:

### JavaScript
```javascript
// Function to calculate factorial recursively
function factorial(n) {
    if (n === 0 || n === 1) return 1;
    return n * factorial(n - 1);
}

const result = factorial(5);
console.log(`Factorial of 5 is: ${result}`);
```
### Python
```python
# Processing a list of numbers in Python
def process_data(data_list):
    # Returns doubled positive numbers
    return [x * 2 for x in data_list if x > 0]

numbers = [1, -2, 3, 4, -5]
print(process_data(numbers))
```

###CSS / HTML
```css
/* Enhanced Print Styles explicitly keeping backgrounds */
@media print {
    * { 
        -webkit-print-color-adjust: exact !important; 
        print-color-adjust: exact !important; 
    }
    .page-break { 
        break-after: page; 
        page-break-after: always; 
    }
}
```

---

## فواصل الصفحات المخصصة
> في أي وقت تريد إجبار النص على الانتقال لصفحة جديدة عند الطباعة (كما حدث قبل قسم الأكواد مباشرةً)، فقط استخدم زر "فاصل صفحة" من شريط الأدوات أو اكتب ---page--- في سطر فارغ.