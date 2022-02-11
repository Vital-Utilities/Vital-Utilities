import React from "react";
import { useInView } from "react-intersection-observer";
import { useSelector } from "react-redux";
import { Area, AreaChart, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { GetMachineDynamicDataResponse, GetMachineStaticDataResponse } from "../../Dtos/Dto";
import { VitalState } from "../../Redux/States";
import { getReadableBytesPerSecondString, getReadableBytesString } from "../FormatUtils";
import { ChartData, ClassicLayout, CustomTooltip, formatXAxis, ItemOne, ItemTwo } from "./Shared";
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

export const ClassicGpuMetricView: React.FunctionComponent<{ gpuNumber: number } & ChartData> = props => {
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
                        <Tooltip content={<CustomTooltip />} />
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
                    <div style={{ display: "flex", flexWrap: "wrap", alignContent: "flex-start", gap: 15 }}>
                        {current?.coreUsagePercentage !== undefined && <ItemOne color="#3182bd" title="Core Utilization" value={`${current.coreUsagePercentage}%`} />}
                        {current?.vRamUsagePercentage && <ItemOne color="orange" title="Memory" value={`${current.vRamUsagePercentage}%`} />}
                        {current?.powerDrawWattage !== undefined && <ItemOne color="yellow" title="Power" value={`${current?.powerDrawWattage.toFixed(2)}w`} />}
                        {current?.coreTemperature !== undefined && <ItemOne color="white" title="GPU Core" value={`${current?.coreTemperature}°C`} />}

                        {thisGpuDynamic?.temperatureReadings &&
                            Object.keys(thisGpuDynamic?.temperatureReadings)
                                .filter(e => e !== "GPU Core")
                                .map((key, index) => {
                                    return <ItemOne key={index} color="lightgray" title={`${key.replace("GPU ", "")}`} value={`${Math.ceil(thisGpuDynamic?.temperatureReadings[key] ?? 0)}°C`} />;
                                })}
                        {thisGpuDynamic?.pcIe_Throughput.pcIe_Rx_BytesPerSecond !== undefined && <ItemOne color="lightgray" title="PCIE Recieve" value={getReadableBytesPerSecondString(thisGpuDynamic?.pcIe_Throughput.pcIe_Rx_BytesPerSecond, 0)} />}
                        {thisGpuDynamic?.pcIe_Throughput.pcIe_Tx_BytesPerSecond !== undefined && <ItemOne color="lightgray" title="PCIE Transmit" value={getReadableBytesPerSecondString(thisGpuDynamic?.pcIe_Throughput.pcIe_Tx_BytesPerSecond, 0)} />}
                        {thisGpuDynamic?.memoryClockMhz !== undefined && <ItemOne color="lightgray" title="Memory Clock" value={`${Math.ceil(thisGpuDynamic?.memoryClockMhz)}mhz`} />}
                        {thisGpuDynamic?.shaderClockMhz !== undefined && <ItemOne color="lightgray" title="Shader Clock" value={`${Math.ceil(thisGpuDynamic?.shaderClockMhz)}mhz`} />}

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
