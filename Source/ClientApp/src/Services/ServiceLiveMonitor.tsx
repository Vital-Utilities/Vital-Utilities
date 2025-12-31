import { useRequest } from "ahooks";
import _ from "lodash";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { helloApi } from "../Redux/actions/tauriApi";
import { updateHttpConnectedAction } from "../Redux/actions/appActions";
import { AppState, VitalState } from "../Redux/States";

export const ServiceLiveMonitor: React.FunctionComponent = () => {
    const appState = useSelector<VitalState, AppState>(state => state.appState);
    const dispatcher = useDispatch();
    const [responseHistory, setResponseHistory] = React.useState<{ date: Date; success: boolean }[]>([]);
    useRequest(sendHello, { pollingInterval: 1000 });

    function sendHello() {
        return helloApi.hello().then(
            () => processResult(true),
            () => processResult(false)
        );
    }

    function processResult(success: boolean) {
        const cull = _.takeRight(responseHistory, 4);
        setResponseHistory([...cull, { date: new Date(), success }]);
        const connected = !responseHistory.filter(e => e.date >= new Date(Date.now() - 4000)).every(e => e.success === false);
        if (connected !== appState.httpConnected) dispatcher(updateHttpConnectedAction(connected));
    }
    return <></>;
};
