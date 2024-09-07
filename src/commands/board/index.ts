import { ApplicationCommandOptionType, ComponentType } from "lilybird";
import { handleChestCollision } from "./collisions/chest.js";
import { $applicationCommand } from "../../handler.js";
import { boardReset } from "./refresh.js";
import { handleMoving } from "./move.js";
import { boardSpawn } from "./spawn.js";
import { viewBoard } from "./view.js";
import { scanBoard } from "./scan.js";

$applicationCommand({
    name: "board",
    description: "Board actions",
    components: [
        {
            type: ComponentType.Button,
            id: "arrows",
            customMatcher: "custom_id.split(\"-\",2)[0] === \"arrow\"",
            handle: handleMoving
        },
        {
            type: ComponentType.Button,
            id: "chests",
            customMatcher: "custom_id.split(\"-\",2)[0] === \"c\"",
            handle: handleChestCollision
        }
    ],
    options: [
        {
            type: ApplicationCommandOptionType.SUB_COMMAND,
            name: "refresh",
            description: "Refresh chest locations.",
            options: [
                {
                    type: ApplicationCommandOptionType.INTEGER,
                    name: "layer",
                    description: "The layer to reset. Pass -1 to reset all. Default: -1"
                }
            ],
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
                },
                {
                    type: ApplicationCommandOptionType.INTEGER,
                    name: "layer",
                    description: "The layer to reset. Pass -1 to reset all. Default: -1",
                    min_value: 1
                }
            ],
            handle: boardSpawn
        }
    ]
});
