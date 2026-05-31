'use client'

import { useAuth } from '@/contexts/AuthContext'
import { firebaseConfigured } from '@/lib/firebase'
import { Button } from '@/components/ui/button'

export function LoginScreen() {
  const { signInWithGoogle } = useAuth()

  if (!firebaseConfigured) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 text-center" dir="rtl">
        <div className="mb-6 text-6xl">⚙️</div>
        <h1 className="text-2xl font-bold mb-2">נדרשת הגדרת Firebase</h1>
        <p className="text-muted-foreground text-sm mb-8 max-w-xs leading-relaxed">
          כדי להפעיל את Smokless, צריך ליצור פרויקט Firebase ולהגדיר את קובץ <code className="bg-muted px-1 rounded text-amber-400">.env.local</code>
        </p>
        <div className="w-full max-w-sm bg-card rounded-2xl p-5 text-right space-y-3 text-sm">
          <p className="font-semibold text-base mb-4">הוראות הגדרה:</p>
          <div className="flex gap-3 items-start">
            <span className="bg-amber-400 text-black rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
            <div>כנס ל-<span className="text-amber-400">firebase.google.com</span> → צור פרויקט חדש</div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="bg-amber-400 text-black rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
            <div>הפעל <strong>Authentication</strong> עם Google + <strong>Firestore Database</strong></div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="bg-amber-400 text-black rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
            <div>Project Settings → Web App → העתק את ה-Config</div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="bg-amber-400 text-black rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">4</span>
            <div>צור קובץ <code className="bg-muted px-1 rounded text-amber-400">.env.local</code> בתיקיית הפרויקט ומלא את הפרטים</div>
          </div>
          <div className="flex gap-3 items-start">
            <span className="bg-amber-400 text-black rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">5</span>
            <div>הפעל מחדש: <code className="bg-muted px-1 rounded text-amber-400">npm run dev</code></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 text-center">
      <div className="mb-8 text-7xl">🚬</div>
      <h1 className="text-4xl font-bold mb-2 text-foreground">Smokless</h1>
      <p className="text-muted-foreground text-lg mb-2">עקוב אחר הסיגריות שלך</p>
      <p className="text-muted-foreground text-sm mb-10">השג יעדים, תתחרה עם חברים, שנה הרגלים</p>

      <div className="w-full max-w-xs space-y-4">
        <Button
          onClick={signInWithGoogle}
          className="w-full h-14 text-base font-semibold bg-white text-gray-800 border border-gray-200 hover:bg-gray-50 shadow-sm"
          variant="outline"
        >
          <svg className="w-5 h-5 ml-2" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          כניסה עם Google
        </Button>
      </div>

      <p className="text-xs text-muted-foreground mt-8 max-w-xs">
        על ידי כניסה, אתה מסכים לתנאי השימוש ומדיניות הפרטיות
      </p>
    </div>
  )
}
