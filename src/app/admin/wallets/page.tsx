import { redirect } from "next/navigation";
import { WalletsAdminView } from "../../../components/admin/wallets-admin-view";
import { auth } from "@/lib/auth";
import { getUserRoleByEmail, listAdminUserWallets } from "@/lib/supabase";

export default async function WalletsAdminPage() {
    const session = await auth();
    const email = session?.user?.email;

    if (!email) {
        redirect("/");
    }

    const currentRole = await getUserRoleByEmail(email);

    if (currentRole !== "admin") {
        redirect("/");
    }

    const wallets = await listAdminUserWallets();

    return <WalletsAdminView wallets={wallets} />;
}
