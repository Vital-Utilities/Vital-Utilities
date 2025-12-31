import { GetMachineDynamicDataResponse } from "@vital/vitalservice";
import React from "react";
import { useSelector } from "react-redux";
import { ResponsiveContainer, AreaChart, XAxis, YAxis, Area, Tooltip } from "recharts";
import { ClassicLayout, ItemOne, ItemTwo, ClassicTooltip, formatXAxis } from "../../../components/Charts/Shared";
import { VitalState } from "../../../Redux/States";
import { BatteryCharging, BatteryFull, BatteryLow, BatteryMedium, Plug } from "lucide-react";

interface PowerMetric {
    dateTimeOffset: string;
    systemPowerWatts: number | undefined;
    batteryPercentage: number | undefined;
    batteryVoltage: number | undefined;
}

export const ClassicPowerView: React.FunctionComponent = () => {
    const [history, setHistory] = React.useState<PowerMetric[]>([]);
    const dynamicState = useSelector<VitalState, GetMachineDynamicDataResponse | undefined>(state => state.machineState.dynamic);
    const powerData = dynamicState?.powerUsageData;

    // Update history with new data
    React.useEffect(() => {
        if (!powerData) return;

        const newMetric: PowerMetric = {
            dateTimeOffset: new Date().toISOString(),
            systemPowerWatts: powerData.systemPowerWatts,
            batteryPercentage: powerData.batteryPercentage,
            batteryVoltage: powerData.batteryVoltage
        };

        setHistory(prev => {
            const updated = [...prev, newMetric];
            // Keep last 60 entries (1 minute of data at 1/sec)
            if (updated.length > 60) {
                return updated.slice(-60);
            }
            return updated;
        });
    }, [powerData?.systemPowerWatts, powerData?.batteryPercentage]);

    const current = history[history.length - 1];

    const getBatteryIcon = (percentage: number | undefined, charging: boolean) => {
        if (charging) return <BatteryCharging className="w-6 h-6 text-green-400" />;
        if (percentage === undefined) return <BatteryMedium className="w-6 h-6 text-slate-400" />;
        if (percentage >= 80) return <BatteryFull className="w-6 h-6 text-green-400" />;
        if (percentage >= 40) return <BatteryMedium className="w-6 h-6 text-yellow-400" />;
        return <BatteryLow className="w-6 h-6 text-red-400" />;
    };

    const getHealthColor = (health: number | undefined) => {
        if (health === undefined) return "text-slate-400";
        if (health >= 90) return "text-green-400";
        if (health >= 70) return "text-yellow-400";
        return "text-red-400";
    };

    function getGraphView() {
        return (
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history}>
                    <XAxis hide dataKey="dateTimeOffset" tickFormatter={e => formatXAxis(e)} />
                    <YAxis hide yAxisId="power" />
                    <YAxis hide yAxisId="percent" domain={[0, 100]} orientation="right" />
                    <Tooltip content={<ClassicTooltip />} />
                    <Area yAxisId="power" unit="W" type="monotone" dataKey="systemPowerWatts" name={`System Power ${current?.systemPowerWatts?.toFixed(1) ?? "-"}W`} stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} isAnimationActive={false} />
                    <Area yAxisId="percent" unit="%" type="monotone" dataKey="batteryPercentage" name={`Battery ${current?.batteryPercentage ?? "-"}%`} stroke="#22c55e" fill="transparent" isAnimationActive={false} />
                </AreaChart>
            </ResponsiveContainer>
        );
    }

    if (!powerData?.batteryInstalled) {
        return (
            <ClassicLayout
                header={{ title: "Power", deviceName: "No Battery Detected" }}
                graph={
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                        <Plug className="w-8 h-8 mr-2" />
                        <span>Desktop system - no battery information available</span>
                    </div>
                }
                bottomItems={<></>}
            />
        );
    }

    return (
        <ClassicLayout
            header={{
                title: "Power",
                deviceName: powerData.externalConnected ? "Plugged In" : "On Battery"
            }}
            graph={getGraphView()}
            showRange
            bottomItems={
                <>
                    <div style={{ display: "flex", flexWrap: "wrap", alignContent: "flex-start", gap: 15, overflowY: "auto" }}>
                        {/* Battery Status */}
                        <div className="flex items-center gap-2 p-2 rounded bg-card/50">
                            {getBatteryIcon(powerData.batteryPercentage, powerData.externalConnected && !powerData.fullyCharged)}
                            <span className="text-lg font-mono">{powerData.batteryPercentage?.toFixed(0) ?? "-"}%</span>
                        </div>

                        {/* Power consumption */}
                        {powerData.systemPowerWatts !== undefined && <ItemOne color="#3b82f6" title="System Power" value={`${powerData.systemPowerWatts.toFixed(1)}W`} />}

                        {/* Adapter info */}
                        {powerData.externalConnected && powerData.adapterWatts && <ItemOne color="#22c55e" title="Adapter" value={`${powerData.adapterWatts}W ${powerData.adapterDescription ?? ""}`} />}

                        {/* Battery Health */}
                        {powerData.batteryHealth !== undefined && <ItemOne color={powerData.batteryHealth >= 90 ? "#22c55e" : powerData.batteryHealth >= 70 ? "#eab308" : "#ef4444"} title="Battery Health" value={`${powerData.batteryHealth.toFixed(1)}%`} />}

                        {/* Cycle Count */}
                        {powerData.cycleCount !== undefined && <ItemOne color="#94a3b8" title="Cycle Count" value={`${powerData.cycleCount}`} />}

                        {/* Battery Voltage */}
                        {powerData.batteryVoltage !== undefined && <ItemOne color="#94a3b8" title="Voltage" value={`${powerData.batteryVoltage.toFixed(2)}V`} />}

                        {/* Time Remaining */}
                        {powerData.timeRemainingMinutes !== undefined && powerData.timeRemainingMinutes > 0 && <ItemOne color="#06b6d4" title="Time Remaining" value={formatTimeRemaining(powerData.timeRemainingMinutes)} />}
                    </div>
                    <div>
                        <ItemTwo title="Capacity:" value={`${powerData.maxCapacityMah ?? "-"} / ${powerData.designCapacityMah ?? "-"} mAh`} />
                        {powerData.adapterVoltage && <ItemTwo title="Adapter Voltage:" value={`${powerData.adapterVoltage.toFixed(1)}V`} />}
                        <ItemTwo title="Status:" value={powerData.fullyCharged ? "Fully Charged" : powerData.externalConnected ? "Charging" : "Discharging"} />
                    </div>
                </>
            }
        />
    );
};

function formatTimeRemaining(minutes: number): string {
    if (minutes < 60) {
        return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
}
