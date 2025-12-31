/* eslint-disable @typescript-eslint/no-unused-vars */
// TODO: Replace SignalR with Tauri events for real-time updates
// SignalR is a .NET technology not available in the embedded Rust backend
// For now, we mark as connected and rely on HTTP polling for data
import React from "react";
import { useDispatch } from "react-redux";
import { updateSignalRConnectedAction } from "../Redux/actions/appActions";

const ManagedHubSignalR: React.FunctionComponent = () => {
    const dispatch = useDispatch();

    React.useEffect(() => {
        // SignalR is not available with the embedded Rust backend
        // Mark as connected immediately so the app can proceed
        // Real-time updates will be implemented via Tauri events later
        console.info("SignalR disabled - using Tauri backend. Marking as connected.");
        dispatch(updateSignalRConnectedAction(true));
    }, [dispatch]);

    return <></>;
};

export default ManagedHubSignalR;
