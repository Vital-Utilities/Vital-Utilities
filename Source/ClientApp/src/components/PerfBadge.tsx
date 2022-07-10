/* eslint-disable security/detect-object-injection */
import { TimeSeriesMachineMetricsResponse } from "@vital/vitalservice";
import { Progress, Badge } from "antd";
import React from "react";
import { useSelector } from "react-redux";
import { VitalState } from "../Redux/States";

interface props {
    processName: string;
}
export const ProcessorThreadPerfBadge: React.FunctionComponent<props> = ({ processName }) => {
    const [name] = React.useState(processName);
    const processCpuThreadPercentage = useSelector<VitalState, { [key: string]: number } | undefined>(state => state.machineState.dynamic?.processCpuThreadsUsage ?? undefined);
    const processCpuPercentage = useSelector<VitalState, { [key: string]: number } | undefined>(state => state.machineState.dynamic?.processCpuUsage ?? undefined);

    const processRamPercentage = useSelector<VitalState, { [key: string]: number } | undefined>(state => state.machineState.dynamic?.processRamUsageGb ?? undefined);
    const totalRamBytes = useSelector<VitalState, number | undefined>(state => state.machineState.dynamic?.ramUsagesData?.totalVisibleMemoryBytes);
    function getStroke(value: number) {
        if (value > 90) {
            return "red";
        } else if (value > 80) {
            return "orange";
        } else {
            return "#108ee9";
        }
    }
    return (
        <>
            <div style={{ margin: 4 }}>
                CPU load
                <Progress style={{ top: -10 }} strokeColor={processCpuPercentage && getStroke(processCpuPercentage[name])} size={"small"} status={"active"} percent={processCpuPercentage && processCpuPercentage[name]} />
                Thread load
                <Progress style={{ top: -10 }} strokeColor={processCpuThreadPercentage && getStroke(processCpuThreadPercentage[name])} size={"small"} status={"active"} percent={processCpuThreadPercentage && processCpuThreadPercentage[name]} />
                Mem Usage
                <Progress style={{ top: -10 }} strokeColor={processRamPercentage && getStroke(processRamPercentage[name])} size={"small"} status={"active"} percent={totalRamBytes && processRamPercentage && (processRamPercentage[name] / totalRamBytes) * 100} />
            </div>
        </>
    );
};
export function getPercentColor(percent: number) {
    const value = percent / 100;
    //value from 0 to 1
    const hue = ((1 - value) * 120).toString(10);
    return ["hsl(", hue, ",100%,50%)"].join("");
}
export function getProcessCPUPercentColor(percent: number) {
    if (percent === 0) return "White";
    else if (percent < 5) return "#00ff37";
    else if (percent < 20) return "Yellow";
    else if (percent < 40) return "Orange";
    else return "Red";
}

export const ProcessorCoresUsageGraphic: React.FunctionComponent = () => {
    const coresPercentage = useSelector<VitalState, number[] | undefined>(state => state.machineState.dynamic?.cpuUsageData?.corePercentages);

    const Square: React.FunctionComponent<{ value: number }> = ({ value }) => {
        return <div style={{ height: 8, width: 8, backgroundColor: getPercentColor(value) }} />;
    };

    return (
        <>
            {coresPercentage && (
                <div style={{ display: "grid", width: "100%", gap: "8px 20px", gridTemplateColumns: `repeat(${coresPercentage.length / 3},0)` }}>
                    {coresPercentage?.map((e, i) => (
                        <Square key={i} value={e} />
                    ))}
                </div>
            )}
        </>
    );
};

export const CpuPerfBadge: React.FunctionComponent = () => {
    const timeSeriesMetrics = useSelector<VitalState, TimeSeriesMachineMetricsResponse | undefined>(state => state.machineState?.timeSeriesMetricsState);
    const data = timeSeriesMetrics?.metrics?.[timeSeriesMetrics.metrics.length - 1]?.cpuUsageData[0]?.totalCoreUsagePercentage ?? undefined;
    return (
        <div style={{ width: 130, display: "flex", alignItems: "center" }}>
            CPU
            <Progress
                style={{ marginLeft: 4, marginTop: -4 }}
                strokeColor={{
                    from: "#108ee9",
                    to: "red"
                }}
                size={"small"}
                status={"active"}
                percent={data && Number.parseFloat(data.toFixed(0))}
            />
        </div>
    );
};
export const GpuPerfBadge: React.FunctionComponent = () => {
    const timeSeriesMetrics = useSelector<VitalState, TimeSeriesMachineMetricsResponse | undefined>(state => state.machineState?.timeSeriesMetricsState);
    const data = timeSeriesMetrics?.metrics?.[timeSeriesMetrics.metrics.length - 1]?.gpuUsageData[0]?.coreUsagePercentage ?? undefined;

    return (
        <div style={{ width: 130, display: "flex", alignItems: "center" }}>
            GPU
            <Progress
                style={{ marginLeft: 4, marginTop: -4 }}
                strokeColor={{
                    from: "#108ee9",
                    to: "red"
                }}
                size={"small"}
                status={"active"}
                percent={data && Number.parseFloat(data?.toFixed(0) ?? "0")}
            />
        </div>
    );
};
export const RamUsageBadge: React.FunctionComponent = () => {
    const timeSeriesMetrics = useSelector<VitalState, TimeSeriesMachineMetricsResponse | undefined>(state => state.machineState?.timeSeriesMetricsState);
    const data = timeSeriesMetrics?.metrics?.[timeSeriesMetrics.metrics.length - 1]?.ramUsageData;
    const usages = (data?.usedMemoryBytes && data?.totalVisibleMemoryBytes && (data?.usedMemoryBytes / data?.totalVisibleMemoryBytes) * 100) ?? undefined;
    return (
        <div style={{ width: 130, display: "flex", alignItems: "center" }}>
            Mem
            <Progress
                style={{ marginLeft: 4, marginTop: -4 }}
                strokeColor={{
                    from: "#108ee9",
                    to: "red"
                }}
                size={"small"}
                status={"active"}
                percent={usages && Number.parseFloat(usages.toFixed(0))}
            />
        </div>
    );
};

export const ThreadCountBadge: React.FunctionComponent<props> = ({ processName }) => {
    const [name] = React.useState(processName);
    const processThreadCount = useSelector<VitalState, { [key: string]: number } | undefined>(state => state.machineState.dynamic?.processThreadCount ?? undefined);

    return <Badge style={{ backgroundColor: "gray", pointerEvents: "none" }} count={`Threads in use: ${processThreadCount && processThreadCount[name]}`} />;
};
