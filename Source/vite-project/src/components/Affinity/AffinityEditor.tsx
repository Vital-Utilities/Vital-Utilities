import { Button } from "antd";
import React from "react";
import { useSelector } from "react-redux";
import { VitalState } from "../../Redux/States";
import "./affinity.scss";
import { AffinityRenderer } from "./AffinityRenderer";
interface Props {
    affinity: number[];
    onChange: (value: number[]) => void;
}

export const AffinityEditor: React.FunctionComponent<Props> = ({ affinity, onChange }) => {
    const totalThreads = useSelector<VitalState, number>(state => state.machineState.static?.cpu.threadCount ?? 0);

    function toggleAll() {
        const newAffinity = Array.from(affinity);
        if (affinity.length < totalThreads) {
            for (let index = 0; index < totalThreads; index++) {
                newAffinity.push(index);
            }
            onChange(newAffinity);
        } else {
            onChange([]);
        }
    }

    function invertAffinity() {
        let newAffinity: number[] = [];
        for (let index = 0; index < totalThreads; index++) {
            newAffinity.push(index);
        }
        newAffinity = newAffinity.filter(e => !affinity.some(f => f === e));
        onChange(newAffinity);
    }

    return (
        <>
            <div className="button-row">
                <Button onClick={() => toggleAll()}>Toggle All</Button>
                <Button onClick={() => invertAffinity()}>Invert selections</Button>
            </div>
            <div
                style={{
                    width: "50%",
                    display: "grid",
                    gridTemplateColumns: "auto auto auto auto auto auto"
                }}
            >
                <AffinityRenderer affinity={affinity} onChange={e => onChange(e)} />
            </div>
        </>
    );
};
