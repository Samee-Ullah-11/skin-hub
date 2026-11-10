import { section } from "../section";

type Page = { title: string; description: string; blocks: { h?: string; p: string[] }[] };

export const pages = section<Record<"about" | "contact" | "privacy" | "terms" | "disclaimer", Page>>(
  {
    about: {
      title: "About {site}",
      description: "{site} lists approved skin care and aesthetic clinics and lets patients send booking requests online.",
      blocks: [
        {
          p: [
            "{site} helps people in Pakistan find skin care and aesthetic clinics, see which doctors work there and when, and send a booking request without phoning around.",
            "We are starting in Peshawar and will add other cities one at a time.",
          ],
        },
        {
          h: "How clinics are listed",
          p: [
            "Clinics register themselves and upload their licence and the registration certificates of their doctors. Our team reviews these before a clinic appears in search.",
            "Clinics set their own schedules, prices and descriptions. We do not rank clinics by quality and we do not publish reviews.",
          ],
        },
        {
          h: "What we do not do",
          p: ["We do not provide medical care or advice, and we do not take payment for visits. You pay the clinic directly."],
        },
      ],
    },
    contact: {
      title: "Contact",
      description: "Contact the {site} team by email or WhatsApp.",
      blocks: [
        {
          p: [
            "For questions about a booking, contact the clinic directly using the WhatsApp button on its page.",
            "For questions about the website, your account or listing a clinic, contact us using the details below.",
          ],
        },
      ],
    },
    privacy: {
      title: "Privacy policy",
      description: "What personal data {site} collects, why, and who can see it.",
      blocks: [
        {
          h: "What we collect",
          p: [
            "Patients: name, email address, mobile number, and an optional short note with each booking request. We do not ask for national ID numbers, medical history or photos.",
            "Clinic owners: name, email address, mobile number, clinic details, and the documents needed to verify the clinic.",
          ],
        },
        {
          h: "Who can see it",
          p: [
            "A clinic sees your name, mobile number and note only for bookings you make with that clinic.",
            "Clinic documents are stored privately and can be opened only by our review team, using links that expire after a few minutes.",
          ],
        },
        {
          h: "Cookies",
          p: [
            "We use a sign-in cookie to keep you logged in, and cookies that remember your language, theme and city. We do not use advertising or tracking cookies.",
          ],
        },
        {
          h: "Service providers",
          p: [
            "We use a hosting provider, a database provider, an email delivery service and an image storage service to run the site. They process data only to provide these services.",
          ],
        },
        {
          h: "Your choices",
          p: ["You can update your profile at any time. To delete your account, contact us and we will remove your personal data except where we must keep records."],
        },
      ],
    },
    terms: {
      title: "Terms of use",
      description: "The rules for using {site} as a patient or a clinic.",
      blocks: [
        {
          h: "What {site} is",
          p: [
            "{site} is a listing and booking request service. It connects patients with independent clinics. It is not a healthcare provider.",
          ],
        },
        {
          h: "Bookings",
          p: [
            "A booking request is not an appointment until the clinic confirms it. Clinics may decline requests. Unanswered requests expire.",
            "Please cancel bookings you cannot attend so the time can be offered to someone else.",
          ],
        },
        {
          h: "Clinics",
          p: [
            "Clinics are responsible for the accuracy of their information, the qualifications of their staff, their prices and the care they provide.",
            "We may refuse, suspend or remove a listing that breaks these terms or the law.",
          ],
        },
        {
          h: "Accounts",
          p: ["Keep your password private. Do not create accounts for other people or use the site to send spam or false bookings."],
        },
      ],
    },
    disclaimer: {
      title: "Medical disclaimer",
      description: "{site} does not give medical advice.",
      blocks: [
        {
          p: [
            "Information on {site} is provided by clinics and is for general information only. It is not medical advice.",
            "We do not recommend specific treatments, doctors or clinics. Results of any treatment vary from person to person.",
            "Before any treatment, discuss the risks, benefits and costs with a qualified doctor. In an emergency, go to the nearest hospital.",
          ],
        },
      ],
    },
  },
  {
    about: {
      title: "{site} کے بارے میں",
      description: "{site} منظور شدہ جلد اور جمالیاتی کلینک دکھاتا ہے اور مریضوں کو آن لائن بکنگ کی درخواست بھیجنے دیتا ہے۔",
      blocks: [
        {
          p: [
            "{site} پاکستان میں لوگوں کو جلد اور جمالیاتی کلینک تلاش کرنے، وہاں کے ڈاکٹر اور اوقات دیکھنے، اور فون کیے بغیر بکنگ کی درخواست بھیجنے میں مدد دیتا ہے۔",
            "ہم پشاور سے شروع کر رہے ہیں اور باقی شہر ایک ایک کر کے شامل کریں گے۔",
          ],
        },
        {
          h: "کلینک کیسے شامل ہوتے ہیں",
          p: [
            "کلینک خود رجسٹر ہوتے ہیں اور اپنا لائسنس اور ڈاکٹروں کی رجسٹریشن اسناد اپ لوڈ کرتے ہیں۔ تلاش میں ظاہر ہونے سے پہلے ہماری ٹیم انہیں دیکھتی ہے۔",
            "کلینک اپنے اوقات، قیمتیں اور تعارف خود لکھتے ہیں۔ ہم کلینکس کی درجہ بندی نہیں کرتے اور تبصرے شائع نہیں کرتے۔",
          ],
        },
        {
          h: "ہم کیا نہیں کرتے",
          p: ["ہم علاج یا طبی مشورہ نہیں دیتے اور ملاقات کی رقم وصول نہیں کرتے۔ ادائیگی آپ براہ راست کلینک کو کرتے ہیں۔"],
        },
      ],
    },
    contact: {
      title: "رابطہ",
      description: "{site} ٹیم سے ای میل یا واٹس ایپ پر رابطہ کریں۔",
      blocks: [
        {
          p: [
            "کسی بکنگ کے بارے میں سوال ہو تو کلینک کے صفحے پر واٹس ایپ بٹن سے براہ راست کلینک سے رابطہ کریں۔",
            "ویب سائٹ، اکاؤنٹ یا کلینک شامل کرنے کے بارے میں نیچے دیے گئے ذرائع سے ہم سے رابطہ کریں۔",
          ],
        },
      ],
    },
    privacy: {
      title: "رازداری کی پالیسی",
      description: "{site} کون سا ذاتی ڈیٹا جمع کرتا ہے، کیوں، اور اسے کون دیکھ سکتا ہے۔",
      blocks: [
        {
          h: "ہم کیا جمع کرتے ہیں",
          p: [
            "مریض: نام، ای میل، موبائل نمبر، اور ہر بکنگ کے ساتھ اختیاری مختصر نوٹ۔ ہم شناختی کارڈ نمبر، طبی تاریخ یا تصاویر نہیں مانگتے۔",
            "کلینک کے مالکان: نام، ای میل، موبائل نمبر، کلینک کی تفصیل، اور تصدیق کے لیے ضروری دستاویزات۔",
          ],
        },
        {
          h: "اسے کون دیکھ سکتا ہے",
          p: [
            "کلینک آپ کا نام، موبائل نمبر اور نوٹ صرف ان بکنگز کے لیے دیکھتا ہے جو آپ نے اسی کلینک میں کی ہوں۔",
            "کلینک کی دستاویزات نجی طور پر محفوظ ہیں اور صرف ہماری جائزہ ٹیم چند منٹ میں ختم ہونے والے لنکس سے کھول سکتی ہے۔",
          ],
        },
        {
          h: "کوکیز",
          p: ["ہم لاگ ان رکھنے کے لیے ایک کوکی اور زبان، تھیم اور شہر یاد رکھنے کے لیے کوکیز استعمال کرتے ہیں۔ ہم اشتہاری یا ٹریکنگ کوکیز استعمال نہیں کرتے۔"],
        },
        {
          h: "خدمات فراہم کرنے والے",
          p: ["سائٹ چلانے کے لیے ہم ہوسٹنگ، ڈیٹا بیس، ای میل اور تصاویر محفوظ کرنے کی خدمات استعمال کرتے ہیں۔ وہ ڈیٹا صرف یہ خدمات دینے کے لیے استعمال کرتے ہیں۔"],
        },
        {
          h: "آپ کے اختیارات",
          p: ["آپ کسی بھی وقت اپنا پروفائل بدل سکتے ہیں۔ اکاؤنٹ حذف کرانے کے لیے ہم سے رابطہ کریں، ہم ضروری ریکارڈ کے علاوہ آپ کا ذاتی ڈیٹا ہٹا دیں گے۔"],
        },
      ],
    },
    terms: {
      title: "استعمال کی شرائط",
      description: "مریض یا کلینک کے طور پر {site} استعمال کرنے کے اصول۔",
      blocks: [
        {
          h: "{site} کیا ہے",
          p: ["{site} فہرست اور بکنگ درخواست کی سروس ہے۔ یہ مریضوں کو آزاد کلینکس سے جوڑتی ہے۔ یہ خود طبی سہولت فراہم نہیں کرتی۔"],
        },
        {
          h: "بکنگز",
          p: [
            "بکنگ کی درخواست اس وقت تک ملاقات نہیں جب تک کلینک تصدیق نہ کرے۔ کلینک درخواست نامنظور کر سکتے ہیں۔ جواب نہ ملنے پر درخواست ختم ہو جاتی ہے۔",
            "جس بکنگ پر نہ آ سکیں اسے منسوخ کریں تاکہ وہ وقت کسی اور کو مل سکے۔",
          ],
        },
        {
          h: "کلینک",
          p: [
            "کلینک اپنی معلومات کی درستی، عملے کی قابلیت، قیمتوں اور علاج کے ذمہ دار ہیں۔",
            "ان شرائط یا قانون کی خلاف ورزی پر ہم کوئی فہرست روک، معطل یا ہٹا سکتے ہیں۔",
          ],
        },
        {
          h: "اکاؤنٹس",
          p: ["اپنا پاس ورڈ کسی کو نہ بتائیں۔ دوسروں کے نام پر اکاؤنٹ نہ بنائیں اور سائٹ کو جعلی بکنگز کے لیے استعمال نہ کریں۔"],
        },
      ],
    },
    disclaimer: {
      title: "طبی اعلان",
      description: "{site} طبی مشورہ نہیں دیتا۔",
      blocks: [
        {
          p: [
            "{site} پر معلومات کلینک فراہم کرتے ہیں اور یہ صرف عمومی معلومات ہیں۔ یہ طبی مشورہ نہیں۔",
            "ہم کسی خاص علاج، ڈاکٹر یا کلینک کی سفارش نہیں کرتے۔ کسی بھی علاج کے نتائج ہر شخص میں مختلف ہوتے ہیں۔",
            "کسی بھی علاج سے پہلے اس کے خطرات، فوائد اور اخراجات مستند ڈاکٹر سے پوچھیں۔ ہنگامی صورت میں قریبی ہسپتال جائیں۔",
          ],
        },
      ],
    },
  },
);
