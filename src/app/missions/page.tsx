import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getUserDashboardByEmail } from "@/lib/supabase";
import { MissionsView } from "@/components/missions/missions-view";

export default async function MissionsPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/");
  }

  let dashboard = null;

  try {
    dashboard = await getUserDashboardByEmail(session.user.email);
  } catch (error) {
    console.error("Erro ao carregar dashboard para missões:", error);
  }

  return (
    <MissionsView
      userName={dashboard?.userName ?? session.user.name ?? null}
      userNickName={dashboard?.userNickName ?? null}
      userImageUrl={dashboard?.userImageUrl ?? session.user.image ?? null}
      userRole={dashboard?.userRole ?? "user"}
      coins={dashboard?.coins ?? 0}
      diamonds={dashboard?.diamonds ?? 0}
      level={dashboard?.level ?? 1}
    />
  );
}
