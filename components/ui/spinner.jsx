import { cn } from "@/lib/utils";
import { Loading03Icon } from "@hugeicons/core-free-icons";
import { Hugeicons } from "@/components/utils/hugeicons";

export function Spinner({ className, ...props }) {
  return (
    <Hugeicons
      icon={Loading03Icon}
      aria-label="Loading"
      className={cn("animate-spin", className)}
      role="status"
      {...props}
    />
  );
}
