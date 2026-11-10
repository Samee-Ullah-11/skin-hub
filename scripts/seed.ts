import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { Category, Treatment } from "../src/models/Catalog";
import { Clinic } from "../src/models/Clinic";
import { Doctor } from "../src/models/Doctor";
import { Testimonial } from "../src/models/Engagement";
import { Deal } from "../src/models/Deal";
import { Area, City, Province } from "../src/models/Location";
import { Settings } from "../src/models/Platform";
import { User } from "../src/models/User";
import {
  CATEGORIES,
  CITIES,
  PESHAWAR_AREAS,
  PROVINCES,
  REQUIRED_DOC_TYPES,
  SAMPLE_EMAIL_DOMAIN,
  SKIN_TREATMENTS,
} from "./seed-data";

const uri = process.env.MONGODB_URI;
const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
const adminPassword = process.env.ADMIN_PASSWORD;
const withSamples = !process.argv.includes("--no-samples");

if (!uri) throw new Error("MONGODB_URI is not set");
if (!adminEmail || !adminPassword || adminPassword.length < 12) {
  throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD (at least 12 characters) in .env before seeding");
}

await mongoose.connect(uri);
await mongoose.connection.syncIndexes();

const existingAdmin = await User.findOne({ email: adminEmail });
if (existingAdmin) {
  console.log(`Admin ${adminEmail} already exists, leaving it unchanged`);
} else {
  await User.create({
    name: "Administrator",
    email: adminEmail,
    phone: "+920000000000",
    passwordHash: await bcrypt.hash(adminPassword, 12),
    role: "admin",
    emailVerifiedAt: new Date(),
  });
  console.log(`Created admin ${adminEmail}`);
}

const provinceIds = new Map<string, mongoose.Types.ObjectId>();
for (const [i, p] of PROVINCES.entries()) {
  const doc = await Province.findOneAndUpdate(
    { slug: p.slug },
    { $setOnInsert: { slug: p.slug, name: { en: p.en, ur: p.ur }, active: true, sortOrder: i } },
    { upsert: true, returnDocument: "after" },
  );
  provinceIds.set(p.slug, doc._id);
}

for (const [i, c] of CITIES.entries()) {
  await City.findOneAndUpdate(
    { slug: c.slug },
    {
      $setOnInsert: {
        slug: c.slug,
        name: { en: c.en, ur: c.ur },
        provinceId: provinceIds.get(c.province),
        active: c.active,
        center: { lat: c.lat, lng: c.lng },
        sortOrder: i,
      },
    },
    { upsert: true },
  );
}

const peshawar = await City.findOne({ slug: "peshawar" }).orFail();
for (const a of PESHAWAR_AREAS) {
  await Area.findOneAndUpdate(
    { cityId: peshawar._id, slug: a.slug },
    { $setOnInsert: { cityId: peshawar._id, slug: a.slug, name: { en: a.en, ur: a.ur }, active: true } },
    { upsert: true },
  );
}

for (const [i, c] of CATEGORIES.entries()) {
  await Category.findOneAndUpdate(
    { slug: c.slug },
    { $setOnInsert: { slug: c.slug, name: { en: c.en, ur: c.ur }, active: c.active, sortOrder: i } },
    { upsert: true },
  );
}
const skin = await Category.findOne({ slug: "skin-care-aesthetic" }).orFail();
for (const [i, t] of SKIN_TREATMENTS.entries()) {
  await Treatment.findOneAndUpdate(
    { slug: t.slug },
    { $setOnInsert: { slug: t.slug, name: { en: t.en, ur: t.ur }, categoryId: skin._id, active: true, sortOrder: i } },
    { upsert: true },
  );
}

await Settings.findOneAndUpdate(
  { key: "platform" },
  { $setOnInsert: { key: "platform", requiredDocTypes: REQUIRED_DOC_TYPES } },
  { upsert: true },
);
console.log("Seeded provinces, cities, Peshawar areas, categories, treatments and settings");

if (withSamples) {
  const treatments = await Treatment.find({ categoryId: skin._id }).lean();
  const areas = await Area.find({ cityId: peshawar._id }).lean();
  const kp = provinceIds.get("khyber-pakhtunkhwa");
  const samplePasswordHash = await bcrypt.hash(`sample-${new mongoose.Types.ObjectId()}`, 10);
  const weekdays = [1, 2, 3, 4, 5, 6].map((weekday) => ({
    weekday,
    start: "10:00",
    end: weekday === 6 ? "14:00" : "18:00",
    breaks: weekday === 6 ? [] : [{ start: "13:00", end: "14:00" }],
  }));

  for (let n = 1; n <= 3; n++) {
    const email = `owner-${n}@${SAMPLE_EMAIL_DOMAIN}`;
    const owner = await User.findOneAndUpdate(
      { email },
      {
        $setOnInsert: {
          name: `SAMPLE Owner ${n}`,
          email,
          phone: `+9230000000${n}0`,
          passwordHash: samplePasswordHash,
          role: "clinic_owner",
          emailVerifiedAt: new Date(),
        },
      },
      { upsert: true, returnDocument: "after" },
    );
    const area = areas[(n * 3) % areas.length];
    const exists = await Clinic.exists({ ownerId: owner._id });
    if (exists) continue;
    const lat = peshawar.center.lat + (n - 2) * 0.012;
    const lng = peshawar.center.lng - 0.03 + n * 0.015;
    const clinic = await Clinic.create({
      ownerId: owner._id,
      slug: `sample-clinic-${n}`,
      name: { en: `SAMPLE Clinic ${n}`, ur: `نمونہ کلینک ${n}` },
      categoryId: skin._id,
      provinceId: kp,
      cityId: peshawar._id,
      areaId: area._id,
      address: { en: `SAMPLE address ${n}, ${area.name.en}, Peshawar`, ur: "" },
      location: { type: "Point", coordinates: [lng, lat] },
      phone: `+9230000000${n}0`,
      whatsapp: `+9230000000${n}0`,
      description: {
        en: "SAMPLE listing for testing. This is not a real clinic. Remove it with npm run seed:wipe-samples.",
        ur: "جانچ کے لیے نمونہ۔ یہ اصل کلینک نہیں ہے۔",
      },
      treatments: treatments.slice(n - 1, n + 4).map((t) => ({ treatmentId: t._id })),
      status: "approved",
      submittedAt: new Date(),
      approvedAt: new Date(),
      isSample: true,
    });
    for (let d = 1; d <= (n === 1 ? 2 : 1); d++) {
      await Doctor.create({
        clinicId: clinic._id,
        name: { en: `SAMPLE Doctor ${n}.${d}`, ur: `نمونہ ڈاکٹر ${n}.${d}` },
        gender: d % 2 === 0 ? "male" : "female",
        specialty: { en: "SAMPLE specialty", ur: "" },
        qualifications: "SAMPLE",
        slotMinutes: 30,
        weekly: weekdays,
        isSample: true,
        sortOrder: d,
      });
    }
  }
  // SAMPLE starting prices (PKR) so the price layout can be previewed. Only fills prices that are not set.
  const SAMPLE_PRICES = [2500, 3500, 5000, 8000, 12000, 15000];
  for (const clinic of await Clinic.find({ isSample: true })) {
    let changed = false;
    clinic.treatments.forEach((tr, i) => {
      if (typeof tr.fromPricePkr !== "number") {
        tr.fromPricePkr = SAMPLE_PRICES[i % SAMPLE_PRICES.length];
        changed = true;
      }
    });
    if (changed) await clinic.save();
  }
  // SAMPLE deals: one or two running offers per sample clinic, only added when the clinic has none.
  const SAMPLE_PERCENTS = [15, 20, 25, 30];
  const now = new Date();
  for (const [i, clinic] of (await Clinic.find({ isSample: true }).sort({ slug: 1 })).entries()) {
    if (await Deal.exists({ clinicId: clinic._id })) continue;
    for (const [j, tr] of clinic.treatments.slice(0, 2).entries()) {
      await Deal.create({
        clinicId: clinic._id,
        treatmentId: tr.treatmentId,
        percentOff: SAMPLE_PERCENTS[(i + j) % SAMPLE_PERCENTS.length],
        note: "SAMPLE offer",
        startsAt: now,
        endsAt: new Date(now.getTime() + (21 + i * 7) * 86400_000),
        isSample: true,
      });
    }
  }
  for (let n = 1; n <= 3; n++) {
    await Testimonial.findOneAndUpdate(
      { name: `SAMPLE Patient ${n}` },
      {
        $setOnInsert: {
          name: `SAMPLE Patient ${n}`,
          quote: { en: "SAMPLE text to preview the layout. Replace with a real patient quote before launch.", ur: "" },
          sortOrder: n,
        },
      },
      { upsert: true },
    );
  }
  console.log(`Seeded SAMPLE clinics and doctors (owners use @${SAMPLE_EMAIL_DOMAIN}; wipe with npm run seed:wipe-samples)`);
}

await mongoose.disconnect();
