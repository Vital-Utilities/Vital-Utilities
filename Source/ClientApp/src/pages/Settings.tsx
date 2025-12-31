import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { VitalState } from "../Redux/States";
import { fetchSettingsAction } from "../Redux/actions/settingsAction";
import { SettingsDto } from "@vital/vitalservice";
import { settingsApi } from "../Redux/actions/tauriApi";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

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
                        <h2 className="text-lg font-semibold mb-4">App Settings</h2>
                        {/* Always on top setting has been removed */}
                    </div>
                );
            case viewOptions.Service:
                return (
                    <div>
                        {backendSettings && (
                            <div className="flex items-center gap-4">
                                <Label>Run on windows log in</Label>
                                <Button variant="secondary" onClick={() => SetRunAtStartup(!backendSettings.runAtStarup)}>
                                    {backendSettings.runAtStarup ? "Stop Vital Service from running on log in" : "Run Vital Service on log in"}
                                </Button>
                                <span className="text-muted-foreground">(Requires Admin Rights)</span>
                            </div>
                        )}
                    </div>
                );
        }
    }

    return (
        <div className="p-5">
            <div className="mb-6">
                <div className="flex items-center gap-4 mb-4">
                    <Label>Settings for:</Label>
                    <RadioGroup value={view} onValueChange={(value: viewOptions) => setView(value)} className="flex gap-2">
                        {Object.values(viewOptions).map(option => (
                            <div key={option} className="flex items-center">
                                <RadioGroupItem value={option} id={option} className="peer sr-only" />
                                <Label htmlFor={option} className="px-3 py-2 rounded-md cursor-pointer border border-border bg-secondary peer-data-[state=checked]:bg-primary peer-data-[state=checked]:text-primary-foreground">
                                    {option}
                                </Label>
                            </div>
                        ))}
                    </RadioGroup>
                </div>
                {getPage()}
            </div>
        </div>
    );
};
