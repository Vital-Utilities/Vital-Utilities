import { createFileRoute } from "@tanstack/react-router";
import { Profiles } from "../../pages/Profile/Profiles";

export const Route = createFileRoute("/profiles/")({
    component: Profiles
});
