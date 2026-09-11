"use client";

import { useEffect, useState } from "react";

import { TelegramIcon } from "@/components/ui/form-fields";
import { IdIcon, GroupFilledIcon, MailFilledIcon, PencilIcon, ProfileUserIcon } from "@/components/ui/icons";
import { useProfileStore } from "@/lib/store/profile-store";

import { ProfileEditModal, type ProfileFormData } from "./profile-edit-modal";

export function ProfileCard() {
  const profile = useProfileStore((state) => state.profile);
  const status = useProfileStore((state) => state.status);
  const error = useProfileStore((state) => state.error);
  const fetchProfile = useProfileStore((state) => state.fetch);
  const updateProfile = useProfileStore((state) => state.update);
  const [editOpen, setEditOpen] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSave = async (data: ProfileFormData) => {
    if (!profile) return;
    setSaveError(null);
    try {
      await updateProfile({
        userId: profile.userId,
        fullName: data.name,
        group: data.group,
        telegram: data.telegram,
      });
      setEditOpen(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Не удалось сохранить профиль");
    }
  };

  const cardShell = (children: React.ReactNode) => (
    <div className="flex w-full max-w-[440px] flex-col items-center justify-between rounded-[18px] border-2 border-secondary bg-white px-6 pt-9 pb-6 sm:px-9 xl:max-w-[388px]">
      {children}
    </div>
  );

  if (status === "idle" || status === "loading") {
    return cardShell(<p className="text-[0.9375rem] text-ink/70">Загружаем профиль…</p>);
  }

  if (status === "error" || !profile) {
    return cardShell(
      <p role="alert" className="text-[0.9375rem] text-error">
        {error ?? "Не удалось загрузить профиль"}
      </p>,
    );
  }

  const rows = [
    { label: "ID", value: String(profile.userId), Icon: IdIcon, labelPaddingLeft: 3 },
    { label: "Группа", value: profile.group, Icon: GroupFilledIcon, labelPaddingLeft: 0 },
    { label: "Телеграм", value: profile.telegram, Icon: TelegramIcon, labelPaddingLeft: 9 },
    { label: "Почта", value: profile.email, Icon: MailFilledIcon, labelPaddingLeft: 4 },
  ];

  return (
    <div className="flex w-full max-w-[440px] flex-col items-center justify-between rounded-[18px] border-2 border-secondary bg-white px-6 pt-9 pb-6 sm:px-9 xl:max-w-[388px]">
      <div className="flex w-full flex-col items-center">
        <div className="flex size-[150px] shrink-0 items-center justify-center rounded-full bg-mist sm:size-[198px]">
          <ProfileUserIcon className="size-[76px] text-ink sm:size-[100px]" />
        </div>

        <p className="mt-6 text-center text-[1.375rem] font-bold text-ink sm:text-[1.625rem]">
          {profile.fullName}
        </p>

        <div className="mt-6 flex w-full flex-col">
          {rows.map(({ label, value, Icon, labelPaddingLeft }, index) => (
            <div
              key={label}
              className={`flex items-center gap-3 py-3 ${
                index !== 0 ? "border-t border-ink/15" : ""
              }`}
            >
              <Icon className="h-6 w-auto shrink-0 text-ink" />
              <span
                className="text-[0.9375rem] text-ink/70"
                style={{ paddingLeft: labelPaddingLeft }}
              >
                {label}
              </span>
              <span className="ml-auto truncate text-[1rem] font-bold text-ink sm:text-[1.0625rem]">
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {saveError && (
        <p role="alert" className="mt-2 text-[0.8125rem] text-error">
          {saveError}
        </p>
      )}

      <button
        type="button"
        onClick={() => setEditOpen(true)}
        className="mt-4 flex h-[52px] w-full max-w-[300px] cursor-pointer items-center justify-center gap-2.5 rounded-[14px] bg-ink font-hand text-[1.25rem] uppercase text-white transition-transform hover:scale-[1.01]"
      >
        <PencilIcon className="size-5 shrink-0" />
        Редактировать профиль
      </button>

      <ProfileEditModal
        key={editOpen ? "open" : "closed"}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        initialData={{ name: profile.fullName, group: profile.group, telegram: profile.telegram }}
        email={profile.email}
        onSave={handleSave}
      />
    </div>
  );
}
