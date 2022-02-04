import { useLocalStorageState } from "ahooks";
import React from "react";
import { useInView } from "react-intersection-observer";
import { useSelector } from "react-redux";
import { ComposedChart, ReferenceLine, Bar, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis, AreaChart, Area } from "recharts";
import { GetMachineDynamicDataResponse } from "../../Dtos/Dto";
import { NetworkActivityFormat } from "../../Dtos/UiModel";
import { State } from "../../Redux/States";
import { getReadableBytesString, getReadableBitsPerSecondString, getReadableBytesPerSecondString } from "../FormatUtils";
import { ChartData, ClassicLayout, CustomTooltip, customUnitFlags, formatXAxis, ItemOne, ItemTwo } from "./Shared";
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

export const ClassicNetworkAdapterMetricView: React.FunctionComponent<{ macAddress: string; networkActivityFormat: NetworkActivityFormat } & ChartData> = props => {
    const [ordered, setOrdered] = React.useState<networkMetricsModel[]>([]);
    const dynamicState = useSelector<State, GetMachineDynamicDataResponse | undefined>(state => state.machineState.dynamic);
    const thisAdapter = Object.values(dynamicState?.networkUsageData?.adapters ?? {}).find(e => e.properties.macAddress === props.macAddress);

    React.useEffect(() => {
        if (!props.metrics) return;
        const f = props.metrics
            .map(e => e.networkMetrics?.filter(e => e.macAddress === props.macAddress)[0])
            .map(e => {
                return { ...e, uploadSpeedBps: -(e?.uploadSpeedBps ?? 0) };
            });
        setOrdered(f ?? []);
    }, [props.metrics, props.macAddress]);

    const current = ordered?.[ordered.length - 1];

    const downloadText = props.networkActivityFormat === NetworkActivityFormat.BitsPerSecond ? getReadableBitsPerSecondString(Math.abs(current?.downloadSpeedBps ?? 0)) : getReadableBytesPerSecondString(Math.abs(current?.downloadSpeedBps ?? 0));
    const uploadText = props.networkActivityFormat === NetworkActivityFormat.BitsPerSecond ? getReadableBitsPerSecondString(Math.abs(current?.uploadSpeedBps ?? 0)) : getReadableBytesPerSecondString(Math.abs(current?.uploadSpeedBps ?? 0));
    const unitType = props.networkActivityFormat === NetworkActivityFormat.BitsPerSecond ? customUnitFlags["#bps"] : customUnitFlags["#Bps"];
    function getGraphView() {
        return (
            <>
                <ResponsiveContainer width="100%">
                    <AreaChart data={ordered}>
                        <XAxis dataKey="dateTimeOffset" hide tickFormatter={e => formatXAxis(e)} />
                        <YAxis hide tickFormatter={e => (props.networkActivityFormat === NetworkActivityFormat.BitsPerSecond ? getReadableBitsPerSecondString(e) : getReadableBytesString(e))} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area unit={unitType} dataKey="downloadSpeedBps" name={`Recieve ${downloadText}`} stroke="orange" fill="orange" fillOpacity={0.1} isAnimationActive={false} />
                        <Area unit={unitType} dataKey="uploadSpeedBps" name={`Send ${uploadText}`} stroke="yellow" fill="yellow" fillOpacity={0.1} isAnimationActive={false} />
                    </AreaChart>
                </ResponsiveContainer>
            </>
        );
    }

    return (
        <ClassicLayout
            header={{ title: `${thisAdapter?.properties?.name}`, deviceName: thisAdapter?.properties?.description }}
            graph={getGraphView()}
            showRange
            bottomItems={
                <>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 30 }}>
                        {current?.downloadSpeedBps !== null && <ItemOne color="orange" title="Download Speed" value={`${downloadText}`} />}
                        {current?.uploadSpeedBps !== null && <ItemOne color="yellow" title="Upload Speed" value={`${uploadText}`} />}
                    </div>
                    <div>
                        {thisAdapter?.properties?.macAddress && <ItemTwo title="Mac Address:" value={thisAdapter.properties.macAddress.replace(/(.{2})/g, "$1-").substring(0, thisAdapter.properties.macAddress.length + 5)} />}
                        {thisAdapter?.properties?.connectionType && <ItemTwo title="Connection Type:" value={thisAdapter.properties.connectionType} />}
                        {thisAdapter?.properties?.speedBps && <ItemTwo title="Connection Speed:" value={getReadableBitsPerSecondString(thisAdapter.properties.speedBps)} />}
                        {thisAdapter?.properties?.ipInterfaceProperties?.iPv4Address && <ItemTwo title="IPv4:" value={thisAdapter?.properties?.ipInterfaceProperties?.iPv4Address} />}
                        {thisAdapter?.properties?.ipInterfaceProperties?.iPv6Address && <ItemTwo title="IPv6:" value={thisAdapter?.properties?.ipInterfaceProperties?.iPv6Address} />}
                    </div>
                </>
            }
        />
    );
};
