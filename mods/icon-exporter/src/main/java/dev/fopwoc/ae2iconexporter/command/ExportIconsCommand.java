package dev.fopwoc.ae2iconexporter.command;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

import net.minecraft.client.Minecraft;
import net.minecraft.command.CommandBase;
import net.minecraft.command.ICommandSender;
import net.minecraft.util.ChatComponentText;
import net.minecraft.util.EnumChatFormatting;

import codechicken.nei.ItemList;
import dev.fopwoc.ae2iconexporter.export.IconExportJob;
import dev.fopwoc.ae2iconexporter.export.IconExportScreen;

public final class ExportIconsCommand extends CommandBase {

    private static final DateTimeFormatter TIMESTAMP = DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss");

    @Override
    public String getCommandName() {
        return "exporticons";
    }

    @Override
    public String getCommandUsage(ICommandSender sender) {
        return "/exporticons [name]";
    }

    @Override
    public int getRequiredPermissionLevel() {
        return 0;
    }

    @Override
    public boolean canCommandSenderUseCommand(ICommandSender sender) {
        return true;
    }

    @Override
    public void processCommand(ICommandSender sender, String[] arguments) {
        Minecraft minecraft = Minecraft.getMinecraft();
        if (minecraft.theWorld == null || minecraft.thePlayer == null) {
            reply(sender, EnumChatFormatting.RED + "Join a world before exporting icons.");
            return;
        }
        if (ItemList.items.isEmpty()) {
            reply(sender, EnumChatFormatting.RED + "NEI has not finished building its item list yet.");
            return;
        }

        Path output = minecraft.mcDataDir.toPath()
            .resolve("ae2-icons")
            .resolve(exportName(arguments));
        if (Files.exists(output)) {
            reply(sender, EnumChatFormatting.RED + "Export directory already exists: " + output.toAbsolutePath());
            return;
        }

        try {
            IconExportJob job = new IconExportJob(output);
            minecraft.displayGuiScreen(new IconExportScreen(job));
        } catch (IOException cause) {
            reply(sender, EnumChatFormatting.RED + "Unable to start export: " + cause.getMessage());
        }
    }

    private static String exportName(String[] arguments) {
        if (arguments.length == 0) {
            return "export-" + LocalDateTime.now()
                .format(TIMESTAMP);
        }
        StringBuilder value = new StringBuilder();
        for (int index = 0; index < arguments.length; index++) {
            if (value.length() > 0) {
                value.append('-');
            }
            value.append(arguments[index]);
        }
        String sanitized = value.toString()
            .toLowerCase()
            .replaceAll("[^a-z0-9._-]+", "-")
            .replaceAll("^-+|-+$", "");
        return sanitized.isEmpty() ? "export-" + LocalDateTime.now()
            .format(TIMESTAMP) : sanitized;
    }

    private static void reply(ICommandSender sender, String message) {
        sender.addChatMessage(new ChatComponentText(message));
    }
}
