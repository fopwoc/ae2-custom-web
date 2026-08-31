package dev.fopwoc.ae2iconexporter.export;

import net.minecraft.item.ItemStack;
import net.minecraftforge.oredict.OreDictionary;

import cpw.mods.fml.common.registry.GameRegistry;
import cpw.mods.fml.common.registry.GameRegistry.UniqueIdentifier;

final class IconIdentity {

    private final String registry;
    private final int damage;
    private final String nbtHash;

    private IconIdentity(String registry, int damage, String nbtHash) {
        this.registry = registry;
        this.damage = damage;
        this.nbtHash = nbtHash;
    }

    static IconIdentity from(ItemStack stack) {
        UniqueIdentifier identifier = GameRegistry.findUniqueIdentifierFor(stack.getItem());
        if (identifier == null) {
            throw new IllegalArgumentException("Item has no registry identifier");
        }
        int damage = stack.getItemDamage() == OreDictionary.WILDCARD_VALUE ? 0 : stack.getItemDamage();
        String nbtHash = stack.hasTagCompound() ? Hashing.sha256(
            stack.getTagCompound()
                .toString())
            : null;
        return new IconIdentity(identifier.toString(), damage, nbtHash);
    }

    String key() {
        return legacyId() + ":" + (nbtHash == null ? "" : nbtHash);
    }

    String registry() {
        return registry;
    }

    int damage() {
        return damage;
    }

    String nbtHash() {
        return nbtHash;
    }

    String legacyId() {
        return registry + ":" + damage;
    }
}
