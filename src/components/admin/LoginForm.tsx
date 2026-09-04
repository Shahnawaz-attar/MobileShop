"use client";

import { useActionState } from "react";
import { loginAction } from "@/server/auth/actions";
import type { ActionResult } from "@/types";
import { Button } from "@/components/ui/button";

export function LoginForm() {
  const [state, formAction, isPending] = useActionState<ActionResult<null> | null, FormData>(
    loginAction,
    null
  );

  return (
    <form action={formAction} className="space-y-4">
      {state?.success === false && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {state.error}
        </div>
      )}

      <div className="space-y-2">
        <label
          htmlFor="login-email"
          className="block text-sm font-medium text-foreground"
        >
          Email
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          defaultValue={"owner@shreemobiles.com"}
          autoComplete="email"
          required
          disabled={isPending}
          className="block w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="owner@example.com"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="login-password"
          className="block text-sm font-medium text-foreground"
        >
          Password
        </label>
        <input
          id="login-password"
          name="password"
          defaultValue={"Admin@123456"}
          type="password"
          autoComplete="current-password"
          required
          disabled={isPending}
          className="block w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="••••••••"
        />
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="w-full h-11 text-base sm:text-sm font-semibold rounded-lg shadow-sm"
      >
        {isPending ? "Signing in…" : "Sign In"}
      </Button>
    </form>
  );
}
