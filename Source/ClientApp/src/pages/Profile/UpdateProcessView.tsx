import { ManagedModelDto, UpdateManagedRequest } from "@vital/vitalservice";
import React from "react";
import { AffinityEditor } from "../../components/Affinity/AffinityEditor";
import { profileApi } from "../../Redux/actions/tauriApi";
import { ProcessPriority } from "./ProcessPriority";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import toast from "react-hot-toast";

interface UpdateProcessViewProps {
    managedModel: ManagedModelDto;
    onCancel: () => void;
    onSubmit: () => void;
}

export const UpdateProcessView: React.FunctionComponent<UpdateProcessViewProps> = ({ managedModel, onCancel, onSubmit }) => {
    const [model, setModel] = React.useState<ManagedModelDto>(managedModel);

    async function SendRequest() {
        const request: UpdateManagedRequest = { managedModelDto: model };
        profileApi
            .updateProcessConfig(request)
            .then(() => {
                onSubmit();
            })
            .catch(e => toast.error(String(e)));
    }

    return (
        <div style={{ height: "100%" }}>
            <div className="space-y-4">
                <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                    <Label>Process Name</Label>
                    <span>{model.processName}</span>
                </div>
                <div className="grid grid-cols-[120px_1fr] items-center gap-4">
                    <Label htmlFor="alias">Alias</Label>
                    <Input id="alias" value={model.alias} onChange={e => setModel({ ...model, alias: e.target.value })} placeholder="Give this an alias if the name is not friendly" />
                </div>
                <ProcessPriority value={model.processPriority} onChange={e => setModel({ ...model, processPriority: e })} />
                <div className="grid grid-cols-[120px_1fr] items-start gap-4">
                    <Label>Affinity</Label>
                    <AffinityEditor affinity={model.affinity} onChange={e => setModel({ ...model, affinity: e })} />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                    <Button variant="secondary" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button onClick={SendRequest}>Update Process</Button>
                </div>
            </div>
        </div>
    );
};
