import { Item, ItemRarity, ItemTable, ItemType } from "./item.js";

class InertMetallicDrip extends Item {
    public rdsProbability = 1;
    public rdsUnique = false;
    public rdsAlways = false;
    public rdsEnabled = true;
    public rdsValue = {
        id: "inert_metallic_drip",
        type: ItemType.Crafting,
        rarity: ItemRarity.Normal,
        name: "Inert Metallic Drip",
        description: "A basic material used for weapon breakthrough"
    };
}

class LentoHelix extends Item {
    public rdsProbability = 1;
    public rdsUnique = false;
    public rdsAlways = false;
    public rdsEnabled = true;
    public rdsValue = {
        id: "lento_helix",
        type: ItemType.Crafting,
        rarity: ItemRarity.Normal,
        name: "Lento Helix",
        description: "A basic material used for weapon breakthrough"
    };
}

class WavewornResidue210 extends Item {
    public rdsProbability = 1;
    public rdsUnique = false;
    public rdsAlways = false;
    public rdsEnabled = true;
    public rdsValue = {
        id: "waveworn_residue_210",
        type: ItemType.Crafting,
        rarity: ItemRarity.Normal,
        name: "Waveworn Residue 210",
        description: "A basic material used for weapon breakthrough"
    };
}

class CadenceSeed extends Item {
    public rdsProbability = 1;
    public rdsUnique = false;
    public rdsAlways = false;
    public rdsEnabled = true;
    public rdsValue = {
        id: "cadence_seed",
        type: ItemType.Crafting,
        rarity: ItemRarity.Normal,
        name: "Cadence Seed",
        description: "A basic material used for weapon breakthrough"
    };
}

class ImpurePhlogiston extends Item {
    public rdsProbability = 1;
    public rdsUnique = false;
    public rdsAlways = false;
    public rdsEnabled = true;
    public rdsValue = {
        id: "impure_phlogiston",
        type: ItemType.Crafting,
        rarity: ItemRarity.Normal,
        name: "Impure Phlogiston",
        description: "A basic material used for weapon breakthrough"
    };
}

export const NormalItemTable = new ItemTable()
    .add(new InertMetallicDrip())
    .add(new LentoHelix())
    .add(new WavewornResidue210())
    .add(new CadenceSeed())
    .add(new ImpurePhlogiston());
