import { useI18n } from "../i18n/I18nContext";

export function Spinner({ label }: { label?: string }) {
  const { t } = useI18n();
  return <p className="spinner">{label ?? t("common.loading")}</p>;
}

export function ErrorBanner({ message }: { message: string }) {
  return <p className="error-banner">{message}</p>;
}

export function Empty({ message }: { message: string }) {
  return <p className="empty">{message}</p>;
}
