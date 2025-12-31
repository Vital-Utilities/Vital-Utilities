import React, { useEffect } from "react";
import { Layout, Form, Radio, Button } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { VitalState } from "../Redux/States";
import { fetchSettingsAction } from "../Redux/actions/settingsAction";
import { SettingsDto } from "@vital/vitalservice";
import { settingsApi } from "../Redux/actions/tauriApi";

const { Content } = Layout;

enum viewOptions {
    "Client" = "Client",
    "Service" = "Vital Service"
}

export const Settings: React.FunctionComponent = () => {
    const backendSettings = useSelector<VitalState, SettingsDto | undefined>(state => state.settingsState.settings);
    const [view, setView] = React.useState<viewOptions>(viewOptions.Client);

    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(fetchSettingsAction());
    }, []);

    if (!backendSettings) return <>settings is undefined</>;
    function SetRunAtStartup(runAtStartup: boolean) {
        if (!backendSettings) return;
        settingsApi
            .setRunAtStartup(runAtStartup)
            .then(() => {
                dispatch(fetchSettingsAction());
            })
            .catch(error => console.error(error));
    }

    function getPage() {
        switch (view) {
            case viewOptions.Client:
                return (
                    <div>
                        <h2>App Settings</h2>
                        {/* Always on top setting has been removed */}
                    </div>
                );
            case viewOptions.Service:
                return (
                    <div>
                        {backendSettings && (
                            <Form.Item label="Run on windows log in">
                                <Button onClick={() => SetRunAtStartup(!backendSettings.runAtStarup)}>{backendSettings.runAtStarup ? "Stop Vital Service from running on log in" : "Run Vital Service on log in"}</Button> (Requires Admin Rights)
                            </Form.Item>
                        )}
                    </div>
                );
        }
    }

    return (
        <div style={{ padding: 20 }}>
            <Content>
                <Form.Item label="Settings for: ">
                    <Radio.Group options={Object.values(viewOptions)} onChange={e => setView(e.target.value)} value={view} optionType="button" />
                </Form.Item>
                <Form>{getPage()}</Form>
            </Content>
        </div>
    );
};
