import { redirect } from "next/navigation";
import { PermissionsView } from "@/components/admin/permissions-view";
import { auth } from "@/lib/auth";
import { getUserRoleByEmail, listUsersWithRoles } from "@/lib/supabase";

export default async function PermissionsPage() {
    const session = await auth();
    const email = session?.user?.email;

    if (!email) {
        redirect("/");
    }

    const currentRole = await getUserRoleByEmail(email);

    if (currentRole !== "admin") {
        redirect("/");
    }

    const users = await listUsersWithRoles();

    return <PermissionsView users={users} />;
}
