import { ButtonStyle, ComponentType } from "lilybird";

import type { Message } from "lilybird";

export const BACK_BUTTON: Message.Component.ButtonStructure = {
    type: ComponentType.Button,
    custom_id: "back",
    style: ButtonStyle.Secondary,
    label: "Go Back"
};
