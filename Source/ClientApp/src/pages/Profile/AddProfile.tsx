import { CreateProfileRequest } from "@vital/vitalservice";
import React from "react";
import { useDispatch } from "react-redux";
import { profileApi } from "../../Redux/actions/tauriApi";
import { recieveProfileAddedAction } from "../../Redux/actions/profileActions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import toast from "react-hot-toast";

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
            .create(createProfileRequest.name)
            .then(result => {
                dispatch(recieveProfileAddedAction(result));
                onSubmit();
            })
            .catch(error => {
                console.error(error);
                toast.error(String(error));
                setSending(false);
            });
    }

    return (
        <div style={{ height: "100%" }}>
            <div className="space-y-4">
                <div className="grid grid-cols-[100px_1fr] items-center gap-4">
                    <Label htmlFor="profile-name">Profile Name</Label>
                    <Input
                        id="profile-name"
                        value={createProfileRequest.name}
                        onChange={e =>
                            setCreateProfileRequest({
                                ...createProfileRequest,
                                name: e.target.value
                            })
                        }
                    />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                    <Button variant="secondary" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button onClick={Post}>Add</Button>
                </div>
            </div>
        </div>
    );
};
