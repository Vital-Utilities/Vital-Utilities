import { useRequest } from "ahooks";
import axios from "axios";
import _ from "lodash";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateHttpConnectedAction } from "../Redux/actions/appActions";
import { AppState, VitalState } from "../Redux/States";

export const ServiceLiveMonitor: React.FunctionComponent = () => {
    const appState = useSelector<VitalState, AppState>(state => state.appState);
    const dispatcher = useDispatch();
    const [responseHistory, setResponseHistory] = React.useState<{ date: Date; success: boolean }[]>([]);
    useRequest(sendHello, { pollingInterval: 1000 });

    function sendHello() {
        return axios.get("/api/hello", { timeout: 700 }).then(
            res => processResult(res.status),
            err => processResult(err.response?.status)
        );
    }

    function processResult(status: number) {
        const cull = _.takeRight(responseHistory, 4);
        setResponseHistory([...cull, { date: new Date(), success: status === 200 }]);
        const connected = !responseHistory.filter(e => e.date >= new Date(Date.now() - 4000)).every(e => e.success === false);
        if (connected !== appState.httpConnected) dispatcher(updateHttpConnectedAction(connected));
    }
    return <></>;
};
