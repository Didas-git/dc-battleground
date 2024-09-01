import { defaultTransformers } from "@lilybird/transformers";
import { handler } from "./handler.js";
import { CachingDelegationType, Intents, createClient } from "lilybird";

import "./commands.js";
import { BOARD_CALCULATED_SIZE, BOARD_LIMITS } from "./schemas/board.js";

// await handler.scanDir(`${import.meta.dir}/listeners`);

const { interactionCreate, ...trimmed } = defaultTransformers;
// eslint-disable-next-line no-void
void interactionCreate;

export const client = await createClient({
    token: process.env.TOKEN,
    intents: [
        Intents.GUILDS,
        Intents.GUILD_MEMBERS
    ],
    caching: {
        delegate: CachingDelegationType.DEFAULT,
        enabled: { guild: true }
    },
    setup: async (c) => {
        console.log(`Logged in as ${c.user.username} (${c.user.id})`);
        await handler.loadGlobalCommands(c);
        console.log(`Current Board size: ${BOARD_CALCULATED_SIZE} (${BOARD_LIMITS.POSITIVE.x}x${BOARD_LIMITS.POSITIVE.y})`);
    },
    transformers: trimmed,
    listeners: handler.getListenersObject()
});
