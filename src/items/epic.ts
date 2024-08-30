import { Item, ItemRarity, ItemTable, ItemType } from "./item.js";

class PolarizedMetallicDrip extends Item {
    public rdsProbability = 1;
    public rdsUnique = false;
    public rdsAlways = false;
    public rdsEnabled = true;
    public rdsValue = {
        id: "polarized_metallic_drip",
        type: ItemType.Crafting,
        rarity: ItemRarity.Normal,
        name: "Polarized Metallic Drip",
        description: "A basic material used for weapon breakthrough"
    };
}

class AndanteHelix extends Item {
    public rdsProbability = 1;
    public rdsUnique = false;
    public rdsAlways = false;
    public rdsEnabled = true;
    public rdsValue = {
        id: "andante_helix",
        type: ItemType.Crafting,
        rarity: ItemRarity.Normal,
        name: "Andante Helix",
        description: "A basic material used for weapon breakthrough"
    };
}

class WavewornResidue235 extends Item {
    public rdsProbability = 1;
    public rdsUnique = false;
    public rdsAlways = false;
    public rdsEnabled = true;
    public rdsValue = {
        id: "waveworn_residue_235",
        type: ItemType.Crafting,
        rarity: ItemRarity.Normal,
        name: "Waveworn Residue 235",
        description: "A basic material used for weapon breakthrough"
    };
}

class CadenceLeaf extends Item {
    public rdsProbability = 1;
    public rdsUnique = false;
    public rdsAlways = false;
    public rdsEnabled = true;
    public rdsValue = {
        id: "cadence_leaf",
        type: ItemType.Crafting,
        rarity: ItemRarity.Normal,
        name: "Cadence Leaf",
        description: "A basic material used for weapon breakthrough"
    };
}

class RefinedPhlogiston extends Item {
    public rdsProbability = 1;
    public rdsUnique = false;
    public rdsAlways = false;
    public rdsEnabled = true;
    public rdsValue = {
        id: "refined_phlogiston",
        type: ItemType.Crafting,
        rarity: ItemRarity.Normal,
        name: "Refined Phlogiston",
        description: "A basic material used for weapon breakthrough"
    };
}

export const EpicItemTable = new ItemTable()
    .add(new PolarizedMetallicDrip())
    .add(new AndanteHelix())
    .add(new WavewornResidue235())
    .add(new CadenceLeaf())
    .add(new RefinedPhlogiston());
