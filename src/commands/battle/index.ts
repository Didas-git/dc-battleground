import { ApplicationCommandOptionType } from "lilybird";
import { $applicationCommand } from "../../handler.js";
import { attack } from "./attack.js";

$applicationCommand({
    name: "battle",
    description: "The collection of all battle related commands.",
    options: [
        {
            type: ApplicationCommandOptionType.SUB_COMMAND,
            name: "attack",
            description: "Attack your opponent.",
            handle: attack
        }
    ]
});
