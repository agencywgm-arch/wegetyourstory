import { createMcpHandler, McpServer } from "@modelcontextprotocol/server";
import * as z from "zod/v4";
import { fal } from "@fal-ai/client";

const MAX_COST = Number(process.env.WGM_MAX_ESTIMATED_COST_USD || "1.50");

function requireFal() {
  const key = process.env.FAL_KEY;
  if (!key) throw new Error("WGM Video is not configured: FAL_KEY is missing.");
  fal.config({ credentials: key });
}

const handler = createMcpHandler(() => {
  const server = new McpServer(
    {
      name: "wgm-video",
      version: "0.1.0",
    },
    {
      instructions: `
WGM Video is a video-generation control layer for fal.ai.
Use it to search/inspect fal models, estimate cost when possible, submit generations, check jobs, and return downloadable result URLs.
Do not claim a video was generated until the fal job/result confirms success.
Prefer image-to-video when the user provides a reference image.
Preserve requested visual continuity constraints literally.
Before an expensive generation, report the selected model, duration/resolution when known, and estimated cost if available.
`,
      capabilities: { tools: {} },
    }
  );

  server.registerTool(
    "wgm_health",
    {
      description: "Check whether WGM Video and fal.ai are configured.",
      inputSchema: z.object({}),
    },
    async () => ({
      content: [{
        type: "text",
        text: JSON.stringify({
          service: "WGM Video",
          falConfigured: Boolean(process.env.FAL_KEY),
          maxEstimatedCostUsd: MAX_COST
        }, null, 2)
      }]
    })
  );

  server.registerTool(
    "wgm_generate_video",
    {
      description:
        "Generate a video with a fal.ai model. modelId must be a valid fal endpoint/model ID. Supports prompt plus optional image URL(s), duration, aspect ratio and resolution when the chosen model accepts them. Returns a job request ID and, when available, result URLs.",
      inputSchema: z.object({
        modelId: z.string().min(1).describe("fal.ai model/endpoint ID"),
        prompt: z.string().min(1),
        imageUrl: z.string().url().optional(),
        imageUrls: z.array(z.string().url()).max(10).optional(),
        duration: z.union([z.string(), z.number()]).optional(),
        aspectRatio: z.string().optional(),
        resolution: z.string().optional(),
        extraInput: z.record(z.string(), z.any()).optional(),
        estimatedCostUsd: z.number().nonnegative().optional(),
      }),
    },
    async (input) => {
      requireFal();

      if (input.estimatedCostUsd && input.estimatedCostUsd > MAX_COST) {
        throw new Error(
          `WGM safety limit: estimated cost $${input.estimatedCostUsd.toFixed(2)} exceeds $${MAX_COST.toFixed(2)}.`
        );
      }

      const payload: Record<string, unknown> = {
        prompt: input.prompt,
        ...(input.extraInput || {}),
      };

      if (input.imageUrl) payload.image_url = input.imageUrl;
      if (input.imageUrls?.length) payload.image_urls = input.imageUrls;
      if (input.duration !== undefined) payload.duration = input.duration;
      if (input.aspectRatio) payload.aspect_ratio = input.aspectRatio;
      if (input.resolution) payload.resolution = input.resolution;

      const result = await fal.queue.submit(input.modelId, { input: payload });

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            service: "WGM Video",
            status: "queued",
            requestId: result.request_id,
            modelId: input.modelId,
            nextStep: "Call wgm_check_video with the same modelId and requestId until status is completed."
          }, null, 2)
        }]
      };
    }
  );

  server.registerTool(
    "wgm_check_video",
    {
      description: "Check a fal.ai video generation job and return the completed result, including downloadable video URL(s), when ready.",
      inputSchema: z.object({
        modelId: z.string().min(1),
        requestId: z.string().min(1),
      }),
    },
    async ({ modelId, requestId }) => {
      requireFal();

      const status = await fal.queue.status(modelId, {
        requestId,
        logs: false,
      });

      const base: Record<string, unknown> = {
        service: "WGM Video",
        modelId,
        requestId,
        status: status.status,
      };

      if (status.status === "COMPLETED") {
        const result: any = await fal.queue.result(modelId, { requestId });
        base.result = result;
      }

      return {
        content: [{
          type: "text",
          text: JSON.stringify(base, null, 2)
        }]
      };
    }
  );

  server.registerTool(
    "wgm_generate_and_wait",
    {
      description:
        "Convenience tool: submit a fal.ai generation and poll until completion. Use for short jobs only. Returns the completed fal result with video URL(s).",
      inputSchema: z.object({
        modelId: z.string().min(1),
        prompt: z.string().min(1),
        imageUrl: z.string().url().optional(),
        duration: z.union([z.string(), z.number()]).optional(),
        aspectRatio: z.string().optional(),
        resolution: z.string().optional(),
        extraInput: z.record(z.string(), z.any()).optional(),
        estimatedCostUsd: z.number().nonnegative().optional(),
      }),
    },
    async (input) => {
      requireFal();

      if (input.estimatedCostUsd && input.estimatedCostUsd > MAX_COST) {
        throw new Error(
          `WGM safety limit: estimated cost $${input.estimatedCostUsd.toFixed(2)} exceeds $${MAX_COST.toFixed(2)}.`
        );
      }

      const payload: Record<string, unknown> = {
        prompt: input.prompt,
        ...(input.extraInput || {}),
      };
      if (input.imageUrl) payload.image_url = input.imageUrl;
      if (input.duration !== undefined) payload.duration = input.duration;
      if (input.aspectRatio) payload.aspect_ratio = input.aspectRatio;
      if (input.resolution) payload.resolution = input.resolution;

      const result: any = await fal.subscribe(input.modelId, {
        input: payload,
        logs: false,
      });

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            service: "WGM Video",
            status: "completed",
            modelId: input.modelId,
            result
          }, null, 2)
        }]
      };
    }
  );

  return server;
});

export async function GET(request: Request) {
  return handler.fetch(request);
}

export async function POST(request: Request) {
  return handler.fetch(request);
}

export async function DELETE(request: Request) {
  return handler.fetch(request);
}