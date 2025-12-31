import { createFileRoute } from "@tanstack/react-router";
import { EditProfilePage } from "../../pages/Profile/EditProfilePage";

export const Route = createFileRoute("/profiles/$profileId")({
    component: EditProfilePage
});
