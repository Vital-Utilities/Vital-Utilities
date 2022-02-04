import { useSize } from "ahooks";
import _, { values } from "lodash";
import React, { CSSProperties, useRef } from "react";
import { useInView } from "react-intersection-observer";
import { useSelector } from "react-redux";
import { Area, AreaChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { GetMachineDynamicDataResponse, GetMachineStaticDataResponse, TimeSeriesMachineMetricsResponse } from "../../Dtos/Dto";
import { State } from "../../Redux/States";
import { ChartData, ClassicLayout, CustomTooltip, formatXAxis, ItemOne, ItemTwo } from "./Shared";

export type TimeSeriesProps = { timeSeries: TimeSeriesMachineMetricsResponse };

export type CpuMetricsModel = {
    dateTimeOffset: Date;
    totalCoreUsagePercentage?: number | undefined;
    packageTemperature?: number | undefined;
    powerDrawWattage?: number | undefined;
    coresUsagePercentage?: {
        [key: number]: number;
    };
    coreClocksMhz?: {
        [key: number]: number;
    };
    id: number;
    uniqueIdentifier?: string | undefined;
};
export const CpuChartTimeSeries: React.FunctionComponent<ChartData> = props => {
    const { ref, inView } = useInView();

    const [ordered, setOrdered] = React.useState<CpuMetricsModel[]>();
    React.useEffect(() => {
        if (!props.metrics || !inView) return;
        const f = props.metrics.map(e => e.cpuMetrics[0]);
        setOrdered(f ?? []);
    }, [props.metrics, inView]);

    const current = ordered?.[ordered.length - 1];
    return (
        <div ref={ref}>
            <ResponsiveContainer width="100%" height={150}>
                <AreaChart data={ordered}>
                    <XAxis dataKey="dateTimeOffset" tickFormatter={e => formatXAxis(e)} />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" stroke="yellow" orientation="right" tickFormatter={e => e + "w"} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area yAxisId="left" unit="%" type="monotone" dataKey="totalCoreUsagePercentage" name={`Core Load ${current?.totalCoreUsagePercentage}%`} activeDot={{ r: 4 }} fillOpacity={0.3} isAnimationActive={false} />
                    <Area yAxisId="left" unit="°C" type="monotone" dataKey="packageTemperature" name={`Temperature ${current?.packageTemperature}°C`} stroke="orange" color="orange" fillOpacity={0.1} activeDot={{ r: 4 }} fill="orange" isAnimationActive={false} />
                    <Area yAxisId="right" unit="w" type="monotone" dataKey="powerDrawWattage" name={`Power ${current?.powerDrawWattage}w`} stroke="yellow" color="yellow" fillOpacity={0.1} activeDot={{ r: 4 }} fill="transparent" isAnimationActive={false} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export const ClassicCpuChartView: React.FunctionComponent<ChartData & { graphView: "Overall" | "Logical" }> = props => {
    const [ordered, setOrdered] = React.useState<CpuMetricsModel[]>();
    const staticState = useSelector<State, GetMachineStaticDataResponse | undefined>(state => state.machineState.static);
    const dynamicState = useSelector<State, GetMachineDynamicDataResponse | undefined>(state => state.machineState.dynamic);
    const threads = staticState?.cpu?.threadCount ?? 0;
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
                        <ResponsiveContainer width="100%">
                            <AreaChart data={ordered} className="hide-legend" style={{ border: "-5px white solid" } as CSSProperties}>
                                <XAxis dataKey="dateTimeOffset" hide tickFormatter={e => e} />
                                <YAxis yAxisId="left" hide />
                                <YAxis yAxisId="right" stroke="yellow" hide orientation="right" tickFormatter={e => e + "w"} />
                                <YAxis yAxisId="speed" stroke="white" hide orientation="right" tickFormatter={e => e + "ghz"} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Area yAxisId="left" unit="%" type="monotone" dataKey="totalCoreUsagePercentage" name={`Utilisation ${current?.totalCoreUsagePercentage}%`} activeDot={{ r: 4 }} fillOpacity={0.3} isAnimationActive={false} />
                                <Area yAxisId="right" unit="w" type="monotone" dataKey="powerDrawWattage" name={`Power ${current?.powerDrawWattage}w`} stroke="yellow" color="yellow" fillOpacity={0.1} activeDot={{ r: 4 }} fill="transparent" isAnimationActive={false} />
                                <Area yAxisId="left" unit="°C" type="monotone" dataKey="packageTemperature" name={`Temperature ${current?.packageTemperature}°C`} stroke="white" color="white" fillOpacity={0.1} activeDot={{ r: 4 }} fill="transparent" isAnimationActive={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </>
                );
            case "Logical": {
                const cellHeight = graphWindowSize?.height ? graphWindowSize?.height / 4 - 7 * 4 : 0;
                return (
                    <div ref={graphWindowRef} style={{ display: "grid", width: "100%", gridTemplateColumns: `repeat(${threads / 4}, minmax(50px, 1fr))`, gap: 5, overflow: "hidden" }}>
                        {dynamicState?.cpuUsageData?.cores?.map((e, i) => {
                            return (
                                graphWindowSize && (
                                    <div key={i} style={{ border: "1px solid gray" }}>
                                        <span style={{ padding: 5 }}>{i}</span>
                                        <ResponsiveContainer width="100%" height={cellHeight}>
                                            <AreaChart data={ordered}>
                                                <XAxis dataKey="dateTimeOffset" tickFormatter={e => formatXAxis(e)} hide />
                                                <YAxis domain={[0, 100]} hide />
                                                <Tooltip content={<CustomTooltip />} />
                                                <Area unit="%" type="monotone" dataKey={`coresUsagePercentage.${i}`} name={`Core${i}`} activeDot={{ r: 4 }} fillOpacity={0.3} isAnimationActive={false} />;
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                )
                            );
                        })}
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
                        <ItemOne color="yellow" title="Power" value={`${current?.powerDrawWattage}w`} />
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
