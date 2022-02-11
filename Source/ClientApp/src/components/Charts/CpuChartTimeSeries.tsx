import React from "react";
import { useInView } from "react-intersection-observer";
import { Area, AreaChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TimeSeriesMachineMetricsResponse } from "../../Dtos/Dto";
import { ChartData, CustomTooltip, formatXAxis } from "./Shared";

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
