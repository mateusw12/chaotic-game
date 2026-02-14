import { HomeView } from "@/components/home/home-view";
import { auth } from "@/lib/auth";
import { getUserDashboardByEmail } from "@/lib/supabase";

export default async function Home() {
  const session = await auth();
  const email = session?.user?.email;
  let dashboard = null;

  if (email) {
    try {
      dashboard = await getUserDashboardByEmail(email);
    } catch (error) {
      console.error("Erro ao carregar dashboard do usuário:", error);
    }
  }

  return (
    <HomeView
      isAuthenticated={Boolean(session)}
      userName={dashboard?.userName ?? session?.user?.name ?? null}
      userImageUrl={dashboard?.userImageUrl ?? session?.user?.image ?? null}
      userRole={dashboard?.userRole ?? "user"}
      coins={dashboard?.coins ?? 0}
      diamonds={dashboard?.diamonds ?? 0}
    />
  );
}
