import { CachingDelegationType, Intents, createClient } from "lilybird";
import { defaultTransformers } from "@lilybird/transformers";
import { handler } from "./handler.js";

import { floors } from "../config.json" with { type: "json" };

import "./commands.js";

// await handler.scanDir(`${import.meta.dir}/listeners`);

const { interactionCreate, ...trimmed } = defaultTransformers;
// eslint-disable-next-line no-void
void interactionCreate;

export const client = await createClient({
    token: process.env.TOKEN,
    intents: [Intents.GUILDS],
    caching: {
        delegate: CachingDelegationType.DEFAULT,
        enabled: { guild: true }
    },
    setup: async (c) => {
        console.log(`Logged in as ${c.user.username} (${c.user.id})`);
        await handler.loadGlobalCommands(c);
        console.log("The following floors are available:");
        console.table(floors);
    },
    transformers: trimmed,
    listeners: handler.getListenersObject()
});
