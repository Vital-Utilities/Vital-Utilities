import React from "react";
import { useSelector } from "react-redux";
import type { VitalState } from "../../Redux/States";
import { AffinityEditor } from "../../components/Affinity/AffinityEditor";
import { ProcessPriority } from "./ProcessPriority";
import { type AddProccessRequest, ProcessPriorityEnum } from "@vital/vitalservice";
import { profileApi } from "../../Redux/actions/tauriApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AddProcessViewProps {
    name: string;
    executionPath: string;
    assignedAffinity?: number[];
    profileId: number;
    onSuccess: () => void;
    onBack: () => void;
}

export const AddProcessView: React.FunctionComponent<AddProcessViewProps> = props => {
    const totalThreads = useSelector<VitalState, number | undefined>(state => state.machineState.static?.cpu.threadCount);
    const [addProcessRequest, setAddProcessRequest] = React.useState<AddProccessRequest>({
        processName: props.name,
        executionPath: props.executionPath,
        alias: "",
        processPriority: ProcessPriorityEnum.DontOverride,
        affinity: generateDefaultAffinity(),
        profileId: props.profileId
    });

    function generateDefaultAffinity() {
        if (!totalThreads) throw "totalThreads should not be undefined";
        let array: number[] = [];
        if (!props.assignedAffinity) {
            for (let index = 0; index < totalThreads; index++) {
                array.push(index);
            }
        } else {
            array = { ...props.assignedAffinity };
        }
        return array;
    }

    async function SendRequest() {
        profileApi.addProcessConfig(addProcessRequest).then(() => {
            props.onSuccess();
        });
    }

    return (
        <div style={{ height: "100%" }}>
            <div className="space-y-4">
                <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                    <Label>Process Name</Label>
                    <span>{props.name}</span>
                </div>
                <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                    <Label htmlFor="alias">Alias</Label>
                    <Input
                        id="alias"
                        value={addProcessRequest.alias}
                        onChange={e =>
                            setAddProcessRequest({
                                ...addProcessRequest,
                                alias: e.target.value
                            })
                        }
                        placeholder="Give this an alias if the name is not friendly"
                    />
                </div>
                <ProcessPriority value={addProcessRequest.processPriority} onChange={e => setAddProcessRequest({ ...addProcessRequest, processPriority: e })} />
                <div className="grid grid-cols-[120px_1fr] items-start gap-4">
                    <Label>Affinity</Label>
                    <AffinityEditor affinity={addProcessRequest.affinity} onChange={e => setAddProcessRequest({ ...addProcessRequest, affinity: e })} />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                    <Button variant="secondary" onClick={props.onBack}>
                        Back
                    </Button>
                    <Button onClick={SendRequest}>Add process to managed</Button>
                </div>
            </div>
        </div>
    );
};
