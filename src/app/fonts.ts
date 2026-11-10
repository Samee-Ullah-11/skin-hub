import { Noto_Naskh_Arabic, Noto_Nastaliq_Urdu, Poppins } from "next/font/google";

/** Poppins for all Latin text (headings and body); Urdu keeps Nastaliq headings and Naskh body. */
const poppins = Poppins({ subsets: ["latin"], variable: "--f-sans", display: "swap", weight: ["400", "500", "600", "700"] });
const naskh = Noto_Naskh_Arabic({
  subsets: ["arabic"],
  variable: "--f-naskh",
  display: "swap",
  weight: ["400", "600"],
  preload: false,
});
const nastaliq = Noto_Nastaliq_Urdu({
  subsets: ["arabic"],
  variable: "--f-nastaliq",
  display: "swap",
  weight: ["400", "600"],
  preload: false,
});

export const fontVariables = [poppins.variable, naskh.variable, nastaliq.variable].join(" ");
