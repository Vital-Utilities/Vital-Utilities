import { GetMachineStaticDataResponse, GetMachineDynamicDataResponse } from "@vital/vitalservice";
import { useSize } from "ahooks";
import _, { values } from "lodash";
import React, { CSSProperties, useRef } from "react";
import { useSelector } from "react-redux";
import { Area, AreaChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CpuMetricsModel } from "../../../components/Charts/CpuChartTimeSeries";
import { ChartData, ClassicLayout, ItemOne, ItemTwo, ClassicTooltip } from "../../../components/Charts/Shared";
import { VitalState } from "../../../Redux/States";

export const ClassicCpuChartView: React.FunctionComponent<ChartData & { graphView: "Overall" | "Logical" }> = props => {
    const [ordered, setOrdered] = React.useState<CpuMetricsModel[]>();
    const staticState = useSelector<VitalState, GetMachineStaticDataResponse | undefined>(state => state.machineState.static);
    const dynamicState = useSelector<VitalState, GetMachineDynamicDataResponse | undefined>(state => state.machineState.dynamic);
    const threads = staticState?.cpu?.threadCount ?? 0;
    const cores = staticState?.cpu?.numberOfCores ?? 0;
    const graphWindowRef = useRef(null);
    const graphWindowSize = useSize(graphWindowRef);
    React.useEffect(() => {
        if (!props.metrics) return;
        const f = props.metrics.map(e => e.cpuMetrics[0]);
        setOrdered(f ?? []);
    }, [props.metrics]);

    const current = ordered?.[ordered.length - 1];

    function getGraphView() {
        switch (props.graphView) {
            case "Overall":
                return (
                    <>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={ordered} className="hide-legend" style={{ border: "-5px white solid" } as CSSProperties}>
                                <XAxis dataKey="dateTimeOffset" hide tickFormatter={e => e} />
                                <YAxis yAxisId="left" hide />
                                <YAxis yAxisId="right" stroke="yellow" hide orientation="right" tickFormatter={e => e + "w"} />
                                <YAxis yAxisId="speed" stroke="white" hide orientation="right" tickFormatter={e => e + "ghz"} />
                                <Tooltip content={<ClassicTooltip />} />
                                <Legend />
                                <Area yAxisId="left" unit="%" type="monotone" dataKey="totalCoreUsagePercentage" name={`Utilisation ${current?.totalCoreUsagePercentage}%`} activeDot={{ r: 4 }} fillOpacity={0.3} isAnimationActive={false} />
                                {current?.powerDrawWattage && <Area yAxisId="right" unit="w" type="monotone" dataKey="powerDrawWattage" name={`Power ${current?.powerDrawWattage}w`} stroke="yellow" color="yellow" fillOpacity={0.1} activeDot={{ r: 4 }} fill="transparent" isAnimationActive={false} />}
                                <Area yAxisId="left" unit="°C" type="monotone" dataKey="packageTemperature" name={`Temperature ${current?.packageTemperature}°C`} stroke="white" color="white" fillOpacity={0.1} activeDot={{ r: 4 }} fill="transparent" isAnimationActive={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </>
                );
            case "Logical": {
                const corePercentages = dynamicState?.cpuUsageData?.corePercentages;

                // Calculate per-core average across last 10 data points
                const coreAverages: number[] = [];
                if (corePercentages && ordered && ordered.length > 0) {
                    const last10 = ordered.slice(-10).filter(m => m !== null && m !== undefined);
                    for (let coreIdx = 0; coreIdx < corePercentages.length; coreIdx++) {
                        const coreValues = last10.map(m => m?.coresUsagePercentage?.[coreIdx] ?? 0).filter(v => v > 0);
                        const avg = coreValues.length > 0 ? coreValues.reduce((a, b) => a + b, 0) / coreValues.length : 0;
                        coreAverages.push(avg);
                    }
                }

                return (
                    <div className="flex h-full w-full px-3 py-3 overflow-x-auto">
                        {corePercentages && corePercentages.length > 0 ? (
                            <div className="flex gap-2 h-full w-full items-end">
                                {corePercentages.map((percentage, i) => {
                                    const coreAvg = coreAverages[i] ?? 0;

                                    return (
                                        <div key={i} className="flex flex-col items-center h-full flex-1 min-w-[24px]">
                                            <div className="flex-1 w-full rounded-lg overflow-hidden flex flex-col justify-end bg-secondary/20 relative">
                                                {/* Per-core average usage line */}
                                                <div
                                                    className="absolute w-full h-[2px] bg-white/60 z-10 transition-all duration-500 ease-out"
                                                    style={{
                                                        bottom: `${coreAvg}%`,
                                                        opacity: coreAvg > 0 ? 1 : 0
                                                    }}
                                                />
                                                <div
                                                    className="w-full rounded-lg transition-all duration-500 ease-out bg-gradient-to-t from-primary to-accent"
                                                    style={{
                                                        height: `${percentage}%`,
                                                        boxShadow: "0 0 12px rgba(59, 130, 246, 0.4)"
                                                    }}
                                                />
                                            </div>
                                            <div className="text-[10px] text-muted-foreground mt-1.5 font-medium">{i}</div>
                                            <div className="text-[10px] text-foreground/70 font-mono">{percentage.toFixed(0)}%</div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="text-muted-foreground text-center w-full flex items-center justify-center">Core usage data not available</div>
                        )}
                    </div>
                );
            }
            default:
                return <></>;
        }
    }
    const highestCoreClockMhz = _.max(values(current?.coreClocksMhz));
    return (
        <ClassicLayout
            header={{ title: "CPU", deviceName: staticState?.cpu?.name }}
            graph={getGraphView()}
            showRange={props.graphView === "Overall"}
            bottomItems={
                <>
                    <div style={{ display: "flex", flexWrap: "wrap", alignContent: "flex-start", gap: 30 }}>
                        <ItemOne color="#3182bd" title="Utilisation" value={`${current?.totalCoreUsagePercentage}%`} />
                        {current?.powerDrawWattage && <ItemOne color="yellow" title="Power" value={`${current?.powerDrawWattage}w`} />}
                        <ItemOne color="white" title="Package Temp" value={`${current?.packageTemperature}°C`} />
                        {highestCoreClockMhz && <ItemOne color="white" title="Speed" value={`${highestCoreClockMhz} mhz`} />}
                    </div>
                    <div>
                        <ItemTwo title="Cores:" value={staticState?.cpu.numberOfCores} />
                        <ItemTwo title="Threads:" value={staticState?.cpu.threadCount} />
                        <ItemTwo title="Virtualisation:" value={staticState?.cpu.virtualizationFirmwareEnabled ? "Enabled" : "Disabled"} />
                        <ItemTwo title="L1 cache:" value={`${staticState?.cpu.l1CacheSize ?? 0} KB`} />
                        <ItemTwo title="L2 cache:" value={`${(staticState?.cpu.l2CacheSize ?? 0) / 1024} MB`} />
                        <ItemTwo title="L3 cache:" value={`${(staticState?.cpu.l3CacheSize ?? 0) / 1024} MB`} />
                    </div>
                </>
            }
        />
    );
};
