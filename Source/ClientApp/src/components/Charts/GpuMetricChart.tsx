import React from "react";
import { useInView } from "react-intersection-observer";
import { Area, AreaChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartData, CustomTooltip, formatXAxis } from "./Shared";
export type gpuMetricsModel = {
    dateTimeOffset: Date;
    vRamUsagePercentage: string;
    coreUsagePercentage?: number | undefined;
    vramUsageGB?: number | undefined;
    vramTotalGB?: number | undefined;
    coreTemperature?: number | undefined;
    powerDrawWattage?: number | undefined;
    fanPercentage?:
        | {
              [key: string]: number;
          }
        | undefined;
    id: number;
    uniqueIdentifier?: string | undefined;
};
export const GpuMetricChart: React.FunctionComponent<{ gpuNumber: string } & ChartData> = props => {
    const { ref, inView } = useInView();

    const [ordered, setOrdered] = React.useState<gpuMetricsModel[]>([]);

    React.useEffect(() => {
        if (!props.metrics || !inView) return;
        processData();
        async function processData() {
            if (!props.metrics || !inView) return;
            const f = props.metrics.map(e => e.gpuMetrics[0]);
            setOrdered(f ?? []);
        }
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
                    <Area yAxisId="left" unit="%" type="monotone" dataKey="coreUsagePercentage" name={`Core Load ${current?.coreUsagePercentage}%`} fillOpacity={0.1} activeDot={{ r: 4 }} isAnimationActive={false} />
                    <Area yAxisId="left" unit="°C" type="monotone" dataKey="coreTemperature" name={`Temperature ${current?.coreTemperature}°C`} stroke="orange" activeDot={{ r: 4 }} fill="transparent" isAnimationActive={false} />
                    <Area yAxisId="left" unit="%" type="monotone" dataKey="vRamUsagePercentage" name={`Memory ${current?.vRamUsagePercentage}%`} stroke="lime" activeDot={{ r: 4 }} fill="transparent" isAnimationActive={false} />
                    <Area yAxisId="right" unit="w" type="monotone" dataKey="powerDrawWattage" name={`Power ${current?.powerDrawWattage}w`} stroke="yellow" activeDot={{ r: 4 }} fill="transparent" isAnimationActive={false} />
                    {current?.fanPercentage &&
                        Object.keys(current.fanPercentage).map((key, index) => {
                            return <Area key={index} unit="%" yAxisId="left" type="monotone" dataKey={`fanPercentage.${index}`} name={`Fan ${current?.fanPercentage?.[key]}%`} stroke="white" activeDot={{ r: 4 }} fill="transparent" isAnimationActive={false} />;
                        })}
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};
