import { redirect } from "next/navigation";
import { isLang, localePath } from "@/i18n/config";

/** Saved clinics moved to the public /saved page (it also works for visitors who are not logged in). */
export default async function AccountSavedRedirect({ params }: PageProps<"/[lang]/account/saved">) {
  const { lang } = await params;
  redirect(localePath(isLang(lang) ? lang : "en", "/saved"));
}
