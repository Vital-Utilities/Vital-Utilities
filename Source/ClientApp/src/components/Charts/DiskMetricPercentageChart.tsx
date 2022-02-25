import React from "react";
import { useInView } from "react-intersection-observer";
import { ComposedChart, Area, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { DiskUsageMetricModel } from "../../Dtos/ClientApiDto";
import { getReadableBytesString } from "../FormatUtils";
import { ChartData, CustomTooltip, customUnitFlags, formatXAxis } from "./Shared";

export const DiskMetricPercentageChart: React.FunctionComponent<{ uniqueIdentifier: string } & ChartData> = props => {
    const { ref, inView } = useInView();
    const [ordered, setOrdered] = React.useState<DiskUsageMetricModel[]>([]);

    React.useEffect(() => {
        if (!props.metrics || !inView) return;
        const f = props.metrics.map(e => e.diskMetrics?.filter(e => e.uniqueIdentifier === props.uniqueIdentifier)[0]);
        setOrdered(f ?? []);
    }, [props.metrics, inView]);

    const current = ordered?.[ordered.length - 1];
    return (
        <div ref={ref}>
            <ResponsiveContainer width="100%" height={150}>
                <ComposedChart data={ordered}>
                    <XAxis dataKey="dateTimeOffset" tickFormatter={e => formatXAxis(e)} />
                    <YAxis tickFormatter={e => getReadableBytesString(e)} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    {/* <Legend iconSize={10} layout="vertical" verticalAlign="middle" align="right" /> */}
                    <Area type="monotone" unit="%" dataKey="usedSpacePercentage" name={`Storage Used ${current?.usedSpacePercentage?.toFixed(1)}%`} activeDot={{ r: 4 }} fill="transparent" stroke="lime" fillOpacity={0.1} isAnimationActive={false} />
                    <Area type="monotone" unit={customUnitFlags["#Bytes"]} dataKey="usedSpaceBytes" name={`Storage Used ${getReadableBytesString(current?.usedSpaceBytes)}`} fill="transparent" stroke="white" fillOpacity={0.1} isAnimationActive={false} />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
};
