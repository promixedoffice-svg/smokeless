'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { COMPANY_NAME, COMPANY_REG, SUPPORT_EMAIL, SUPPORT_PHONE, WHATSAPP_URL, APP_VERSION, APP_VERSION_DATE } from '@/lib/constants'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      <div className="sticky top-0 bg-background/95 backdrop-blur border-b border-border px-5 py-4 flex items-center gap-3 z-10">
        <Link href="/" className="text-muted-foreground">
          <ArrowRight size={20} />
        </Link>
        <h1 className="text-lg font-bold">תנאי שימוש ופרטיות</h1>
      </div>

      <div className="px-5 py-6 max-w-2xl mx-auto space-y-8 pb-16">

        {/* Company info */}
        <div className="bg-card rounded-2xl p-5 border border-border">
          <p className="text-sm font-bold text-amber-400 mb-1">Smokeless</p>
          <p className="text-xs text-muted-foreground">פותח ומופעל על ידי {COMPANY_NAME}, {COMPANY_REG}</p>
          <p className="text-xs text-muted-foreground mt-1">גרסה {APP_VERSION} · {APP_VERSION_DATE}</p>
        </div>

        {/* Terms of Use */}
        <section>
          <h2 className="text-base font-bold mb-3 text-amber-400">תנאי שימוש</h2>
          <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>
              ברוך הבא לאפליקציית Smokeless. על ידי שימוש באפליקציה, אתה מסכים לתנאים הבאים. אנא קרא אותם בעיון.
            </p>
            <p>
              <strong className="text-foreground">שימוש מותר:</strong> האפליקציה מיועדת לשימוש אישי בלבד לצורך מעקב אחר הרגלי עישון ועידוד הפחתתו. האפליקציה אינה מהווה ייעוץ רפואי ואינה מחליפה אותו.
            </p>
            <p>
              <strong className="text-foreground">אחריות:</strong> {COMPANY_NAME} אינה אחראית לדיוק הנתונים שהוזנו על ידי המשתמש. כל המידע מוזן באופן עצמאי על ידי המשתמש ואינו מאומת.
            </p>
            <p>
              <strong className="text-foreground">תחרויות:</strong> תחרויות בין משתמשים מבוססות על דיווח עצמי בלבד. {COMPANY_NAME} אינה אחראית לאמינות הנתונים שמוזנים על ידי משתתפים אחרים.
            </p>
            <p>
              <strong className="text-foreground">זמינות:</strong> אנו שואפים לזמינות מלאה אך אינו מתחייבים לפעילות ללא הפסקות. {COMPANY_NAME} רשאית להפסיק או לשנות את השירות בכל עת עם הודעה סבירה.
            </p>
            <p>
              <strong className="text-foreground">אסור:</strong> שימוש לרעה, ניסיון פריצה, הפצת תוכן פוגעני, או שימוש מסחרי ללא אישור בכתב.
            </p>
            <p>
              <strong className="text-foreground">שינוי תנאים:</strong> {COMPANY_NAME} רשאית לעדכן תנאים אלה. המשך שימוש באפליקציה לאחר עדכון מהווה הסכמה לתנאים החדשים.
            </p>
          </div>
        </section>

        {/* Privacy Policy */}
        <section>
          <h2 className="text-base font-bold mb-3 text-amber-400">מדיניות פרטיות</h2>
          <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>
              <strong className="text-foreground">מידע שנאסף:</strong> אנו אוספים את המידע הבא:
            </p>
            <ul className="list-disc list-inside space-y-1 mr-3">
              <li>פרטי חשבון Google: שם, כתובת אימייל, תמונת פרופיל</li>
              <li>נתוני עישון: מספר סיגריות, תאריכים ושעות</li>
              <li>הגדרות: יעדים, מחיר חפיסה, העדפות</li>
              <li>נתוני תחרות: ניקוד וסטטוס בתחרויות קבוצתיות</li>
            </ul>
            <p>
              <strong className="text-foreground">שימוש במידע:</strong> המידע משמש אך ורק להצגת סטטיסטיקות אישיות, ניהול תחרויות, ושיפור חוויית המשתמש. איננו מוכרים, משכירים או מעבירים מידע אישי לצדדים שלישיים.
            </p>
            <p>
              <strong className="text-foreground">אחסון:</strong> המידע מאוחסן בשרתי Google Firebase בסביבה מאובטחת.
            </p>
            <p>
              <strong className="text-foreground">מחיקת מידע:</strong> ניתן למחוק את נתוני העישון מהגדרות האפליקציה. למחיקת חשבון מלאה, פנה אלינו בדוא"ל.
            </p>
            <p>
              <strong className="text-foreground">עוגיות ואחסון מקומי:</strong> האפליקציה משתמשת ב-localStorage לשמירת הגדרות מקומיות (שפה, עמדת כפתור, הגדרות צליל). לא נשתמש בעוגיות למעקב פרסומי.
            </p>
            <p>
              <strong className="text-foreground">קטינים:</strong> האפליקציה אינה מיועדת לבני פחות מ-18. אם נודע לנו שמשתמש הוא קטין, נמחק את חשבונו.
            </p>
          </div>
        </section>

        {/* Contact */}
        <section>
          <h2 className="text-base font-bold mb-3 text-amber-400">יצירת קשר</h2>
          <div className="bg-card rounded-2xl p-5 space-y-3">
            <p className="text-sm text-muted-foreground">לכל שאלה, בקשה או תלונה:</p>
            <a href={`mailto:${SUPPORT_EMAIL}`} className="flex items-center gap-2 text-sm text-amber-400 font-medium">
              📧 {SUPPORT_EMAIL}
            </a>
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-emerald-400 font-medium">
              💬 WhatsApp: {SUPPORT_PHONE}
            </a>
            <p className="text-xs text-muted-foreground pt-2 border-t border-border">
              {COMPANY_NAME} · {COMPANY_REG}
            </p>
          </div>
        </section>

      </div>
    </div>
  )
}
