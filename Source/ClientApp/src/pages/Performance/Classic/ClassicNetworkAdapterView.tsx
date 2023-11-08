import { GetMachineDynamicDataResponse } from "@vital/vitalservice";
import React from "react";
import { useSelector } from "react-redux";
import { ResponsiveContainer, AreaChart, XAxis, YAxis, Area, Tooltip } from "recharts";
import { networkMetricsModel } from "../../../components/Charts/NetworkAdapterMetricChart";
import { ChartData, customUnitFlags, formatXAxis, ClassicLayout, ItemOne, ItemTwo, ClassicTooltip } from "../../../components/Charts/Shared";
import { getReadableBitsPerSecondString } from "../../../components/FormatUtils";
import { VitalState } from "../../../Redux/States";

export const ClassicNetworkAdapterView: React.FunctionComponent<{ macAddress: string } & ChartData> = props => {
    const [ordered, setOrdered] = React.useState<networkMetricsModel[]>();
    const dynamicState = useSelector<VitalState, GetMachineDynamicDataResponse | undefined>(state => state.machineState.dynamic);
    const thisAdapter = Object.values(dynamicState?.networkUsageData?.adapters ?? {})
        .filter(e => e.properties.isUp === true)
        .find(e => e.properties.macAddress === props.macAddress);

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
    const currentRecievedBps = getReadableBitsPerSecondString(current?.downloadSpeedBps ?? 0);
    const currentSentBps = getReadableBitsPerSecondString(current?.uploadSpeedBps ?? 0);
    function getGraphView() {
        return (
            <>
                <ResponsiveContainer width="100%">
                    <AreaChart data={ordered}>
                        <XAxis dataKey="dateTimeOffset" hide tickFormatter={e => formatXAxis(e)} />
                        <YAxis hide tickFormatter={e => getReadableBitsPerSecondString(e)} />
                        <Tooltip content={<ClassicTooltip />} />
                        <Area unit={customUnitFlags["#Bps"]} dataKey="downloadSpeedBps" name={`Recieve ${currentRecievedBps}`} stroke="orange" fill="orange" fillOpacity={0.1} isAnimationActive={false} />
                        <Area unit={customUnitFlags["#Bps"]} dataKey="uploadSpeedBps" name={`Send ${currentSentBps}`} stroke="yellow" fill="yellow" fillOpacity={0.1} isAnimationActive={false} />
                    </AreaChart>
                </ResponsiveContainer>
            </>
        );
    }

    return (
        <ClassicLayout
            header={{ title: `${thisAdapter?.properties?.connectionType} (${thisAdapter?.properties?.name})`, deviceName: thisAdapter?.properties?.description ?? undefined }}
            graph={getGraphView()}
            showRange
            bottomItems={
                <>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 30 }}>
                        {current?.downloadSpeedBps !== null && <ItemOne color="orange" title="Recieved" value={`${currentRecievedBps}`} />}
                        {current?.uploadSpeedBps !== null && <ItemOne color="yellow" title="Sent" value={`${currentSentBps}`} />}
                    </div>
                    <div>
                        {thisAdapter?.properties?.macAddress && <ItemTwo title="Mac Address:" value={thisAdapter.properties.macAddress} />}
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
