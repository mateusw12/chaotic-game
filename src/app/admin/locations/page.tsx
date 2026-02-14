import { redirect } from "next/navigation";
import { LocationsView } from "@/components/admin/locations-view";
import { auth } from "@/lib/auth";
import { getUserRoleByEmail, listLocations } from "@/lib/supabase";

export default async function LocationsPage() {
    const session = await auth();
    const email = session?.user?.email;

    if (!email) {
        redirect("/");
    }

    const currentRole = await getUserRoleByEmail(email);

    if (currentRole !== "admin") {
        redirect("/");
    }

    const locations = await listLocations();

    return <LocationsView locations={locations} />;
}
