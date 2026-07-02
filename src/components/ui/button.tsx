import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type ButtonVariant = "default" | "outline" | "ghost";
type ButtonSize = "default" | "lg" | "icon";

const variantClasses: Record<ButtonVariant, string> = {
  default: "bg-primary text-primary-foreground hover:bg-primary/85",
  outline:
    "border-border bg-background text-foreground hover:bg-muted hover:text-foreground",
  ghost: "bg-transparent text-foreground hover:bg-muted hover:text-foreground",
};

const sizeClasses: Record<ButtonSize, string> = {
  default: "h-10 gap-2 px-4",
  lg: "h-11 gap-2.5 px-5",
  icon: "size-10",
};

const baseClasses =
  "inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-lg border border-transparent text-sm font-medium transition-all outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0";

type SharedButtonProps = {
  children: ReactNode;
  className?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
};

type ButtonAsButtonProps = SharedButtonProps &
  ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: never;
  };

type ButtonAsLinkProps = SharedButtonProps &
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
  };

export type ButtonProps = ButtonAsButtonProps | ButtonAsLinkProps;

function isLinkButton(props: ButtonProps): props is ButtonAsLinkProps {
  return typeof props.href === "string";
}

function getLinkProps({
  href,
  children,
  className,
  variant,
  size,
  ...linkProps
}: ButtonAsLinkProps) {
  void children;
  void className;
  void variant;
  void size;

  return { href, linkProps };
}

function getNativeButtonProps({
  children,
  className,
  variant,
  size,
  ...buttonProps
}: ButtonAsButtonProps) {
  void children;
  void className;
  void variant;
  void size;

  return buttonProps;
}

export function Button(props: ButtonProps) {
  const { children, className, variant = "default", size = "default" } = props;
  const classes = cn(baseClasses, variantClasses[variant], sizeClasses[size], className);

  if (isLinkButton(props)) {
    const { href, linkProps } = getLinkProps(props);
    return (
      <Link href={href} className={classes} {...linkProps}>
        {children}
      </Link>
    );
  }

  const buttonProps = getNativeButtonProps(props);

  return (
    <button className={classes} {...buttonProps}>
      {children}
    </button>
  );
}
