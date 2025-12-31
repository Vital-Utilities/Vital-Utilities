import { ProcessPriorityEnum } from "@vital/vitalservice";
import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ProcessPriorityProps {
    value?: ProcessPriorityEnum;
    onChange: (value: ProcessPriorityEnum) => void;
}

export const ProcessPriority: React.FunctionComponent<ProcessPriorityProps> = ({ value, onChange }) => {
    return (
        <div className="grid grid-cols-[120px_1fr] items-center gap-4">
            <Label>Process Priority</Label>
            <Select value={value} onValueChange={e => onChange(e as ProcessPriorityEnum)}>
                <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value={ProcessPriorityEnum.DontOverride} title="Affinity will not manage this setting.">
                        Dont Override
                    </SelectItem>
                    <SelectItem value={ProcessPriorityEnum.Idle} title="Specifies that the threads of this process run only when the system is idle, such as a screen saver. The threads of the process are preempted by the threads of any process running in a higher priority class. This priority class is inherited by child processes.">
                        Idle
                    </SelectItem>
                    <SelectItem value={ProcessPriorityEnum.BelowNormal} title="Specifies that the process has priority above Idle but below Normal.">
                        Below Normal
                    </SelectItem>
                    <SelectItem value={ProcessPriorityEnum.Normal} title="Specifies that the process has no special scheduling needs.">
                        Normal
                    </SelectItem>
                    <SelectItem value={ProcessPriorityEnum.AboveNormal} title="Specifies that the process has priority higher than `Normal` but lower than `High`.">
                        Above Normal
                    </SelectItem>
                    <SelectItem
                        value={ProcessPriorityEnum.High}
                        title="Specifies that the process performs time-critical tasks that must be executed immediately, such as the Task List dialog, which must respond quickly when called by the user, regardless of the load on the operating system. The threads of the process preempt the threads of normal or idle priority class processes. Use extreme care when specifying High for the process's priority class, because a high priority class application can use nearly all available processor time."
                    >
                        High
                    </SelectItem>
                    <SelectItem
                        value={ProcessPriorityEnum.RealTime}
                        title="Specifies that the process has the highest possible priority. The threads of a process with RealTime priority preempt the threads of all other processes, including operating system processes performing important tasks. Thus, a Real Time priority process that executes for more than a very brief interval can cause disk caches not to flush or cause the mouse to be unresponsive."
                    >
                        Real Time
                    </SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
};
