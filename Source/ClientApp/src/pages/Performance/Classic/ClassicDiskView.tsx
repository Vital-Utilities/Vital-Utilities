import React from "react";
import { ResponsiveContainer, AreaChart, XAxis, YAxis, Area, Tooltip } from "recharts";
import { diskMetricsModel } from "../../../components/Charts/DiskMetricChart";
import { ChartData, formatXAxis, customUnitFlags, ClassicLayout, ItemOne, ItemTwo, ClassicTooltip } from "../../../components/Charts/Shared";
import { getReadableBytesString, getReadableBytesPerSecondString } from "../../../components/FormatUtils";

export const ClassicDiskView: React.FunctionComponent<{ driveLetter: string } & ChartData> = props => {
    const [ordered, setOrdered] = React.useState<diskMetricsModel[]>([]);

    React.useEffect(() => {
        if (!props.metrics) return;
        const f = props.metrics.map(e => e.diskMetrics?.filter(e => e.driveLetter === props.driveLetter)[0]);
        setOrdered(f ?? []);
    }, [props.metrics, props.driveLetter]);

    const current = ordered?.[ordered.length - 1];

    function getGraphView() {
        return (
            <>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={ordered}>
                        <XAxis dataKey="dateTimeOffset" hide tickFormatter={e => formatXAxis(e)} />
                        <YAxis yAxisId="left" domain={[0, 100]} hide />
                        <YAxis yAxisId="right" orientation="left" hide tickFormatter={e => getReadableBytesString(e)} />
                        <YAxis yAxisId="temp" stroke="white" hide domain={[0, 100]} orientation="right" tickFormatter={e => e + "°C"} />
                        <Tooltip content={<ClassicTooltip />} />
                        <Area yAxisId="left" unit="%" type="monotone" dataKey="totalActivityPercentage" name={"Utilization"} activeDot={{ r: 4 }} fillOpacity={0.1} isAnimationActive={false} />
                        <Area yAxisId="right" unit={customUnitFlags["#Bps"]} type="monotone" dataKey="readRateBytesPerSecond" name={`Read ${getReadableBytesPerSecondString(current?.readRateBytesPerSecond)}`} activeDot={{ r: 4 }} stroke="orange" fill="orange" fillOpacity={0.1} isAnimationActive={false} />
                        <Area yAxisId="right" unit={customUnitFlags["#Bps"]} type="monotone" dataKey="writeRateBytesPerSecond" name={`Write ${getReadableBytesPerSecondString(current?.writeRateBytesPerSecond)}`} activeDot={{ r: 4 }} stroke="yellow" fill="yellow" isAnimationActive={false} fillOpacity={0.1} />
                        <Area yAxisId="temp" unit="°C" type="monotone" dataKey="temperatures.Temperature" name={`Temperature ${current?.temperatures?.["Temperature"]}°C`} activeDot={{ r: 4 }} fill="transparent" stroke="white" fillOpacity={0.1} isAnimationActive={false} />
                    </AreaChart>
                </ResponsiveContainer>
            </>
        );
    }
    return (
        <ClassicLayout
            header={{ title: `Disk (${current?.driveLetter})`, deviceName: current?.name ?? undefined }}
            graph={getGraphView()}
            showRange
            bottomItems={
                <>
                    <div style={{ display: "flex", alignContent: "flex-start", flexWrap: "wrap", gap: 30 }}>
                        <ItemOne color="#3182bd" title="Utilisation" value={`${current?.totalActivityPercentage}%`} />
                        <ItemOne color="orange" title="Read Speed" value={`${getReadableBytesPerSecondString(current?.readRateBytesPerSecond)}`} />
                        <ItemOne color="yellow" title="Write Speed" value={`${getReadableBytesPerSecondString(current?.writeRateBytesPerSecond)}`} />
                        <ItemOne color="yellow" title="Storage" value={`${getReadableBytesString(current?.usedSpaceBytes)}/${getReadableBytesString(current?.totalSpaceBytes)}`} />
                        {Object.values(current?.temperatures ?? {}).map((e, i) => {
                            return <ItemOne key={i} title={`Temperature ${i}`} value={`${e}°C`} />;
                        })}
                    </div>
                    <div>
                        {/* <ItemTwo title="Type:" value={`${current?.driveType}`} /> */}
                        {current?.dataReadBytes && <ItemTwo title="Total Read:" value={getReadableBytesString(current?.dataReadBytes)} />}
                        {current?.dataWrittenBytes && <ItemTwo title="Total Written:" value={getReadableBytesString(current?.dataWrittenBytes)} />}
                    </div>
                </>
            }
        />
    );
};
