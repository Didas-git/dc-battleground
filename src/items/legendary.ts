import { Item, ItemRarity, ItemTable, ItemType } from "./item.js";

class HeterizedMetallicDrip extends Item {
    public rdsProbability = 1;
    public rdsUnique = false;
    public rdsAlways = false;
    public rdsEnabled = true;
    public rdsValue = {
        id: "heterized_metallic_drip",
        type: ItemType.Crafting,
        rarity: ItemRarity.Normal,
        name: "Heterized Metallic Drip",
        description: "A basic material used for weapon breakthrough"
    };
}

class PrestoHelix extends Item {
    public rdsProbability = 1;
    public rdsUnique = false;
    public rdsAlways = false;
    public rdsEnabled = true;
    public rdsValue = {
        id: "presto_helix",
        type: ItemType.Crafting,
        rarity: ItemRarity.Normal,
        name: "Presto Helix",
        description: "A basic material used for weapon breakthrough"
    };
}

class WavewornResidue239 extends Item {
    public rdsProbability = 1;
    public rdsUnique = false;
    public rdsAlways = false;
    public rdsEnabled = true;
    public rdsValue = {
        id: "waveworn_residue_239",
        type: ItemType.Crafting,
        rarity: ItemRarity.Normal,
        name: "Waveworn Residue 239",
        description: "A basic material used for weapon breakthrough"
    };
}

class CadenceBlossom extends Item {
    public rdsProbability = 1;
    public rdsUnique = false;
    public rdsAlways = false;
    public rdsEnabled = true;
    public rdsValue = {
        id: "cadence_blossom",
        type: ItemType.Crafting,
        rarity: ItemRarity.Normal,
        name: "Cadence Blossom",
        description: "A basic material used for weapon breakthrough"
    };
}

class FlawlessPhlogiston extends Item {
    public rdsProbability = 1;
    public rdsUnique = false;
    public rdsAlways = false;
    public rdsEnabled = true;
    public rdsValue = {
        id: "flawless_phlogiston",
        type: ItemType.Crafting,
        rarity: ItemRarity.Normal,
        name: "Flawless Phlogiston",
        description: "A basic material used for weapon breakthrough"
    };
}

export const LegendaryItemTable = new ItemTable()
    .add(new HeterizedMetallicDrip())
    .add(new PrestoHelix())
    .add(new WavewornResidue239())
    .add(new CadenceBlossom())
    .add(new FlawlessPhlogiston());
