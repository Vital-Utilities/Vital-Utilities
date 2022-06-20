import * as React from "react";
import { Route, Switch, useLocation } from "react-router";
import { BrowserRouter as Router, Link } from "react-router-dom";
import { Processes } from "./pages/Processes";
import "antd/dist/antd.css";
import { Menu, Modal } from "antd";
import { SettingFilled, QuestionCircleFilled, ProfileFilled, DashboardOutlined, AppstoreOutlined, WarningOutlined } from "@ant-design/icons";
import { Profiles } from "./pages/Profile/Profiles";
import { EditProfilePage } from "./pages/Profile/EditProfilePage";
import { useDispatch, useSelector } from "react-redux";
import { AppState, VitalState } from "./Redux/States";
import { CpuPerfBadge, GpuPerfBadge, RamUsageBadge } from "./components/PerfBadge";
import { Settings } from "./pages/Settings";
import { ConnnectionIssuePage } from "./pages/ConnectionIssue";
import { useInterval } from "ahooks";
import { InfoPage } from "./pages/Info";
import { fetchMachineDynamicDataAction, fetchMachineStaticDataAction, fetchMachineTimeSeriesDataAction } from "./Redux/actions/machineActions";
import { useEffect } from "react";
import axios from "axios";
import { fetchManagedProcessesAction } from "./Redux/actions/managedModelActions";
import { updateAppReadyAction } from "./Redux/actions/appActions";
import { PerformancePage, relativeTimeOptions, relativeTypeStringOptions } from "./pages/Performance/Performance";
import moment from "moment";
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
const App: React.FunctionComponent = () => {
    const dispatch = useDispatch();
    const location = useLocation();
    const appState = useSelector<VitalState, AppState>(state => state.appState);
    const [noConnectionModalVisible, setNoConnectionModalVisible] = React.useState(false);
    const [aboutModalVisible, setAboutModalVisible] = React.useState(false);
    React.useEffect(() => {
        if (appState.vitalServicePort !== undefined) {
            dispatch(updateAppReadyAction(true));
        }
        setNoConnectionModalVisible(!appState.httpConnected);
    }, [appState.httpConnected, appState.signalRConnected, appState.vitalServicePort]);

    useInterval(
        () => {
            if (appState.httpConnected) getData();
        },
        2000,
        { immediate: true }
    );

    useEffect(() => {
        axios.defaults.baseURL = `http://localhost:${appState.vitalServicePort}`;
        axios.defaults.timeout = 10000;
        axios.defaults.responseType = "json";
        axios.defaults.headers = { "Access-Control-Allow-Origin": "*" };
    }, [appState.vitalServicePort]);

    async function getData() {
        let relativeTimeOption = window.localStorage.getItem("relativeTimeOption") ?? "Last 1 minute";
        // eslint-disable-next-line prettier/prettier
        relativeTimeOption = relativeTimeOption.replaceAll("\"", "") as relativeTypeStringOptions;
        dispatch(fetchMachineStaticDataAction());
        dispatch(
            fetchMachineTimeSeriesDataAction({
                latest: moment().add(1, "minutes").utc().toDate(),
                earliest: moment().add(relativeTimeOptions[relativeTimeOption], "minutes").utc().toDate()
            })
        );
        dispatch(fetchMachineDynamicDataAction());
        dispatch(fetchManagedProcessesAction());
    }

    if (!appState.appReady) return <>App Loading...</>;

    return (
        <div id="page" style={{ display: "flex", flexDirection: "column", overflow: "hidden", height: "100vh", width: "100vw" }}>
            <Router>
                <Modal visible={noConnectionModalVisible} centered footer={null} title={"Problem connecting to Vital Service"} width={600} onCancel={() => setNoConnectionModalVisible(false)}>
                    <ConnnectionIssuePage />
                </Modal>
                <Modal visible={aboutModalVisible} centered footer={null} title={"Info"} width={500} onCancel={() => setAboutModalVisible(false)}>
                    <InfoPage />
                </Modal>
                <div style={{ display: "grid", borderBottom: "1px solid white", gridTemplateColumns: "auto auto" }}>
                    <Menu mode="horizontal" defaultSelectedKeys={[location.pathname]}>
                        {/*                         <Menu.Item key="/" icon={<HomeFilled />}>
                            <Link to="/" />
                        </Menu.Item> */}
                        <Menu.Item key={"/"} icon={<AppstoreOutlined />}>
                            <Link to="/" /> Processes
                        </Menu.Item>
                        <Menu.Item key="/performance" icon={<DashboardOutlined />}>
                            <Link to="/performance" /> Performance
                        </Menu.Item>
                        <Menu.Item key="/profiles" icon={<ProfileFilled />}>
                            <Link to="/profiles" /> Profiles
                        </Menu.Item>
                        <Menu.Item key="/settings" icon={<SettingFilled />}>
                            <Link to="/settings" /> Settings
                        </Menu.Item>
                    </Menu>
                    <div style={{ width: "auto", justifySelf: "end", marginRight: 20, alignItems: "center", gap: "20px", height: "100%", display: "flex", flexDirection: "row", color: "white" }}>
                        <CpuPerfBadge />
                        <RamUsageBadge />
                        <GpuPerfBadge />
                        <span>
                            {!appState.httpConnected && (
                                <span style={{ color: "orange", cursor: "pointer" }} onClick={() => setNoConnectionModalVisible(true)}>
                                    <WarningOutlined style={{ color: "orange" }} /> Disconnected
                                </span>
                            )}
                        </span>
                        <span className="interactable" onClick={() => setAboutModalVisible(true)}>
                            <QuestionCircleFilled style={{ fontSize: 20 }} />
                        </span>
                    </div>
                </div>
                <div id="pageContainer" style={{ width: "100%", display: "contents" }}>
                    <Switch>
                        {/* <Route path="/" exact component={ProcessManager} /> */}
                        <Route path="/" exact component={Processes} />
                        <Route path="/performance" exact component={PerformancePage} />
                        <Route path="/profiles" exact component={Profiles} />
                        <Route path="/profiles/:profileId" exact component={EditProfilePage} />
                        <Route path="/settings" exact component={Settings} />
                    </Switch>
                </div>
            </Router>
        </div>
    );
};

export default App;
