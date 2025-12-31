import { invoke } from "@tauri-apps/api/core";
import React from "react";
import { BsDiscord, BsGithub } from "react-icons/bs";
import { useSelector } from "react-redux";
import { AppState, VitalState } from "../Redux/States";
import { openUrl } from "../Utilities/TauriCommands";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

export const ConnnectionIssuePage: React.FunctionComponent = () => {
    const appState = useSelector<VitalState, AppState>(state => state.appState);
    const [portInput, setPortInput] = React.useState(appState.vitalServicePort);
    return (
        <div className="flex items-center justify-center h-full w-full">
            <div>
                <h1 className="text-xl font-bold flex items-center gap-2">
                    <AlertTriangle className="text-orange-500" />
                    Could not connect to local Vital Service
                </h1>
                <br />
                <h3 className="flex items-center gap-2">Api: {appState.httpConnected ? <CheckCircle className="text-green-500" /> : <AlertTriangle className="text-orange-500" />}</h3>
                <h3 className="flex items-center gap-2">SignalR: {appState.signalRConnected ? <CheckCircle className="text-green-500" /> : <AlertTriangle className="text-orange-500" />}</h3>
                <br />
                <h3 className="font-semibold">Things to try:</h3>
                <div className="ml-2.5">
                    <h4 className="font-medium">1. Is VitalService running?</h4>
                    <Button
                        variant="secondary"
                        className="ml-4"
                        onClick={() => {
                            invoke("restart_vital_service");
                        }}
                    >
                        Start Vital Service
                    </Button>
                </div>
                <br />
                <div className="ml-2.5">
                    <h4 className="font-medium">2. See error logs for clues.</h4>
                </div>
                <br />
                <div className="ml-2.5">
                    <h4 className="font-medium">3. Is the port used by another application?</h4>
                    <p className="ml-4">If the port is occupied, you can specify a new port below and click the following button to apply and restart the service.</p>
                    <div className="flex flex-row gap-2.5 mt-2">
                        <Input type="number" value={portInput} className="w-24" onChange={e => setPortInput(e.target.valueAsNumber)} />
                        <Button
                            variant="secondary"
                            onClick={() => {
                                invoke("update_vital_service_port", { portNumber: portInput })
                                    .then(() => {
                                        invoke("restart_vital_service").catch(e => {
                                            toast.error(String(e));
                                            console.error(e);
                                        });
                                    })
                                    .catch(e => {
                                        toast.error(String(e));
                                        console.error(e);
                                    });
                            }}
                        >
                            Save And Start Vital Service
                        </Button>
                    </div>
                </div>
                <br />
                <div className="ml-2.5">
                    <h4 className="font-medium">Get Help</h4>
                    <div className="flex flex-row gap-5 text-base">
                        <a className="flex items-center gap-1 cursor-pointer text-accent hover:underline" onClick={() => openUrl("https://discord.gg/ghQ8nQK2ma")}>
                            <BsDiscord /> Discord Hangout
                        </a>
                        <a className="flex items-center gap-1 cursor-pointer text-accent hover:underline" onClick={() => openUrl("https://github.com/Vital-Utilities/Vital-Utilities/issues/new?assignees=&labels=Bug&template=bug_report.yaml&title=Bug")}>
                            <BsGithub /> Submit a bug
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};
