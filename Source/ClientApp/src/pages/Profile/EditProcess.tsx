import { ManagedModelDto } from "@vital/vitalservice";
import React from "react";
import { UpdateProcessView } from "./UpdateProcessView";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface EditProcessModelProps {
    model: ManagedModelDto;
    onCancel: () => void;
    onSubmit: () => void;
}

export const EditProcess: React.FunctionComponent<EditProcessModelProps> = ({ model, onCancel, onSubmit }) => {
    return (
        <Dialog open={true} onOpenChange={open => !open && onCancel()}>
            <DialogContent className="sm:max-w-[1000px]">
                <DialogHeader>
                    <DialogTitle>Update Configuration</DialogTitle>
                </DialogHeader>
                <UpdateProcessView managedModel={model} onCancel={onCancel} onSubmit={onSubmit}></UpdateProcessView>
            </DialogContent>
        </Dialog>
    );
};
