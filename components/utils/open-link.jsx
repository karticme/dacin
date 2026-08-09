import cn from "cnfast";

export function OpenLink({ url, className, ...props }) {
  return (
    <button
      type="link"
      onClick={() =>
        import("@/lib/telegram").then((module) => module.openUrl(url))
      }
      className={cn(
        "cursor-pointer text-info transition-all hover:underline underline-offset-4",
        className,
      )}
      {...props}
    />
  );
}
