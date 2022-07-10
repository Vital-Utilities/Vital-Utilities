import { ProcessPriorityEnum } from "@vital/vitalservice";
import { Form, Select } from "antd";
import React from "react";

interface ProcessPriorityProps {
    value?: ProcessPriorityEnum;
    onChange: (value: ProcessPriorityEnum) => void;
}

export const ProcessPriority: React.FunctionComponent<ProcessPriorityProps> = ({ value, onChange }) => {
    return (
        <div style={{ height: "100%" }}>
            <Form.Item label="Process Priority">
                <Select value={value} onChange={e => onChange(e)}>
                    <Select.Option title="Affinity will not manage this setting." value={ProcessPriorityEnum.DontOverride}>
                        Dont Override
                    </Select.Option>
                    <Select.Option title="Specifies that the threads of this process run only when the system is idle, such as a screen saver. The threads of the process are preempted by the threads of any process running in a higher priority class. This priority class is inherited by child processes." value={ProcessPriorityEnum.Idle}>
                        Idle
                    </Select.Option>
                    <Select.Option title="Specifies that the process has priority above Idle but below Normal." value={ProcessPriorityEnum.BelowNormal}>
                        Below Normal
                    </Select.Option>
                    <Select.Option title="Specifies that the process has no special scheduling needs." value={ProcessPriorityEnum.Normal}>
                        Normal
                    </Select.Option>
                    <Select.Option title="Specifies that the process has priority higher than `Normal` but lower than `High`." value={ProcessPriorityEnum.AboveNormal}>
                        Above Normal
                    </Select.Option>
                    <Select.Option
                        title="Specifies that the process performs time-critical tasks that must be executed immediately, such as the Task List dialog, which must respond quickly when called by the user, regardless of the load on the operating system. The threads of the process preempt the threads of normal or idle priority class processes.
Use extreme care when specifying High for the process's priority class, because a high priority class application can use nearly all available processor time."
                        value={ProcessPriorityEnum.High}
                    >
                        High
                    </Select.Option>
                    <Select.Option
                        title="Specifies that the process has the highest possible priority.
The threads of a process with RealTime priority preempt the threads of all other processes, including operating system processes performing important tasks. Thus, a Real Time priority process that executes for more than a very brief interval can cause disk caches not to flush or cause the mouse to be unresponsive."
                        value={ProcessPriorityEnum.RealTime}
                    >
                        Real Time
                    </Select.Option>
                </Select>
            </Form.Item>
        </div>
    );
};
