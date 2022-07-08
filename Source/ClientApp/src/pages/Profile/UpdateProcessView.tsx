import { ManagedModelDto, UpdateManagedRequest } from "@vital/vitalservice";
import { Input, Button, Form, message } from "antd";
import axios from "axios";
import React from "react";
import { AffinityEditor } from "../../components/Affinity/AffinityEditor";
import { ProcessPriority } from "./ProcessPriority";

interface UpdateProcessViewProps {
    managedModel: ManagedModelDto;
    onCancel: () => void;
    onSubmit: () => void;
}

export const UpdateProcessView: React.FunctionComponent<UpdateProcessViewProps> = ({ managedModel, onCancel, onSubmit }) => {
    const [model, setModel] = React.useState<ManagedModelDto>(managedModel);

    async function SendRequest() {
        const request: UpdateManagedRequest = { managedModelDto: model };
        axios
            .put<UpdateManagedRequest>("api/profile/process", request)
            .then(result => {
                if (result.status === 200) onSubmit();
            })
            .catch(e => message.error(e));
    }

    return (
        <div style={{ height: "100%" }}>
            <Form labelCol={{ span: 4 }} wrapperCol={{ span: 14 }} layout="horizontal">
                <Form.Item label="Process Name">{model.processName}</Form.Item>
                <Form.Item label="Alias">
                    <Input value={model.alias} onChange={e => setModel({ ...model, alias: e.target.value })} placeholder="Give this an alias if the name is not friendly" />
                </Form.Item>
                <ProcessPriority value={model.processPriority} onChange={e => setModel({ ...model, processPriority: e })} />
                <Form.Item label="Affinity">
                    <AffinityEditor affinity={model.affinity} onChange={e => setModel({ ...model, affinity: e })} />
                </Form.Item>
                <div className="ant-modal-footer">
                    <Button onClick={onCancel}>Cancel</Button>
                    <Button type="primary" onClick={SendRequest}>
                        Update Process
                    </Button>
                </div>
            </Form>
        </div>
    );
};
