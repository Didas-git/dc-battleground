import { ApplicationCommandOptionType } from "lilybird";
import { $applicationCommand } from "../../handler.js";
import { actionSelfHeal } from "./self/heal.js";
import { actionSell } from "./sell.js";

$applicationCommand({
    name: "action",
    description: "Execute an action.",
    options: [
        {
            type: ApplicationCommandOptionType.SUB_COMMAND,
            name: "sell",
            description: "Sell an item.",
            handle: actionSell
        },
        {
            type: ApplicationCommandOptionType.SUB_COMMAND_GROUP,
            name: "self",
            description: "Execute an action on yourself.",
            options: [
                {
                    type: ApplicationCommandOptionType.SUB_COMMAND,
                    name: "heal",
                    description: "Heal yourself.",
                    options: [
                        {
                            type: ApplicationCommandOptionType.INTEGER,
                            name: "amount",
                            description: "The amount to heal for.",
                            min_value: 0
                        }
                    ],
                    handle: actionSelfHeal
                }
            ]
        }
    ]
});
