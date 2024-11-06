import { ApplicationCommandOptionType, ComponentType } from "lilybird";
import { handleClassSelection, profileCreate } from "./create.js";
import { $applicationCommand } from "../../handler.js";
import { profileDisplay } from "./display.js";

$applicationCommand({
    name: "profile",
    description: "Manage your profile",
    options: [
        {
            type: ApplicationCommandOptionType.SUB_COMMAND,
            name: "create",
            description: "Create your profile",
            handle: profileCreate
        },
        {
            type: ApplicationCommandOptionType.SUB_COMMAND,
            name: "display",
            description: "Display a profile",
            options: [
                {
                    type: ApplicationCommandOptionType.USER,
                    name: "target",
                    description: "The user you want the see the profile of"
                }
            ],
            handle: profileDisplay
        }
    ],
    components: [
        {
            type: ComponentType.StringSelect,
            id: "class",
            handle: handleClassSelection
        }
    ]
});
