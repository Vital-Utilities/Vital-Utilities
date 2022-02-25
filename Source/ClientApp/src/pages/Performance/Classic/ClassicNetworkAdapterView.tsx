import React from "react";
import { useSelector } from "react-redux";
import { ResponsiveContainer, AreaChart, XAxis, YAxis, Area, Tooltip } from "recharts";
import { networkMetricsModel } from "../../../components/Charts/NetworkAdapterMetricChart";
import { ChartData, customUnitFlags, formatXAxis, CustomTooltip, ClassicLayout, ItemOne, ItemTwo } from "../../../components/Charts/Shared";
import { getReadableBitsPerSecondString, getReadableBytesPerSecondString, getReadableBytesString } from "../../../components/FormatUtils";
import { GetMachineDynamicDataResponse } from "../../../Dtos/ClientApiDto";
import { NetworkActivityFormat } from "../../../Dtos/UiModel";
import { VitalState } from "../../../Redux/States";

export const ClassicNetworkAdapterView: React.FunctionComponent<{ macAddress: string; networkActivityFormat: NetworkActivityFormat } & ChartData> = props => {
    const [ordered, setOrdered] = React.useState<networkMetricsModel[]>([]);
    const dynamicState = useSelector<VitalState, GetMachineDynamicDataResponse | undefined>(state => state.machineState.dynamic);
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
