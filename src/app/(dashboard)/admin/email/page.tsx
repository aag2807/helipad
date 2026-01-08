"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/lib/trpc";
import { useTranslations } from "@/hooks/use-translations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import {
  Mail,
  Save,
  TestTube,
  Server,
  Lock,
  User,
  RefreshCw,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

export default function EmailSettingsPage() {
  const { t } = useTranslations();
  const [showPassword, setShowPassword] = useState(false);
  const [testEmail, setTestEmail] = useState("");

  const emailConfigSchema = z.object({
    provider: z.enum(["smtp", "resend"]),
    smtpHost: z.string().min(1, t("emailSettings.smtpHostRequired")),
    smtpPort: z.coerce.number().int().min(1).max(65535, t("emailSettings.smtpPortInvalid")),
    smtpSecure: z.boolean(),
    smtpUser: z.string().min(1, t("emailSettings.smtpUserRequired")),
    smtpPassword: z.string().min(1, t("emailSettings.smtpPasswordRequired")),
    fromEmail: z.string().email(t("emailSettings.fromEmailInvalid")),
    fromName: z.string().min(1, t("emailSettings.fromNameRequired")),
    testEmail: z.string().email(t("emailSettings.fromEmailInvalid")).optional(),
  });

  type EmailConfigFormData = z.infer<typeof emailConfigSchema>;

  const { data: config, isLoading } = trpc.emailConfig.getCurrent.useQuery();
  const updateConfig = trpc.emailConfig.update.useMutation();
  const testEmailMutation = trpc.emailConfig.test.useMutation();

  const utils = trpc.useUtils();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<EmailConfigFormData>({
    resolver: zodResolver(emailConfigSchema),
    values: config
      ? {
          provider: config.provider as "smtp" | "resend",
          smtpHost: config.smtpHost || "",
          smtpPort: config.smtpPort || 587,
          smtpSecure: config.smtpSecure ?? false,
          smtpUser: config.smtpUser || "",
          smtpPassword: config.smtpPassword || "",
          fromEmail: config.fromEmail || "",
          fromName: config.fromName || "",
        }
      : undefined,
  });

  const onSubmit = async (data: EmailConfigFormData) => {
    if (!config) return;

    try {
      await updateConfig.mutateAsync({
        id: config.id,
        provider: data.provider,
        smtpHost: data.smtpHost,
        smtpPort: data.smtpPort,
        smtpSecure: data.smtpSecure,
        smtpUser: data.smtpUser,
        smtpPassword: data.smtpPassword,
        fromEmail: data.fromEmail,
        fromName: data.fromName,
      });

      await utils.emailConfig.getCurrent.invalidate();

      toast({
        type: "success",
        title: t("emailSettings.settingsSaved"),
        description: t("emailSettings.settingsSavedDescription"),
      });

      reset(data);
    } catch (error) {
      toast({
        type: "error",
        title: t("emailSettings.errorSaving"),
        description: error instanceof Error ? error.message : t("emailSettings.errorSavingDescription"),
      });
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail) {
      toast({
        type: "error",
        title: t("emailSettings.emailRequired"),
        description: t("emailSettings.emailRequiredDescription"),
      });
      return;
    }

    try {
      await testEmailMutation.mutateAsync({ toEmail: testEmail });

      toast({
        type: "success",
        title: t("emailSettings.testSent"),
        description: t("emailSettings.testSentDescription").replace("{email}", testEmail),
      });
    } catch (error) {
      toast({
        type: "error",
        title: t("emailSettings.testFailed"),
        description: error instanceof Error ? error.message : t("emailSettings.testFailedDescription"),
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 dark:border-amber-900 dark:bg-amber-950">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          <div>
            <h3 className="font-semibold text-amber-900 dark:text-amber-100">
              {t("emailSettings.noConfig")}
            </h3>
            <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
              {t("emailSettings.noConfigDescription")}
            </p>
            <code className="mt-2 block rounded bg-amber-100 px-2 py-1 text-xs dark:bg-amber-900">
              npm run migrate:turso
            </code>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("emailSettings.title")}</h1>
          <p className="mt-2 text-muted-foreground">
            {t("emailSettings.description")}
          </p>
        </div>
        <Badge variant={config.isActive ? "success" : "secondary"}>
          {config.isActive ? (
            <>
              <CheckCircle className="mr-1 h-3 w-3" />
              {t("emailSettings.active")}
            </>
          ) : (
            t("emailSettings.inactive")
          )}
        </Badge>
      </div>

      {/* Configuration Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* SMTP Server Settings */}
        <div className="rounded-lg border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <Server className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">{t("emailSettings.smtpServer")}</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="smtpHost" className="text-sm font-medium">
                {t("emailSettings.host")}
              </label>
              <Input
                id="smtpHost"
                {...register("smtpHost")}
                placeholder={t("emailSettings.hostPlaceholder")}
                error={errors.smtpHost?.message}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="smtpPort" className="text-sm font-medium">
                {t("emailSettings.port")}
              </label>
              <Input
                id="smtpPort"
                type="number"
                {...register("smtpPort")}
                placeholder={t("emailSettings.portPlaceholder")}
                error={errors.smtpPort?.message}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="smtpSecure"
                type="checkbox"
                {...register("smtpSecure")}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="smtpSecure" className="text-sm font-medium">
                {t("emailSettings.useTLS")}
              </label>
            </div>
          </div>

          <div className="mt-4 rounded-md bg-muted p-3 text-xs text-muted-foreground">
            <strong>{t("emailSettings.commonPorts")}</strong> {t("emailSettings.portsInfo")}
          </div>
        </div>

        {/* Authentication */}
        <div className="rounded-lg border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <Lock className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">{t("emailSettings.authentication")}</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="smtpUser" className="text-sm font-medium">
                {t("emailSettings.username")}
              </label>
              <Input
                id="smtpUser"
                {...register("smtpUser")}
                placeholder={t("emailSettings.usernamePlaceholder")}
                error={errors.smtpUser?.message}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="smtpPassword" className="text-sm font-medium">
                {t("emailSettings.password")}
              </label>
              <div className="relative">
                <Input
                  id="smtpPassword"
                  type={showPassword ? "text" : "password"}
                  {...register("smtpPassword")}
                  placeholder={t("emailSettings.passwordPlaceholder")}
                  error={errors.smtpPassword?.message}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-md bg-blue-50 p-3 text-xs text-blue-900 dark:bg-blue-950 dark:text-blue-100">
            <strong>{t("emailSettings.gmailNote")}</strong> {t("emailSettings.gmailNoteDescription")}{" "}
            <a
              href="https://myaccount.google.com/apppasswords"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              myaccount.google.com/apppasswords
            </a>
          </div>
        </div>

        {/* Sender Information */}
        <div className="rounded-lg border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">{t("emailSettings.senderInfo")}</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="fromEmail" className="text-sm font-medium">
                {t("emailSettings.fromEmail")}
              </label>
              <Input
                id="fromEmail"
                type="email"
                {...register("fromEmail")}
                placeholder={t("emailSettings.fromEmailPlaceholder")}
                error={errors.fromEmail?.message}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="fromName" className="text-sm font-medium">
                {t("emailSettings.fromName")}
              </label>
              <Input
                id="fromName"
                {...register("fromName")}
                placeholder={t("emailSettings.fromNamePlaceholder")}
                error={errors.fromName?.message}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between rounded-lg border bg-card p-6">
          <div>
            <p className="font-medium">{t("emailSettings.saveChanges")}</p>
            <p className="text-sm text-muted-foreground">
              {isDirty ? t("emailSettings.unsavedChanges") : t("emailSettings.allChangesSaved")}
            </p>
          </div>
          <Button
            type="submit"
            disabled={!isDirty || updateConfig.isPending}
            className="min-w-[120px]"
          >
            {updateConfig.isPending ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                {t("emailSettings.saving")}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {t("emailSettings.save")}
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Test Email */}
      <div className="rounded-lg border bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <TestTube className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">{t("emailSettings.testEmail")}</h2>
        </div>

        <p className="mb-4 text-sm text-muted-foreground">
          {t("emailSettings.testEmailDescription")}
        </p>

        <div className="flex gap-2">
          <Input
            type="email"
            placeholder={t("emailSettings.testEmailPlaceholder")}
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            className="flex-1"
          />
          <Button
            type="button"
            variant="secondary"
            onClick={handleTestEmail}
            disabled={testEmailMutation.isPending || !testEmail}
            className="min-w-[120px]"
          >
            {testEmailMutation.isPending ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                {t("emailSettings.sending")}
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                {t("emailSettings.sendTest")}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Help Section */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-6 dark:border-blue-900 dark:bg-blue-950">
        <h3 className="mb-2 font-semibold text-blue-900 dark:text-blue-100">
          {t("emailSettings.commonProviders")}
        </h3>
        <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
          <div>
            <strong>{t("emailSettings.gmailProvider")}</strong> {t("emailSettings.gmailInfo")}
          </div>
          <div>
            <strong>{t("emailSettings.sendgridProvider")}</strong> {t("emailSettings.sendgridInfo")}
          </div>
          <div>
            <strong>{t("emailSettings.mailgunProvider")}</strong> {t("emailSettings.mailgunInfo")}
          </div>
          <div>
            <strong>{t("emailSettings.sesProvider")}</strong> {t("emailSettings.sesInfo")}
          </div>
        </div>
      </div>
    </div>
  );
}
