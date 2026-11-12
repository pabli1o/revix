import Link, { type LinkProps } from "next/link";
import clsx from "clsx";
import { VARIANT_CLASSES, SIZE_CLASSES, type Variant, type Size } from "./button";

type AnchorProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">;

/** <Button>'s exact visual variants, for the places a call to action is a
 * navigation (landing page CTAs) rather than an in-page action — avoids
 * nesting a <button> inside the <a> that Link renders. */
export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: LinkProps & AnchorProps & { variant?: Variant; size?: Size; className?: string; children?: React.ReactNode }) {
  return (
    <Link
      {...props}
      className={clsx(
        "inline-flex items-center justify-center font-medium transition-all duration-150",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      )}
    >
      {children}
    </Link>
  );
}
