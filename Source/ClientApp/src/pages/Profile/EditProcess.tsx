import { Modal } from "antd";
import React from "react";
import { ManagedModelDto } from "../../Dtos/ClientApiDto";
import { UpdateProcessView } from "./UpdateProcessView";

interface EditProcessModelProps {
    model: ManagedModelDto;
    onCancel: () => void;
    onSubmit: () => void;
}

export const EditProcess: React.FunctionComponent<EditProcessModelProps> = ({ model, onCancel, onSubmit }) => {
    return (
        <>
            <Modal width={1000} visible title="Update Configuration" closable onCancel={onCancel} maskClosable={false} afterClose={onCancel} footer={null}>
                <UpdateProcessView managedModel={model} onCancel={onCancel} onSubmit={onSubmit}></UpdateProcessView>
            </Modal>
        </>
    );
};
