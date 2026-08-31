package dev.fopwoc.ae2iconexporter.export;

import net.minecraft.client.gui.GuiScreen;
import net.minecraft.util.ChatComponentText;
import net.minecraft.util.EnumChatFormatting;

public final class IconExportScreen extends GuiScreen {

    private static final int BATCH_SIZE = 16;

    private final IconExportJob job;
    private boolean reported;

    public IconExportScreen(IconExportJob job) {
        this.job = job;
    }

    @Override
    public void drawScreen(int mouseX, int mouseY, float partialTicks) {
        drawDefaultBackground();
        if (!job.complete()) {
            job.runBatch(BATCH_SIZE);
        }

        drawCenteredString(fontRendererObj, "Exporting GTNH resource icons", width / 2, height / 2 - 18, 0xffffff);
        drawCenteredString(
            fontRendererObj,
            job.processed() + " / " + job.total() + "  ·  " + job.failureCount() + " skipped",
            width / 2,
            height / 2 + 2,
            0xa8b3c7);
        drawCenteredString(
            fontRendererObj,
            "Keep this screen open until the export finishes.",
            width / 2,
            height / 2 + 24,
            0x73809a);

        if (job.complete() && !reported) {
            reported = true;
            reportCompletion();
            mc.displayGuiScreen(null);
        }
    }

    @Override
    protected void keyTyped(char character, int keyCode) {}

    @Override
    public boolean doesGuiPauseGame() {
        return false;
    }

    private void reportCompletion() {
        if (job.fatalError() == null) {
            mc.thePlayer.addChatMessage(
                new ChatComponentText(
                    EnumChatFormatting.GREEN + "Icon export complete: "
                        + job.outputDirectory()
                            .toAbsolutePath()
                        + " ("
                        + job.failureCount()
                        + " skipped)"));
        } else {
            mc.thePlayer.addChatMessage(
                new ChatComponentText(EnumChatFormatting.RED + "Icon export failed: " + job.fatalError()));
        }
    }
}
