import React from "react";
import packageInfo from "../../package.json";
import { BsDiscord, BsGithub } from "react-icons/bs";
import { openUrl } from "../Utilities/TauriCommands";
export const InfoPage: React.FunctionComponent = () => {
    return (
        <div style={{ alignItems: "center", display: "grid", justifyContent: "center", height: "100%", width: "100%" }}>
            <div>
                <h1>{packageInfo.name}</h1>
                <p>v{packageInfo.version}</p>
                <div style={{ fontWeight: "bold" }}>{packageInfo.copyright}</div>
                <br />
                <div style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: 16 }}>
                    <a onClick={() => openUrl("https://discord.gg/ghQ8nQK2ma")}>
                        <BsDiscord /> Discord Hangout
                    </a>
                    <a onClick={() => openUrl("https://github.com/Vital-Utilities/Vital-Utilities/issues/new")}>
                        <BsGithub /> Submit a bug
                    </a>
                    <a onClick={() => openUrl("https://github.com/Vital-Utilities/Vital-Utilities/discussions/categories/feature-requests-suggestions")}>
                        <BsGithub /> Submit a feature request or suggestion
                    </a>
                </div>
            </div>
        </div>
    );
};
