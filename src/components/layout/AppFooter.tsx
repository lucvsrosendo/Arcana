import { Link } from "react-router-dom";
import { uiCopy } from "@/data/i18n";
import type { LanguageCode } from "@/types/tarot";

type AppFooterProps = {
  language: LanguageCode;
};

export function AppFooter({ language }: AppFooterProps) {
  const copy = uiCopy[language];

  return (
    <footer className="app-footer">
      <div className="app-footer__accent zen-accent-bar" aria-hidden="true" />
      <p className="app-footer__brand">
        <span className="app-footer__mark" aria-hidden="true">XVIII</span>
        {copy.appBrand}
      </p>
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
      <p className="app-footer__meta">{copy.appBrand}</p>
    </footer>
  );
}
