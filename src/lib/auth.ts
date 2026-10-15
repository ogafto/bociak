import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { readSession } from "./session";
import { findUserById, setUserPlan } from "./db";
import { getPlan } from "./catalog";

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  plan: ReturnType<typeof getPlan>;
  planUntil: string | null;
  /** Czy konto wykorzystało już okres próbny Bota Pro. */
  trialUsed: boolean;
  createdAt: string;
};

// Data Access Layer: jedno miejsce, które czyta sesję i zwraca bezpieczny obiekt użytkownika.
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await readSession();
  if (!session) return null;
  const user = findUserById(session.userId);
  if (!user) return null;

  // Wygasły płatny pakiet wraca do darmowego.
  let planId = user.plan;
  if (user.plan_until && new Date(user.plan_until) < new Date()) {
    setUserPlan(user.id, "start", null);
    planId = "start";
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    plan: getPlan(planId),
    planUntil: planId === "start" ? null : user.plan_until,
    trialUsed: user.trial_used === 1,
    createdAt: user.created_at,
  };
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/logowanie");
  return user;
}
