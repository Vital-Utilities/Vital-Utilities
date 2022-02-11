import { useLocalStorageState } from "ahooks";
import React from "react";
import { useInView } from "react-intersection-observer";
import { ComposedChart, ReferenceLine, Bar, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { NetworkActivityFormat } from "../../Dtos/UiModel";
import { getReadableBytesString, getReadableBitsPerSecondString, getReadableBytesPerSecondString } from "../FormatUtils";
import { ChartData, CustomTooltip, customUnitFlags, formatXAxis } from "./Shared";
export type networkMetricsModel = {
    macAddress: string;
    dateTimeOffset: Date;
    uploadSpeedBps: number | null;
    downloadSpeedBps: number | null;
};
export const NetworkAdapterMetricChart: React.FunctionComponent<{ macAddress: string } & ChartData> = props => {
    const { ref, inView } = useInView();

    const [ordered, setOrdered] = React.useState<networkMetricsModel[]>([]);
    const [networkActivityFormat, setNetworkActivityFormat] = useLocalStorageState("networkActivityFormat", { defaultValue: NetworkActivityFormat.BitsPerSecond });
    React.useEffect(() => {
        if (!props.metrics || !inView) return;
        const f = props.metrics.map(e => e.networkMetrics?.filter(e => e.macAddress === props.macAddress)[0]);
        setOrdered(f ?? []);
    }, [props.metrics, inView]);

    const current = ordered?.[ordered.length - 1];

    const downloadText = networkActivityFormat === NetworkActivityFormat.BitsPerSecond ? getReadableBitsPerSecondString(Math.abs(current?.downloadSpeedBps ?? 0)) : getReadableBytesPerSecondString(Math.abs(current?.downloadSpeedBps ?? 0));
    const uploadText = networkActivityFormat === NetworkActivityFormat.BitsPerSecond ? getReadableBitsPerSecondString(Math.abs(current?.uploadSpeedBps ?? 0)) : getReadableBytesPerSecondString(Math.abs(current?.uploadSpeedBps ?? 0));
    const unitType = networkActivityFormat === NetworkActivityFormat.BitsPerSecond ? customUnitFlags["#bps"] : customUnitFlags["#Bps"];

    return (
        <div ref={ref}>
            <ResponsiveContainer width="100%" height={150}>
                <ComposedChart data={ordered} stackOffset="sign">
                    <XAxis dataKey="dateTimeOffset" tickFormatter={e => formatXAxis(e)} />
                    <YAxis tickFormatter={e => (networkActivityFormat === NetworkActivityFormat.BitsPerSecond ? getReadableBitsPerSecondString(Math.abs(e)) : getReadableBytesString(Math.abs(e)))} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <ReferenceLine y={0} stroke="white" />
                    <Bar stackId="stack" unit={unitType} dataKey="downloadSpeedBps" name={`Recieve ${downloadText}`} stroke="rgb(49, 130, 189)" fill="rgb(49, 130, 189)" isAnimationActive={false} />
                    <Bar stackId="stack" unit={unitType} dataKey="uploadSpeedBps" name={`Send ${uploadText}`} stroke="orange" fill="orange" isAnimationActive={false} />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
};
