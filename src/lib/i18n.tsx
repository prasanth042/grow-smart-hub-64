import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "ta";

type Dict = Record<string, { en: string; ta: string }>;

export const dict = {
  appName: { en: "Smart Farmer Assistant", ta: "ஸ்மார்ட் விவசாயி உதவியாளர்" },
  tagline: {
    en: "Grow smarter. From soil to market — all in one place.",
    ta: "புத்திசாலித்தனமாக விளைவிக்கவும். மண் முதல் சந்தை வரை — ஒரே இடத்தில்.",
  },
  getStarted: { en: "Get started", ta: "தொடங்கு" },
  signIn: { en: "Sign in", ta: "உள்நுழை" },
  signUp: { en: "Sign up", ta: "பதிவு செய்" },
  signOut: { en: "Sign out", ta: "வெளியேறு" },
  email: { en: "Email", ta: "மின்னஞ்சல்" },
  password: { en: "Password", ta: "கடவுச்சொல்" },
  fullName: { en: "Full name", ta: "முழு பெயர்" },
  phone: { en: "Phone", ta: "தொலைபேசி" },
  continueWithGoogle: { en: "Continue with Google", ta: "Google மூலம் தொடரவும்" },
  or: { en: "or", ta: "அல்லது" },
  dashboard: { en: "Dashboard", ta: "டாஷ்போர்டு" },
  welcome: { en: "Welcome", ta: "வணக்கம்" },
  landManagement: { en: "Land Management", ta: "நில மேலாண்மை" },
  cropPlanning: { en: "Crop Planning", ta: "பயிர் திட்டமிடல்" },
  weather: { en: "Weather Monitoring", ta: "வானிலை கண்காணிப்பு" },
  irrigation: { en: "Irrigation", ta: "நீர்ப்பாசனம்" },
  fertilizer: { en: "Fertilizer Advisor", ta: "உரம் ஆலோசகர்" },
  disease: { en: "Disease Detection", ta: "நோய் கண்டறிதல்" },
  pest: { en: "Pest Management", ta: "பூச்சி மேலாண்மை" },
  harvest: { en: "Harvest", ta: "அறுவடை" },
  market: { en: "Market Price", ta: "சந்தை விலை" },
  expenses: { en: "Expenses", ta: "செலவுகள்" },
  reports: { en: "Reports", ta: "அறிக்கைகள்" },
  chatbot: { en: "AI Assistant", ta: "AI உதவியாளர்" },
  profile: { en: "Profile", ta: "சுயவிவரம்" },
  addLand: { en: "Add Land", ta: "நிலம் சேர்" },
  editLand: { en: "Edit Land", ta: "நிலம் திருத்து" },
  save: { en: "Save", ta: "சேமி" },
  cancel: { en: "Cancel", ta: "ரத்து" },
  delete: { en: "Delete", ta: "நீக்கு" },
  landName: { en: "Land name", ta: "நில பெயர்" },
  area: { en: "Area (acres)", ta: "பரப்பளவு (ஏக்கர்)" },
  soilType: { en: "Soil type", ta: "மண் வகை" },
  waterSource: { en: "Water source", ta: "நீர் ஆதாரம்" },
  location: { en: "Location / village", ta: "இடம் / கிராமம்" },
  notes: { en: "Notes", ta: "குறிப்புகள்" },
  noLands: { en: "No land parcels yet. Add your first one.", ta: "இன்னும் நிலம் இல்லை. முதல் நிலத்தை சேர்க்கவும்." },
  village: { en: "Village", ta: "கிராமம்" },
  district: { en: "District", ta: "மாவட்டம்" },
  language: { en: "Language", ta: "மொழி" },
  comingSoon: { en: "Coming soon", ta: "விரைவில் வரும்" },
  totalLand: { en: "Total land", ta: "மொத்த நிலம்" },
  parcels: { en: "parcels", ta: "நிலங்கள்" },
  acres: { en: "acres", ta: "ஏக்கர்" },
  heroCta1: { en: "AI-powered crop advice, disease detection, and market prices — in Tamil and English.", ta: "AI உதவியுடன் பயிர் ஆலோசனை, நோய் கண்டறிதல் மற்றும் சந்தை விலைகள் — தமிழ் மற்றும் ஆங்கிலத்தில்." },
  feature1Title: { en: "Know your land", ta: "உங்கள் நிலத்தை அறியுங்கள்" },
  feature1Body: { en: "Track every parcel: soil, water, and location — one dashboard.", ta: "ஒவ்வொரு நிலத்தையும் கண்காணி: மண், நீர், இடம் — ஒரே டாஷ்போர்டு." },
  feature2Title: { en: "Smart recommendations", ta: "புத்திசாலி பரிந்துரைகள்" },
  feature2Body: { en: "AI suggests the right crop, fertilizer, and irrigation for your soil and season.", ta: "உங்கள் மண் மற்றும் பருவத்திற்கு ஏற்ற பயிர், உரம், நீர்ப்பாசனம் ஆகியவற்றை AI பரிந்துரைக்கிறது." },
  feature3Title: { en: "Spot problems early", ta: "பிரச்சனையை முன்பே கண்டறியுங்கள்" },
  feature3Body: { en: "Snap a photo. Get instant disease and pest diagnosis with treatment.", ta: "புகைப்படம் எடு. உடனடி நோய், பூச்சி கண்டறிதல் மற்றும் சிகிச்சை பெறுங்கள்." },
  feature4Title: { en: "Sell at the right price", ta: "சரியான விலையில் விற்கவும்" },
  feature4Body: { en: "Live mandi prices help you plan when and where to sell your harvest.", ta: "நேரடி சந்தை விலைகள் அறுவடையை எப்போது, எங்கு விற்க வேண்டும் என்பதைத் திட்டமிட உதவும்." },
} satisfies Dict;

export type DictKey = keyof typeof dict;

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (k: DictKey) => string };
const LangCtx = createContext<Ctx | null>(null);

const STORAGE_KEY = "sfa-lang";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (saved === "en" || saved === "ta") setLangState(saved);
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, l);
  };

  const t = (k: DictKey) => dict[k][lang];

  return <LangCtx.Provider value={{ lang, setLang, t }}>{children}</LangCtx.Provider>;
}

export function useLang() {
  const ctx = useContext(LangCtx);
  if (!ctx) throw new Error("useLang must be inside LanguageProvider");
  return ctx;
}
