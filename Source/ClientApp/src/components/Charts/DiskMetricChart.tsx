import { DiskUsageMetricModel } from "@vital/vitalservice";
import React from "react";
import { useInView } from "react-intersection-observer";
import { Area, AreaChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getReadableBytesString, getReadableBytesPerSecondString } from "../FormatUtils";
import { ChartData, CustomTooltip, customUnitFlags, formatXAxis } from "./Shared";

export type diskMetricsModel = DiskUsageMetricModel;
export const DiskMetricChart: React.FunctionComponent<{ uniqueIdentifier: string } & ChartData> = props => {
    const { ref, inView } = useInView();
    const [ordered, setOrdered] = React.useState<diskMetricsModel[]>([]);

    React.useEffect(() => {
        if (!props.metrics || !inView) return;
        const f = props.metrics.map(e => e.diskMetrics?.filter(e => e.uniqueIdentifier === props.uniqueIdentifier)[0]);
        setOrdered(f ?? []);
    }, [props.metrics, inView]);

    const current = ordered?.[ordered.length - 1];

    return (
        <div ref={ref}>
            <ResponsiveContainer width="100%" height={150}>
                <AreaChart data={ordered}>
                    <XAxis dataKey="dateTimeOffset" tickFormatter={e => formatXAxis(e)} />
                    <YAxis yAxisId="left" orientation="left" tickFormatter={e => getReadableBytesString(e)} />
                    <YAxis yAxisId="right" stroke="white" domain={[0, 100]} orientation="right" tickFormatter={e => e + "°C"} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area yAxisId="left" unit={customUnitFlags["#Bps"]} type="monotone" dataKey="readRateBytesPerSecond" name={`Read ${getReadableBytesPerSecondString(current?.readRateBytesPerSecond)}`} activeDot={{ r: 4 }} fillOpacity={0.1} isAnimationActive={false} />
                    <Area yAxisId="left" unit={customUnitFlags["#Bps"]} type="monotone" dataKey="writeRateBytesPerSecond" name={`Write ${getReadableBytesPerSecondString(current?.writeRateBytesPerSecond)}`} activeDot={{ r: 4 }} stroke="orange" fill="orange" isAnimationActive={false} fillOpacity={0.1} />
                    <Area yAxisId="right" unit="°C" type="monotone" dataKey="temperatures.Temperature" name={`Temperature ${current?.temperatures?.["Temperature"]}°C`} activeDot={{ r: 4 }} fill="transparent" stroke="white" fillOpacity={0.1} isAnimationActive={false} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};
