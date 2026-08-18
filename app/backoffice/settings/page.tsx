import { PageHeading } from "@/components/backoffice/BackofficeUI";
import HqPushNotifications from "@/components/backoffice/HqPushNotifications";
import { requireStaff } from "@/lib/staff-auth";

export default async function BackofficeSettingsPage() {
  await requireStaff();
  return <><PageHeading eyebrow="Preferências" title="Definições" description="Controla os avisos do HQ neste dispositivo." /><div className="mt-6 max-w-3xl"><HqPushNotifications /></div></>;
}
