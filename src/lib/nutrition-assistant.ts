import type { AssistantConfidence, ModuleAssistantPreview } from "@/components/module-assistant";

export type NutritionEstimateItem = {
  name: string;
  quantityLabel: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  confidence: AssistantConfidence;
};

export type NutritionAssistantPreview = ModuleAssistantPreview & {
  id: string;
  mealName: string;
  mealType: "Breakfast" | "Lunch" | "Dinner" | "Snack";
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  notes: string;
  assumptions: string[];
  items: NutritionEstimateItem[];
  rawRequest: string;
};

type FoodEntry = {
  name: string;
  aliases: string[];
  serving: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  defaultQuantity?: number;
  defaultUnit?: string;
  defaultGrams?: number;
  per100g?: boolean;
  confidence?: AssistantConfidence;
  assumption?: string;
};

const foodMap: FoodEntry[] = [
  { name: "Chicken shawarma bowl", aliases: ["chicken shawarma bowl", "shawarma bowl"], serving: "1 bowl", calories: 700, protein: 38, carbs: 75, fats: 24, confidence: "low", assumption: "Assumed a restaurant-size bowl with chicken, rice, sauce, and vegetables." },
  { name: "Turkey sandwich", aliases: ["turkey sandwich"], serving: "1 sandwich", calories: 350, protein: 28, carbs: 40, fats: 8, confidence: "medium", assumption: "Assumed one standard turkey sandwich with bread, turkey, and light condiments." },
  { name: "Protein shake", aliases: ["protein shake", "shake"], serving: "1 shake", calories: 160, protein: 25, carbs: 7, fats: 3, confidence: "medium", assumption: "Assumed one scoop of protein powder mixed as a basic shake." },
  { name: "Greek yogurt", aliases: ["greek yogurt", "yogurt"], serving: "1 serving", calories: 130, protein: 17, carbs: 7, fats: 4, confidence: "medium", assumption: "Assumed one 150g serving of Greek yogurt." },
  { name: "Chicken breast", aliases: ["chicken breast", "grilled chicken", "chicken"], serving: "100g", calories: 165, protein: 31, carbs: 0, fats: 3.6, defaultGrams: 150, per100g: true, assumption: "Assumed cooked lean chicken breast." },
  { name: "Rice", aliases: ["rice"], serving: "1 cup cooked", calories: 205, protein: 4, carbs: 45, fats: 0.4, defaultQuantity: 1, defaultUnit: "cup", assumption: "Assumed one cup of cooked rice." },
  { name: "Pasta", aliases: ["pasta"], serving: "1 cup cooked", calories: 220, protein: 8, carbs: 43, fats: 1, defaultQuantity: 1, defaultUnit: "cup", assumption: "Assumed one cup of cooked pasta." },
  { name: "Pizza slice", aliases: ["pizza slice", "pizza"], serving: "1 slice", calories: 285, protein: 12, carbs: 36, fats: 10, defaultUnit: "slice", assumption: "Assumed one average slice of regular cheese or mixed-topping pizza." },
  { name: "Egg", aliases: ["eggs", "egg"], serving: "1 egg", calories: 72, protein: 6, carbs: 0.4, fats: 5, defaultUnit: "egg" },
  { name: "Toast", aliases: ["toast", "slice of toast", "slices of toast"], serving: "1 slice", calories: 80, protein: 3, carbs: 15, fats: 1, defaultUnit: "slice" },
  { name: "Banana", aliases: ["banana", "bananas"], serving: "1 medium banana", calories: 105, protein: 1.3, carbs: 27, fats: 0.4, defaultUnit: "banana" },
  { name: "Milk", aliases: ["milk"], serving: "1 cup", calories: 122, protein: 8, carbs: 12, fats: 5, defaultQuantity: 1, defaultUnit: "cup", assumption: "Assumed one cup of 2% milk." },
  { name: "Peanut butter", aliases: ["peanut butter"], serving: "1 tbsp", calories: 95, protein: 4, carbs: 3, fats: 8, defaultQuantity: 1, defaultUnit: "tbsp", assumption: "Assumed one tablespoon of peanut butter." },
  { name: "Oatmeal", aliases: ["oatmeal", "oats"], serving: "1 cup cooked", calories: 154, protein: 6, carbs: 27, fats: 3, defaultQuantity: 1, defaultUnit: "cup", assumption: "Assumed one cup of cooked oatmeal." },
  { name: "Berries", aliases: ["berries", "berry"], serving: "1 cup", calories: 70, protein: 1, carbs: 17, fats: 0.5, defaultQuantity: 1, defaultUnit: "cup", assumption: "Assumed one cup of mixed berries." },
  { name: "Salad", aliases: ["salad"], serving: "1 bowl", calories: 250, protein: 8, carbs: 18, fats: 16, confidence: "low", assumption: "Assumed a mixed salad with dressing; toppings can change macros substantially." },
  { name: "Apple", aliases: ["apple", "apples"], serving: "1 medium apple", calories: 95, protein: 0.5, carbs: 25, fats: 0.3, defaultUnit: "apple" },
  { name: "Potatoes", aliases: ["potatoes", "potato"], serving: "100g", calories: 87, protein: 2, carbs: 20, fats: 0.1, defaultGrams: 200, per100g: true, assumption: "Assumed plain cooked potatoes." },
  { name: "Beef", aliases: ["beef", "steak"], serving: "100g", calories: 250, protein: 26, carbs: 0, fats: 15, defaultGrams: 150, per100g: true, confidence: "medium", assumption: "Assumed cooked beef; fat content varies by cut." },
  { name: "Salmon", aliases: ["salmon"], serving: "100g", calories: 208, protein: 20, carbs: 0, fats: 13, defaultGrams: 150, per100g: true },
  { name: "Tuna", aliases: ["tuna"], serving: "1 can", calories: 120, protein: 26, carbs: 0, fats: 1, defaultQuantity: 1, defaultUnit: "can", assumption: "Assumed one drained can of tuna in water." },
  { name: "Cheese", aliases: ["cheese"], serving: "1 oz", calories: 113, protein: 7, carbs: 1, fats: 9, defaultQuantity: 1, defaultUnit: "oz", assumption: "Assumed one ounce or one slice of cheese." }
];

const unitWords = [
  "g",
  "gram",
  "grams",
  "slice",
  "slices",
  "cup",
  "cups",
  "tbsp",
  "tablespoon",
  "tablespoons",
  "can",
  "cans",
  "bowl",
  "bowls",
  "sandwich",
  "sandwiches",
  "shake",
  "shakes",
  "serving",
  "servings"
];

const fillerWords = new Set([
  "i",
  "had",
  "ate",
  "add",
  "log",
  "estimate",
  "calories",
  "protein",
  "for",
  "this",
  "meal",
  "today",
  "with",
  "and",
  "a",
  "an",
  "of",
  "the",
  "breakfast",
  "lunch",
  "dinner",
  "snack",
  "grilled",
  "cooked",
  "plain",
  "my"
]);

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeInput(value: string) {
  return value.toLowerCase().replace(/[.,!?;:()]/g, " ").replace(/\s+/g, " ").trim();
}

function inferMealType(value: string, now: Date): NutritionAssistantPreview["mealType"] {
  const normalized = normalizeInput(value);
  if (/\bbreakfast\b/.test(normalized)) return "Breakfast";
  if (/\blunch\b/.test(normalized)) return "Lunch";
  if (/\bdinner\b/.test(normalized)) return "Dinner";
  if (/\bsnack\b/.test(normalized)) return "Snack";
  const hour = now.getHours();
  if (hour < 11) return "Breakfast";
  if (hour < 16) return "Lunch";
  if (hour < 21) return "Dinner";
  return "Snack";
}

function cleanMealName(value: string) {
  const cleaned = value
    .replace(/^\s*(i\s+)?(had|ate|add|log|estimate calories and protein for|estimate calories for)\s+/i, "")
    .replace(/^\s*(breakfast|lunch|dinner|snack)\s*:\s*/i, "")
    .trim();
  return cleaned ? cleaned[0].toUpperCase() + cleaned.slice(1) : "Assistant meal estimate";
}

function rangesOverlap(a: [number, number], b: [number, number]) {
  return a[0] < b[1] && b[0] < a[1];
}

function scaleEntry(entry: FoodEntry, quantity?: number, unit?: string): NutritionEstimateItem {
  const normalizedUnit = unit?.toLowerCase();
  let factor = 1;
  let quantityLabel = entry.serving;

  if (normalizedUnit && ["g", "gram", "grams"].includes(normalizedUnit)) {
    const grams = quantity ?? entry.defaultGrams ?? 100;
    factor = entry.per100g ? grams / 100 : grams / (entry.defaultGrams ?? 100);
    quantityLabel = `${Math.round(grams)}g`;
  } else if (quantity) {
    factor = quantity;
    quantityLabel = formatQuantityLabel(quantity, normalizedUnit ?? entry.defaultUnit ?? "serving");
  } else if (entry.defaultGrams && entry.per100g) {
    factor = entry.defaultGrams / 100;
    quantityLabel = `${entry.defaultGrams}g`;
  } else if (entry.defaultQuantity && entry.defaultUnit) {
    factor = entry.defaultQuantity;
    quantityLabel = `${entry.defaultQuantity} ${entry.defaultUnit}`;
  }

  return {
    name: entry.name,
    quantityLabel,
    calories: Math.round(entry.calories * factor),
    protein: roundMacro(entry.protein * factor),
    carbs: roundMacro(entry.carbs * factor),
    fats: roundMacro(entry.fats * factor),
    confidence: entry.confidence ?? (quantity || entry.defaultQuantity || entry.defaultGrams ? "medium" : "high")
  };
}

function roundMacro(value: number) {
  return Math.round(value * 10) / 10;
}

function formatQuantityLabel(quantity: number, unit: string) {
  const displayQuantity = Number.isInteger(quantity) ? Math.round(quantity) : quantity;
  const pluralUnit =
    quantity === 1 || unit.endsWith("s") || ["g", "tbsp", "oz"].includes(unit)
      ? unit
      : `${unit}s`;
  return `${displayQuantity} ${pluralUnit}`;
}

function combinedConfidence(items: NutritionEstimateItem[], unknownUsed: boolean): AssistantConfidence {
  if (unknownUsed || items.some((item) => item.confidence === "low")) return "low";
  if (items.some((item) => item.confidence === "medium")) return "medium";
  return "high";
}

function findFoodItems(request: string) {
  const normalized = normalizeInput(request);
  const occupied: Array<[number, number]> = [];
  const items: NutritionEstimateItem[] = [];
  const assumptions: string[] = [];

  for (const entry of foodMap) {
    for (const alias of entry.aliases) {
      const escapedAlias = escapeRegExp(alias);
      const patterns = [
        {
          regex: new RegExp(`(\\d+(?:\\.\\d+)?)\\s*(${unitWords.join("|")})\\s*(?:of\\s+)?(?:[a-z]+\\s+){0,2}?\\b${escapedAlias}\\b`, "gi"),
          quantityIndex: 1,
          unitIndex: 2
        },
        {
          regex: new RegExp(`(\\d+(?:\\.\\d+)?)\\s+\\b${escapedAlias}\\b`, "gi"),
          quantityIndex: 1
        },
        {
          regex: new RegExp(`\\b${escapedAlias}\\b`, "gi")
        }
      ];

      for (const pattern of patterns) {
        for (const match of normalized.matchAll(pattern.regex)) {
          const index = match.index ?? 0;
          const range: [number, number] = [index, index + match[0].length];
          if (occupied.some((item) => rangesOverlap(item, range))) continue;
          const quantity = Number(pattern.quantityIndex ? match[pattern.quantityIndex] : "");
          const unit = pattern.unitIndex ? match[pattern.unitIndex] : undefined;
          const estimate = scaleEntry(entry, Number.isFinite(quantity) && quantity > 0 ? quantity : undefined, unit);
          items.push(estimate);
          occupied.push(range);
          if (!quantity || entry.assumption || estimate.confidence !== "high") {
            assumptions.push(entry.assumption ?? `Assumed ${estimate.quantityLabel} for ${entry.name.toLowerCase()}.`);
          }
        }
      }
    }
  }

  return { items, assumptions };
}

function hasMostlyUnknownFood(request: string, knownItems: NutritionEstimateItem[]) {
  if (!request.trim()) return false;
  if (!knownItems.length) return true;
  const cleaned = normalizeInput(request)
    .split(" ")
    .filter((word) => !fillerWords.has(word))
    .filter((word) => !unitWords.includes(word))
    .filter((word) => !/^\d+(\.\d+)?g?$/.test(word))
    .filter((word) => !foodMap.some((entry) => entry.aliases.some((alias) => alias.split(" ").includes(word))));

  return cleaned.length >= 3;
}

export function parseNutritionAssistantRequest(request: string, now = new Date()): NutritionAssistantPreview {
  const trimmed = request.trim();
  const { items: knownItems, assumptions } = findFoodItems(trimmed);
  const warnings: string[] = [
    "Nutrition numbers are estimates, not exact measurements."
  ];
  const items = [...knownItems];
  const unknownUsed = hasMostlyUnknownFood(trimmed, knownItems);

  if (!trimmed) {
    warnings.push("Add a meal description before previewing.");
  }

  if (unknownUsed) {
    items.push({
      name: knownItems.length ? "Unrecognized add-on" : "Rough meal estimate",
      quantityLabel: "editable estimate",
      calories: knownItems.length ? 150 : 450,
      protein: knownItems.length ? 5 : 25,
      carbs: knownItems.length ? 20 : 50,
      fats: knownItems.length ? 5 : 15,
      confidence: "low"
    });
    assumptions.push(
      knownItems.length
        ? "Some food details were not in the built-in estimate map, so a small editable add-on was included."
        : "Food was not recognized in the built-in estimate map, so a rough editable meal estimate was created."
    );
    warnings.push("Estimate confidence is low because at least one food or serving size was unclear.");
  }

  if (!items.length) {
    items.push({
      name: "Rough meal estimate",
      quantityLabel: "editable estimate",
      calories: 450,
      protein: 25,
      carbs: 50,
      fats: 15,
      confidence: "low"
    });
    assumptions.push("No specific food was recognized, so this is a rough editable meal estimate.");
    warnings.push("Add more detail for a better estimate, such as serving size, grams, cups, or item count.");
  }

  const calories = Math.round(items.reduce((total, item) => total + item.calories, 0));
  const protein = roundMacro(items.reduce((total, item) => total + item.protein, 0));
  const carbs = roundMacro(items.reduce((total, item) => total + item.carbs, 0));
  const fats = roundMacro(items.reduce((total, item) => total + item.fats, 0));
  const confidence = combinedConfidence(items, unknownUsed);
  if (confidence === "low" && !warnings.some((warning) => warning.includes("confidence is low"))) {
    warnings.push("Estimate confidence is low because the food or serving size can vary substantially.");
  }
  const mealName = cleanMealName(trimmed);

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    title: "Nutrition estimate preview",
    summary: "Review and edit these estimated macros before saving to today's log.",
    confidence,
    warnings,
    mealName,
    mealType: inferMealType(trimmed, now),
    calories,
    protein,
    carbs,
    fats,
    notes: [
      `Assistant estimate from: "${trimmed || "No meal description"}"`,
      assumptions.length ? `Assumptions: ${Array.from(new Set(assumptions)).join(" ")}` : undefined
    ].filter(Boolean).join("\n"),
    assumptions: Array.from(new Set(assumptions)),
    items,
    rawRequest: trimmed
  };
}
