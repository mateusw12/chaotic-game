import { redirect } from "next/navigation";
import { StorePacksView } from "@/components/admin/store-packs-view";
import { auth } from "@/lib/auth";
import { getUserRoleByEmail, listAdminStorePacks } from "@/lib/supabase";

export default async function StorePacksAdminPage() {
    const session = await auth();
    const email = session?.user?.email;

    if (!email) {
        redirect("/");
    }

    const currentRole = await getUserRoleByEmail(email);

    if (currentRole !== "admin") {
        redirect("/");
    }

    const packs = await listAdminStorePacks();

    return <StorePacksView packs={packs} />;
}
