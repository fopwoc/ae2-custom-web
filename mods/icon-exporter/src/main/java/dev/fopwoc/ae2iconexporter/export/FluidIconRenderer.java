package dev.fopwoc.ae2iconexporter.export;

import java.awt.image.BufferedImage;
import java.nio.ByteBuffer;

import net.minecraft.client.Minecraft;
import net.minecraft.client.renderer.Tessellator;
import net.minecraft.client.renderer.texture.TextureMap;
import net.minecraft.client.shader.Framebuffer;
import net.minecraft.util.IIcon;
import net.minecraftforge.fluids.Fluid;
import net.minecraftforge.fluids.FluidStack;

import org.lwjgl.BufferUtils;
import org.lwjgl.opengl.GL11;

final class FluidIconRenderer {

    BufferedImage render(Fluid fluid) {
        Minecraft minecraft = Minecraft.getMinecraft();
        FluidStack stack = new FluidStack(fluid, 1000);
        IIcon icon = fluid.getIcon(stack);
        if (icon == null) {
            throw new IllegalArgumentException("Fluid has no stitched texture");
        }

        Framebuffer framebuffer = new Framebuffer(ItemIconRenderer.ICON_SIZE, ItemIconRenderer.ICON_SIZE, true);
        ByteBuffer pixels;
        boolean attributesPushed = false;
        boolean projectionPushed = false;
        boolean modelViewPushed = false;

        try {
            framebuffer.bindFramebuffer(true);
            GL11.glPushAttrib(GL11.GL_ALL_ATTRIB_BITS);
            attributesPushed = true;
            GL11.glViewport(0, 0, ItemIconRenderer.ICON_SIZE, ItemIconRenderer.ICON_SIZE);
            GL11.glClearColor(0.0F, 0.0F, 0.0F, 0.0F);
            GL11.glClear(GL11.GL_COLOR_BUFFER_BIT | GL11.GL_DEPTH_BUFFER_BIT);

            GL11.glMatrixMode(GL11.GL_PROJECTION);
            GL11.glPushMatrix();
            projectionPushed = true;
            GL11.glLoadIdentity();
            GL11.glOrtho(0.0D, ItemIconRenderer.ICON_SIZE, ItemIconRenderer.ICON_SIZE, 0.0D, -1.0D, 1.0D);

            GL11.glMatrixMode(GL11.GL_MODELVIEW);
            GL11.glPushMatrix();
            modelViewPushed = true;
            GL11.glLoadIdentity();

            minecraft.getTextureManager()
                .bindTexture(TextureMap.locationBlocksTexture);
            GL11.glDisable(GL11.GL_LIGHTING);
            GL11.glDisable(GL11.GL_DEPTH_TEST);
            GL11.glEnable(GL11.GL_BLEND);
            GL11.glBlendFunc(GL11.GL_SRC_ALPHA, GL11.GL_ONE_MINUS_SRC_ALPHA);

            int color = fluid.getColor(stack);
            int alpha = color >>> 24 & 0xff;
            if (alpha == 0) {
                alpha = 0xff;
            }
            GL11.glColor4f(
                (color >> 16 & 0xff) / 255.0F,
                (color >> 8 & 0xff) / 255.0F,
                (color & 0xff) / 255.0F,
                alpha / 255.0F);

            Tessellator tessellator = Tessellator.instance;
            tessellator.startDrawingQuads();
            tessellator.addVertexWithUV(0.0D, ItemIconRenderer.ICON_SIZE, 0.0D, icon.getMinU(), icon.getMaxV());
            tessellator.addVertexWithUV(
                ItemIconRenderer.ICON_SIZE,
                ItemIconRenderer.ICON_SIZE,
                0.0D,
                icon.getMaxU(),
                icon.getMaxV());
            tessellator.addVertexWithUV(ItemIconRenderer.ICON_SIZE, 0.0D, 0.0D, icon.getMaxU(), icon.getMinV());
            tessellator.addVertexWithUV(0.0D, 0.0D, 0.0D, icon.getMinU(), icon.getMinV());
            tessellator.draw();

            GL11.glFlush();
            pixels = BufferUtils.createByteBuffer(ItemIconRenderer.ICON_SIZE * ItemIconRenderer.ICON_SIZE * 4);
            GL11.glReadPixels(
                0,
                0,
                ItemIconRenderer.ICON_SIZE,
                ItemIconRenderer.ICON_SIZE,
                GL11.GL_RGBA,
                GL11.GL_UNSIGNED_BYTE,
                pixels);
        } finally {
            if (modelViewPushed) {
                GL11.glMatrixMode(GL11.GL_MODELVIEW);
                GL11.glPopMatrix();
            }
            if (projectionPushed) {
                GL11.glMatrixMode(GL11.GL_PROJECTION);
                GL11.glPopMatrix();
            }
            if (attributesPushed) {
                GL11.glPopAttrib();
            }
            GL11.glMatrixMode(GL11.GL_MODELVIEW);
            framebuffer.unbindFramebuffer();
            framebuffer.deleteFramebuffer();
            minecraft.getFramebuffer()
                .bindFramebuffer(true);
            GL11.glViewport(0, 0, minecraft.displayWidth, minecraft.displayHeight);
        }

        return ItemIconRenderer.toImage(pixels);
    }
}
