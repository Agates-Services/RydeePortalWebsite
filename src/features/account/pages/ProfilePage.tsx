import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/features/auth/useAuth";
import { updateUser } from "@/api/riders";
import { changePassword } from "@/api/account";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import type { Profile } from "@/types/profile";

type TabKey = "profile" | "settings";

function toTitleCaseRole(role: string): "Rider" | "Admin" | "Operator" | "Customer" | string {
  const l = role.toLowerCase();
  if (l === "rider") return "Rider";
  if (l === "admin") return "Admin";
  if (l === "operator") return "Operator";
  if (l === "customer") return "Customer";
  return role;
}

function isEndpointGap(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { name?: unknown; status?: unknown };
  return e.name === "ApiError" && (e.status === 404 || e.status === 500);
}

function extractErrorMessage(err: unknown, fallback: string): string {
  if (!(err instanceof Error)) return fallback;
  const raw = err.message.trim();
  if (raw.startsWith("{")) {
    try {
      const parsed = JSON.parse(raw) as { error?: unknown; message?: unknown };
      if (typeof parsed.error === "string" && parsed.error) return parsed.error;
      if (typeof parsed.message === "string" && parsed.message) return parsed.message;
      return fallback;
    } catch {
      return fallback;
    }
  }
  return raw || fallback;
}

export default function ProfilePage() {
  const { t } = useTranslation();
  const { profile, userId, login } = useAuth();
  const [tab, setTab] = useState<TabKey>("profile");

  const initialName = profile?.name ?? "";
  const initialAddress = profile?.address ?? "";
  const [name, setName] = useState(initialName);
  const [address, setAddress] = useState(initialAddress);
  const initialRef = useRef({ name: initialName, address: initialAddress });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [discardOpen, setDiscardOpen] = useState(false);

  const dirty = name !== initialRef.current.name || address !== initialRef.current.address;

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwSubmitting, setPwSubmitting] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSaved, setPwSaved] = useState(false);
  const [pwUnavailable, setPwUnavailable] = useState(false);

  useEffect(() => {
    if (!saved) return;
    const id = window.setTimeout(() => setSaved(false), 4000);
    return () => window.clearTimeout(id);
  }, [saved]);

  useEffect(() => {
    if (!pwSaved) return;
    const id = window.setTimeout(() => setPwSaved(false), 4000);
    return () => window.clearTimeout(id);
  }, [pwSaved]);

  const role = toTitleCaseRole(profile?.role ?? "");
  const phone = profile?.phone ?? "";
  const isRider = role === "Rider";
  const activationStatus = profile?.activationStatus ?? "";

  const passwordFormError = useMemo(() => {
    if (!currentPw) return t("account.settings.password.currentRequired");
    if (newPw.length < 8) return t("account.settings.password.minLength");
    if (newPw !== confirmPw) return t("account.settings.password.mismatch");
    return "";
  }, [currentPw, newPw, confirmPw, t]);

  const handleSaveProfile = async () => {
    if (!profile || !phone) return;
    if (!dirty) return;
    setSaving(true);
    setSaveError(null);
    setSaved(false);
    if (name === initialRef.current.name && address === initialRef.current.address) {
      setSaving(false);
      return;
    }
    const merged: Profile = { ...profile, name, address };
    const fullProfile: Record<string, unknown> = { ...merged, role: merged.role.toLowerCase() };
    delete fullProfile.phone;
    try {
      await updateUser(phone, userId, fullProfile);
      login(merged);
      initialRef.current = { name, address };
      setSaved(true);
    } catch (err) {
      setSaveError(extractErrorMessage(err, t("account.profile.saveFailed")));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (dirty) {
      setDiscardOpen(true);
      return;
    }
    setName(initialRef.current.name);
    setAddress(initialRef.current.address);
  };

  const confirmDiscard = () => {
    setName(initialRef.current.name);
    setAddress(initialRef.current.address);
    setSaveError(null);
    setDiscardOpen(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;
    if (passwordFormError) {
      setPwError(passwordFormError);
      return;
    }
    setPwSubmitting(true);
    setPwError(null);
    setPwSaved(false);
    try {
      const res = await changePassword({ phone, currentPassword: currentPw, newPassword: newPw });
      if (res.success) {
        setPwSaved(true);
        setCurrentPw("");
        setNewPw("");
        setConfirmPw("");
      } else {
        setPwError(res.error ?? t("account.settings.password.changeFailed"));
      }
    } catch (err) {
      if (isEndpointGap(err)) {
        setPwUnavailable(true);
      }
      setPwError(extractErrorMessage(err, t("account.settings.password.changeFailed")));
    } finally {
      setPwSubmitting(false);
    }
  };

  const tabId = (k: TabKey) => `fqa-account-tab-${k}`;
  const panelId = (k: TabKey) => `fqa-account-panel-${k}`;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6">
      <div role="tablist" aria-label={t("account.profile.title")} className="flex gap-1 border-b border-border">
        {(["profile", "settings"] as TabKey[]).map((k) => (
          <button
            key={k}
            id={tabId(k)}
            role="tab"
            type="button"
            aria-selected={tab === k}
            aria-controls={panelId(k)}
            tabIndex={tab === k ? 0 : -1}
            onClick={() => setTab(k)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === k
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t(`account.profile.tabs.${k}`)}
          </button>
        ))}
      </div>

      {tab === "profile" && (
        <div id={panelId("profile")} role="tabpanel" aria-labelledby={tabId("profile")}>
          <Card>
            <CardHeader>
              <CardTitle>{t("account.profile.title")}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div>
                <Label htmlFor="fqa-account-name">{t("account.profile.fields.name")}</Label>
                <Input
                  id="fqa-account-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1.5"
                  autoComplete="name"
                />
              </div>
              <div>
                <Label htmlFor="fqa-account-address">{t("account.profile.fields.address")}</Label>
                <Input
                  id="fqa-account-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="mt-1.5"
                  autoComplete="street-address"
                />
              </div>
              <div>
                <Label htmlFor="fqa-account-phone">{t("account.profile.fields.phone")}</Label>
                <Input
                  id="fqa-account-phone"
                  value={phone}
                  readOnly
                  className="mt-1.5 bg-muted"
                  aria-readonly="true"
                />
              </div>
              <div>
                <Label htmlFor="fqa-account-role">{t("account.profile.fields.role")}</Label>
                <Input
                  id="fqa-account-role"
                  value={role}
                  readOnly
                  className="mt-1.5 bg-muted"
                  aria-readonly="true"
                />
              </div>
              {isRider && activationStatus && (
                <div>
                  <Label>{t("account.profile.fields.activationStatus")}</Label>
                  <div className="mt-1.5">
                    <Badge variant="outline" data-testid="fqa-account-activation">
                      {activationStatus}
                    </Badge>
                  </div>
                </div>
              )}

              {saved && (
                <p role="status" className="text-sm text-success">
                  {t("account.profile.saved")}
                </p>
              )}
              {saveError && (
                <p role="alert" className="text-sm text-destructive">
                  {saveError}
                </p>
              )}

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={handleCancel} disabled={saving}>
                  {t("account.profile.cancel")}
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={!dirty || saving}
                  aria-busy={saving || undefined}
                  data-testid="fqa-account-save"
                >
                  {saving ? (
                    <>
                      <Loader2 size={14} aria-hidden="true" className="me-2 animate-spin" />
                      {t("account.profile.saving")}
                    </>
                  ) : (
                    t("account.profile.save")
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "settings" && (
        <div id={panelId("settings")} role="tabpanel" aria-labelledby={tabId("settings")} className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("account.settings.language.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              <LanguageSwitcher />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("account.settings.password.title")}</CardTitle>
            </CardHeader>
            <CardContent>
              {pwUnavailable ? (
                <p className="text-sm text-muted-foreground">
                  {t("account.settings.password.unavailable")}
                </p>
              ) : (
                <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
                  <div>
                    <Label htmlFor="fqa-account-currentpw">{t("account.settings.password.current")}</Label>
                    <Input
                      id="fqa-account-currentpw"
                      type="password"
                      value={currentPw}
                      onChange={(e) => setCurrentPw(e.target.value)}
                      className="mt-1.5"
                      autoComplete="current-password"
                    />
                  </div>
                  <div>
                    <Label htmlFor="fqa-account-newpw">{t("account.settings.password.new")}</Label>
                    <Input
                      id="fqa-account-newpw"
                      type="password"
                      value={newPw}
                      onChange={(e) => setNewPw(e.target.value)}
                      className="mt-1.5"
                      autoComplete="new-password"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t("account.settings.password.hint")}
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="fqa-account-confirmpw">{t("account.settings.password.confirm")}</Label>
                    <Input
                      id="fqa-account-confirmpw"
                      type="password"
                      value={confirmPw}
                      onChange={(e) => setConfirmPw(e.target.value)}
                      className="mt-1.5"
                      autoComplete="new-password"
                    />
                  </div>

                  {pwSaved && (
                    <p role="status" className="text-sm text-success">
                      {t("account.settings.password.changed")}
                    </p>
                  )}
                  {pwError && (
                    <p role="alert" className="text-sm text-destructive">
                      {pwError}
                    </p>
                  )}

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={pwSubmitting}
                      aria-busy={pwSubmitting || undefined}
                      data-testid="fqa-account-changepw"
                    >
                      {pwSubmitting ? (
                        <>
                          <Loader2 size={14} aria-hidden="true" className="me-2 animate-spin" />
                          {t("account.settings.password.submitting")}
                        </>
                      ) : (
                        t("account.settings.password.submit")
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <AlertDialog open={discardOpen} onOpenChange={setDiscardOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("account.profile.discardTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("account.profile.discardDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDiscard}>
              {t("account.profile.discardConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
