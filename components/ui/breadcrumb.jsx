"use client";
import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cn, Hugeicons } from "@/lib/utils";
import {
  ArrowRight01Icon,
  MoreHorizontalIcon,
} from "@hugeicons/core-free-icons";

export function Breadcrumb({ ...props }) {
  return <nav aria-label="breadcrumb" data-slot="breadcrumb" {...props} />;
}

export function BreadcrumbList({ className, ...props }) {
  return (
    <ol
      className={cn(
        "wrap-break-word flex flex-wrap items-center gap-1.5 text-muted-foreground text-sm",
        className,
      )}
      data-slot="breadcrumb-list"
      {...props}
    />
  );
}

export function BreadcrumbItem({ className, ...props }) {
  return (
    <li
      className={cn("inline-flex items-center gap-1.5", className)}
      data-slot="breadcrumb-item"
      {...props}
    />
  );
}

export function BreadcrumbLink({ className, render, ...props }) {
  const defaultProps = {
    className: cn("transition-colors hover:text-foreground", className),
    "data-slot": "breadcrumb-link",
  };

  return useRender({
    defaultTagName: "a",
    props: mergeProps(defaultProps, props),
    render,
  });
}

export function BreadcrumbPage({ className, ...props }) {
  return (
    <span
      aria-current="page"
      className={cn("font-normal text-foreground", className)}
      data-slot="breadcrumb-page"
      {...props}
    />
  );
}

export function BreadcrumbSeparator({ children, className, ...props }) {
  return (
    <li
      aria-hidden="true"
      className={cn("opacity-80 [&>svg]:size-3.5", className)}
      data-slot="breadcrumb-separator"
      role="presentation"
      {...props}
    >
      {children ?? <Hugeicons icon={ArrowRight01Icon} />}
    </li>
  );
}

export function BreadcrumbEllipsis({ className, ...props }) {
  return (
    <span
      aria-hidden="true"
      className={className}
      data-slot="breadcrumb-ellipsis"
      role="presentation"
      {...props}
    >
      <Hugeicons icon={MoreHorizontalIcon} className="size-4" />
      <span className="sr-only">More</span>
    </span>
  );
}
