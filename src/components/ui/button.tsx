import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-violet-600 text-white shadow-lg shadow-violet-200 hover:bg-violet-700 hover:shadow-xl hover:shadow-violet-300 hover:-translate-y-0.5",
        destructive:
          "bg-red-600 text-white shadow-lg shadow-red-200 hover:bg-red-700 hover:shadow-xl hover:shadow-red-300 hover:-translate-y-0.5",
        outline:
          "border border-zinc-200 bg-white shadow-sm hover:bg-zinc-50 hover:text-zinc-900 hover:border-zinc-300 hover:shadow-md hover:-translate-y-0.5",
        secondary:
          "bg-zinc-100 text-zinc-900 hover:bg-zinc-200 hover:shadow-sm hover:-translate-y-0.5",
        ghost: "hover:bg-zinc-100 hover:text-zinc-900",
        link: "text-violet-600 underline-offset-4 hover:underline hover:text-violet-700",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3 text-xs",
        lg: "h-11 rounded-xl px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };

