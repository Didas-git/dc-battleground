import { createCustomGrowthArray, cfg } from "./level.js";

import * as Level from "../../schemas/levels.js";

const data = createCustomGrowthArray(cfg);

for (let i = 1, { length } = data; i < length; i++) Level.addLevel(i, data[i]);
