import { GetMachineStaticDataResponse, GetMachineDynamicDataResponse } from "@vital/vitalservice";
import React from "react";
import { useSelector } from "react-redux";
import { ResponsiveContainer, AreaChart, XAxis, YAxis, Area, Tooltip } from "recharts";
import { gpuMetricsModel } from "../../../components/Charts/GpuMetricChart";
import { ChartData, formatXAxis, ClassicLayout, ItemOne, ItemTwo, ClassicTooltip } from "../../../components/Charts/Shared";
import { getReadableBytesPerSecondString, getReadableBytesString } from "../../../components/FormatUtils";
import { VitalState } from "../../../Redux/States";

export const ClassicGpuView: React.FunctionComponent<{ gpuNumber: number } & ChartData> = props => {
    const [ordered, setOrdered] = React.useState<gpuMetricsModel[]>([]);
    const staticState = useSelector<VitalState, GetMachineStaticDataResponse | undefined>(state => state.machineState.static);

    const dynamicState = useSelector<VitalState, GetMachineDynamicDataResponse | undefined>(state => state.machineState.dynamic);
    const thisGpuStatic = staticState?.gpu?.[props.gpuNumber];
    const thisGpuDynamic = dynamicState?.gpuUsageData?.[props.gpuNumber];
    React.useEffect(() => {
        if (!props.metrics) return;
        processData();
        async function processData() {
            if (!props.metrics) return;
            const f = props.metrics.map(e => e.gpuMetrics[0]);
            setOrdered(f ?? []);
        }
    }, [props.metrics, props.gpuNumber]);

    const current = ordered?.[ordered.length - 1];
    function getGraphView() {
        return (
            <>
                <ResponsiveContainer width="100%">
                    <AreaChart data={ordered}>
                        <XAxis hide dataKey="dateTimeOffset" tickFormatter={e => formatXAxis(e)} />
                        <YAxis hide yAxisId="left" />
                        <YAxis hide yAxisId="right" stroke="yellow" orientation="right" tickFormatter={e => e + "w"} />
                        // eslint-disable-next-line no-undef
                        <Tooltip content={<ClassicTooltip />} />
                        <Area yAxisId="left" unit="%" type="monotone" dataKey="coreUsagePercentage" name={`Core Load ${current?.coreUsagePercentage}%`} fillOpacity={0.1} activeDot={{ r: 4 }} isAnimationActive={false} />
                        <Area yAxisId="left" unit="°C" type="monotone" dataKey="coreTemperature" name={`Temperature ${current?.coreTemperature}°C`} stroke="white" activeDot={{ r: 4 }} fill="transparent" isAnimationActive={false} />
                        <Area yAxisId="left" unit="%" type="monotone" dataKey="vRamUsagePercentage" name={`Memory ${current?.vRamUsagePercentage}%`} stroke="orange" activeDot={{ r: 4 }} fill="transparent" isAnimationActive={false} />
                        <Area yAxisId="right" unit="w" type="monotone" dataKey="powerDrawWattage" name={`Power ${current?.powerDrawWattage}w`} stroke="yellow" activeDot={{ r: 4 }} fill="transparent" isAnimationActive={false} />
                        {current?.fanPercentage &&
                            Object.keys(current.fanPercentage).map((key, index) => {
                                return <Area key={index} unit="%" yAxisId="left" type="monotone" dataKey={`fanPercentage.${index}`} name={`Fan ${current?.fanPercentage?.[key]}%`} stroke="white" activeDot={{ r: 4 }} fill="transparent" isAnimationActive={false} />;
                            })}
                    </AreaChart>
                </ResponsiveContainer>
            </>
        );
    }
    return thisGpuStatic ? (
        <ClassicLayout
            header={{ title: "GPU", deviceName: thisGpuStatic?.name }}
            graph={getGraphView()}
            showRange
            bottomItems={
                <>
                    <div style={{ display: "flex", flexWrap: "wrap", alignContent: "flex-start", gap: 15, overflowY: "auto" }}>
                        {current?.coreUsagePercentage !== undefined && <ItemOne color="#3182bd" title="Core Utilization" value={`${current.coreUsagePercentage}%`} />}
                        {current?.vRamUsagePercentage !== undefined && <ItemOne color="orange" title="Memory" value={`${current.vRamUsagePercentage}%`} />}
                        {current?.powerDrawWattage !== undefined && <ItemOne color="yellow" title="Power" value={`${current?.powerDrawWattage}w`} />}
                        {current?.coreTemperature !== undefined && <ItemOne color="white" title="GPU Core" value={`${current?.coreTemperature}°C`} />}

                        {thisGpuDynamic?.temperatureReadings &&
                            Object.keys(thisGpuDynamic?.temperatureReadings)
                                .filter(e => e !== "GPU Core")
                                .map((key, index) => {
                                    return <ItemOne key={index} color="lightgray" title={`${key.replace("GPU ", "")}`} value={`${Math.ceil(thisGpuDynamic?.temperatureReadings[key] ?? 0)}°C`} />;
                                })}
                        {thisGpuDynamic?.pcIe?.pcIe_RxBytesPerSecond && <ItemOne color="lightgray" title="PCIE Recieve" value={getReadableBytesPerSecondString(thisGpuDynamic?.pcIe.pcIe_RxBytesPerSecond, 0)} />}
                        {thisGpuDynamic?.pcIe?.pcIe_TxBytesPerSecond && <ItemOne color="lightgray" title="PCIE Transmit" value={getReadableBytesPerSecondString(thisGpuDynamic?.pcIe.pcIe_TxBytesPerSecond, 0)} />}
                        {thisGpuDynamic?.clockSpeeds?.graphicsClockMhz && <ItemOne color="lightgray" title="Graphics Clock" value={`${Math.ceil(thisGpuDynamic?.clockSpeeds?.graphicsClockMhz)}mhz`} />}
                        {thisGpuDynamic?.clockSpeeds?.memoryClockMhz && <ItemOne color="lightgray" title="Memory Clock" value={`${Math.ceil(thisGpuDynamic?.clockSpeeds?.memoryClockMhz)}mhz`} />}
                        {thisGpuDynamic?.clockSpeeds?.computeClockMhz && <ItemOne color="lightgray" title="Compute Clock" value={`${Math.ceil(thisGpuDynamic?.clockSpeeds?.computeClockMhz)}mhz`} />}
                        {thisGpuDynamic?.clockSpeeds?.videoClockMhz && <ItemOne color="lightgray" title="Video Clock" value={`${Math.ceil(thisGpuDynamic?.clockSpeeds?.videoClockMhz)}mhz`} />}
                        {current?.fanPercentage &&
                            Object.keys(current.fanPercentage).map((key, index) => {
                                return <ItemOne key={index} color="lightgray" title={`Fan ${index + 1}`} value={`${current?.fanPercentage?.[key]}%`} />;
                            })}
                    </div>
                    <div>
                        <ItemTwo title="Total Memory:" value={getReadableBytesString(staticState?.gpu[props.gpuNumber].memoryTotalBytes)} />
                        <ItemTwo title="Physical Location:" value={`device ${props.gpuNumber}`} />
                    </div>
                </>
            }
        />
    ) : (
        <></>
    );
};
