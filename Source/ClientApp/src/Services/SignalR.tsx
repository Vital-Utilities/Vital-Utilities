/* eslint-disable @typescript-eslint/no-unused-vars */
import { HubConnectionBuilder, HubConnectionState, HubConnection } from "@microsoft/signalr"; // version 1.0.4
import { GetMachineDynamicDataResponse, ManagedModelDto } from "@vital/vitalservice";
import { message, notification } from "antd";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateSignalRConnectedAction } from "../Redux/actions/appActions";
import { recieveMachineDynamicDataAction } from "../Redux/actions/machineActions";
import { recieveDeleteManagedProcessAction, recieveManagedProcessAddedAction, recieveManagedProcessUpdatedAction } from "../Redux/actions/managedModelActions";
import { VitalState, AppState } from "../Redux/States";

const ManagedHubSignalR: React.FunctionComponent = () => {
    // eslint-disable-next-line no-unused-vars
    const [signalRConnection, setConnection] = React.useState<HubConnection>();
    const dispatch = useDispatch();
    const appState = useSelector<VitalState, AppState>(state => state.appState);
    // register signalR after the user logged in
    setInterval(() => {
        if (signalRConnection?.state === HubConnectionState.Disconnected)
            signalRConnection
                ?.start()
                .then(() => setIsConnected(true))
                .catch(err => {
                    console.error("SignalR Connection Error: ", err), setIsConnected(false);
                });
    }, 5000);
    function setIsConnected(connected: boolean) {
        dispatch(updateSignalRConnectedAction(connected));
    }
    React.useEffect(() => {
        // create the connection instance
        const connection = new HubConnectionBuilder().withUrl(`http://localhost:${appState.vitalServicePort}/ManagedHub`).withAutomaticReconnect().build();
        console.log(connection.connectionId);
        // event handlers, you can use these to dispatch actions to update your Redux store
        connection.on("MachineDynamicData", (data: GetMachineDynamicDataResponse) => {
            message.info("Machine dynamic data recieved");
            dispatch(recieveMachineDynamicDataAction(data));
        });
        connection.on("ManagedAdded", (data: ManagedModelDto) => {
            dispatch(recieveManagedProcessAddedAction(data));
        });
        connection.on("ManagedUpdated", (data: ManagedModelDto) => {
            dispatch(recieveManagedProcessUpdatedAction(data));
        });
        connection.on("ManagedRemoved", (data: ManagedModelDto) => {
            dispatch(recieveDeleteManagedProcessAction(data.id));
        });

        connection.onreconnecting(error => {
            console.assert(connection.state === HubConnectionState.Reconnecting);
            setIsConnected(false);
            console.error(`Connection lost due to error "${error}". Reconnecting.`);
            notification.error({ duration: 5, message: `Connection lost due to error "${error}". Reconnecting.` });
            console.log("SignalR Reconnecting");
        });
        connection.onreconnected(connectionId => {
            console.assert(connection.state === HubConnectionState.Connected);
            setIsConnected(true);
            console.error(`Connection reestablished. Connected with connectionId "${connectionId}".`);
            console.log("SignalR Reconnected");
            setIsConnected(true);
        });
        connection.onclose(error => {
            console.assert(connection.state === HubConnectionState.Disconnected);
            const message = `Connection closed due to error "${error}". Try refreshing this page to restart the connection.`;
            notification.error({ duration: null, message: message });
            console.error(message);
            setIsConnected(false);
        });

        connection
            .start()
            .then(() => console.info("SignalR Connected"))
            .then(() => setIsConnected(true))
            .catch(err => {
                console.error("SignalR Connection Error: ", err), setIsConnected(false);
            });

        setConnection(connection);
    }, [dispatch, appState.vitalServicePort]);

    return <></>;
};

export default ManagedHubSignalR;
