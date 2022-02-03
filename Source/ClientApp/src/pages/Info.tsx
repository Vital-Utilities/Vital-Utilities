import React from "react";
import { version, name, copyright } from "../../package.json";
import { BsDiscord, BsGithub } from "react-icons/bs";
import { openUrl } from "../Utilities/TauriCommands";
export const InfoPage: React.FunctionComponent = () => {
    return (
        <div style={{ alignItems: "center", display: "grid", justifyContent: "center", height: "100%", width: "100%" }}>
            <div>
                <h1>{name}</h1>
                <p>v{version}</p>
                <div style={{ fontWeight: "bold" }}>{copyright}</div>
                <br />
                <div style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 16 }}>
                    <a onClick={() => openUrl("https://discord.gg/ghQ8nQK2ma")}>
                        <BsDiscord /> Discord Hangout
                    </a>
                    <a onClick={() => openUrl("https://github.com/Snazzie/Vital-Utilities/issues/new")}>
                        <BsGithub /> Submit a bug
                    </a>
                    <a onClick={() => openUrl("https://github.com/Snazzie/Vital-Utilities/discussions/categories/feature-requests")}>
                        <BsGithub /> Submit a feature
                    </a>
                </div>
            </div>
        </div>
    );
};
