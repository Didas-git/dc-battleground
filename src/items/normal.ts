import { Item, ItemRarity, ItemTable, ItemType } from "./item.js";

class BasicNode extends Item {
    public rdsProbability = 1;
    public rdsUnique = false;
    public rdsAlways = false;
    public rdsEnabled = true;
    public rdsValue = {
        id: "basic_node",
        type: ItemType.Crafting,
        rarity: ItemRarity.Normal,
        name: "Node",
        description: "A basic material used for weapon analysis"
    };
}

export const NormalItemTable = new ItemTable();
NormalItemTable.add(new BasicNode());
