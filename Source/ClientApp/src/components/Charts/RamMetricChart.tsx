import React from "react";
import { useInView } from "react-intersection-observer";
import { Area, AreaChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getReadableBytesString } from "../FormatUtils";
import { ChartData, CustomTooltip, customUnitFlags, formatXAxis } from "./Shared";
export type ramMetricsModel = {
    dateTimeOffset: Date;
    usedBytes: number | null;
    usedPercentage: number | null;
    freePhysicalMemory?: number;
    totalVisibleMemoryBytes?: number;
    id: number;
    uniqueIdentifier?: string | undefined | null;
};

function bytesToGb(bytes: number) {
    return bytes / 1024 / 1024 / 1024;
}

export const RamMetricChart: React.FunctionComponent<ChartData> = props => {
    const { ref, inView } = useInView();

    const [ordered, setOrdered] = React.useState<ramMetricsModel[]>();

    React.useEffect(() => {
        if (!props.metrics || !inView) return;
        const f = props.metrics.map(e => e.ramMetrics);
        setOrdered(f ?? []);
    }, [props.metrics, inView]);
    const current = ordered?.[ordered.length - 1];
    return (
        <div ref={ref}>
            <ResponsiveContainer width="100%" height={150}>
                <AreaChart data={ordered}>
                    <XAxis dataKey="dateTimeOffset" tickFormatter={e => formatXAxis(e)} />
                    <YAxis domain={[0, current?.totalVisibleMemoryBytes ?? 0]} tickFormatter={e => getReadableBytesString(e)} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area type={"monotone"} unit={customUnitFlags["#Bytes"]} dataKey="usedBytes" name={`Used ${getReadableBytesString(current?.usedBytes)} (${current?.usedPercentage}%)`} fillOpacity={0.1} activeDot={{ r: 4 }} isAnimationActive={false} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};
