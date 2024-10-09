import { ButtonStyle, ComponentType } from "lilybird";
import { DIRECTION_MAP } from "./board.js";

import type { Message } from "lilybird";

export const BACK_BUTTON: Message.Component.ButtonStructure = {
    type: ComponentType.Button,
    custom_id: "back",
    style: ButtonStyle.Secondary,
    label: "Go Back"
};

export const MOVEMENT_ROW: Message.Component.ActionRowStructure = {
    type: ComponentType.ActionRow,
    components: [
        {
            type: ComponentType.Button,
            custom_id: "arrow-left",
            style: ButtonStyle.Primary,
            label: DIRECTION_MAP.left
        },
        {
            type: ComponentType.Button,
            custom_id: "arrow-up",
            style: ButtonStyle.Primary,
            label: DIRECTION_MAP.up
        },
        {
            type: ComponentType.Button,
            custom_id: "arrow-down",
            style: ButtonStyle.Primary,
            label: DIRECTION_MAP.down
        },
        {
            type: ComponentType.Button,
            custom_id: "arrow-right",
            style: ButtonStyle.Primary,
            label: DIRECTION_MAP.right
        }
    ]
};
