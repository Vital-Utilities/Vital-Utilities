"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";

import { cn } from "@/lib/utils";

function Progress({ className, value, ...props }: React.ComponentProps<typeof ProgressPrimitive.Root>) {
    return (
        <ProgressPrimitive.Root data-slot="progress" className={cn("bg-secondary relative h-2 w-full overflow-hidden rounded-full ring-1 ring-white/5", className)} {...props}>
            <ProgressPrimitive.Indicator data-slot="progress-indicator" className="h-full w-full flex-1 transition-all duration-300 ease-out bg-gradient-to-r from-primary to-accent rounded-full" style={{ transform: `translateX(-${100 - (value || 0)}%)` }} />
        </ProgressPrimitive.Root>
    );
}

export { Progress };
