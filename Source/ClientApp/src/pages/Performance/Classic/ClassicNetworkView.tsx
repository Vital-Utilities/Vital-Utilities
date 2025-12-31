import { GetMachineDynamicDataResponse, NetworkAdapterUsage } from "@vital/vitalservice";
import React, { useRef, useEffect, useCallback, useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { ClassicLayout, ItemOne, ItemTwo } from "../../../components/Charts/Shared";
import { getReadableBitsPerSecondString } from "../../../components/FormatUtils";
import { VitalState } from "../../../Redux/States";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Network colors
const COLORS = {
    download: "#22c55e", // Green - Download/Receive
    upload: "#f97316", // Orange - Upload/Send
    background: "#1a1a24",
    border: "#2a2a3a",
    text: "#f8fafc",
    textMuted: "#94a3b8",
    gridLine: "rgba(100, 116, 139, 0.1)"
};

// Animation
const LERP_FACTOR = 0.15;

function lerp(current: number, target: number, factor: number): number {
    return current + (target - current) * factor;
}

interface NetworkHistory {
    download: number;
    upload: number;
}

export const ClassicNetworkView: React.FunctionComponent = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(0);

    // Animated current values
    const animatedDownloadRef = useRef<number>(0);
    const animatedUploadRef = useRef<number>(0);

    const dynamicState = useSelector<VitalState, GetMachineDynamicDataResponse | undefined>(state => state.machineState.dynamic);

    // Get active adapters - only Wi-Fi and Ethernet
    const activeAdapters = useMemo(() => {
        return Object.entries(dynamicState?.networkUsageData?.adapters ?? {})
            .filter(([, adapter]) => {
                if (!adapter.properties.isUp) return false;
                const connType = adapter.properties.connectionType?.toLowerCase() ?? "";
                // Only include Wireless (Wi-Fi) and Ethernet adapters
                return connType === "wireless" || connType === "ethernet";
            })
            .map(([mac, adapter]) => ({ mac, adapter }));
    }, [dynamicState?.networkUsageData?.adapters]);

    // Selected adapter state - default to first active adapter
    const [selectedMac, setSelectedMac] = useState<string | null>(null);

    // Auto-select first adapter if none selected
    useEffect(() => {
        if (!selectedMac && activeAdapters.length > 0) {
            setSelectedMac(activeAdapters[0].mac);
        }
    }, [selectedMac, activeAdapters]);

    const thisAdapter: NetworkAdapterUsage | undefined = activeAdapters.find(a => a.mac === selectedMac)?.adapter;

    // Get history from backend (continuously updated even when view is not active)
    const backendHistory = selectedMac ? dynamicState?.networkHistory?.[selectedMac] : undefined;

    // Convert backend history format to local format for drawing
    const history: NetworkHistory[] = useMemo(() => {
        if (!backendHistory?.history) return [];
        return backendHistory.history.map(h => ({
            download: h.downloadBps,
            upload: h.uploadBps
        }));
    }, [backendHistory?.history]);

    const maxSpeed = backendHistory?.maxSpeedBps ?? 1_000_000;

    const currentDownload = thisAdapter?.usage?.recieveBps ?? 0;
    const currentUpload = thisAdapter?.usage?.sendBps ?? 0;

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();

        // Always reset canvas size to handle DPR properly
        if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
        }

        // Reset transform and scale for DPR
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);

        const width = rect.width;
        const height = rect.height;

        ctx.clearRect(0, 0, width, height);

        // Animate current values (for smooth bar animation)
        animatedDownloadRef.current = lerp(animatedDownloadRef.current, currentDownload, LERP_FACTOR);
        animatedUploadRef.current = lerp(animatedUploadRef.current, currentUpload, LERP_FACTOR);

        // Draw the network activity visualization (animated bars, actual text values)
        drawNetworkActivity(ctx, width, height, animatedDownloadRef.current, animatedUploadRef.current, currentDownload, currentUpload, maxSpeed);

        // Draw the history graph
        drawNetworkGraph(ctx, width, height, history, maxSpeed);

        animationRef.current = requestAnimationFrame(draw);
    }, [currentDownload, currentUpload, history, maxSpeed]);

    useEffect(() => {
        animationRef.current = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(animationRef.current);
    }, [draw]);

    return (
        <ClassicLayout
            header={{
                title: "Network",
                deviceName: thisAdapter?.properties?.description ?? undefined,
                rightContent:
                    activeAdapters.length > 1 ? (
                        <Select value={selectedMac ?? undefined} onValueChange={setSelectedMac}>
                            <SelectTrigger style={{ width: 280 }}>
                                <SelectValue placeholder="Select adapter" />
                            </SelectTrigger>
                            <SelectContent>
                                {activeAdapters.map(({ mac, adapter }) => (
                                    <SelectItem key={mac} value={mac}>
                                        {adapter.properties.connectionType ?? "Network"} ({adapter.properties.name})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    ) : (
                        <span style={{ color: COLORS.textMuted, fontSize: 14 }}>
                            {thisAdapter?.properties?.connectionType ?? "Network"} ({thisAdapter?.properties?.name ?? "Unknown"})
                        </span>
                    )
            }}
            graph={<canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />}
            bottomItems={
                <>
                    <div style={{ display: "flex", flexWrap: "wrap", alignContent: "flex-start", gap: 15, overflowY: "auto" }}>
                        <ItemOne color={COLORS.download} title="Download" value={getReadableBitsPerSecondString(currentDownload)} />
                        <ItemOne color={COLORS.upload} title="Upload" value={getReadableBitsPerSecondString(currentUpload)} />
                    </div>
                    <div>
                        {thisAdapter?.properties?.macAddress && <ItemTwo title="MAC Address:" value={thisAdapter.properties.macAddress} />}
                        {thisAdapter?.properties?.connectionType && <ItemTwo title="Connection:" value={thisAdapter.properties.connectionType} />}
                        {thisAdapter?.properties?.speedBps && <ItemTwo title="Link Speed:" value={getReadableBitsPerSecondString(thisAdapter.properties.speedBps)} />}
                        {thisAdapter?.properties?.ipInterfaceProperties?.iPv4Address && <ItemTwo title="IPv4:" value={thisAdapter.properties.ipInterfaceProperties.iPv4Address} />}
                        {thisAdapter?.properties?.ipInterfaceProperties?.iPv6Address && <ItemTwo title="IPv6:" value={thisAdapter.properties.ipInterfaceProperties.iPv6Address} />}
                    </div>
                </>
            }
        />
    );
};

function drawNetworkActivity(ctx: CanvasRenderingContext2D, width: number, height: number, animatedDownload: number, animatedUpload: number, actualDownload: number, actualUpload: number, maxSpeed: number) {
    const centerY = height * 0.25;
    const barWidth = width * 0.7;
    const barHeight = 16;
    const barX = (width - barWidth) / 2;
    const gap = 12;
    const time = Date.now();

    // Download bar (top) - use animated for bar, actual for text
    const downloadY = centerY - gap / 2 - barHeight;
    const downloadPercent = Math.min(1, animatedDownload / maxSpeed);
    drawActivityBar(ctx, barX, downloadY, barWidth, barHeight, downloadPercent, COLORS.download, "Download", actualDownload, time);

    // Upload bar (bottom) - use animated for bar, actual for text
    const uploadY = centerY + gap / 2;
    const uploadPercent = Math.min(1, animatedUpload / maxSpeed);
    drawActivityBar(ctx, barX, uploadY, barWidth, barHeight, uploadPercent, COLORS.upload, "Upload", actualUpload, time);

    // Scale indicator
    ctx.font = "9px system-ui";
    ctx.fillStyle = COLORS.textMuted;
    ctx.textAlign = "right";
    ctx.fillText(getReadableBitsPerSecondString(maxSpeed), barX + barWidth, downloadY - 6);
}

function drawActivityBar(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, percent: number, color: string, label: string, value: number, time: number) {
    const cornerRadius = height / 2;

    // Background
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, cornerRadius);
    ctx.fillStyle = "rgba(30, 30, 40, 0.8)";
    ctx.fill();
    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Filled portion
    if (percent > 0.01) {
        const fillWidth = Math.max(height, width * percent);
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(x, y, width, height, cornerRadius);
        ctx.clip();

        // Gradient fill
        const gradient = ctx.createLinearGradient(x, y, x + fillWidth, y);
        gradient.addColorStop(0, adjustBrightness(color, -30));
        gradient.addColorStop(0.5, color);
        gradient.addColorStop(1, adjustBrightness(color, 20));
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, fillWidth, height, cornerRadius);
        ctx.fill();

        // Animated pulse/shimmer effect when active
        if (value > 1000) {
            const shimmerPos = (time / 30) % (width + 100);
            const shimmerGradient = ctx.createLinearGradient(x + shimmerPos - 50, 0, x + shimmerPos + 50, 0);
            shimmerGradient.addColorStop(0, "rgba(255, 255, 255, 0)");
            shimmerGradient.addColorStop(0.5, "rgba(255, 255, 255, 0.15)");
            shimmerGradient.addColorStop(1, "rgba(255, 255, 255, 0)");
            ctx.fillStyle = shimmerGradient;
            ctx.fillRect(x, y, fillWidth, height);
        }

        ctx.restore();
    }

    // Label on left
    ctx.font = "10px system-ui";
    ctx.fillStyle = COLORS.textMuted;
    ctx.textAlign = "right";
    ctx.fillText(label, x - 8, y + height / 2 + 3);

    // Value on right
    ctx.textAlign = "left";
    ctx.fillStyle = color;
    ctx.fillText(getReadableBitsPerSecondString(value), x + width + 8, y + height / 2 + 3);
}

function drawNetworkGraph(ctx: CanvasRenderingContext2D, width: number, height: number, history: NetworkHistory[], maxSpeed: number) {
    if (history.length < 1) return;

    const graphHeight = height * 0.45;
    const graphY = height * 0.9;
    const graphWidth = width * 0.85;
    const graphX = (width - graphWidth) / 2;

    // Draw from center - download goes up, upload goes down
    const centerY = graphY - graphHeight / 2;

    // Grid lines
    ctx.strokeStyle = COLORS.gridLine;
    ctx.lineWidth = 1;

    // Center line (zero)
    ctx.beginPath();
    ctx.moveTo(graphX, centerY);
    ctx.lineTo(graphX + graphWidth, centerY);
    ctx.stroke();

    // Top and bottom bounds
    for (const offset of [-graphHeight / 2, graphHeight / 2]) {
        ctx.beginPath();
        ctx.moveTo(graphX, centerY + offset);
        ctx.lineTo(graphX + graphWidth, centerY + offset);
        ctx.stroke();
    }

    // Draw bars
    const maxBars = 60;
    const barGap = 2;
    const totalBarWidth = graphWidth / maxBars;
    const barWidth = totalBarWidth - barGap;

    for (let i = 0; i < history.length; i++) {
        const barIndex = maxBars - history.length + i;
        const x = graphX + barIndex * totalBarWidth + barGap / 2;

        // Download bar (above center)
        const downloadHeight = (history[i].download / maxSpeed) * (graphHeight / 2);
        if (downloadHeight > 0) {
            const clampedDownloadHeight = Math.min(downloadHeight, graphHeight / 2);

            // Gradient for download bar
            const downloadGradient = ctx.createLinearGradient(0, centerY - clampedDownloadHeight, 0, centerY);
            downloadGradient.addColorStop(0, COLORS.download);
            downloadGradient.addColorStop(1, adjustBrightness(COLORS.download, -40));

            ctx.fillStyle = downloadGradient;
            ctx.beginPath();
            ctx.roundRect(x, centerY - clampedDownloadHeight, barWidth, clampedDownloadHeight, [2, 2, 0, 0]);
            ctx.fill();

            // Subtle glow for active bars
            if (i === history.length - 1 && history[i].download > 1000) {
                ctx.save();
                ctx.shadowColor = COLORS.download;
                ctx.shadowBlur = 8;
                ctx.fillStyle = COLORS.download;
                ctx.beginPath();
                ctx.roundRect(x, centerY - clampedDownloadHeight, barWidth, clampedDownloadHeight, [2, 2, 0, 0]);
                ctx.fill();
                ctx.restore();
            }
        }

        // Upload bar (below center)
        const uploadHeight = (history[i].upload / maxSpeed) * (graphHeight / 2);
        if (uploadHeight > 0) {
            const clampedUploadHeight = Math.min(uploadHeight, graphHeight / 2);

            // Gradient for upload bar
            const uploadGradient = ctx.createLinearGradient(0, centerY, 0, centerY + clampedUploadHeight);
            uploadGradient.addColorStop(0, adjustBrightness(COLORS.upload, -40));
            uploadGradient.addColorStop(1, COLORS.upload);

            ctx.fillStyle = uploadGradient;
            ctx.beginPath();
            ctx.roundRect(x, centerY, barWidth, clampedUploadHeight, [0, 0, 2, 2]);
            ctx.fill();

            // Subtle glow for active bars
            if (i === history.length - 1 && history[i].upload > 1000) {
                ctx.save();
                ctx.shadowColor = COLORS.upload;
                ctx.shadowBlur = 8;
                ctx.fillStyle = COLORS.upload;
                ctx.beginPath();
                ctx.roundRect(x, centerY, barWidth, clampedUploadHeight, [0, 0, 2, 2]);
                ctx.fill();
                ctx.restore();
            }
        }
    }

    // Labels
    ctx.font = "10px system-ui";
    ctx.fillStyle = COLORS.textMuted;
    ctx.textAlign = "left";
    ctx.fillText("NETWORK ACTIVITY", graphX, centerY - graphHeight / 2 - 8);

    // Legend
    ctx.textAlign = "right";
    ctx.fillStyle = COLORS.download;
    ctx.fillText("Download", graphX + graphWidth - 60, centerY - graphHeight / 2 - 8);
    ctx.fillStyle = COLORS.upload;
    ctx.fillText("Upload", graphX + graphWidth, centerY - graphHeight / 2 - 8);

    // Time labels
    ctx.fillStyle = COLORS.textMuted;
    ctx.textAlign = "left";
    ctx.fillText("60s", graphX, graphY + 5);
    ctx.textAlign = "right";
    ctx.fillText("now", graphX + graphWidth, graphY + 5);

    // Scale labels
    ctx.textAlign = "right";
    ctx.fillText(getReadableBitsPerSecondString(maxSpeed), graphX - 5, centerY - graphHeight / 2 + 4);
    ctx.fillText(getReadableBitsPerSecondString(maxSpeed), graphX - 5, centerY + graphHeight / 2 + 4);
}

function adjustBrightness(hex: string, percent: number): string {
    const num = parseInt(hex.replace("#", ""), 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + percent));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + percent));
    const b = Math.min(255, Math.max(0, (num & 0x0000ff) + percent));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
