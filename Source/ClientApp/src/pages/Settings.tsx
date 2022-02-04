import React, { useEffect } from "react";
import { Layout, Form, Radio, Button } from "antd";
import { SettingsDto } from "../Dtos/Dto";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { State } from "../Redux/States";
import { fetchSettingsAction } from "../Redux/actions/settingsAction";

const { Content } = Layout;

enum viewOptions {
    //"Client" = "Client",
    "Service" = "Vital Service"
}

export const Settings: React.FunctionComponent = () => {
    const settings = useSelector<State, SettingsDto | undefined>(state => state.settingsState.settings);
    const [view, setView] = React.useState<viewOptions>(viewOptions.Service);
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(fetchSettingsAction());
    }, []);

    if (!settings) return <>settings is undefined</>;
    function SetRunAtStartup(runAtStartup: boolean) {
        if (!settings) return;
        axios
            .put(`api/settings/SetRunAtStartup?runAtStartup=${runAtStartup ? true : false}`, {})
            .then(() => {
                dispatch(fetchSettingsAction());
            })
            .catch(error => console.error(error));
    }

    function getPage() {
        switch (view) {
            /*             case "Client":
                return (
                    <div>
                        <h2>UI</h2>
                        {settings?.ui?.networkUtilizationFormat && (
                            <>
                                <Form.Item label="Network Activity Format">
                                    <Radio.Group options={Object.keys(NetworkActivityFormat)} onChange={() => null} value={NetworkActivityFormat[settings.ui.networkUtilizationFormat]} optionType="button" />
                                </Form.Item>
                            </>
                        )}
                    </div>
                ); */
            case viewOptions.Service:
                return (
                    <div>
                        {settings && (
                            <Form.Item label="Run on windows log in">
                                <Button onClick={() => SetRunAtStartup(!settings.runAtStarup)}>{settings.runAtStarup ? "Stop Vital Service from running on log in" : "Run Vital Service on log in"}</Button> (Requires Admin Rights)
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
