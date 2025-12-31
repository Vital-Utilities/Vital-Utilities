import { GetMachineDynamicDataResponse } from "@vital/vitalservice";
import React, { useRef, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { ClassicLayout, ItemOne, ItemTwo } from "../../../components/Charts/Shared";
import { VitalState } from "../../../Redux/States";
import { Plug } from "lucide-react";

// AC transition animation state
interface ACTransitionState {
    active: boolean;
    direction: "connect" | "disconnect";
    progress: number; // 0 to 1
    startTime: number;
    surgeParticles: SurgeParticle[];
}

interface SurgeParticle {
    x: number;
    y: number;
    angle: number;
    speed: number;
    size: number;
    life: number;
    maxLife: number;
}

export const ClassicPowerView: React.FunctionComponent = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(0);
    const powerHistoryRef = useRef<number[]>([]);
    const wasPluggedInRef = useRef<boolean | null>(null);
    const acTransitionRef = useRef<ACTransitionState>({
        active: false,
        direction: "connect",
        progress: 0,
        startTime: 0,
        surgeParticles: []
    });

    const dynamicState = useSelector<VitalState, GetMachineDynamicDataResponse | undefined>(state => state.machineState.dynamic);
    const powerData = dynamicState?.powerUsageData;

    // Update power history
    useEffect(() => {
        if (powerData?.systemPowerWatts !== undefined) {
            powerHistoryRef.current.push(powerData.systemPowerWatts);
            if (powerHistoryRef.current.length > 60) {
                powerHistoryRef.current.shift();
            }
        }
    }, [powerData?.systemPowerWatts]);

    // Detect AC state changes and trigger transition
    useEffect(() => {
        const isPluggedIn = powerData?.externalConnected ?? false;
        const wasPluggedIn = wasPluggedInRef.current;

        if (wasPluggedIn !== null && wasPluggedIn !== isPluggedIn) {
            // State changed - trigger transition animation
            const transition = acTransitionRef.current;
            transition.active = true;
            transition.direction = isPluggedIn ? "connect" : "disconnect";
            transition.progress = 0;
            transition.startTime = Date.now();
            transition.surgeParticles = [];

            // Create surge particles for connect animation
            if (isPluggedIn) {
                for (let i = 0; i < 20; i++) {
                    transition.surgeParticles.push({
                        x: 0,
                        y: 0,
                        angle: (Math.PI * 2 * i) / 20 + Math.random() * 0.3,
                        speed: 2 + Math.random() * 3,
                        size: 3 + Math.random() * 4,
                        life: 1,
                        maxLife: 0.8 + Math.random() * 0.4
                    });
                }
            }
        }

        wasPluggedInRef.current = isPluggedIn;
    }, [powerData?.externalConnected]);

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();

        // Set canvas size with device pixel ratio for sharp rendering
        if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);
        }

        const width = rect.width;
        const height = rect.height;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Get current values
        const batteryPercent = powerData?.batteryPercentage ?? 0;
        const systemPower = powerData?.systemPowerWatts ?? 0;
        const isCharging = powerData?.externalConnected && !powerData?.fullyCharged;
        const isPluggedIn = powerData?.externalConnected ?? false;
        const isPassthrough = isPluggedIn && powerData?.fullyCharged === true;
        const adapterWatts = powerData?.adapterWatts ?? 0;

        // Update AC transition
        const transition = acTransitionRef.current;
        if (transition.active) {
            const elapsed = (Date.now() - transition.startTime) / 1000;
            const duration = transition.direction === "connect" ? 1.2 : 0.8;
            transition.progress = Math.min(elapsed / duration, 1);

            if (transition.progress >= 1) {
                transition.active = false;
            }
        }

        // Draw unified battery visualization with integrated power flow
        drawIntegratedBattery(ctx, width, height, batteryPercent, systemPower, adapterWatts, isCharging ?? false, isPluggedIn, isPassthrough, transition);

        // Draw power graph at bottom
        drawPowerGraph(ctx, width, height, powerHistoryRef.current);

        animationRef.current = requestAnimationFrame(draw);
    }, [powerData]);

    useEffect(() => {
        animationRef.current = requestAnimationFrame(draw);
        return () => cancelAnimationFrame(animationRef.current);
    }, [draw]);

    if (!powerData?.batteryInstalled) {
        return (
            <ClassicLayout
                header={{ title: "Power", deviceName: "No Battery Detected" }}
                graph={
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                        <Plug className="w-8 h-8 mr-2" />
                        <span>Desktop system - no battery information available</span>
                    </div>
                }
                bottomItems={<></>}
            />
        );
    }

    const healthColor = (powerData.batteryHealth ?? 100) >= 80 ? "#22c55e" : (powerData.batteryHealth ?? 100) >= 50 ? "#eab308" : "#ef4444";

    return (
        <ClassicLayout
            header={{
                title: "Power",
                deviceName: powerData.externalConnected ? "Plugged In" : "On Battery"
            }}
            graph={<canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />}
            bottomItems={
                <>
                    <div style={{ display: "flex", flexWrap: "wrap", alignContent: "flex-start", gap: 15, overflowY: "auto" }}>
                        {/* Power consumption */}
                        {powerData.systemPowerWatts !== undefined && <ItemOne color="#3b82f6" title="System Power" value={`${powerData.systemPowerWatts.toFixed(1)}W`} />}

                        {/* Battery Flow - positive = charging, negative = discharging */}
                        {powerData.batteryAmperage !== undefined && <ItemOne color={powerData.batteryAmperage > 0 ? "#22c55e" : powerData.batteryAmperage < 0 ? "#f97316" : "#94a3b8"} title="Battery Flow" value={`${powerData.batteryAmperage > 0 ? "+" : ""}${powerData.batteryAmperage} mA`} />}

                        {/* Battery Health */}
                        {powerData.batteryHealth !== undefined && <ItemOne color={healthColor} title="Battery Health" value={`${powerData.batteryHealth.toFixed(1)}%`} />}

                        {/* Cycle Count */}
                        {powerData.cycleCount !== undefined && <ItemOne color="#94a3b8" title="Cycle Count" value={`${powerData.cycleCount}`} />}

                        {/* Battery Voltage */}
                        {powerData.batteryVoltage !== undefined && <ItemOne color="#94a3b8" title="Voltage" value={`${powerData.batteryVoltage.toFixed(2)}V`} />}

                        {/* Time Remaining */}
                        {powerData.timeRemainingMinutes !== undefined && powerData.timeRemainingMinutes > 0 && <ItemOne color="#06b6d4" title="Time Remaining" value={formatTimeRemaining(powerData.timeRemainingMinutes)} />}
                    </div>
                    <div>
                        <ItemTwo title="Capacity:" value={`${powerData.maxCapacityMah ?? "-"} / ${powerData.designCapacityMah ?? "-"} mAh`} />
                        {powerData.adapterVoltage && <ItemTwo title="Adapter Voltage:" value={`${powerData.adapterVoltage.toFixed(1)}V`} />}
                        <ItemTwo title="Status:" value={powerData.fullyCharged ? "Fully Charged" : powerData.externalConnected ? "Charging" : "Discharging"} />
                    </div>
                </>
            }
        />
    );
};

// Particle system for energy flow
interface Particle {
    x: number;
    y: number;
    targetX: number;
    targetY: number;
    progress: number;
    speed: number;
    size: number;
    color: string;
    type: "input" | "output" | "passthrough";
    // For bezier curve particles
    controlY?: number;
}

let particles: Particle[] = [];

// Cubic bezier interpolation for passthrough particles
function bezierPoint(t: number, p0: number, p1: number, p2: number, p3: number): number {
    const mt = 1 - t;
    return mt * mt * mt * p0 + 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t * p3;
}

// Easing function for smooth animations
function easeOutElastic(x: number): number {
    const c4 = (2 * Math.PI) / 3;
    return x === 0 ? 0 : x === 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
}

function easeOutCubic(x: number): number {
    return 1 - Math.pow(1 - x, 3);
}

function easeInCubic(x: number): number {
    return x * x * x;
}

function drawIntegratedBattery(ctx: CanvasRenderingContext2D, width: number, height: number, percent: number, systemPower: number, adapterWatts: number, isCharging: boolean, isPluggedIn: boolean, isPassthrough: boolean, transition: ACTransitionState) {
    const centerX = width / 2;
    const centerY = height * 0.38;
    const time = Date.now();

    // Battery dimensions
    const batteryWidth = Math.min(width * 0.45, 220);
    const batteryHeight = batteryWidth * 0.5;
    const cornerRadius = 14;
    const tipWidth = 12;
    const tipHeight = batteryHeight * 0.32;

    const batteryX = centerX - batteryWidth / 2;
    const batteryY = centerY - batteryHeight / 2;

    const inputX = batteryX - 80;
    const inputY = centerY;
    const outputX = batteryX + batteryWidth + tipWidth + 80;
    const outputY = centerY;

    // Calculate transition visibility
    let acOpacity = 1;
    let acScale = 1;
    let showAC = isPluggedIn;

    if (transition.active) {
        if (transition.direction === "connect") {
            // Connect animation: slide in from left with scale up
            const easedProgress = easeOutElastic(transition.progress);
            acOpacity = Math.min(transition.progress * 2, 1);
            acScale = 0.3 + easedProgress * 0.7;
            showAC = true;
        } else {
            // Disconnect animation: fade out and shrink
            const easedProgress = easeInCubic(transition.progress);
            acOpacity = 1 - easedProgress;
            acScale = 1 - easedProgress * 0.5;
            showAC = true;
        }
    }

    // === AC INPUT (Left side) ===
    if (showAC) {
        ctx.save();
        ctx.globalAlpha = acOpacity;

        // Transform for scale animation
        ctx.translate(inputX, inputY);
        ctx.scale(acScale, acScale);
        ctx.translate(-inputX, -inputY);

        // Draw input connector/line - either to battery or passthrough to system
        ctx.save();
        if (transition.active && transition.direction === "connect") {
            const lineProgress = Math.min(transition.progress * 1.5, 1);
            const lineEndX = inputX + 25 + (batteryX - inputX - 25) * easeOutCubic(lineProgress);

            // Glow effect during connection
            ctx.shadowColor = "rgba(34, 197, 94, 0.8)";
            ctx.shadowBlur = 20 + Math.sin(time / 50) * 10;

            ctx.strokeStyle = "#22c55e";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(inputX + 25, inputY);
            if (lineProgress < 1) {
                ctx.lineTo(lineEndX, inputY);
            } else {
                ctx.quadraticCurveTo(batteryX - 20, inputY, batteryX, inputY);
            }
            ctx.stroke();
        } else if (transition.active && transition.direction === "disconnect") {
            // Fade out line with flicker effect
            const flicker = Math.random() > 0.3 ? 1 : 0.5;
            ctx.strokeStyle = `rgba(34, 197, 94, ${acOpacity * flicker})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(inputX + 25, inputY);
            ctx.quadraticCurveTo(batteryX - 20, inputY, batteryX, inputY);
            ctx.stroke();
        } else if (isPassthrough) {
            // Passthrough mode: draw angular line that goes around battery
            const bypassY = centerY - batteryHeight * 0.75;

            // Dim the line to battery
            ctx.strokeStyle = "rgba(34, 197, 94, 0.15)";
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(inputX + 25, inputY);
            ctx.quadraticCurveTo(batteryX - 20, inputY, batteryX, inputY);
            ctx.stroke();
            ctx.setLineDash([]);

            // Draw passthrough line with angular path around battery (blue, 0.2 opacity)
            ctx.strokeStyle = "rgba(59, 130, 246, 0.2)";
            ctx.lineWidth = 3;
            ctx.lineJoin = "round";
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.moveTo(inputX + 25, inputY);
            // Go straight then up
            ctx.lineTo(batteryX - 15, inputY);
            ctx.lineTo(batteryX - 15, bypassY);
            // Go across the top
            ctx.lineTo(batteryX + batteryWidth + tipWidth + 15, bypassY);
            // Go down to system
            ctx.lineTo(batteryX + batteryWidth + tipWidth + 15, outputY);
            ctx.lineTo(outputX - 25, outputY);
            ctx.stroke();
        } else {
            ctx.strokeStyle = "#22c55e";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(inputX + 25, inputY);
            ctx.quadraticCurveTo(batteryX - 20, inputY, batteryX, inputY);
            ctx.stroke();
        }
        ctx.restore();

        // AC power indicator circle
        ctx.save();
        if (transition.active && transition.direction === "connect") {
            // Pulsing glow during connect
            const pulseIntensity = 0.6 + Math.sin(time / 80) * 0.4;
            ctx.shadowColor = `rgba(34, 197, 94, ${pulseIntensity})`;
            ctx.shadowBlur = 25 + Math.sin(time / 60) * 15;
        } else {
            ctx.shadowColor = "rgba(34, 197, 94, 0.6)";
            ctx.shadowBlur = 15;
        }
        ctx.beginPath();
        ctx.arc(inputX, inputY, 22, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
        ctx.fill();
        ctx.strokeStyle = "#22c55e";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();

        // AC icon (plug symbol)
        ctx.font = "bold 14px system-ui";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#22c55e";
        ctx.fillText("⚡", inputX, inputY);

        // Adapter wattage label
        ctx.font = "bold 11px system-ui";
        ctx.fillStyle = "#22c55e";
        ctx.fillText(`${adapterWatts}W`, inputX, inputY + 35);
        ctx.font = "10px system-ui";
        ctx.fillStyle = "#64748b";
        ctx.fillText("AC IN", inputX, inputY + 48);

        ctx.restore(); // Restore from globalAlpha and scale

        // Draw surge particles during connect animation
        if (transition.active && transition.direction === "connect") {
            const surgeX = inputX;
            const surgeY = inputY;

            for (const particle of transition.surgeParticles) {
                const age = 1 - particle.life / particle.maxLife;
                const distance = age * 60 * particle.speed;
                const px = surgeX + Math.cos(particle.angle) * distance;
                const py = surgeY + Math.sin(particle.angle) * distance;
                const alpha = particle.life * 0.8;
                const size = particle.size * particle.life;

                ctx.beginPath();
                ctx.arc(px, py, size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(34, 197, 94, ${alpha})`;
                ctx.fill();

                particle.life -= 0.025;
            }

            // Remove dead particles
            transition.surgeParticles = transition.surgeParticles.filter(p => p.life > 0);

            // Draw expanding ring effect
            const ringProgress = easeOutCubic(Math.min(transition.progress * 2, 1));
            if (ringProgress < 1) {
                const ringRadius = 22 + ringProgress * 80;
                const ringAlpha = (1 - ringProgress) * 0.6;
                ctx.beginPath();
                ctx.arc(inputX, inputY, ringRadius, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(34, 197, 94, ${ringAlpha})`;
                ctx.lineWidth = 3 * (1 - ringProgress);
                ctx.stroke();
            }
        }

        // Add input particles (only when stable connection and charging)
        if (!transition.active && isPluggedIn && !isPassthrough && Math.random() < 0.15) {
            particles.push({
                x: inputX + 25,
                y: inputY,
                targetX: batteryX,
                targetY: inputY,
                progress: 0,
                speed: 0.02 + Math.random() * 0.01,
                size: 4 + Math.random() * 2,
                color: "#22c55e",
                type: "input"
            });
        }

        // Add passthrough particles that go around the battery
        if (!transition.active && isPassthrough && Math.random() < 0.1) {
            const bypassY = centerY - batteryHeight * 0.75;
            particles.push({
                x: inputX + 25,
                y: inputY,
                targetX: outputX - 25,
                targetY: outputY,
                progress: 0,
                speed: 0.008 + Math.random() * 0.004,
                size: 4 + Math.random() * 2,
                color: "#3b82f6",
                type: "passthrough",
                controlY: bypassY
            });
        }
    }

    // === SYSTEM OUTPUT (Right side) ===

    // Draw output connector/line from battery (dim it in passthrough mode)
    ctx.save();
    if (isPassthrough) {
        ctx.strokeStyle = "rgba(59, 130, 246, 0.2)";
        ctx.setLineDash([4, 4]);
    } else {
        ctx.strokeStyle = "#3b82f6";
    }
    ctx.lineWidth = 3;

    // Curved line from battery tip to system
    ctx.beginPath();
    ctx.moveTo(batteryX + batteryWidth + tipWidth, outputY);
    ctx.quadraticCurveTo(outputX - 45, outputY, outputX - 25, outputY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // System power indicator circle
    ctx.save();
    ctx.shadowColor = "rgba(59, 130, 246, 0.6)";
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(outputX, outputY, 22, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(15, 23, 42, 0.9)";
    ctx.fill();
    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // System power value
    ctx.font = "bold 12px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#3b82f6";
    ctx.fillText(`${systemPower.toFixed(1)}W`, outputX, outputY);

    // System label
    ctx.font = "10px system-ui";
    ctx.fillStyle = "#64748b";
    ctx.fillText("SYSTEM", outputX, outputY + 35);

    // Add output particles (only when not in passthrough mode - battery supplies power)
    if (!isPassthrough && Math.random() < 0.12) {
        particles.push({
            x: batteryX + batteryWidth + tipWidth,
            y: outputY,
            targetX: outputX - 25,
            targetY: outputY,
            progress: 0,
            speed: 0.025 + Math.random() * 0.015,
            size: 3 + Math.random() * 2,
            color: "#3b82f6",
            type: "output"
        });
    }

    // === BATTERY BODY ===
    // Outer glow based on state
    ctx.save();
    if (isCharging) {
        ctx.shadowColor = "rgba(34, 197, 94, 0.5)";
        ctx.shadowBlur = 25;
    } else if (percent < 20) {
        ctx.shadowColor = "rgba(239, 68, 68, 0.5)";
        ctx.shadowBlur = 18 + Math.sin(time / 200) * 6;
    } else {
        ctx.shadowColor = "rgba(59, 130, 246, 0.25)";
        ctx.shadowBlur = 12;
    }

    // Glass outer shell
    ctx.beginPath();
    ctx.roundRect(batteryX, batteryY, batteryWidth, batteryHeight, cornerRadius);
    const shellGradient = ctx.createLinearGradient(batteryX, batteryY, batteryX, batteryY + batteryHeight);
    shellGradient.addColorStop(0, "rgba(45, 45, 60, 0.92)");
    shellGradient.addColorStop(0.5, "rgba(28, 28, 38, 0.95)");
    shellGradient.addColorStop(1, "rgba(38, 38, 52, 0.92)");
    ctx.fillStyle = shellGradient;
    ctx.fill();
    ctx.restore();

    // Glass border
    ctx.beginPath();
    ctx.roundRect(batteryX, batteryY, batteryWidth, batteryHeight, cornerRadius);
    const borderGradient = ctx.createLinearGradient(batteryX, batteryY, batteryX, batteryY + batteryHeight);
    borderGradient.addColorStop(0, "rgba(255, 255, 255, 0.28)");
    borderGradient.addColorStop(0.5, "rgba(255, 255, 255, 0.08)");
    borderGradient.addColorStop(1, "rgba(255, 255, 255, 0.12)");
    ctx.strokeStyle = borderGradient;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Battery tip
    ctx.beginPath();
    ctx.roundRect(batteryX + batteryWidth - 1, centerY - tipHeight / 2, tipWidth, tipHeight, [0, 6, 6, 0]);
    const tipGradient = ctx.createLinearGradient(batteryX + batteryWidth, centerY - tipHeight / 2, batteryX + batteryWidth, centerY + tipHeight / 2);
    tipGradient.addColorStop(0, "rgba(85, 85, 105, 0.9)");
    tipGradient.addColorStop(0.5, "rgba(55, 55, 75, 0.9)");
    tipGradient.addColorStop(1, "rgba(75, 75, 95, 0.9)");
    ctx.fillStyle = tipGradient;
    ctx.fill();

    // === LIQUID FILL ===
    const fillPadding = 6;
    const maxFillWidth = batteryWidth - fillPadding * 2;
    const fillWidth = maxFillWidth * (percent / 100);
    const fillHeight = batteryHeight - fillPadding * 2;
    const fillX = batteryX + fillPadding;
    const fillY = batteryY + fillPadding;

    if (percent > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(fillX, fillY, maxFillWidth, fillHeight, cornerRadius - 4);
        ctx.clip();

        // Animated liquid wave
        const waveAmplitude = isCharging ? 4 : 2;
        const waveFrequency = 0.025;
        const waveSpeed = isCharging ? 0.004 : 0.0015;

        ctx.beginPath();
        ctx.moveTo(fillX, fillY + fillHeight);

        for (let x = 0; x <= fillWidth; x += 2) {
            const waveY = Math.sin(x * waveFrequency + time * waveSpeed) * waveAmplitude;
            const waveY2 = Math.sin(x * waveFrequency * 1.5 + time * waveSpeed * 1.2) * (waveAmplitude * 0.6);
            ctx.lineTo(fillX + x, fillY + waveY + waveY2);
        }

        ctx.lineTo(fillX + fillWidth, fillY + fillHeight);
        ctx.closePath();

        // Liquid gradient
        const liquidGradient = ctx.createLinearGradient(fillX, fillY, fillX, fillY + fillHeight);
        if (percent < 20) {
            liquidGradient.addColorStop(0, "rgba(248, 113, 113, 0.95)");
            liquidGradient.addColorStop(0.4, "rgba(239, 68, 68, 0.9)");
            liquidGradient.addColorStop(1, "rgba(185, 28, 28, 0.88)");
        } else if (percent < 50) {
            liquidGradient.addColorStop(0, "rgba(253, 224, 71, 0.95)");
            liquidGradient.addColorStop(0.4, "rgba(250, 204, 21, 0.9)");
            liquidGradient.addColorStop(1, "rgba(202, 138, 4, 0.88)");
        } else {
            liquidGradient.addColorStop(0, "rgba(134, 239, 172, 0.95)");
            liquidGradient.addColorStop(0.4, "rgba(74, 222, 128, 0.9)");
            liquidGradient.addColorStop(1, "rgba(22, 163, 74, 0.88)");
        }
        ctx.fillStyle = liquidGradient;
        ctx.fill();

        // Surface shine
        ctx.beginPath();
        for (let x = 0; x <= fillWidth; x += 2) {
            const waveY = Math.sin(x * waveFrequency + time * waveSpeed) * waveAmplitude;
            const waveY2 = Math.sin(x * waveFrequency * 1.5 + time * waveSpeed * 1.2) * (waveAmplitude * 0.6);
            if (x === 0) {
                ctx.moveTo(fillX + x, fillY + waveY + waveY2);
            } else {
                ctx.lineTo(fillX + x, fillY + waveY + waveY2);
            }
        }
        ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Bubbles when charging
        if (isCharging) {
            for (let i = 0; i < 6; i++) {
                const bubbleX = fillX + 15 + (i * (fillWidth - 30)) / 5;
                const bubblePhase = (time / 900 + i * 0.6) % 2;
                const bubbleY = fillY + fillHeight - bubblePhase * fillHeight * 0.85;
                const bubbleSize = 2.5 + Math.sin(time / 250 + i) * 1.2;
                const bubbleAlpha = Math.max(0, 1 - bubblePhase * 0.7);

                ctx.beginPath();
                ctx.arc(bubbleX + Math.sin(time / 400 + i) * 4, bubbleY, bubbleSize, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${bubbleAlpha * 0.45})`;
                ctx.fill();
            }
        }

        ctx.restore();
    }

    // Glass reflection overlay
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(batteryX + 5, batteryY + 5, batteryWidth - 10, batteryHeight * 0.38, [cornerRadius - 3, cornerRadius - 3, 0, 0]);
    const reflectionGradient = ctx.createLinearGradient(batteryX, batteryY, batteryX, batteryY + batteryHeight * 0.45);
    reflectionGradient.addColorStop(0, "rgba(255, 255, 255, 0.12)");
    reflectionGradient.addColorStop(0.6, "rgba(255, 255, 255, 0.03)");
    reflectionGradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = reflectionGradient;
    ctx.fill();
    ctx.restore();

    // === PERCENTAGE TEXT ===
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 2;
    ctx.font = `bold ${batteryHeight * 0.36}px system-ui`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`${Math.round(percent)}%`, centerX, centerY);
    ctx.restore();

    // Charging bolt
    if (isCharging) {
        const boltSize = batteryHeight * 0.2;
        const boltX = centerX + batteryWidth * 0.26;
        const boltY = centerY;

        ctx.save();
        ctx.shadowColor = "#fbbf24";
        ctx.shadowBlur = 12;
        ctx.translate(boltX, boltY);
        ctx.beginPath();
        ctx.moveTo(0, -boltSize);
        ctx.lineTo(-boltSize * 0.55, boltSize * 0.1);
        ctx.lineTo(-boltSize * 0.1, boltSize * 0.1);
        ctx.lineTo(-boltSize * 0.18, boltSize);
        ctx.lineTo(boltSize * 0.38, -boltSize * 0.1);
        ctx.lineTo(-boltSize * 0.08, -boltSize * 0.1);
        ctx.closePath();
        ctx.fillStyle = "#fbbf24";
        ctx.fill();
        ctx.restore();
    }

    // === UPDATE AND DRAW PARTICLES ===
    // Define path waypoints for passthrough
    const bypassY = centerY - batteryHeight * 0.75;
    const pathPoints = [
        { x: inputX + 25, y: inputY },
        { x: batteryX - 15, y: inputY },
        { x: batteryX - 15, y: bypassY },
        { x: batteryX + batteryWidth + tipWidth + 15, y: bypassY },
        { x: batteryX + batteryWidth + tipWidth + 15, y: outputY },
        { x: outputX - 25, y: outputY }
    ];

    particles = particles.filter(p => {
        p.progress += p.speed;

        if (p.progress >= 1) return false;

        let x: number, y: number;

        if (p.type === "passthrough") {
            // Follow the angular path around battery
            const totalSegments = pathPoints.length - 1;
            const segmentProgress = p.progress * totalSegments;
            const currentSegment = Math.min(Math.floor(segmentProgress), totalSegments - 1);
            const segmentT = segmentProgress - currentSegment;

            const p1 = pathPoints[currentSegment];
            const p2 = pathPoints[currentSegment + 1];

            x = p1.x + (p2.x - p1.x) * segmentT;
            y = p1.y + (p2.y - p1.y) * segmentT;
        } else {
            // Linear interpolation for regular particles
            const t = p.progress;
            x = p.x + (p.targetX - p.x) * t;
            y = p.y + (p.targetY - p.y) * t;

            // Slight vertical wobble for non-passthrough
            y += Math.sin(time / 100 + p.progress * 10) * 3;
        }

        ctx.beginPath();
        ctx.arc(x, y, p.size * (1 - p.progress * 0.5), 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = 0.8 * (1 - p.progress * 0.6);
        ctx.fill();
        ctx.globalAlpha = 1;

        return true;
    });

    // Limit particles
    if (particles.length > 40) {
        particles = particles.slice(-40);
    }
}

function drawPowerGraph(ctx: CanvasRenderingContext2D, width: number, height: number, history: number[]) {
    if (history.length < 2) return;

    const graphHeight = height * 0.18;
    const graphY = height * 0.92;
    const graphWidth = width * 0.85;
    const graphX = (width - graphWidth) / 2;

    const minPower = Math.min(...history) * 0.9;
    const maxPower = Math.max(...history, 10) * 1.1;
    const range = maxPower - minPower || 1;

    // Background
    ctx.fillStyle = "rgba(15, 23, 42, 0.6)";
    ctx.beginPath();
    ctx.roundRect(graphX - 15, graphY - graphHeight - 10, graphWidth + 30, graphHeight + 25, 8);
    ctx.fill();

    // Grid lines
    ctx.strokeStyle = "rgba(100, 116, 139, 0.2)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 3; i++) {
        const y = graphY - (i / 3) * graphHeight;
        ctx.beginPath();
        ctx.moveTo(graphX, y);
        ctx.lineTo(graphX + graphWidth, y);
        ctx.stroke();
    }

    // Graph line
    ctx.beginPath();
    ctx.moveTo(graphX, graphY - ((history[0] - minPower) / range) * graphHeight);

    for (let i = 1; i < history.length; i++) {
        const x = graphX + (i / (history.length - 1)) * graphWidth;
        const y = graphY - ((history[i] - minPower) / range) * graphHeight;
        ctx.lineTo(x, y);
    }

    ctx.strokeStyle = "#3b82f6";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();

    // Fill
    const lastX = graphX + graphWidth;
    const gradient = ctx.createLinearGradient(0, graphY - graphHeight, 0, graphY);
    gradient.addColorStop(0, "rgba(59, 130, 246, 0.4)");
    gradient.addColorStop(1, "rgba(59, 130, 246, 0.05)");

    ctx.lineTo(lastX, graphY);
    ctx.lineTo(graphX, graphY);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Current value dot
    const currentY = graphY - ((history[history.length - 1] - minPower) / range) * graphHeight;
    ctx.beginPath();
    ctx.arc(lastX, currentY, 4, 0, Math.PI * 2);
    ctx.fillStyle = "#3b82f6";
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Labels
    ctx.font = "10px system-ui";
    ctx.fillStyle = "#64748b";
    ctx.textAlign = "left";
    ctx.fillText(`${maxPower.toFixed(0)}W`, graphX - 12, graphY - graphHeight + 4);
    ctx.fillText(`${minPower.toFixed(0)}W`, graphX - 12, graphY + 4);

    ctx.textAlign = "right";
    ctx.fillText("Power (60s)", graphX + graphWidth + 12, graphY - graphHeight + 4);
}

function formatTimeRemaining(minutes: number): string {
    if (minutes < 60) {
        return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
}
