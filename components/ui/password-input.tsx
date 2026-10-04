"use client";

import { forwardRef, useState } from "react";
import clsx from "clsx";
import { Input } from "./input";

type PasswordInputProps = Omit<React.ComponentProps<typeof Input>, "type">;

/** A password <Input> with a show/hide toggle, so a user can check what
 * they actually typed before submitting — reused across login, signup,
 * and the reset-password screen. */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, ...props }, ref) => {
    const [visible, setVisible] = useState(false);

    return (
      <div className="relative">
        <Input
          ref={ref}
          type={visible ? "text" : "password"}
          className={clsx("pr-11", className)}
          {...props}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          title={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted transition-colors hover:text-text"
        >
          {visible ? "🙈" : "👁️"}
        </button>
      </div>
    );
  },
);
PasswordInput.displayName = "PasswordInput";
