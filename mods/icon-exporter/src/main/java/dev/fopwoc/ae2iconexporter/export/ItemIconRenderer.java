package dev.fopwoc.ae2iconexporter.export;

import java.awt.image.BufferedImage;
import java.nio.ByteBuffer;

import net.minecraft.client.Minecraft;
import net.minecraft.client.gui.FontRenderer;
import net.minecraft.client.renderer.RenderBlocks;
import net.minecraft.client.renderer.RenderHelper;
import net.minecraft.client.renderer.entity.RenderItem;
import net.minecraft.client.shader.Framebuffer;
import net.minecraft.item.ItemStack;
import net.minecraftforge.client.ForgeHooksClient;

import org.lwjgl.BufferUtils;
import org.lwjgl.opengl.GL11;
import org.lwjgl.opengl.GL12;

final class ItemIconRenderer {

    static final int ICON_SIZE = 64;
    private static final int CANVAS_SIZE = 32;
    private static final int ITEM_SIZE = 16;
    private static final RenderBlocks RENDER_BLOCKS = new RenderBlocks();
    private static final RenderItem RENDER_ITEM = new RenderItem();

    BufferedImage render(ItemStack source) {
        Minecraft minecraft = Minecraft.getMinecraft();
        ItemStack stack = source.copy();
        stack.stackSize = 1;
        Framebuffer framebuffer = new Framebuffer(ICON_SIZE, ICON_SIZE, true);
        ByteBuffer pixels;
        boolean projectionPushed = false;
        boolean modelViewPushed = false;

        try {
            framebuffer.bindFramebuffer(true);
            GL11.glViewport(0, 0, ICON_SIZE, ICON_SIZE);
            GL11.glClearColor(0.0F, 0.0F, 0.0F, 0.0F);
            GL11.glClear(GL11.GL_COLOR_BUFFER_BIT | GL11.GL_DEPTH_BUFFER_BIT);

            GL11.glMatrixMode(GL11.GL_PROJECTION);
            GL11.glPushMatrix();
            projectionPushed = true;
            GL11.glLoadIdentity();
            GL11.glOrtho(0.0D, CANVAS_SIZE, CANVAS_SIZE, 0.0D, 1000.0D, 3000.0D);

            GL11.glMatrixMode(GL11.GL_MODELVIEW);
            GL11.glPushMatrix();
            modelViewPushed = true;
            GL11.glLoadIdentity();
            GL11.glTranslatef(0.0F, 0.0F, -2000.0F);

            RenderHelper.enableGUIStandardItemLighting();
            GL11.glEnable(GL12.GL_RESCALE_NORMAL);
            int position = (CANVAS_SIZE - ITEM_SIZE) / 2;
            if (!ForgeHooksClient.renderInventoryItem(
                RENDER_BLOCKS,
                minecraft.getTextureManager(),
                stack,
                true,
                0.0F,
                position,
                position)) {
                FontRenderer font = stack.getItem()
                    .getFontRenderer(stack);
                RENDER_ITEM.renderItemIntoGUI(
                    font == null ? minecraft.fontRenderer : font,
                    minecraft.getTextureManager(),
                    stack,
                    position,
                    position);
            }

            GL11.glFlush();
            pixels = BufferUtils.createByteBuffer(ICON_SIZE * ICON_SIZE * 4);
            GL11.glReadPixels(0, 0, ICON_SIZE, ICON_SIZE, GL11.GL_RGBA, GL11.GL_UNSIGNED_BYTE, pixels);
        } finally {
            RenderHelper.disableStandardItemLighting();
            GL11.glDisable(GL12.GL_RESCALE_NORMAL);
            if (modelViewPushed) {
                GL11.glMatrixMode(GL11.GL_MODELVIEW);
                GL11.glPopMatrix();
            }
            if (projectionPushed) {
                GL11.glMatrixMode(GL11.GL_PROJECTION);
                GL11.glPopMatrix();
            }
            GL11.glMatrixMode(GL11.GL_MODELVIEW);
            framebuffer.unbindFramebuffer();
            framebuffer.deleteFramebuffer();
            minecraft.getFramebuffer()
                .bindFramebuffer(true);
            GL11.glViewport(0, 0, minecraft.displayWidth, minecraft.displayHeight);
        }

        return toImage(pixels);
    }

    static BufferedImage toImage(ByteBuffer pixels) {
        BufferedImage image = new BufferedImage(ICON_SIZE, ICON_SIZE, BufferedImage.TYPE_INT_ARGB);
        for (int y = 0; y < ICON_SIZE; y++) {
            for (int x = 0; x < ICON_SIZE; x++) {
                int source = (x + (ICON_SIZE - y - 1) * ICON_SIZE) * 4;
                int red = pixels.get(source) & 0xff;
                int green = pixels.get(source + 1) & 0xff;
                int blue = pixels.get(source + 2) & 0xff;
                int alpha = pixels.get(source + 3) & 0xff;
                image.setRGB(x, y, alpha << 24 | red << 16 | green << 8 | blue);
            }
        }
        return image;
    }
}
