import mongoose, { Schema, type Model } from "mongoose";

export type Localized = { en: string; ur?: string };

export function localized(required = true) {
  return new Schema<Localized>(
    {
      en: { type: String, trim: true, required, default: required ? undefined : "" },
      ur: { type: String, trim: true, default: "" },
    },
    { _id: false },
  );
}

export function defineModel<T>(name: string, schema: Schema<T>): Model<T> {
  return (mongoose.models[name] as Model<T>) ?? mongoose.model<T>(name, schema);
}

export type Id = mongoose.Types.ObjectId;
export const ObjectId = Schema.Types.ObjectId;
