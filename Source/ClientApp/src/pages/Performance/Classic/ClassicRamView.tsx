import { GetMachineStaticDataResponse, GetMachineDynamicDataResponse } from "@vital/vitalservice";
import React, { useRef, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { ClassicLayout, ItemOne, ItemTwo } from "../../../components/Charts/Shared";
import { getReadableBytesString } from "../../../components/FormatUtils";
import { VitalState } from "../../../Redux/States";

// Memory segment colors matching Activity Monitor style
const COLORS = {
    app: "#f97316", // Orange - App Memory
    wired: "#ef4444", // Red - Wired Memory
    compressed: "#a855f7", // Purple - Compressed
    cached: "#06b6d4", // Cyan - Cached Files
    swap: "#eab308", // Yellow - Swap Used
    free: "#22c55e", // Green - Free
    inUse: "#3b82f6", // Blue - In Use (matches memory usage chart)
    background: "#1a1a24",
    border: "#2a2a3a",
    text: "#f8fafc",
    textMuted: "#94a3b8"
};

// Animation easing - smooth interpolation factor (0.08 = smooth, 0.2 = snappy)
const LERP_FACTOR = 0.1;

// Linear interpolation helper
function lerp(current: number, target: number, factor: number): number {
    return current + (target - current) * factor;
}

// Animated segment values
interface AnimatedMemoryData {
    app: number;
    wired: number;
    compressed: number;
    cached: number;
    free: number;
    total: number;
    swapUsed: number;
    swapTotal: number;
}

export const ClassicRamView: React.FunctionComponent = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(0);
    const memoryHistoryRef = useRef<number[]>([]);

    // Animated values - these smoothly transition toward target values
    const animatedValuesRef = useRef<AnimatedMemoryData>({
        app: 0,
        wired: 0,
        compressed: 0,
        cached: 0,
        free: 0,
        total: 0,
        swapUsed: 0,
        swapTotal: 0
    });

    // Track if this is the first render (for instant initial values)
    const isFirstRenderRef = useRef(true);

    const staticState = useSelector<VitalState, GetMachineStaticDataResponse | undefined>(state => state.machineState.static);
    const dynamicState = useSelector<VitalState, GetMachineDynamicDataResponse | undefined>(state => state.machineState.dynamic);
    const ramData = dynamicState?.ramUsagesData;
    const ramStatic = staticState?.ram;

    // Update memory history
    useEffect(() => {
        if (ramData?.usedMemoryBytes !== undefined && ramData?.totalVisibleMemoryBytes) {
            const usedPercent = (ramData.usedMemoryBytes / ramData.totalVisibleMemoryBytes) * 100;
            memoryHistoryRef.current.push(usedPercent);
            if (memoryHistoryRef.current.length > 60) {
                memoryHistoryRef.current.shift();
            }
        }
    }, [ramData?.usedMemoryBytes, ramData?.totalVisibleMemoryBytes]);

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();

        if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);
        }

        const width = rect.width;
        const height = rect.height;

        ctx.clearRect(0, 0, width, height);

        if (!ramData) {
            animationRef.current = requestAnimationFrame(draw);
            return;
        }

        // Target values from actual data
        const targetTotal = ramData.totalVisibleMemoryBytes || 1;
        const targetUsed = ramData.usedMemoryBytes || 0;
        const targetApp = ramData.appMemoryBytes || 0;
        const targetWired = ramData.wiredMemoryBytes || 0;
        const targetCompressed = ramData.compressedMemoryBytes || 0;
        const targetCached = ramData.cachedFilesBytes || 0;
        const targetSwapUsed = ramData.swapUsedBytes || 0;
        const targetSwapTotal = ramData.swapTotalBytes || 0;
        const targetFree = Math.max(0, targetTotal - targetUsed);

        const animated = animatedValuesRef.current;

        // On first render with data, set values instantly (no animation delay)
        if (isFirstRenderRef.current && targetTotal > 0) {
            animated.total = targetTotal;
            animated.app = targetApp;
            animated.wired = targetWired;
            animated.compressed = targetCompressed;
            animated.cached = targetCached;
            animated.free = targetFree;
            animated.swapUsed = targetSwapUsed;
            animated.swapTotal = targetSwapTotal;
            isFirstRenderRef.current = false;
        } else {
            // Smoothly interpolate toward target values
            animated.total = lerp(animated.total, targetTotal, LERP_FACTOR);
            animated.app = lerp(animated.app, targetApp, LERP_FACTOR);
            animated.wired = lerp(animated.wired, targetWired, LERP_FACTOR);
            animated.compressed = lerp(animated.compressed, targetCompressed, LERP_FACTOR);
            animated.cached = lerp(animated.cached, targetCached, LERP_FACTOR);
            animated.free = lerp(animated.free, targetFree, LERP_FACTOR);
            animated.swapUsed = lerp(animated.swapUsed, targetSwapUsed, LERP_FACTOR);
            animated.swapTotal = lerp(animated.swapTotal, targetSwapTotal, LERP_FACTOR);
        }

        // Draw memory breakdown bar with animated values
        const pressure = ramData.memoryPressure ?? 0;
        drawMemoryBar(ctx, width, height, {
            total: animated.total,
            app: animated.app,
            wired: animated.wired,
            compressed: animated.compressed,
            cached: animated.cached,
            free: animated.free,
            swapUsed: animated.swapUsed,
            swapTotal: animated.swapTotal,
            pressure
        });

        // Draw usage graph at bottom
        drawMemoryGraph(ctx, width, height, memoryHistoryRef.current);

        animationRef.current = requestAnimationFrame(draw);
    }, [ramData]);

    useEffect(() => {
        animationRef.current = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(animationRef.current);
    }, [draw]);

    const usedPercent = ramData?.totalVisibleMemoryBytes ? ((ramData.usedMemoryBytes / ramData.totalVisibleMemoryBytes) * 100).toFixed(1) : "0";

    // Determine memory pressure color
    const pressureColor = ramData?.memoryPressure !== undefined ? (ramData.memoryPressure < 30 ? "#22c55e" : ramData.memoryPressure < 70 ? "#eab308" : "#ef4444") : "#94a3b8";

    return (
        <ClassicLayout
            header={{
                title: "Memory",
                deviceName: `${usedPercent}% Used`
            }}
            graph={<canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />}
            bottomItems={
                <>
                    <div style={{ display: "flex", flexWrap: "wrap", alignContent: "flex-start", gap: 15, overflowY: "auto" }}>
                        {/* Main usage */}
                        <ItemOne color={COLORS.inUse} title="In Use" value={`${getReadableBytesString(ramData?.usedMemoryBytes)} (${usedPercent}%)`} />

                        {/* App Memory */}
                        {ramData?.appMemoryBytes !== undefined && <ItemOne color={COLORS.app} title="App Memory" value={getReadableBytesString(ramData.appMemoryBytes)} />}

                        {/* Wired Memory */}
                        {ramData?.wiredMemoryBytes !== undefined && <ItemOne color={COLORS.wired} title="Wired Memory" value={getReadableBytesString(ramData.wiredMemoryBytes)} />}

                        {/* Compressed */}
                        {ramData?.compressedMemoryBytes !== undefined && <ItemOne color={COLORS.compressed} title="Compressed" value={getReadableBytesString(ramData.compressedMemoryBytes)} />}

                        {/* Cached Files */}
                        {ramData?.cachedFilesBytes !== undefined && <ItemOne color={COLORS.cached} title="Cached Files" value={getReadableBytesString(ramData.cachedFilesBytes)} />}

                        {/* Swap */}
                        {ramData?.swapUsedBytes !== undefined && ramData.swapUsedBytes > 0 && <ItemOne color={COLORS.swap} title="Swap Used" value={getReadableBytesString(ramData.swapUsedBytes)} />}

                        {/* Memory Pressure */}
                        {ramData?.memoryPressure !== undefined && <ItemOne color={pressureColor} title="Memory Pressure" value={`${ramData.memoryPressure.toFixed(0)}%`} />}
                    </div>
                    <div>
                        <ItemTwo title="Total Memory:" value={getReadableBytesString(ramData?.totalVisibleMemoryBytes)} />
                        <ItemTwo title="Available:" value={getReadableBytesString(ramData?.totalVisibleMemoryBytes && ramData?.usedMemoryBytes ? ramData.totalVisibleMemoryBytes - ramData.usedMemoryBytes : 0)} />
                        {ramData?.swapTotalBytes !== undefined && ramData.swapTotalBytes > 0 && <ItemTwo title="Swap:" value={`${getReadableBytesString(ramData.swapUsedBytes)} / ${getReadableBytesString(ramData.swapTotalBytes)}`} />}
                        {ramStatic && <ItemTwo title="Slots Used:" value={`${ramStatic.length}`} />}
                    </div>
                </>
            }
        />
    );
};

interface MemoryData {
    total: number;
    app: number;
    wired: number;
    compressed: number;
    cached: number;
    free: number;
    swapUsed: number;
    swapTotal: number;
    pressure: number; // 0-100
}

function drawMemoryBar(ctx: CanvasRenderingContext2D, width: number, height: number, data: MemoryData) {
    const barHeight = 50;
    const barY = height * 0.2;
    const barX = 40;
    const barWidth = width - 80;
    const cornerRadius = 12;

    const time = Date.now();

    // Memory pressure pulsing glow effect
    // Use memory usage as fallback when pressure is 0 (normal state on macOS)
    const usedPercent = ((data.total - data.free) / data.total) * 100;
    // Start showing glow at 30% usage, scale to 100 at 100% usage
    const effectivePressure = data.pressure > 0 ? data.pressure : Math.max(0, ((usedPercent - 30) / 70) * 100);

    if (effectivePressure > 0) {
        // Pulse speed increases with pressure (faster when critical)
        const pulseSpeed = 3000 + (100 - effectivePressure) * 40; // 3s at 100%, 7s at 0%
        const pulsePhase = (time % pulseSpeed) / pulseSpeed;
        const pulse = 0.5 + 0.5 * Math.sin(pulsePhase * Math.PI * 2);

        // Glow intensity and color based on pressure level
        // Green (0-30) -> Yellow (30-70) -> Red (70-100)
        let glowColor: string;
        let baseIntensity: number;

        if (effectivePressure < 30) {
            // Green - visible glow
            glowColor = "34, 197, 94"; // green-500
            baseIntensity = 0.5 + (effectivePressure / 30) * 0.3;
        } else if (effectivePressure < 70) {
            // Yellow/Orange - strong glow
            const t = (effectivePressure - 30) / 40;
            glowColor = `${234 + Math.round((239 - 234) * t)}, ${179 - Math.round((179 - 68) * t)}, ${8 + Math.round((68 - 8) * t)}`; // yellow to orange
            baseIntensity = 0.8 + t * 0.2;
        } else {
            // Red - intense pulsing glow
            glowColor = "239, 68, 68"; // red-500
            baseIntensity = 1.0;
        }

        const glowIntensity = baseIntensity * (0.6 + 0.4 * pulse);
        const glowSize = 30 + effectivePressure * 0.4 + pulse * 20;

        // Draw multiple layers for stronger glow effect
        ctx.save();

        // Outer glow layer (largest, softest)
        ctx.shadowColor = `rgba(${glowColor}, ${glowIntensity})`;
        ctx.shadowBlur = glowSize * 2;
        ctx.beginPath();
        ctx.roundRect(barX - 6, barY - 6, barWidth + 12, barHeight + 12, cornerRadius + 6);
        ctx.fillStyle = `rgba(${glowColor}, ${glowIntensity * 0.2})`;
        ctx.fill();

        // Middle glow layer
        ctx.shadowBlur = glowSize * 1.2;
        ctx.beginPath();
        ctx.roundRect(barX - 3, barY - 3, barWidth + 6, barHeight + 6, cornerRadius + 3);
        ctx.fillStyle = `rgba(${glowColor}, ${glowIntensity * 0.3})`;
        ctx.fill();

        // Inner glow layer (tightest, brightest)
        ctx.shadowBlur = glowSize * 0.6;
        ctx.beginPath();
        ctx.roundRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2, cornerRadius + 1);
        ctx.fillStyle = `rgba(${glowColor}, ${glowIntensity * 0.4})`;
        ctx.fill();

        ctx.restore();
    }

    // Background with subtle animation
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(barX, barY, barWidth, barHeight, cornerRadius);
    const bgGradient = ctx.createLinearGradient(barX, barY, barX, barY + barHeight);
    bgGradient.addColorStop(0, "rgba(30, 30, 40, 0.95)");
    bgGradient.addColorStop(1, "rgba(20, 20, 28, 0.95)");
    ctx.fillStyle = bgGradient;
    ctx.fill();

    // Border
    ctx.strokeStyle = COLORS.border;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    // Calculate segment widths (as percentage of bar) and track X positions
    const segments: { color: string; label: string; bytes: number; width: number; startX: number }[] = [];
    let segmentX = barX + 2; // Start after the bar padding

    if (data.wired > 0) {
        const width = (data.wired / data.total) * barWidth;
        segments.push({ color: COLORS.wired, label: "Wired", bytes: data.wired, width, startX: segmentX });
        segmentX += width;
    }
    if (data.compressed > 0) {
        const width = (data.compressed / data.total) * barWidth;
        segments.push({ color: COLORS.compressed, label: "Compressed", bytes: data.compressed, width, startX: segmentX });
        segmentX += width;
    }
    if (data.app > 0) {
        const width = (data.app / data.total) * barWidth;
        segments.push({ color: COLORS.app, label: "App", bytes: data.app, width, startX: segmentX });
        segmentX += width;
    }
    if (data.cached > 0) {
        const width = (data.cached / data.total) * barWidth;
        segments.push({ color: COLORS.cached, label: "Cached", bytes: data.cached, width, startX: segmentX });
        segmentX += width;
    }

    // Add free space segment
    if (data.free > 0) {
        const width = (data.free / data.total) * barWidth;
        segments.push({ color: COLORS.free, label: "Free", bytes: data.free, width, startX: segmentX });
    }

    // Draw segments with clipping
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(barX + 2, barY + 2, barWidth - 4, barHeight - 4, cornerRadius - 2);
    ctx.clip();

    let currentX = barX + 2;
    segments.forEach((segment, index) => {
        if (segment.width < 1) return;

        // Segment gradient
        const gradient = ctx.createLinearGradient(currentX, barY, currentX, barY + barHeight);
        gradient.addColorStop(0, segment.color);
        gradient.addColorStop(0.5, adjustBrightness(segment.color, -20));
        gradient.addColorStop(1, adjustBrightness(segment.color, -40));

        ctx.fillStyle = gradient;
        ctx.fillRect(currentX, barY + 2, segment.width, barHeight - 4);

        // Subtle separator line between segments
        if (index < segments.length - 1) {
            ctx.strokeStyle = "rgba(0, 0, 0, 0.3)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(currentX + segment.width, barY + 6);
            ctx.lineTo(currentX + segment.width, barY + barHeight - 6);
            ctx.stroke();
        }

        currentX += segment.width;
    });

    // Animated shimmer effect on used portion
    const usedWidth = ((data.total - data.free) / data.total) * barWidth;
    // Use a fixed cycle length for consistent shimmer speed regardless of bar width
    const shimmerCycleLength = barWidth + 100;
    const shimmerPosition = (time / 40) % shimmerCycleLength; // Slower: divide by 40 instead of 20
    const shimmerX = barX + shimmerPosition - 50;
    const shimmerGradient = ctx.createLinearGradient(shimmerX, 0, shimmerX + 80, 0);
    shimmerGradient.addColorStop(0, "rgba(255, 255, 255, 0)");
    shimmerGradient.addColorStop(0.5, "rgba(255, 255, 255, 0.06)");
    shimmerGradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = shimmerGradient;
    ctx.fillRect(barX + 2, barY + 2, usedWidth, barHeight - 4);

    ctx.restore();

    // Glass reflection on top
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(barX + 4, barY + 4, barWidth - 8, barHeight * 0.35, [cornerRadius - 4, cornerRadius - 4, 0, 0]);
    const reflectGradient = ctx.createLinearGradient(barX, barY, barX, barY + barHeight * 0.4);
    reflectGradient.addColorStop(0, "rgba(255, 255, 255, 0.12)");
    reflectGradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = reflectGradient;
    ctx.fill();
    ctx.restore();

    // Draw legend - positioned at start of each segment, alternating top/bottom
    const legendYTop = barY - 18;
    const legendYBottom = barY + barHeight + 18;
    const legendItems = segments.filter(s => s.width > 5);

    ctx.font = "10px system-ui";
    legendItems.forEach((segment, index) => {
        // Position legend at the start of its segment
        const legendX = segment.startX;
        // Alternate between bottom and top
        const legendY = index % 2 === 0 ? legendYBottom : legendYTop;

        // Color dot
        ctx.beginPath();
        ctx.arc(legendX + 5, legendY, 4, 0, Math.PI * 2);
        ctx.fillStyle = segment.color;
        ctx.fill();

        // Label
        ctx.fillStyle = COLORS.textMuted;
        ctx.textAlign = "left";
        ctx.fillText(segment.label, legendX + 14, legendY + 3);
    });
}

function drawMemoryGraph(ctx: CanvasRenderingContext2D, width: number, height: number, history: number[]) {
    if (history.length < 2) return;

    const graphHeight = height * 0.18;
    const graphY = height * 0.88;
    const graphWidth = width * 0.82;
    const graphX = (width - graphWidth) / 2;

    // Grid lines
    for (let i = 0; i <= 4; i++) {
        const y = graphY - (i / 4) * graphHeight;
        ctx.strokeStyle = `rgba(100, 116, 139, ${i === 0 || i === 4 ? 0.15 : 0.08})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(graphX, y);
        ctx.lineTo(graphX + graphWidth, y);
        ctx.stroke();
    }

    // Build points
    const points: { x: number; y: number }[] = [];
    for (let i = 0; i < history.length; i++) {
        const x = graphX + (i / (history.length - 1)) * graphWidth;
        const y = graphY - (history[i] / 100) * graphHeight;
        points.push({ x, y });
    }

    // Glow effect
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.shadowColor = "rgba(59, 130, 246, 0.6)";
    ctx.shadowBlur = 12;
    ctx.strokeStyle = "rgba(59, 130, 246, 0.5)";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
    ctx.restore();

    // Main line
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();

    // Fill gradient
    const gradient = ctx.createLinearGradient(0, graphY - graphHeight, 0, graphY);
    gradient.addColorStop(0, "rgba(59, 130, 246, 0.25)");
    gradient.addColorStop(0.5, "rgba(59, 130, 246, 0.1)");
    gradient.addColorStop(1, "rgba(59, 130, 246, 0.02)");

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.lineTo(graphX + graphWidth, graphY);
    ctx.lineTo(graphX, graphY);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Current value dot
    const lastPoint = points[points.length - 1];
    ctx.beginPath();
    ctx.arc(lastPoint.x, lastPoint.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(59, 130, 246, 0.3)";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(lastPoint.x, lastPoint.y, 3, 0, Math.PI * 2);
    ctx.fillStyle = "#60a5fa";
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Labels
    ctx.font = "10px system-ui";
    ctx.fillStyle = COLORS.textMuted;
    ctx.textAlign = "left";
    ctx.fillText("MEMORY USAGE", graphX, graphY - graphHeight - 8);

    ctx.textAlign = "left";
    ctx.fillText("60s", graphX, graphY + 12);
    ctx.textAlign = "right";
    ctx.fillText("now", graphX + graphWidth, graphY + 12);

    // Current value
    const currentValue = history[history.length - 1];
    ctx.font = "bold 11px system-ui";
    ctx.fillStyle = COLORS.text;
    ctx.textAlign = "right";
    ctx.fillText(`${currentValue.toFixed(1)}%`, lastPoint.x - 10, lastPoint.y - 8);
}

// Helper function to adjust color brightness
function adjustBrightness(hex: string, percent: number): string {
    const num = parseInt(hex.replace("#", ""), 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + percent));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + percent));
    const b = Math.min(255, Math.max(0, (num & 0x0000ff) + percent));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
