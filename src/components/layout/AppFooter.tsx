import { Link } from "react-router-dom";
import { uiCopy } from "@/data/i18n";
import type { LanguageCode } from "@/types/tarot";

type AppFooterProps = {
  language: LanguageCode;
};

const currentYear = new Date().getFullYear();

export function AppFooter({ language }: AppFooterProps) {
  const copy = uiCopy[language];

  return (
    <footer className="app-footer">
      <div className="app-footer__inner">
        <div className="app-footer__identity">
          <div className="app-footer__accent zen-accent-bar" aria-hidden="true" />
          <p className="app-footer__brand">
            <span className="app-footer__mark" aria-hidden="true">XVIII</span>
            {copy.appBrand}
          </p>
          <p className="app-footer__tagline">{copy.footerTagline}</p>
        </div>
        <nav className="app-footer__nav" aria-label={copy.footerLegalNav}>
          <Link to="/privacy" className="app-footer__link">
            {copy.legalPrivacy}
          </Link>
          <Link to="/terms" className="app-footer__link">
            {copy.legalTerms}
          </Link>
          <Link to="/cookies" className="app-footer__link">
            {copy.legalCookies}
          </Link>
          <Link to="/settings" className="app-footer__link">
            {copy.account}
          </Link>
        </nav>
      </div>
      <div className="app-footer__base">
        <p className="app-footer__meta">{copy.footerDisclaimer}</p>
        <p className="app-footer__meta">
          © {currentYear} {copy.appBrand}
        </p>
      </div>
    </footer>
  );
}
