import { redirect } from "next/navigation";
import { ProfileView } from "@/components/player/profile-view";
import { auth } from "@/lib/auth";
import { getUserDashboardByEmail, getUserProfileByEmail } from "@/lib/supabase";

export default async function ProfilePage() {
    const session = await auth();
    const email = session?.user?.email;

    if (!email) {
        redirect("/");
    }

    let dashboard = null;
    let profile = null;

    try {
        [dashboard, profile] = await Promise.all([
            getUserDashboardByEmail(email),
            getUserProfileByEmail(email),
        ]);
    } catch (error) {
        console.error("Erro ao carregar perfil:", error);
    }

    return (
        <ProfileView
            name={profile?.name ?? dashboard?.userName ?? session.user?.name ?? null}
            nickName={profile?.nickName ?? dashboard?.userNickName ?? null}
            imageUrl={profile?.imageUrl ?? dashboard?.userImageUrl ?? session.user?.image ?? null}
            userRole={dashboard?.userRole ?? "user"}
            coins={dashboard?.coins ?? 0}
            diamonds={dashboard?.diamonds ?? 0}
        />
    );
}
