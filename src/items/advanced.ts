import { Item, ItemRarity, ItemTable, ItemType } from "./item.js";

class ReactiveMetallicDrip extends Item {
    public rdsProbability = 1;
    public rdsUnique = false;
    public rdsAlways = false;
    public rdsEnabled = true;
    public rdsValue = {
        id: "reactive_metallic_drip",
        type: ItemType.Crafting,
        rarity: ItemRarity.Advanced,
        name: "Reactive Metallic Drip",
        description: "A basic material used for weapon breakthrough"
    };
}

class AdagioHelix extends Item {
    public rdsProbability = 1;
    public rdsUnique = false;
    public rdsAlways = false;
    public rdsEnabled = true;
    public rdsValue = {
        id: "adagio_helix",
        type: ItemType.Crafting,
        rarity: ItemRarity.Advanced,
        name: "Adagio Helix",
        description: "A basic material used for weapon breakthrough"
    };
}

class WavewornResidue226 extends Item {
    public rdsProbability = 1;
    public rdsUnique = false;
    public rdsAlways = false;
    public rdsEnabled = true;
    public rdsValue = {
        id: "waveworn_residue_226",
        type: ItemType.Crafting,
        rarity: ItemRarity.Advanced,
        name: "Waveworn Residue 226",
        description: "A basic material used for weapon breakthrough"
    };
}

class CadenceBud extends Item {
    public rdsProbability = 1;
    public rdsUnique = false;
    public rdsAlways = false;
    public rdsEnabled = true;
    public rdsValue = {
        id: "cadence_bud",
        type: ItemType.Crafting,
        rarity: ItemRarity.Advanced,
        name: "Cadence Bud",
        description: "A basic material used for weapon breakthrough"
    };
}

class ExtractedPhlogiston extends Item {
    public rdsProbability = 1;
    public rdsUnique = false;
    public rdsAlways = false;
    public rdsEnabled = true;
    public rdsValue = {
        id: "extracted_phlogiston",
        type: ItemType.Crafting,
        rarity: ItemRarity.Advanced,
        name: "Extracted Phlogiston",
        description: "A basic material used for weapon breakthrough"
    };
}

export const AdvancedItemTable = new ItemTable()
    .add(new ReactiveMetallicDrip())
    .add(new AdagioHelix())
    .add(new WavewornResidue226())
    .add(new CadenceBud())
    .add(new ExtractedPhlogiston());
