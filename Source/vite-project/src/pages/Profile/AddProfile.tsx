import { CreateProfileRequest } from "@vital/vitalservice";
import { Input, Button, Form, notification } from "antd";
import React from "react";
import { useDispatch } from "react-redux";
import { profileApi } from "../../Redux/actions/api";
import { recieveProfileAddedAction } from "../../Redux/actions/profileActions";

interface CreateProfileInterface {
    onCancel: () => void;
    onSubmit: () => void;
}

export const CreateProfile: React.FunctionComponent<CreateProfileInterface> = ({ onCancel, onSubmit }) => {
    const [createProfileRequest, setCreateProfileRequest] = React.useState<CreateProfileRequest>({ name: "" });
    const [sending, setSending] = React.useState<boolean>(false);
    const dispatch = useDispatch();
    async function Post() {
        if (sending) return;
        setSending(true);
        await profileApi
            .apiProfileCreatePut({ createProfileRequest })
            .then(result => {
                dispatch(recieveProfileAddedAction(result));
                onSubmit();
            })
            .catch(error => {
                console.error(error);
                notification.error({ duration: null, message: error });
                setSending(false);
            });
    }

    return (
        <div style={{ height: "100%" }}>
            <Form labelCol={{ span: 4 }} wrapperCol={{ span: 14 }} layout="horizontal">
                <Form.Item label="Profile Name">
                    <Input
                        value={createProfileRequest.name}
                        onChange={e =>
                            setCreateProfileRequest({
                                ...createProfileRequest,
                                name: e.target.value
                            })
                        }
                    />
                </Form.Item>
                <div className="ant-modal-footer">
                    <Button onClick={onCancel}>Cancel</Button>
                    <Button type="primary" onClick={Post}>
                        Add
                    </Button>
                </div>
            </Form>
        </div>
    );
};
