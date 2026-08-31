package dev.fopwoc.ae2iconexporter.export;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import javax.imageio.ImageIO;

import net.minecraft.client.Minecraft;
import net.minecraft.item.ItemStack;
import net.minecraftforge.oredict.OreDictionary;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonArray;
import com.google.gson.JsonNull;
import com.google.gson.JsonObject;
import com.google.gson.JsonPrimitive;

import codechicken.nei.ItemList;
import cpw.mods.fml.common.Loader;
import cpw.mods.fml.common.ModContainer;
import dev.fopwoc.ae2iconexporter.Ae2IconExporterMod;

public final class IconExportJob {

    private static final Gson GSON = new GsonBuilder().setPrettyPrinting()
        .create();

    private final Path outputDirectory;
    private final ItemIconRenderer renderer = new ItemIconRenderer();
    private final List<ExportItem> items = new ArrayList<ExportItem>();
    private final JsonArray entries = new JsonArray();
    private final JsonArray failures = new JsonArray();
    private int processed;
    private boolean complete;
    private String fatalError;

    public IconExportJob(Path outputDirectory) throws IOException {
        this.outputDirectory = outputDirectory;
        collectItems();
        Files.createDirectories(outputDirectory.resolve("icons"));
    }

    public void runBatch(int batchSize) {
        if (complete) {
            return;
        }

        int limit = Math.min(items.size(), processed + batchSize);
        while (processed < limit) {
            export(items.get(processed));
            processed++;
        }
        if (processed == items.size()) {
            finish();
        }
    }

    public int processed() {
        return processed;
    }

    public int total() {
        return items.size();
    }

    public boolean complete() {
        return complete;
    }

    public int failureCount() {
        return failures.size();
    }

    public Path outputDirectory() {
        return outputDirectory;
    }

    public String fatalError() {
        return fatalError;
    }

    private void collectItems() {
        Map<String, ExportItem> unique = new LinkedHashMap<String, ExportItem>();
        for (ItemStack source : ItemList.items) {
            if (source == null || source.getItem() == null) {
                continue;
            }
            try {
                ItemStack stack = source.copy();
                stack.stackSize = 1;
                if (stack.getItemDamage() == OreDictionary.WILDCARD_VALUE) {
                    stack.setItemDamage(0);
                }
                IconIdentity identity = IconIdentity.from(stack);
                unique.putIfAbsent(identity.key(), new ExportItem(identity, stack));
            } catch (Throwable cause) {
                addFailure(null, source, cause);
            }
        }
        items.addAll(unique.values());
        items.sort(Comparator.comparing(item -> item.identity.key()));
    }

    private void export(ExportItem item) {
        try {
            BufferedImage image = renderer.render(item.stack);
            ByteArrayOutputStream bytes = new ByteArrayOutputStream();
            if (!ImageIO.write(image, "png", bytes)) {
                throw new IOException("No PNG writer is available");
            }
            byte[] png = bytes.toByteArray();
            String hash = Hashing.sha256(png);
            String relativePath = "icons/" + hash.substring(0, 2) + "/" + hash + ".png";
            Path destination = outputDirectory.resolve(relativePath);
            Files.createDirectories(destination.getParent());
            if (!Files.exists(destination)) {
                Files.write(destination, png);
            }

            JsonObject entry = new JsonObject();
            entry.addProperty("kind", "item");
            entry.addProperty("registry", item.identity.registry());
            entry.addProperty("damage", item.identity.damage());
            if (item.identity.nbtHash() == null) {
                entry.add("nbtHash", JsonNull.INSTANCE);
            } else {
                entry.addProperty("nbtHash", item.identity.nbtHash());
            }
            entry.addProperty("legacyId", item.identity.legacyId());
            entry.addProperty("displayName", item.stack.getDisplayName());
            entry.addProperty("png", relativePath);
            entries.add(entry);
        } catch (Throwable cause) {
            addFailure(item.identity, item.stack, cause);
        }
    }

    private void finish() {
        try {
            JsonObject manifest = new JsonObject();
            manifest.addProperty("schema", "ae2-icons/v1");
            manifest.addProperty(
                "generatedAt",
                Instant.now()
                    .toString());
            manifest.add("environment", environment());
            manifest.add("entries", entries);
            manifest.add("failures", failures);

            Path temporary = outputDirectory.resolve("manifest.json.tmp");
            Path destination = outputDirectory.resolve("manifest.json");
            Files.write(
                temporary,
                GSON.toJson(manifest)
                    .getBytes(StandardCharsets.UTF_8));
            try {
                Files.move(temporary, destination, StandardCopyOption.ATOMIC_MOVE, StandardCopyOption.REPLACE_EXISTING);
            } catch (IOException unsupportedAtomicMove) {
                Files.move(temporary, destination, StandardCopyOption.REPLACE_EXISTING);
            }
            Ae2IconExporterMod.LOG.info(
                "Exported {} item icons with {} failures to {}",
                entries.size(),
                failures.size(),
                outputDirectory);
        } catch (Throwable cause) {
            fatalError = cause.getMessage() == null ? cause.getClass()
                .getSimpleName() : cause.getMessage();
            Ae2IconExporterMod.LOG.error("Unable to write icon manifest", cause);
        } finally {
            complete = true;
        }
    }

    private JsonObject environment() {
        JsonObject environment = new JsonObject();
        environment.addProperty("minecraft", "1.7.10");
        environment.addProperty("iconSize", ItemIconRenderer.ICON_SIZE);

        List<String> mods = new ArrayList<String>();
        for (ModContainer mod : Loader.instance()
            .getActiveModList()) {
            mods.add(mod.getModId() + "@" + mod.getVersion());
        }
        mods.sort(String::compareTo);
        JsonArray modList = new JsonArray();
        for (String mod : mods) {
            modList.add(new JsonPrimitive(mod));
        }
        environment.add("mods", modList);
        environment.addProperty("modsSha256", Hashing.sha256(String.join("\n", mods)));

        JsonArray resourcePacks = new JsonArray();
        for (String resourcePack : Minecraft.getMinecraft().gameSettings.resourcePacks) {
            resourcePacks.add(new JsonPrimitive(resourcePack));
        }
        environment.add("resourcePacks", resourcePacks);
        return environment;
    }

    private void addFailure(IconIdentity identity, ItemStack stack, Throwable cause) {
        JsonObject failure = new JsonObject();
        if (identity == null) {
            failure.add("legacyId", JsonNull.INSTANCE);
        } else {
            failure.addProperty("legacyId", identity.legacyId());
        }
        String displayName;
        try {
            displayName = stack == null ? "Unknown item" : stack.getDisplayName();
        } catch (Throwable ignored) {
            displayName = "Unknown item";
        }
        failure.addProperty("displayName", displayName);
        failure.addProperty(
            "reason",
            cause.getClass()
                .getSimpleName() + ": "
                + String.valueOf(cause.getMessage()));
        failures.add(failure);
        Ae2IconExporterMod.LOG.warn("Unable to export icon for {}", displayName, cause);
    }

    private static final class ExportItem {

        private final IconIdentity identity;
        private final ItemStack stack;

        private ExportItem(IconIdentity identity, ItemStack stack) {
            this.identity = identity;
            this.stack = stack;
        }
    }
}
