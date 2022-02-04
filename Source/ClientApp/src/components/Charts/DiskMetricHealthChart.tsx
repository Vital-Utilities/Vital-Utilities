import React from "react";
import { useInView } from "react-intersection-observer";
import { Area, AreaChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getReadableBytesString } from "../FormatUtils";
import { diskMetricsModel } from "./DiskMetricChart";
import { ChartData, CustomTooltip, customUnitFlags, formatXAxis } from "./Shared";

export const DiskMetricHealthChart: React.FunctionComponent<{ uniqueIdentifier: string } & ChartData> = props => {
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
                    <YAxis tickFormatter={e => getReadableBytesString(e)} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area type="monotone" unit={customUnitFlags["#Bytes"]} dataKey="dataWrittenBytes" name={`Total Write ${getReadableBytesString(current?.dataWrittenBytes)}`} activeDot={{ r: 4 }} fill="transparent" stroke="lime" fillOpacity={0.1} isAnimationActive={false} />
                    <Area type="monotone" unit={customUnitFlags["#Bytes"]} dataKey="dataReadBytes" name={`Total Read ${current?.dataReadBytes && getReadableBytesString(current?.dataReadBytes)}`} activeDot={{ r: 4 }} fill="transparent" stroke="orange" fillOpacity={0.1} isAnimationActive={false} />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};
