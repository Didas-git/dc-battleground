import { ApplicationCommandOptionType } from "lilybird";
import { $applicationCommand } from "../../handler.js";
import { viewBoard } from "./view.js";
import { boardSpawn } from "./spawn.js";
import { boardReset } from "./refresh.js";
import { scanBoard } from "./scan.js";

$applicationCommand({
    name: "board",
    description: "Board actions",
    options: [
        {
            type: ApplicationCommandOptionType.SUB_COMMAND,
            name: "refresh",
            description: "Refresh chest locations.",
            handle: boardReset
        },
        {
            type: ApplicationCommandOptionType.SUB_COMMAND,
            name: "view",
            description: "Visualize current table in your position.",
            handle: viewBoard
        },
        {
            type: ApplicationCommandOptionType.SUB_COMMAND,
            name: "scan",
            description: "Scan for nearby chests in a 60x60 area.",
            handle: scanBoard
        },
        {
            type: ApplicationCommandOptionType.SUB_COMMAND,
            name: "spawn",
            description: "Spawn chests in random locations.",
            options: [
                {
                    type: ApplicationCommandOptionType.INTEGER,
                    name: "quantity",
                    description: "The amount of chests to spawn",
                    min_value: 1,
                    max_value: 30,
                    required: true
                }
            ],
            handle: boardSpawn
        }
    ]
});
