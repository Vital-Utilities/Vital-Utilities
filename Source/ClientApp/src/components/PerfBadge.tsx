/* eslint-disable security/detect-object-injection */
import { TimeSeriesMachineMetricsResponse } from "@vital/vitalservice";
import React from "react";
import { useSelector } from "react-redux";
import { VitalState } from "../Redux/States";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface props {
    processName: string;
}

// Custom Progress component with color support
const ColoredProgress: React.FunctionComponent<{ value: number; color?: string; className?: string }> = ({ value, color, className }) => {
    return (
        <div className={`relative h-2 w-full overflow-hidden rounded-full bg-secondary ${className ?? ""}`}>
            <div className="h-full transition-all" style={{ width: `${Math.min(100, Math.max(0, value))}%`, backgroundColor: color ?? "#108ee9" }} />
        </div>
    );
};

export const ProcessorThreadPerfBadge: React.FunctionComponent<props> = ({ processName }) => {
    const [name] = React.useState(processName);
    const processCpuThreadPercentage = useSelector<VitalState, { [key: string]: number } | undefined>(state => state.machineState.dynamic?.processCpuThreadsUsage ?? undefined);
    const processCpuPercentage = useSelector<VitalState, { [key: string]: number } | undefined>(state => state.machineState.dynamic?.processCpuUsage ?? undefined);

    const processRamPercentage = useSelector<VitalState, { [key: string]: number } | undefined>(state => state.machineState.dynamic?.processRamUsageBytes ?? undefined);
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
        <div className="m-1 space-y-1">
            <div className="text-sm">CPU load</div>
            <ColoredProgress value={processCpuPercentage?.[name] ?? 0} color={processCpuPercentage ? getStroke(processCpuPercentage[name]) : undefined} />
            <div className="text-sm">Thread load</div>
            <ColoredProgress value={processCpuThreadPercentage?.[name] ?? 0} color={processCpuThreadPercentage ? getStroke(processCpuThreadPercentage[name]) : undefined} />
            <div className="text-sm">Mem Usage</div>
            <ColoredProgress value={totalRamBytes && processRamPercentage ? (processRamPercentage[name] / totalRamBytes) * 100 : 0} color={processRamPercentage ? getStroke(processRamPercentage[name]) : undefined} />
        </div>
    );
};
export function getPercentColor(percent: number) {
    const value = percent / 100;
    //value from 0 to 1
    const hue = ((1 - value) * 120).toString(10);
    return ["hsl(", hue, ",100%,50%)"].join("");
}
export function getProcessCPUPercentColor(percent: number) {
    if (percent < 0.05) return "White";
    else if (percent < 5) return "#00ff37";
    else if (percent < 20) return "Yellow";
    else if (percent < 40) return "Orange";
    else return "Red";
}

export const ProcessorCoresUsageGraphic: React.FunctionComponent = () => {
    const coresPercentage = useSelector<VitalState, number[] | undefined>(state => state.machineState.dynamic?.cpuUsageData?.corePercentages);

    const Square: React.FunctionComponent<{ value: number }> = ({ value }) => {
        return <div className="h-2 w-2" style={{ backgroundColor: getPercentColor(value) }} />;
    };

    return (
        <>
            {coresPercentage && (
                <div className="grid w-full gap-x-5 gap-y-2" style={{ gridTemplateColumns: `repeat(${coresPercentage.length / 3},0)` }}>
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
    const data = timeSeriesMetrics?.metrics?.[timeSeriesMetrics.metrics.length - 1]?.cpuUsageData?.[0]?.totalCoreUsagePercentage ?? undefined;
    return (
        <div className="w-32 flex items-center gap-1">
            <span className="text-sm">cpu</span>
            <Progress value={data ? Number.parseFloat(data.toFixed(0)) : 0} className="h-2" />
        </div>
    );
};
export const GpuPerfBadge: React.FunctionComponent = () => {
    const timeSeriesMetrics = useSelector<VitalState, TimeSeriesMachineMetricsResponse | undefined>(state => state.machineState?.timeSeriesMetricsState);
    const data = timeSeriesMetrics?.metrics?.[timeSeriesMetrics.metrics.length - 1]?.gpuUsageData?.[0]?.coreUsagePercentage ?? undefined;

    return (
        <div className="w-32 flex items-center gap-1">
            <span className="text-sm">gpu</span>
            <Progress value={data ? Number.parseFloat(data?.toFixed(0) ?? "0") : 0} className="h-2" />
        </div>
    );
};
export const RamUsageBadge: React.FunctionComponent = () => {
    const timeSeriesMetrics = useSelector<VitalState, TimeSeriesMachineMetricsResponse | undefined>(state => state.machineState?.timeSeriesMetricsState);
    const data = timeSeriesMetrics?.metrics?.[timeSeriesMetrics.metrics.length - 1]?.ramUsageData;
    const usages = (data?.usedMemoryBytes && data?.totalVisibleMemoryBytes && (data?.usedMemoryBytes / data?.totalVisibleMemoryBytes) * 100) ?? undefined;
    return (
        <div className="w-32 flex items-center gap-1">
            <span className="text-sm">mem</span>
            <Progress value={usages ? Number.parseFloat(usages.toFixed(0)) : 0} className="h-2" />
        </div>
    );
};

export const ThreadCountBadge: React.FunctionComponent<props> = ({ processName }) => {
    const [name] = React.useState(processName);
    const processThreadCount = useSelector<VitalState, { [key: string]: number } | undefined>(state => state.machineState.dynamic?.processThreadCount ?? undefined);

    return <Badge variant="secondary" className="pointer-events-none">{`Threads in use: ${processThreadCount ? processThreadCount[name] : "..."}`}</Badge>;
};
