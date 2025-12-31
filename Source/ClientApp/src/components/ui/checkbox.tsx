import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { CheckIcon } from "lucide-react";

import { cn } from "@/lib/utils";

function Checkbox({ className, ...props }: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
    return (
        <CheckboxPrimitive.Root
            data-slot="checkbox"
            className={cn(
                "peer border-border bg-input data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:border-primary focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20 aria-invalid:ring-destructive/20 aria-invalid:border-destructive size-4 shrink-0 rounded-[5px] border transition-all duration-200 outline-none hover:border-border/80 disabled:cursor-not-allowed disabled:opacity-40",
                className
            )}
            {...props}
        >
            <CheckboxPrimitive.Indicator data-slot="checkbox-indicator" className="grid place-content-center text-current">
                <CheckIcon className="size-3.5" />
            </CheckboxPrimitive.Indicator>
        </CheckboxPrimitive.Root>
    );
}

export { Checkbox };
