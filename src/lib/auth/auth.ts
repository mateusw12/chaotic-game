import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import {
  ensureUserProgressionInSupabase,
  ensureDefaultAdminRoleByEmail,
  ensureUserWalletInSupabase,
  registerDailyLoginReward,
  saveLoggedUserInSupabase,
} from "../supabase";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
  secret: process.env.AUTH_SECRET,
  events: {
    async signIn({ account, profile, user }) {
      if (!user.email || !account?.providerAccountId) {
        return;
      }

      try {
        const savedUser = await saveLoggedUserInSupabase({
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          email: user.email,
          name: user.name ?? (profile as { name?: string } | null)?.name ?? null,
          imageUrl: user.image ?? null,
        });

        await ensureDefaultAdminRoleByEmail(savedUser.email);
        await ensureUserWalletInSupabase(savedUser.id);
        await ensureUserProgressionInSupabase(savedUser.id);
        await registerDailyLoginReward(savedUser.id);
      } catch (error) {
        console.error("Erro ao salvar usuário no Supabase:", error);
      }
    },
  },
});
