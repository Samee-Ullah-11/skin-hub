import mongoose from "mongoose";
import { Booking } from "../src/models/Booking";
import { Clinic } from "../src/models/Clinic";
import { ClinicDocument } from "../src/models/ClinicDocument";
import { Doctor } from "../src/models/Doctor";
import { ClinicLike, Testimonial } from "../src/models/Engagement";
import { Deal } from "../src/models/Deal";
import { CommissionEntry, Statement } from "../src/models/Ledger";
import { User } from "../src/models/User";
import { SAMPLE_EMAIL_DOMAIN } from "./seed-data";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI is not set");
await mongoose.connect(uri);

const clinics = await Clinic.find({ isSample: true }, { _id: 1 }).lean();
const clinicIds = clinics.map((c) => c._id);

const results = await Promise.all([
  Booking.deleteMany({ clinicId: { $in: clinicIds } }),
  Doctor.deleteMany({ clinicId: { $in: clinicIds } }),
  ClinicDocument.deleteMany({ clinicId: { $in: clinicIds } }),
  CommissionEntry.deleteMany({ clinicId: { $in: clinicIds } }),
  Statement.deleteMany({ clinicId: { $in: clinicIds } }),
]);
const removedClinics = await Clinic.deleteMany({ _id: { $in: clinicIds } });
await ClinicLike.deleteMany({ clinicId: { $in: clinicIds } });
await Deal.deleteMany({ $or: [{ clinicId: { $in: clinicIds } }, { isSample: true }] });
await Testimonial.deleteMany({ name: /^SAMPLE / });
const removedUsers = await User.deleteMany({ email: { $regex: `@${SAMPLE_EMAIL_DOMAIN.replace(/\./g, "\\.")}$` } });

console.log(
  `Removed ${removedClinics.deletedCount} SAMPLE clinics, ${results[1].deletedCount} doctors, ${results[0].deletedCount} bookings, ${removedUsers.deletedCount} sample users`,
);
await mongoose.disconnect();
