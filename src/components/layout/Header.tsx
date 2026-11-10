import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { cookies } from "next/headers";
import { site } from "@config/site";
import { Icon, type IconName } from "@/components/ui/Icon";
import { fmt, localePath, pick, type Lang } from "@/i18n/config";
import { formatNumber } from "@/lib/format";
import { treatmentIcon } from "@/lib/treatment-icons";
import { treatmentImage } from "@/lib/treatment-image";
import { listTreatments } from "@/services/catalog";
import { treatmentOffers } from "@/services/clinics";
import { getDict } from "@/i18n";
import { getSessionUser } from "@/lib/auth/session";
import { listCities } from "@/services/locations";
import { CitySelector } from "./CitySelector";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationBell } from "./NotificationBell";
import { DrawerLink, HeaderFrame, NavTab } from "./HeaderFrame";
import { BottomNav, type BottomTab } from "./BottomNav";
import { ServicesMenu, type ServiceItem } from "./ServicesMenu";
import { MobileDrawer } from "./MobileDrawer";
import { LoginButton, LoginHost } from "./LoginModal";
import { buttonClass } from "@/components/ui/Button";

export interface MenuLink {
  href: string;
  label: string;
  exact?: boolean;
  icon?: IconName;
}

export async function Header({ lang, menuLinks = [], menuTitle }: { lang: Lang; menuLinks?: MenuLink[]; menuTitle?: string }) {
  const t = getDict(lang);
  const jar = await cookies();
  const [user, cities, treatments, offers] = await Promise.all([
    getSessionUser(),
    listCities(),
    listTreatments({ activeOnly: true }),
    treatmentOffers(),
  ]);
  const cityOptions = cities.map((c) => ({ slug: c.slug, name: pick(c.name, lang), active: c.active }));
  const currentCity = jar.get("city")?.value ?? site.defaultCitySlug;
  const theme = jar.get("theme")?.value;
  const initialTheme = theme === "light" || theme === "dark" ? theme : "system";
  const href = (p: string) => localePath(lang, p);

  // Clinic owners and admins work from their dashboard, so "Home" takes them there.
  const homeHref = user?.role === "clinic_owner" ? href("/dashboard") : user?.role === "admin" ? href("/admin") : href("/");
  const homeLabel = user?.role === "clinic_owner" || user?.role === "admin" ? t.nav.dashboard : t.nav.home;
  const accountLinks: { href: string; label: string }[] =
    user?.role === "patient"
      ? [
          { href: href("/account/bookings"), label: t.nav.myBookings },
          { href: href("/saved"), label: t.nav.saved },
          { href: href("/account/points"), label: t.nav.myPoints },
          { href: href("/account/profile"), label: t.nav.profile },
        ]
      : [];

  // Clinic owners and admins work from their dashboard, so the public pages are for visitors and patients.
  const publicSite = !user || user.role === "patient";
  const mainLinks = [
    { href: homeHref, label: homeLabel },
    { href: href("/treatments"), label: t.nav.services },
    ...(publicSite
      ? [
          { href: href("/deals"), label: t.nav.deals },
          { href: href("/about"), label: t.nav.aboutUs },
          { href: href("/contact"), label: t.nav.contactUs },
        ]
      : []),
  ];
  const guestLinks = [
    { href: href("/signup"), label: t.nav.signUp },
    { href: href("/signup?as=clinic"), label: t.nav.register },
  ];
  const showBell = Boolean(user && user.role !== "admin");

  const themeToggle = (
    <ThemeToggle initial={initialTheme} labels={{ system: t.nav.themeSystem, light: t.nav.themeLight, dark: t.nav.themeDark }} />
  );
  const tools: ReactNode = (
    <>
      <CitySelector lang={lang} cities={cityOptions} current={currentCity} label={t.nav.chooseCity} />
      {themeToggle}
    </>
  );

  const profileHref = !user
    ? href("/login")
    : user.role === "patient"
      ? href("/account/profile")
      : user.role === "clinic_owner"
        ? href("/dashboard/profile")
        : href("/admin");
  const bottomTabs: BottomTab[] = [
    { key: "home", href: homeHref, label: homeLabel, icon: "home", match: [`=${homeHref}`] },
    { key: "search", href: href("/search"), label: t.nav.search, icon: "search", match: ["/search", "/clinics", "/clinic", "/treatments"] },
    // Clinic owners have no saved clinics; their third tab is their bookings.
    user?.role === "clinic_owner"
      ? { key: "saved", href: href("/dashboard/bookings"), label: t.dashboard.navBookings, icon: "clock", match: ["/dashboard/bookings"] }
      : { key: "saved", href: href("/saved"), label: t.nav.saved, icon: "heart", match: ["/saved"] },
    { key: "profile", href: profileHref, label: t.nav.profile, icon: "user", match: ["/account/profile", "/account/bookings", "/account/points", "/dashboard/profile", "/login", "/signup"] },
  ];


  // Log out turns red on hover and while pressed.
  const logout = (
    <form action="/api/auth/logout" method="post">
      <button type="submit" className="whitespace-nowrap py-2 text-[15px] font-medium text-ink transition-colors hover:text-danger active:text-danger">
        {t.nav.logout}
      </button>
    </form>
  );
  const drawerLogout = (
    <form action="/api/auth/logout" method="post">
      <button
        type="submit"
        className="flex w-full items-center rounded-xl px-3 py-2.5 text-[15px] font-medium text-ink transition-colors hover:bg-[var(--status-rejected-bg)] hover:text-danger active:bg-[var(--status-rejected-bg)] active:text-danger"
      >
        {t.nav.logout}
      </button>
    </form>
  );

  const tabs = mainLinks;
  // Right-hand group for patients on desktop (points are reachable from the profile page).
  const patientRight = accountLinks.filter((l) => !l.href.endsWith("/account/points"));

  // Services dropdown: every active treatment as a card, with live clinic counts and prices.
  const servicesHref = href("/treatments");
  const s = t.showcase;
  const serviceItems: ServiceItem[] = treatments.map((tr) => {
    const offer = offers.get(String(tr._id));
    const detail = !offer
      ? s.comingSoon
      : offer.minPrice !== null
        ? fmt(offer.clinics === 1 ? s.spotlightOne : s.spotlightClinics, { count: offer.clinics, price: formatNumber(offer.minPrice, lang) })
        : offer.clinics === 1
          ? s.clinicCountOne
          : fmt(s.clinicCount, { count: offer.clinics });
    return {
      slug: tr.slug,
      name: pick(tr.name, lang),
      href: href(`/clinics/${currentCity}?treatment=${tr.slug}`),
      icon: treatmentIcon(tr.slug),
      image: treatmentImage(tr, { width: 800, height: 600 }).src,
      detail,
    };
  });
  const plain = (links: { href: string; label: string }[], className = "") =>
    links.map((l) => (
      <li key={l.href}>
        <Link href={l.href} className={`whitespace-nowrap py-2 text-[15px] font-medium text-ink hover:text-primary ${className}`}>
          {l.label}
        </Link>
      </li>
    ));
  const tabList = (links: { href: string; label: string }[], className = "") => (
    <Suspense fallback={plain(links, className)}>
      {links.map((l) => (
        <li key={l.href}>
          <NavTab href={l.href} className={className}>
            {l.label}
          </NavTab>
        </li>
      ))}
    </Suspense>
  );

  return (
    <>
    <HeaderFrame>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:start-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-surface focus:px-3 focus:py-2"
      >
        {t.nav.skipToContent}
      </a>
      <div className="flex h-16 items-center gap-8 ps-5 pe-3 md:ps-7 md:pe-5">
        {/* Section 1: logo */}
        <div className="flex shrink-0 items-center">
          <Logo lang={lang} />
        </div>
        {/* Section 2: page tabs */}
        <nav aria-label={t.nav.menu} className="mx-auto hidden lg:block">
          <ul className="flex items-center gap-7">
            {tabList(tabs.filter((l) => l.href === homeHref))}
            <ServicesMenu label={t.nav.services} items={serviceItems} allHref={servicesHref} allLabel={t.home.exploreServices} />
            {tabList(tabs.filter((l) => l.href !== homeHref && l.href !== servicesHref))}
          </ul>
        </nav>
        {/* Section 3: account tabs and settings */}
        <div className="hidden shrink-0 items-center gap-6 lg:flex">
          <div className="flex items-center gap-1 border-e border-line pe-4">{tools}</div>
          {user ? (
            <>
              {patientRight.length ? <ul className="flex items-center gap-6">{tabList(patientRight)}</ul> : null}
              {logout}
            </>
          ) : (
            <ul className="flex items-center gap-6">
              <li>
                <LoginButton
                  label={t.nav.login}
                  className="whitespace-nowrap py-2 text-[15px] font-medium text-ink transition-colors hover:text-primary"
                />
              </li>
              {tabList(guestLinks)}
            </ul>
          )}
        </div>
        {showBell ? (
          <div className="ms-auto lg:ms-0">
            <NotificationBell lang={lang} labels={t.nav} />
          </div>
        ) : null}
        <div className={`flex items-center gap-1 lg:hidden ${showBell ? "" : "ms-auto"}`}>
          {themeToggle}
          {(
            <MobileDrawer label={t.nav.menu} closeLabel={t.nav.closeMenu}>
              <Logo lang={lang} />
              {/* Visitors: sign up and register first, as clear buttons. */}
              {!user ? (
                <div className="grid grid-cols-2 gap-2">
                  <Link href={guestLinks[0].href} className={buttonClass("primary", "md", "rounded-full")}>
                    {t.nav.signUp}
                  </Link>
                  <Link href={guestLinks[1].href} className={buttonClass("secondary", "md", "rounded-full")}>
                    {t.nav.register}
                  </Link>
                </div>
              ) : null}
              {/* Dashboard pages (clinic or admin) come first: that is where this person works. */}
              {menuLinks.length ? (
                <div className="flex flex-col gap-1 border-t border-line pt-4">
                  {menuTitle ? <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wider text-muted">{menuTitle}</p> : null}
                  <ul className="flex flex-col gap-1">
                    {menuLinks.map((l) => (
                      <li key={l.href}>
                        <DrawerLink href={l.href} icon={l.icon} exact={l.exact}>
                          {l.label}
                        </DrawerLink>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <ul className="flex flex-col gap-1 border-t border-line pt-4">
                {tabs
                  .filter((l) => l.href !== servicesHref)
                  .map((l) => (
                    <li key={l.href}>
                      <DrawerLink href={l.href}>{l.label}</DrawerLink>
                    </li>
                  ))}
              </ul>
              {accountLinks.length ? (
                <ul className="flex flex-col gap-1 border-t border-line pt-4">
                  {accountLinks.map((l) => (
                    <li key={l.href}>
                      <DrawerLink href={l.href}>{l.label}</DrawerLink>
                    </li>
                  ))}
                </ul>
              ) : null}
              <details className="group/services border-t border-line pt-3">
                <summary className="flex cursor-pointer list-none items-center justify-between rounded-xl px-3 py-2.5 text-[15px] font-medium hover:bg-soft [&::-webkit-details-marker]:hidden">
                  {t.nav.services}
                  <Icon name="chevronDown" size={16} className="transition-transform group-open/services:rotate-180" />
                </summary>
                <ul className="flex flex-col gap-1 pt-1">
                  {serviceItems.map((it) => (
                    <li key={it.slug}>
                      <Link href={it.href} className="flex items-center gap-3 rounded-xl p-2 hover:bg-soft">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-chip text-chip-ink">
                          <Icon name={it.icon} size={18} />
                        </span>
                        <span className="flex min-w-0 flex-col">
                          <span className="truncate text-sm font-semibold">{it.name}</span>
                          <span className="truncate text-xs text-muted">{it.detail}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                  <li>
                    <Link href={servicesHref} className="mt-1 flex items-center justify-between rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-on-primary">
                      {t.home.exploreServices}
                      <Icon name="arrowRight" size={16} />
                    </Link>
                  </li>
                </ul>
              </details>
              {!user ? (
                <div className="border-t border-line pt-4">
                  <LoginButton
                    label={t.nav.login}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-[15px] font-medium hover:bg-soft"
                  />
                </div>
              ) : null}
              <div className="flex flex-col gap-2 border-t border-line pt-4">
                <span className="px-3 text-xs font-semibold uppercase tracking-wider text-muted">{t.nav.chooseCity}</span>
                <CitySelector lang={lang} cities={cityOptions} current={currentCity} label={t.nav.chooseCity} />
              </div>
              {user ? <div className="border-t border-line pt-4">{drawerLogout}</div> : null}
            </MobileDrawer>
          )}
        </div>
      </div>
    </HeaderFrame>
    <BottomNav tabs={bottomTabs} label={t.nav.mobileNav} />
    {/* One floating login card for the page; any link to /login opens it. */}
    {user ? null : <LoginHost lang={lang} t={t.auth} closeLabel={t.nav.closeMenu} />}
    </>
  );
}
