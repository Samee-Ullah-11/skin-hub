export const PROVINCES = [
  { slug: "khyber-pakhtunkhwa", en: "Khyber Pakhtunkhwa", ur: "خیبر پختونخوا" },
  { slug: "punjab", en: "Punjab", ur: "پنجاب" },
  { slug: "sindh", en: "Sindh", ur: "سندھ" },
  { slug: "balochistan", en: "Balochistan", ur: "بلوچستان" },
  { slug: "islamabad-capital-territory", en: "Islamabad Capital Territory", ur: "اسلام آباد" },
  { slug: "gilgit-baltistan", en: "Gilgit-Baltistan", ur: "گلگت بلتستان" },
  { slug: "azad-kashmir", en: "Azad Jammu and Kashmir", ur: "آزاد جموں و کشمیر" },
];

export const CITIES = [
  { slug: "peshawar", en: "Peshawar", ur: "پشاور", province: "khyber-pakhtunkhwa", active: true, lat: 34.0151, lng: 71.5249 },
  { slug: "mardan", en: "Mardan", ur: "مردان", province: "khyber-pakhtunkhwa", active: false, lat: 34.198, lng: 72.0404 },
  { slug: "abbottabad", en: "Abbottabad", ur: "ایبٹ آباد", province: "khyber-pakhtunkhwa", active: false, lat: 34.1688, lng: 73.2215 },
  { slug: "islamabad", en: "Islamabad", ur: "اسلام آباد", province: "islamabad-capital-territory", active: false, lat: 33.6844, lng: 73.0479 },
  { slug: "rawalpindi", en: "Rawalpindi", ur: "راولپنڈی", province: "punjab", active: false, lat: 33.5651, lng: 73.0169 },
  { slug: "lahore", en: "Lahore", ur: "لاہور", province: "punjab", active: false, lat: 31.5204, lng: 74.3587 },
  { slug: "faisalabad", en: "Faisalabad", ur: "فیصل آباد", province: "punjab", active: false, lat: 31.4504, lng: 73.135 },
  { slug: "multan", en: "Multan", ur: "ملتان", province: "punjab", active: false, lat: 30.1575, lng: 71.5249 },
  { slug: "karachi", en: "Karachi", ur: "کراچی", province: "sindh", active: false, lat: 24.8607, lng: 67.0011 },
  { slug: "hyderabad", en: "Hyderabad", ur: "حیدرآباد", province: "sindh", active: false, lat: 25.396, lng: 68.3578 },
  { slug: "quetta", en: "Quetta", ur: "کوئٹہ", province: "balochistan", active: false, lat: 30.1798, lng: 66.975 },
];

export const PESHAWAR_AREAS = [
  { slug: "hayatabad", en: "Hayatabad", ur: "حیات آباد" },
  { slug: "university-town", en: "University Town", ur: "یونیورسٹی ٹاؤن" },
  { slug: "saddar", en: "Saddar", ur: "صدر" },
  { slug: "cantt", en: "Peshawar Cantt", ur: "پشاور کینٹ" },
  { slug: "gulbahar", en: "Gulbahar", ur: "گلبہار" },
  { slug: "warsak-road", en: "Warsak Road", ur: "ورسک روڈ" },
  { slug: "ring-road", en: "Ring Road", ur: "رنگ روڈ" },
  { slug: "dabgari-gardens", en: "Dabgari Gardens", ur: "ڈبگری گارڈن" },
  { slug: "board-bazaar", en: "Board Bazaar", ur: "بورڈ بازار" },
  { slug: "tehkal", en: "Tehkal", ur: "تہکال" },
];

export const CATEGORIES = [
  { slug: "skin-care-aesthetic", en: "Skin care and aesthetic", ur: "جلد اور جمالیاتی علاج", active: true },
  { slug: "dental", en: "Dental", ur: "دانتوں کا علاج", active: false },
  { slug: "general-medicine", en: "General medicine", ur: "جنرل میڈیسن", active: false },
  { slug: "physiotherapy", en: "Physiotherapy", ur: "فزیوتھراپی", active: false },
];

export const SKIN_TREATMENTS = [
  { slug: "acne-treatment", en: "Acne treatment", ur: "کیل مہاسوں کا علاج" },
  { slug: "laser-hair-removal", en: "Laser hair removal", ur: "لیزر سے بال ہٹانا" },
  { slug: "skin-whitening", en: "Skin whitening", ur: "رنگت نکھارنا" },
  { slug: "facials", en: "Facials", ur: "فیشل" },
  { slug: "chemical-peel", en: "Chemical peel", ur: "کیمیکل پیل" },
  { slug: "pigmentation-treatment", en: "Pigmentation and melasma", ur: "چھائیاں اور داغ" },
  { slug: "scar-treatment", en: "Scar treatment", ur: "نشانات کا علاج" },
  { slug: "hair-loss-treatment", en: "Hair loss treatment", ur: "بال گرنے کا علاج" },
  { slug: "prp", en: "PRP therapy", ur: "پی آر پی تھراپی" },
  { slug: "botox-fillers", en: "Botox and fillers", ur: "بوٹوکس اور فلرز" },
  { slug: "mole-wart-removal", en: "Mole and wart removal", ur: "تل اور مسے ہٹانا" },
  { slug: "microneedling", en: "Microneedling", ur: "مائیکرو نیڈلنگ" },
];

export const REQUIRED_DOC_TYPES = [
  {
    key: "clinic_license",
    label: { en: "Clinic license or healthcare commission registration", ur: "کلینک لائسنس یا ہیلتھ کیئر کمیشن رجسٹریشن" },
  },
  {
    key: "doctor_registration",
    label: { en: "Doctor registration certificate (PMDC)", ur: "ڈاکٹر کی رجسٹریشن سند (پی ایم ڈی سی)" },
  },
];

export const SAMPLE_EMAIL_DOMAIN = "sample.example.test";
