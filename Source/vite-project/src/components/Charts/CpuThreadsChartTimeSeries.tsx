import { CpuUsageMetricModel, TimeSeriesMachineMetricsResponse } from "@vital/vitalservice";
import React from "react";
import { useInView } from "react-intersection-observer";
import { useSelector } from "react-redux";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { VitalState } from "../../Redux/States";
import { CustomTooltip, formatXAxis } from "./Shared";

// array of colors
const COLORS = ["#0088FE", "#FF8234", "#00C49F", "#FFBB28", "#ffffff", "#FF3956", "#8c009e", "#ff70ac", "#b7860b", "#00bfff", "#ffd700", "#0f0", "#008080"];

export const CpuThreadsChartTimeSeries: React.FunctionComponent = () => {
    const { ref, inView } = useInView();
    const [ordered, setOrdered] = React.useState<CpuUsageMetricModel[]>([]);
    const metrics = useSelector<VitalState, TimeSeriesMachineMetricsResponse | undefined>(state => state.machineState?.timeSeriesMetricsState);

    React.useEffect(() => {
        if (!metrics || !inView) return;

        ProcessData();
        async function ProcessData() {
            const chartable = metrics?.metrics.flatMap(e => {
                const flat = e.cpuUsageData.map(d => {
                    return { ...d, dateTimeOffset: e.dateTimeOffset };
                });
                return flat;
            });
            setOrdered(chartable ?? []);
        }
    }, [metrics, inView]);

    const current = ordered?.[ordered.length - 1];
    return (
        <div ref={ref}>
            <ResponsiveContainer width="100%" height={150}>
                <AreaChart data={ordered}>
                    <XAxis dataKey="dateTimeOffset" tickFormatter={e => formatXAxis(e)} />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    {current?.coresUsagePercentage &&
                        Object.keys(current.coresUsagePercentage).map(i => {
                            return <Area key={`cpu ${i}`} unit="%" type="monotone" stroke={COLORS[Number.parseInt(i)]} dataKey={`coresUsagePercentage.${i}`} name={`Cpu ${i} ${current?.coresUsagePercentage?.[Number.parseInt(i)]}%`} activeDot={{ r: 4 }} fill="transparent" isAnimationActive={false} />;
                        })}
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};
