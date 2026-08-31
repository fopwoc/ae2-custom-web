package dev.fopwoc.ae2iconexporter.proxy;

import net.minecraftforge.client.ClientCommandHandler;

import cpw.mods.fml.common.event.FMLInitializationEvent;
import dev.fopwoc.ae2iconexporter.Ae2IconExporterMod;
import dev.fopwoc.ae2iconexporter.command.ExportIconsCommand;

public final class ClientProxy extends CommonProxy {

    @Override
    public void init(FMLInitializationEvent event) {
        ClientCommandHandler.instance.registerCommand(new ExportIconsCommand());
        Ae2IconExporterMod.LOG.info("Registered /exporticons client command");
    }
}
