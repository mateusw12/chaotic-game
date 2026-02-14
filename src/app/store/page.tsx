import { redirect } from "next/navigation";
import { StoreView } from "@/components/store/store-view";
import { auth } from "@/lib/auth";

export default async function StorePage() {
    const session = await auth();

    if (!session?.user?.email) {
        redirect("/");
    }

    return <StoreView userName={session.user.name ?? null} userImageUrl={session.user.image ?? null} />;
}
