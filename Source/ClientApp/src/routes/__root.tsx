import * as React from "react";
import { createRootRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useDispatch, useSelector } from "react-redux";
import { AppState, VitalState } from "../Redux/States";
import { CpuPerfBadge, GpuPerfBadge, RamUsageBadge } from "../components/PerfBadge";
import { ConnnectionIssuePage } from "../pages/ConnectionIssue";
import { useInterval } from "ahooks";
import { InfoPage } from "../pages/Info";
import { fetchMachineDynamicDataAction, fetchMachineStaticDataAction, fetchMachineTimeSeriesDataAction } from "../Redux/actions/machineActions";
import { useEffect } from "react";
import { fetchManagedProcessesAction } from "../Redux/actions/managedModelActions";
import { updateAppReadyAction, updateHttpConnectedAction } from "../Redux/actions/appActions";
import { relativeTimeOptions, relativeTypeStringOptions } from "../pages/Performance/Performance";
import moment from "moment";
import { SplashScreen } from "../pages/SpashScreen";
import { useOs } from "../Utilities/TauriCommands";
import { helloApi } from "../Redux/actions/tauriApi";
import { Settings as SettingsIcon, HelpCircle, User, LayoutDashboard, Grid, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const Route = createRootRoute({
    component: RootLayout
});

function RootLayout() {
    const dispatch = useDispatch();
    const location = useLocation();
    const appState = useSelector<VitalState, AppState>(state => state.appState);
    const [noConnection, setNoConnection] = React.useState(false);
    const [aboutModalVisible, setAboutModalVisible] = React.useState(false);
    const [initializedTime] = React.useState(moment());
    const os = useOs();

    // Check backend connection via Tauri invoke
    useEffect(() => {
        helloApi
            .hello()
            .then(() => {
                dispatch(updateHttpConnectedAction(true));
            })
            .catch(e => {
                console.error("Backend connection failed:", e);
                dispatch(updateHttpConnectedAction(false));
            });
    }, [dispatch]);

    useInterval(() => {
        if (appState.httpConnected && appState.signalRConnected) {
            setNoConnection(false);
            dispatch(updateAppReadyAction(true));
        } else if (moment().diff(initializedTime, "seconds") > 10) {
            setNoConnection(true);
        }
    }, 1000);

    useInterval(
        () => {
            if (appState.httpConnected) getData();
        },
        2000,
        { immediate: true }
    );

    async function getData() {
        let relativeTimeOption = window.localStorage.getItem("relativeTimeOption") ?? "Last 1 minute";
        // eslint-disable-next-line prettier/prettier
        relativeTimeOption = relativeTimeOption.replaceAll("\"", "") as relativeTypeStringOptions;
        dispatch(fetchMachineStaticDataAction());
        dispatch(
            fetchMachineTimeSeriesDataAction({
                latest: moment().add(1, "minutes").utc().toDate().toISOString(),
                earliest: moment().add(relativeTimeOptions[relativeTimeOption], "minutes").utc().toDate().toISOString()
            })
        );
        dispatch(fetchMachineDynamicDataAction());
        dispatch(fetchManagedProcessesAction());
    }

    // eslint-disable-next-line no-constant-condition
    if (!appState.appReady) return <>{noConnection ? <ConnnectionIssuePage /> : <SplashScreen />}</>;

    return (
        <div id="page" style={{ display: "flex", flexDirection: "column", overflow: "hidden", height: "100vh", width: "100vw" }}>
            <Dialog open={noConnection} onOpenChange={setNoConnection}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Problem connecting to Vital Service</DialogTitle>
                    </DialogHeader>
                    <ConnnectionIssuePage />
                </DialogContent>
            </Dialog>
            <Dialog open={aboutModalVisible} onOpenChange={setAboutModalVisible}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Info</DialogTitle>
                    </DialogHeader>
                    <InfoPage />
                </DialogContent>
            </Dialog>
            <div className="border-b border-border/50 backdrop-blur-sm bg-background/80" style={{ display: "grid", gridTemplateColumns: "auto auto" }}>
                <nav className="flex h-12 items-center gap-2 px-3">
                    <NavLink to="/" icon={<Grid className="h-4 w-4" />} active={location.pathname === "/"}>
                        Processes
                    </NavLink>
                    <NavLink to="/performance" icon={<LayoutDashboard className="h-4 w-4" />} active={location.pathname === "/performance"}>
                        Performance
                    </NavLink>
                    {os === "windows" && (
                        <NavLink to="/profiles" icon={<User className="h-4 w-4" />} active={location.pathname.startsWith("/profiles")}>
                            Profiles
                        </NavLink>
                    )}
                    <NavLink to="/settings" icon={<SettingsIcon className="h-4 w-4" />} active={location.pathname === "/settings"}>
                        Settings
                    </NavLink>
                </nav>
                <div style={{ width: "auto", justifySelf: "end", marginRight: 20, alignItems: "center", gap: "20px", height: "100%", display: "flex", flexDirection: "row", color: "white" }}>
                    <CpuPerfBadge />
                    <RamUsageBadge />
                    <GpuPerfBadge />
                    <span>
                        {!appState.httpConnected && (
                            <span style={{ color: "orange", cursor: "pointer" }} onClick={() => setNoConnection(true)}>
                                <AlertTriangle className="h-4 w-4 inline" style={{ color: "orange" }} /> Disconnected
                            </span>
                        )}
                    </span>
                    <span className="interactable cursor-pointer" onClick={() => setAboutModalVisible(true)}>
                        <HelpCircle className="h-5 w-5" />
                    </span>
                </div>
            </div>
            <div id="pageContainer" style={{ width: "100%", display: "contents" }}>
                <Outlet />
            </div>
        </div>
    );
}

interface NavLinkProps {
    to: string;
    icon: React.ReactNode;
    active: boolean;
    children: React.ReactNode;
}

const NavLink: React.FC<NavLinkProps> = ({ to, icon, active, children }) => {
    return (
        <Link to={to} className={cn("flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200", active ? "bg-primary/15 text-primary shadow-sm shadow-primary/20 ring-1 ring-primary/20" : "text-muted-foreground hover:bg-secondary hover:text-foreground")}>
            {icon}
            {children}
        </Link>
    );
};
