/**
 * Image Search Utility — TensorFlow.js MobileNet + Color Extraction
 * 100% FREE, runs entirely in the browser
 */

import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';

// ── Singleton model instance ─────────────────────────────────────
let modelInstance: mobilenet.MobileNet | null = null;
let isModelLoading = false;

/**
 * Load MobileNet model (cached after first load)
 */
async function getModel(): Promise<mobilenet.MobileNet> {
    if (modelInstance) return modelInstance;

    if (isModelLoading) {
        // Wait for existing load to finish
        while (isModelLoading) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        return modelInstance!;
    }

    isModelLoading = true;
    try {
        await tf.ready();
        modelInstance = await mobilenet.load({ version: 2, alpha: 1.0 });
        return modelInstance;
    } finally {
        isModelLoading = false;
    }
}

/**
 * Classify an image using MobileNet
 * Returns top predictions with labels and confidence scores
 */
export async function classifyImage(imageElement: HTMLImageElement): Promise<Array<{ label: string; confidence: number }>> {
    const model = await getModel();
    const predictions = await model.classify(imageElement, 10);

    return predictions.map(p => ({
        label: p.className.toLowerCase(),
        confidence: p.probability,
    }));
}

/**
 * Extract dominant colors from an image using Canvas API
 * No AI needed — pure pixel analysis
 */
export function extractDominantColors(imageElement: HTMLImageElement, numColors = 5): Array<{ hex: string; name: string; percentage: number }> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return [];

    // Resize for faster processing
    const size = 100;
    canvas.width = size;
    canvas.height = size;
    ctx.drawImage(imageElement, 0, 0, size, size);

    const imageData = ctx.getImageData(0, 0, size, size);
    const pixels = imageData.data;

    // Simple color quantization using buckets
    const colorBuckets: Record<string, { r: number; g: number; b: number; count: number }> = {};

    for (let i = 0; i < pixels.length; i += 4) {
        const r = Math.round(pixels[i] / 32) * 32;
        const g = Math.round(pixels[i + 1] / 32) * 32;
        const b = Math.round(pixels[i + 2] / 32) * 32;
        const key = `${r},${g},${b}`;

        if (colorBuckets[key]) {
            colorBuckets[key].count++;
        } else {
            colorBuckets[key] = { r, g, b, count: 1 };
        }
    }

    // Sort by frequency and take top N
    const sorted = Object.values(colorBuckets)
        .sort((a, b) => b.count - a.count)
        .slice(0, numColors);

    const totalPixels = size * size;

    return sorted.map(c => {
        const hex = '#' + [c.r, c.g, c.b].map(v => Math.min(255, v).toString(16).padStart(2, '0')).join('');
        return {
            hex,
            name: getColorName(c.r, c.g, c.b),
            percentage: Math.round((c.count / totalPixels) * 100),
        };
    });
}

/**
 * Map RGB to a human-readable color name
 */
function getColorName(r: number, g: number, b: number): string {
    const colors: Array<{ name: string; r: number; g: number; b: number }> = [
        { name: 'red', r: 255, g: 0, b: 0 },
        { name: 'dark red', r: 139, g: 0, b: 0 },
        { name: 'orange', r: 255, g: 165, b: 0 },
        { name: 'yellow', r: 255, g: 255, b: 0 },
        { name: 'green', r: 0, g: 128, b: 0 },
        { name: 'dark green', r: 0, g: 100, b: 0 },
        { name: 'lime', r: 0, g: 255, b: 0 },
        { name: 'blue', r: 0, g: 0, b: 255 },
        { name: 'navy', r: 0, g: 0, b: 128 },
        { name: 'sky blue', r: 135, g: 206, b: 235 },
        { name: 'cyan', r: 0, g: 255, b: 255 },
        { name: 'purple', r: 128, g: 0, b: 128 },
        { name: 'pink', r: 255, g: 192, b: 203 },
        { name: 'magenta', r: 255, g: 0, b: 255 },
        { name: 'brown', r: 139, g: 69, b: 19 },
        { name: 'maroon', r: 128, g: 0, b: 0 },
        { name: 'beige', r: 245, g: 245, b: 220 },
        { name: 'olive', r: 128, g: 128, b: 0 },
        { name: 'teal', r: 0, g: 128, b: 128 },
        { name: 'gold', r: 255, g: 215, b: 0 },
        { name: 'silver', r: 192, g: 192, b: 192 },
        { name: 'gray', r: 128, g: 128, b: 128 },
        { name: 'dark gray', r: 64, g: 64, b: 64 },
        { name: 'light gray', r: 211, g: 211, b: 211 },
        { name: 'white', r: 255, g: 255, b: 255 },
        { name: 'black', r: 0, g: 0, b: 0 },
        { name: 'cream', r: 255, g: 253, b: 208 },
        { name: 'coral', r: 255, g: 127, b: 80 },
        { name: 'turquoise', r: 64, g: 224, b: 208 },
        { name: 'lavender', r: 230, g: 230, b: 250 },
    ];

    let minDistance = Infinity;
    let closestColor = 'unknown';

    for (const color of colors) {
        const distance = Math.sqrt(
            Math.pow(r - color.r, 2) +
            Math.pow(g - color.g, 2) +
            Math.pow(b - color.b, 2)
        );
        if (distance < minDistance) {
            minDistance = distance;
            closestColor = color.name;
        }
    }

    return closestColor;
}

/**
 * Parse MobileNet labels into useful search keywords
 * MobileNet returns labels like "running shoe, sneaker" — we split them
 */
export function parseLabels(predictions: Array<{ label: string; confidence: number }>): string[] {
    const allLabels: string[] = [];

    for (const pred of predictions) {
        if (pred.confidence < 0.05) continue;

        // MobileNet labels can be comma-separated like "laptop, notebook computer"
        const parts = pred.label.split(',').map(s => s.trim().toLowerCase());
        allLabels.push(...parts);
    }

    // Remove duplicates
    return [...new Set(allLabels)];
}

/**
 * Full image analysis pipeline
 * Returns labels, colors, and search keywords
 */
export async function analyzeImage(file: File): Promise<{
    labels: string[];
    predictions: Array<{ label: string; confidence: number }>;
    colors: Array<{ hex: string; name: string; percentage: number }>;
    keywords: string[];
}> {
    // Create image element from file
    const imageUrl = URL.createObjectURL(file);
    const img = new window.Image();
    img.crossOrigin = 'anonymous';

    await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = imageUrl;
    });

    // Run classification and color extraction in parallel
    const [predictions, colors] = await Promise.all([
        classifyImage(img),
        Promise.resolve(extractDominantColors(img)),
    ]);

    // Parse labels
    const labels = parseLabels(predictions);

    // Generate search keywords (labels + color names)
    const colorNames = colors.slice(0, 3).map(c => c.name);
    const keywords = [...labels, ...colorNames];

    // Clean up
    URL.revokeObjectURL(imageUrl);

    return {
        labels,
        predictions,
        colors,
        keywords,
    };
}
