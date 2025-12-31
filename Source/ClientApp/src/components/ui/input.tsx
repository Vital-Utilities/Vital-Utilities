import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
    return (
        <input
            type={type}
            data-slot="input"
            className={cn(
                "file:text-foreground placeholder:text-muted-foreground/60 selection:bg-primary selection:text-primary-foreground bg-input border-border h-9 w-full min-w-0 rounded-lg border px-3 py-1 text-base transition-all duration-200 outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40 md:text-sm",
                "focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:bg-input/80",
                "hover:border-border/80 hover:bg-input/80",
                "aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
                className
            )}
            {...props}
        />
    );
}

export { Input };
