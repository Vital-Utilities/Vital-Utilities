import React from "react";
import { PulseLoader } from "react-spinners";

export const SplashScreen: React.FunctionComponent = () => {
    return (
        <div id="page" style={{ display: "grid", overflow: "hidden", height: "100vh", width: "100vw", alignContent: "center", justifyContent: "center" }}>
            <div style={{ fontSize: "3vh" }}>Booting</div>
            <div style={{ display: "grid", justifyContent: "center" }}>
                <div>
                    <PulseLoader size={"3vh"} color={"white"} />
                </div>
            </div>
        </div>
    );
};
