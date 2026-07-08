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
  selectLand: { en: "Select a land", ta: "நிலத்தை தேர்ந்தெடுக்கவும்" },
  season: { en: "Season", ta: "பருவம்" },
  kharif: { en: "Kharif (Jun–Oct)", ta: "காரிஃப் (ஜூன்–அக்)" },
  rabi: { en: "Rabi (Oct–Mar)", ta: "ரபி (அக்–மார்)" },
  zaid: { en: "Zaid / Summer (Mar–Jun)", ta: "கோடை (மார்–ஜூன்)" },
  recommend: { en: "Get AI recommendation", ta: "AI பரிந்துரை பெறு" },
  generating: { en: "Thinking…", ta: "சிந்திக்கிறது…" },
  suitability: { en: "Suitability", ta: "பொருத்தம்" },
  duration: { en: "Duration", ta: "காலம்" },
  expectedYield: { en: "Expected yield", ta: "எதிர்பார்க்கும் விளைச்சல்" },
  waterNeed: { en: "Water need", ta: "நீர் தேவை" },
  days: { en: "days", ta: "நாட்கள்" },
  tips: { en: "Tips", ta: "குறிப்புகள்" },
  needLandFirst: { en: "Add a land parcel first.", ta: "முதலில் ஒரு நிலத்தை சேர்க்கவும்." },
  useMyLocation: { en: "Use my location", ta: "என் இடத்தைப் பயன்படுத்து" },
  locating: { en: "Locating…", ta: "கண்டறிகிறது…" },
  temperature: { en: "Temperature", ta: "வெப்பநிலை" },
  rain: { en: "Rain", ta: "மழை" },
  humidity: { en: "Humidity", ta: "ஈரப்பதம்" },
  wind: { en: "Wind", ta: "காற்று" },
  today: { en: "Today", ta: "இன்று" },
  forecast7: { en: "7-day forecast", ta: "7-நாள் முன்னறிவிப்பு" },
  aiAdvice: { en: "AI farming advice", ta: "AI விவசாய ஆலோசனை" },
  cropType: { en: "Crop", ta: "பயிர்" },
  growthStage: { en: "Growth stage", ta: "வளர்ச்சி நிலை" },
  seedling: { en: "Seedling", ta: "நாற்று" },
  vegetative: { en: "Vegetative", ta: "தாவர வளர்ச்சி" },
  flowering: { en: "Flowering", ta: "பூக்கும்" },
  fruiting: { en: "Fruiting", ta: "காய்க்கும்" },
  maturity: { en: "Maturity", ta: "முதிர்ச்சி" },
  calculate: { en: "Calculate", ta: "கணக்கிடு" },
  waterPerWeek: { en: "Water per week", ta: "வாரம் ஒன்றுக்கு நீர்" },
  irrigationFreq: { en: "Suggested schedule", ta: "பரிந்துரைக்கப்பட்ட அட்டவணை" },
  totalVolume: { en: "Total volume", ta: "மொத்த அளவு" },
  liters: { en: "liters", ta: "லிட்டர்" },
  everyNDays: { en: "Every {n} days", ta: "ஒவ்வொரு {n} நாட்களுக்கும்" },
  tryAgain: { en: "Try again", ta: "மீண்டும் முயற்சி" },
  uploadPhoto: { en: "Upload or take a photo", ta: "புகைப்படத்தை பதிவேற்று அல்லது எடு" },
  uploadPhotoHint: { en: "JPG or PNG, up to 8MB", ta: "JPG அல்லது PNG, அதிகபட்சம் 8MB" },
  chooseAnother: { en: "Choose another", ta: "வேறு படம்" },
  analyze: { en: "Analyze", ta: "பகுப்பாய்வு செய்" },
  diagnosis: { en: "Diagnosis", ta: "நோயறிதல்" },
  confidence: { en: "Confidence", ta: "நம்பகத்தன்மை" },
  symptoms: { en: "Symptoms", ta: "அறிகுறிகள்" },
  causes: { en: "Causes", ta: "காரணங்கள்" },
  organicTreatment: { en: "Organic treatment", ta: "இயற்கை சிகிச்சை" },
  chemicalTreatment: { en: "Chemical treatment", ta: "இரசாயன சிகிச்சை" },
  prevention: { en: "Prevention", ta: "தடுப்பு" },
  npkTotal: { en: "NPK required", ta: "NPK தேவை" },
  applicationPlan: { en: "Application plan", ta: "பயன்பாட்டு திட்டம்" },
  when: { en: "When", ta: "எப்போது" },
  how: { en: "How", ta: "எப்படி" },
  organicAmendments: { en: "Organic amendments", ta: "இயற்கை சேர்க்கைகள்" },
  micronutrients: { en: "Micronutrient tips", ta: "நுண்ணூட்டச்சத்து குறிப்புகள்" },
  warnings: { en: "Warnings", ta: "எச்சரிக்கைகள்" },
  sowingDate: { en: "Sowing date", ta: "விதைத்த தேதி" },
  predict: { en: "Predict harvest", ta: "அறுவடையை கணி" },
  harvestWindow: { en: "Harvest window", ta: "அறுவடை காலம்" },
  daysToHarvest: { en: "days to go", ta: "நாட்கள் மீதம்" },
  currentStage: { en: "Current stage", ta: "தற்போதைய நிலை" },
  totalYield: { en: "Total yield", ta: "மொத்த விளைச்சல்" },
  nextActions: { en: "Next actions", ta: "அடுத்த நடவடிக்கைகள்" },
  harvestTips: { en: "Harvest tips", ta: "அறுவடை குறிப்புகள்" },
  riskFactors: { en: "Risk factors", ta: "ஆபத்து காரணிகள்" },
  
  
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
