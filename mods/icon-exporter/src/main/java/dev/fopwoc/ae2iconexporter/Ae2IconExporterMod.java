package dev.fopwoc.ae2iconexporter;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import cpw.mods.fml.common.Mod;
import cpw.mods.fml.common.SidedProxy;
import cpw.mods.fml.common.event.FMLInitializationEvent;
import dev.fopwoc.ae2iconexporter.proxy.CommonProxy;

@Mod(
    modid = Ae2IconExporterMod.MOD_ID,
    version = Tags.VERSION,
    name = "AE2 Icon Exporter",
    acceptedMinecraftVersions = "[1.7.10]",
    acceptableRemoteVersions = "*",
    dependencies = "required-after:NotEnoughItems")
public final class Ae2IconExporterMod {

    public static final String MOD_ID = "ae2iconexporter";
    public static final Logger LOG = LogManager.getLogger(MOD_ID);

    @SidedProxy(
        clientSide = "dev.fopwoc.ae2iconexporter.proxy.ClientProxy",
        serverSide = "dev.fopwoc.ae2iconexporter.proxy.CommonProxy")
    public static CommonProxy proxy;

    @Mod.EventHandler
    public void init(FMLInitializationEvent event) {
        proxy.init(event);
    }
}
