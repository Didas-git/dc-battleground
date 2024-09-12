import { LootTable } from "./loot-table.js";

export class NormalLootTable extends LootTable {
    public override contents = [
        {
            type: 1,
            value: "inert_metallic_drip",
            unique: false,
            always: false,
            probability: 1,
            enabled: true
        },
        {
            type: 1,
            value: "lento_helix",
            unique: false,
            always: false,
            probability: 1,
            enabled: true
        },
        {
            type: 1,
            value: "waveworn_residue_210",
            unique: false,
            always: false,
            probability: 1,
            enabled: true
        },
        {
            type: 1,
            value: "cadence_seed",
            unique: false,
            always: false,
            probability: 1,
            enabled: true
        },
        {
            type: 1,
            value: "impure_phlogiston",
            unique: false,
            always: false,
            probability: 1,
            enabled: true
        }
    ];
}

export class AdvancedLootTable extends LootTable {
    public override contents = [
        {
            type: 1,
            value: "reactive_metallic_drip",
            unique: false,
            always: false,
            probability: 1,
            enabled: true
        },
        {
            type: 1,
            value: "adagio_helix",
            unique: false,
            always: false,
            probability: 1,
            enabled: true
        },
        {
            type: 1,
            value: "waveworn_residue_226",
            unique: false,
            always: false,
            probability: 1,
            enabled: true
        },
        {
            type: 1,
            value: "cadence_bud",
            unique: false,
            always: false,
            probability: 1,
            enabled: true
        },
        {
            type: 1,
            value: "extracted_phlogiston",
            unique: false,
            always: false,
            probability: 1,
            enabled: true
        }
    ];
}

export class EpicLootTable extends LootTable {
    public override contents = [
        {
            type: 1,
            value: "polarized_metallic_drip",
            unique: false,
            always: false,
            probability: 1,
            enabled: true
        },
        {
            type: 1,
            value: "andante_helix",
            unique: false,
            always: false,
            probability: 1,
            enabled: true
        },
        {
            type: 1,
            value: "waveworn_residue_235",
            unique: false,
            always: false,
            probability: 1,
            enabled: true
        },
        {
            type: 1,
            value: "cadence_leaf",
            unique: false,
            always: false,
            probability: 1,
            enabled: true
        },
        {
            type: 1,
            value: "refined_phlogiston",
            unique: false,
            always: false,
            probability: 1,
            enabled: true
        }
    ];
}

export class LegendaryLootTable extends LootTable {
    public override contents = [
        {
            type: 1,
            value: "heterized_metallic_drip",
            unique: false,
            always: false,
            probability: 1,
            enabled: true
        },
        {
            type: 1,
            value: "presto_helix",
            unique: false,
            always: false,
            probability: 1,
            enabled: true
        },
        {
            type: 1,
            value: "waveworn_residue_239",
            unique: false,
            always: false,
            probability: 1,
            enabled: true
        },
        {
            type: 1,
            value: "cadence_blossom",
            unique: false,
            always: false,
            probability: 1,
            enabled: true
        },
        {
            type: 1,
            value: "flawless_phlogiston",
            unique: false,
            always: false,
            probability: 1,
            enabled: true
        }
    ];
}

export class BasicChestTable extends LootTable {
    public override contents = [
        {
            type: 0,
            value: new NormalLootTable(),
            unique: false,
            always: false,
            probability: 1,
            enabled: true
        }
    ];
}

export class NormalChestTable extends LootTable {
    public override contents = [
        {
            type: 0,
            value: new NormalLootTable(),
            unique: false,
            always: false,
            probability: 0.8,
            enabled: true
        },
        {
            type: 0,
            value: new AdvancedLootTable(),
            unique: false,
            always: false,
            probability: 0.2,
            enabled: true
        }
    ];
}

export class EpicChestTable extends LootTable {
    public override contents = [
        {
            type: 0,
            value: new NormalLootTable(),
            unique: false,
            always: false,
            probability: 0.1,
            enabled: true
        },
        {
            type: 0,
            value: new AdvancedLootTable(),
            unique: false,
            always: false,
            probability: 0.6,
            enabled: true
        },
        {
            type: 0,
            value: new EpicLootTable(),
            unique: false,
            always: false,
            probability: 0.3,
            enabled: true
        }
    ];
}

export class LegendaryChestTable extends LootTable {
    public override contents = [
        {
            type: 0,
            value: new NormalLootTable(),
            unique: false,
            always: false,
            probability: 0.05,
            enabled: true
        },
        {
            type: 0,
            value: new AdvancedLootTable(),
            unique: false,
            always: false,
            probability: 0.16,
            enabled: true
        },
        {
            type: 0,
            value: new EpicLootTable(),
            unique: false,
            always: false,
            probability: 0.65,
            enabled: true
        },
        {
            type: 0,
            value: new LegendaryLootTable(),
            unique: false,
            always: false,
            probability: 0.14,
            enabled: true
        }
    ];
}
