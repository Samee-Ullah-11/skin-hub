/**
 * Development only: gives any local account a password you choose, so sample owners can be logged into.
 *
 *   npm run dev:set-password -- owner-1@sample.example.test "YourNewPassword-123"
 *
 * The password can also come from DEV_SET_PASSWORD in the environment instead of the second argument.
 * Refuses to run when NODE_ENV=production.
 */
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { User } from "../src/models/User";

if (process.env.NODE_ENV === "production") throw new Error("dev-set-password is for local development only");
const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI is not set");

const [email, passwordArg] = process.argv.slice(2);
const password = passwordArg ?? process.env.DEV_SET_PASSWORD;
if (!email || !password) throw new Error("usage: dev-set-password <email> <password>");
if (password.length < 12) throw new Error("use at least 12 characters");

await mongoose.connect(uri);
const user = await User.findOne({ email: email.toLowerCase() });
if (!user) throw new Error(`no account with email ${email}`);
await User.updateOne(
  { _id: user._id },
  { $set: { passwordHash: await bcrypt.hash(password, 12), emailVerifiedAt: user.emailVerifiedAt ?? new Date() }, $inc: { tokenVersion: 1 } },
);
console.log(`password set for ${user.email} (${user.role})`);
await mongoose.disconnect();
