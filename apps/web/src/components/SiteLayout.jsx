import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { ChevronDown, Menu, ShoppingCart, X } from "lucide-react";
import {
  BRAND,
  LEGACY,
  MORE_NAV,
  NAV,
  PRIMARY_NAV,
  PUBLISHER,
} from "@/lib/content";
import ThemeToggle from "@/components/ThemeToggle";
import WhatsAppButton from "@/components/WhatsAppButton";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { whatsappHref } from "@/lib/whatsapp";

const OVERLAY_PATHS = new Set([
  "/",
  "/peter-edochie",
  "/legacy",
  "/book",
  "/shop",
  "/events",
  "/mentorship",
  "/gallery",
  "/news",
  "/sponsors",
  "/faq",
  "/contact",
  "/terms",
  "/privacy",
]);

const navClass =
  (overlay) =>
  ({ isActive }) =>
    `whitespace-nowrap text-[0.72rem] uppercase tracking-[0.18em] transition-colors ${
      isActive
        ? "text-[hsl(var(--gold))]"
        : overlay
          ? "text-white/70 hover:text-white"
          : "text-muted-foreground hover:text-foreground"
    }`;

const SiteLayout = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [solid, setSolid] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef(null);
  const { isAuthed } = useAuth();
  const { count } = useCart();
  const location = useLocation();
  const isOverlayPage = OVERLAY_PATHS.has(location.pathname);
  const overlay = isOverlayPage && !solid && !open;

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
    setMoreOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const onClick = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target))
        setMoreOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const moreActive = MORE_NAV.some((item) => location.pathname === item.to);

  return (
    <div className="grain min-h-screen bg-background text-foreground">
      <header
        className={`fixed inset-x-0 top-0 z-[80] transition-[background-color,border-color,box-shadow] duration-300 ${
          overlay
            ? "border-b border-white/10 bg-black/25 backdrop-blur-sm"
            : "border-b border-border bg-background/95 backdrop-blur-md"
        }`}
      >
        <div className="mx-auto flex h-[4.25rem] max-w-[90rem] items-center gap-4 px-5 md:h-[4.5rem] md:px-8 lg:px-10">
          <Link to="/" className="min-w-0 shrink-0 leading-tight">
            <span
              className={`block font-display text-[1.35rem] tracking-wide md:text-[1.55rem] ${overlay ? "text-white" : "text-foreground"}`}
            >
              {LEGACY.name}
            </span>
            <span className="block text-[0.58rem] uppercase tracking-[0.28em] text-[hsl(var(--gold))]">
              {BRAND.projectName}
            </span>
          </Link>

          <nav className="ml-auto hidden items-center gap-5 lg:flex xl:gap-7">
            {PRIMARY_NAV.map((item) => (
              <NavLink key={item.to} to={item.to} className={navClass(overlay)}>
                {item.label}
              </NavLink>
            ))}
            <div className="relative" ref={moreRef}>
              <button
                type="button"
                aria-expanded={moreOpen}
                aria-haspopup="true"
                onClick={() => setMoreOpen((v) => !v)}
                className={`inline-flex items-center gap-1 text-[0.72rem] uppercase tracking-[0.18em] transition-colors ${
                  moreActive
                    ? "text-[hsl(var(--gold))]"
                    : overlay
                      ? "text-white/70 hover:text-white"
                      : "text-muted-foreground hover:text-foreground"
                }`}
              >
                More
                <ChevronDown
                  size={13}
                  strokeWidth={1.6}
                  className={`transition-transform ${moreOpen ? "rotate-180" : ""}`}
                />
              </button>
              {moreOpen ? (
                <div className="absolute right-0 top-[calc(100%+0.85rem)] z-[90] min-w-[12rem] border border-border bg-background py-2">
                  {MORE_NAV.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        `block px-4 py-2.5 text-[0.72rem] uppercase tracking-[0.18em] transition-colors ${
                          isActive
                            ? "text-[hsl(var(--gold))]"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`
                      }
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              ) : null}
            </div>
          </nav>

          <div className="ml-auto flex items-center gap-2 sm:gap-3 lg:ml-5">
            <ThemeToggle compact onDark={overlay} />
            <Link
              to={isAuthed ? "/dashboard" : "/login"}
              className={`hidden text-[0.72rem] uppercase tracking-[0.18em] transition-colors md:inline ${
                overlay
                  ? "text-white/75 hover:text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {isAuthed ? "Dashboard" : "Sign in"}
            </Link>
            <Link
              to="/checkout"
              aria-label={count ? `Cart, ${count} items` : "Cart"}
              className={`relative flex h-10 w-10 items-center justify-center transition-colors ${
                overlay
                  ? "text-white/80 hover:text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ShoppingCart size={17} strokeWidth={1.5} />
              {count > 0 ? (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center bg-[hsl(var(--primary))] px-1 text-[0.55rem] leading-none text-white">
                  {count}
                </span>
              ) : null}
            </Link>
            <button
              type="button"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className={`flex h-10 w-10 items-center justify-center lg:hidden ${overlay ? "text-white" : "text-foreground"}`}
            >
              {open ? (
                <X size={22} strokeWidth={1.4} />
              ) : (
                <Menu size={22} strokeWidth={1.4} />
              )}
            </button>
          </div>
        </div>

        {open ? (
          <div className="max-h-[calc(100dvh-4.25rem)] overflow-y-auto border-t border-border bg-background px-5 pb-10 pt-2 lg:hidden">
            <div className="flex flex-col">
              {NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`border-b border-border/70 py-3.5 font-display text-2xl ${
                    location.pathname === item.to
                      ? "text-[hsl(var(--gold))]"
                      : "text-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <div className="mt-6 grid grid-cols-2 gap-3">
                <Link
                  to={isAuthed ? "/dashboard" : "/login"}
                  className="border border-border py-3.5 text-center text-[0.7rem] uppercase tracking-[0.2em]"
                >
                  {isAuthed ? "Dashboard" : "Sign in"}
                </Link>
                <Link
                  to="/book"
                  className="border border-[hsl(var(--gold))]/70 py-3.5 text-center text-[0.7rem] uppercase tracking-[0.2em] text-[hsl(var(--gold))]"
                >
                  The Book
                </Link>
              </div>
            </div>
          </div>
        ) : null}
      </header>

      <main>{children}</main>
      <WhatsAppButton />

      <footer className="border-t border-border bg-[hsl(var(--surface))]">
        <div className="mx-auto grid max-w-[90rem] gap-12 px-5 py-16 sm:grid-cols-2 lg:grid-cols-12 md:px-10">
          <div className="sm:col-span-2 lg:col-span-4">
            <p className="font-display text-2xl">{LEGACY.name}</p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
              The official digital home of {LEGACY.name},{" "}
              {LEGACY.descriptor.toLowerCase()} — archive, autobiography, events
              and mentorship.
            </p>
            <p className="mt-5 text-[0.66rem] uppercase tracking-[0.22em] text-muted-foreground">
              Published by
            </p>
            <p className="mt-1 font-display text-lg text-[hsl(var(--gold))]">
              {PUBLISHER.name}
            </p>
            <p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">
              Official owner &amp; rights holder of the {LEGACY.legacyName}.
            </p>
            <a
              href={whatsappHref(
                `Hello ${PUBLISHER.name}. I am writing from the Peter Edochie Legacy platform.`,
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-block text-sm text-[hsl(var(--gold))] transition-colors hover:text-foreground"
            >
              WhatsApp {PUBLISHER.phoneDisplay}
            </a>
            <div className="rule-gold mt-6 w-24" />
          </div>
          <FooterCol
            title="Explore"
            links={[
              { to: "/peter-edochie", label: "Biography" },
              { to: "/legacy", label: "Legacy archive" },
              { to: "/gallery", label: "Gallery" },
              { to: "/news", label: "Journal" },
            ]}
          />
          <FooterCol
            title="Participate"
            links={[
              { to: "/events", label: "Events & tickets" },
              { to: "/shop", label: "Shop merchandise" },
              { to: "/mentorship", label: "Mentorship" },
              { to: "/sponsors", label: "Partnership" },
              { to: "/join", label: "Create account" },
              { to: "/track-order", label: "Track an order" },
              { to: "/#subscribe", label: "Subscribe to updates" },
            ]}
          />
          <FooterCol
            title="Contact"
            links={[
              { to: "/faq", label: "FAQ" },
              { to: "/contact", label: "General enquiries" },
              { to: "/contact", label: "Media & press" },
              { to: "/contact", label: "Publishing & rights" },
            ]}
          />
          <FooterCol
            title="Legal"
            links={[
              { to: "/terms", label: "Terms of Service" },
              { to: "/privacy", label: "Privacy Policy" },
              { to: "/contact", label: "Rights inquiries" },
            ]}
          />
        </div>
        <div className="border-t border-border/60">
          <div className="mx-auto flex max-w-[90rem] flex-col gap-2 px-5 py-6 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between md:px-10">
            <p>
              © {new Date().getFullYear()} {PUBLISHER.name}. All rights
              reserved.
            </p>
            <a
              href="http://skytechghana.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-secondary-container transition-colors font-body-md text-body-md"
            >
              <span>Designed By</span>
              <img src="/skytech.png" className="h-6 w-6 rounded-full" />
              <span className="font-medium">SkyTech Ghana</span>
            </a>
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <Link
                to="/terms"
                className="transition-colors hover:text-foreground"
              >
                Terms
              </Link>
              <span className="text-border">·</span>
              <Link
                to="/privacy"
                className="transition-colors hover:text-foreground"
              >
                Privacy
              </Link>
              <span className="text-border">·</span>
              <Link
                to="/faq"
                className="transition-colors hover:text-foreground"
              >
                FAQ
              </Link>
              <span className="text-border">·</span>
              <span className="text-[hsl(var(--gold))]">{BRAND.hashtag}</span>
              <span className="text-border">·</span>
              <span>Lagos · Enugu · Anambra State, Nigeria</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

const FooterCol = ({ title, links }) => (
  <div className="lg:col-span-2">
    <p className="eyebrow">{title}</p>
    <ul className="mt-5 space-y-3">
      {links.map((l, i) => (
        <li key={`${l.to}-${i}`}>
          <Link
            to={l.to}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {l.label}
          </Link>
        </li>
      ))}
    </ul>
  </div>
);

export default SiteLayout;
