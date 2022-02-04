import { CheckCircleOutlined, WarningOutlined } from "@ant-design/icons";
import { invoke } from "@tauri-apps/api";
import { Button, Input, message } from "antd";
import React from "react";
import { useSelector } from "react-redux";
import { AppState, State } from "../Redux/States";

export const ConnnectionIssuePage: React.FunctionComponent = () => {
    const appState = useSelector<State, AppState>(state => state.appState);
    const [portInput, setPortInput] = React.useState(appState.vitalServicePort);
    return (
        <div style={{ alignItems: "center", display: "grid", justifyContent: "center", height: "100%", width: "100%" }}>
            <div>
                <h1>
                    <WarningOutlined style={{ color: "orange", paddingRight: 10 }} />
                    Could not connect to local Vital Service
                </h1>
                <br />
                <h3>Api: {appState.httpConnected ? <CheckCircleOutlined style={{ color: "green" }} /> : <WarningOutlined style={{ color: "orange" }} />}</h3>
                <h3>SignalR: {appState.signalRConnected ? <CheckCircleOutlined style={{ color: "green" }} /> : <WarningOutlined style={{ color: "orange" }} />}</h3>
                <br />
                <h3>Things to try:</h3>
                <div style={{ marginLeft: 10 }}>
                    <h4>1. Is VitalService running?</h4>
                    <Button
                        style={{ marginLeft: 15 }}
                        onClick={() => {
                            invoke("restart_vital_service");
                        }}
                    >
                        Start Vital Service
                    </Button>
                </div>
                <br />
                <div style={{ marginLeft: 10 }}>
                    <h4>2. See error logs for clues.</h4>
                </div>
                <br />
                <div style={{ marginLeft: 10 }}>
                    <h4>3. Is the port used by another application?</h4>
                    <p style={{ marginLeft: 15 }}>If the port is occupied, you can specify a new port below and click the following button to apply and restart the service.</p>
                    <span style={{ display: "flex", flexDirection: "row", gap: 10 }}>
                        <Input value={portInput} style={{ width: 100 }} onChange={e => setPortInput(e.target.valueAsNumber)} />
                        <Button
                            onClick={() => {
                                invoke("update_vital_service_port", { portNumber: portInput })
                                    .then(() => {
                                        invoke("restart_vital_service").catch(e => {
                                            message.error(e);
                                            console.error(e);
                                        });
                                    })
                                    .catch(e => {
                                        message.error(e);
                                        console.error(e);
                                    });
                            }}
                        >
                            Save And Start Vital Service
                        </Button>
                    </span>
                </div>
            </div>
        </div>
    );
};
