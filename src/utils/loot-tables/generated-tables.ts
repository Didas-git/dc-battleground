import { LootTable } from "./loot-table.js";

export class NormalLootTable extends LootTable {
    public override contents = [
        {
            type: 0,
            value: "inert_metallic_drip",
            unique: false,
            always: false,
            probability: 1,
            enabled: true
        },
        {
            type: 0,
            value: "lento_helix",
            unique: false,
            always: false,
            probability: 1,
            enabled: true
        },
        {
            type: 0,
            value: "waveworn_residue_210",
            unique: false,
            always: false,
            probability: 1,
            enabled: true
        },
        {
            type: 0,
            value: "cadence_seed",
            unique: false,
            always: false,
            probability: 1,
            enabled: true
        },
        {
            type: 0,
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
            type: 0,
            value: "reactive_metallic_drip",
            unique: false,
            always: false,
            probability: 1,
            enabled: true
        },
        {
            type: 0,
            value: "adagio_helix",
            unique: false,
            always: false,
            probability: 1,
            enabled: true
        },
        {
            type: 0,
            value: "waveworn_residue_226",
            unique: false,
            always: false,
            probability: 1,
            enabled: true
        },
        {
            type: 0,
            value: "cadence_bud",
            unique: false,
            always: false,
            probability: 1,
            enabled: true
        },
        {
            type: 0,
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
            type: 0,
            value: "polarized_metallic_drip",
            unique: false,
            always: false,
            probability: 1,
            enabled: true
        },
        {
            type: 0,
            value: "andante_helix",
            unique: false,
            always: false,
            probability: 1,
            enabled: true
        },
        {
            type: 0,
            value: "waveworn_residue_235",
            unique: false,
            always: false,
            probability: 1,
            enabled: true
        },
        {
            type: 0,
            value: "cadence_leaf",
            unique: false,
            always: false,
            probability: 1,
            enabled: true
        },
        {
            type: 0,
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
            type: 0,
            value: "heterized_metallic_drip",
            unique: false,
            always: false,
            probability: 1,
            enabled: true
        },
        {
            type: 0,
            value: "presto_helix",
            unique: false,
            always: false,
            probability: 1,
            enabled: true
        },
        {
            type: 0,
            value: "waveworn_residue_239",
            unique: false,
            always: false,
            probability: 1,
            enabled: true
        },
        {
            type: 0,
            value: "cadence_blossom",
            unique: false,
            always: false,
            probability: 1,
            enabled: true
        },
        {
            type: 0,
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
            type: 1,
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
            type: 1,
            value: new NormalLootTable(),
            unique: false,
            always: false,
            probability: 0.8,
            enabled: true
        },
        {
            type: 1,
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
            type: 1,
            value: new NormalLootTable(),
            unique: false,
            always: false,
            probability: 0.1,
            enabled: true
        },
        {
            type: 1,
            value: new AdvancedLootTable(),
            unique: false,
            always: false,
            probability: 0.6,
            enabled: true
        },
        {
            type: 1,
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
            type: 1,
            value: new NormalLootTable(),
            unique: false,
            always: false,
            probability: 0.05,
            enabled: true
        },
        {
            type: 1,
            value: new AdvancedLootTable(),
            unique: false,
            always: false,
            probability: 0.16,
            enabled: true
        },
        {
            type: 1,
            value: new EpicLootTable(),
            unique: false,
            always: false,
            probability: 0.65,
            enabled: true
        },
        {
            type: 1,
            value: new LegendaryLootTable(),
            unique: false,
            always: false,
            probability: 0.14,
            enabled: true
        }
    ];
}

export class GoblinTable extends LootTable {
    public override contents = [
        {
            type: 0,
            value: "goblin_core",
            unique: false,
            always: true,
            probability: 1,
            enabled: true
        }
    ];
}

export function mapEnemyToLootTable(enemy: { id: string }): new () => LootTable {
    switch (enemy.id) {
        case "goblin": {
            return GoblinTable;
        }
        default: throw new Error("This enemy does not have a loot table associated with it.");
    }
}
