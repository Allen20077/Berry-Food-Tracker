import base64
import json
import os
from typing import Any

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
MODEL = os.getenv("GROQ_VISION_MODEL", "qwen/qwen3.8-27b")
MAX_IMAGE_BYTES = 20 * 1024 * 1024

if not GROQ_API_KEY:
    raise RuntimeError("GROQ_API_KEY is missing. Add it to backend/.env")

client = Groq(api_key=GROQ_API_KEY)
app = FastAPI(title="Berry Food Tracker API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

FOOD_SCHEMA = {
    "type": "object",
    "properties": {
        "meal_name": {"type": "string"},
        "portion_grams": {"type": "number"},
        "foods": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "estimated_grams": {"type": "number"},
                    "confidence": {"type": "number"},
                },
                "required": ["name", "estimated_grams", "confidence"],
                "additionalProperties": False,
            },
        },
        "nutrition": {
            "type": "object",
            "properties": {
                "calories_kcal": {"type": "number"},
                "protein_g": {"type": "number"},
                "carbohydrates_g": {"type": "number"},
                "fat_g": {"type": "number"},
                "fiber_g": {"type": "number"},
                "sugar_g": {"type": "number"},
            },
            "required": [
                "calories_kcal",
                "protein_g",
                "carbohydrates_g",
                "fat_g",
                "fiber_g",
                "sugar_g",
            ],
            "additionalProperties": False,
        },
        "micronutrients": {
            "type": "object",
            "properties": {
                "sodium_mg": {"type": "number"},
                "potassium_mg": {"type": "number"},
                "calcium_mg": {"type": "number"},
                "iron_mg": {"type": "number"},
                "magnesium_mg": {"type": "number"},
                "vitamin_a_ug": {"type": "number"},
                "vitamin_c_mg": {"type": "number"},
                "vitamin_d_ug": {"type": "number"},
                "vitamin_b12_ug": {"type": "number"},
                "folate_ug": {"type": "number"},
            },
            "required": [
                "sodium_mg",
                "potassium_mg",
                "calcium_mg",
                "iron_mg",
                "magnesium_mg",
                "vitamin_a_ug",
                "vitamin_c_mg",
                "vitamin_d_ug",
                "vitamin_b12_ug",
                "folate_ug",
            ],
            "additionalProperties": False,
        },
        "confidence": {
            "type": "object",
            "properties": {
                "food_identification": {"type": "number"},
                "portion_estimation": {"type": "number"},
                "nutrition_estimation": {"type": "number"},
            },
            "required": [
                "food_identification",
                "portion_estimation",
                "nutrition_estimation",
            ],
            "additionalProperties": False,
        },
        "assumptions": {
            "type": "array",
            "items": {"type": "string"},
        },
    },
    "required": [
        "meal_name",
        "portion_grams",
        "foods",
        "nutrition",
        "micronutrients",
        "confidence",
        "assumptions",
    ],
    "additionalProperties": False,
}

PROMPT = """
You are Berry AI, a food and nutrition image analyzer.

Analyze the provided food image carefully. Identify EVERY visible food item that materially contributes to the meal. Estimate the total portion and each component's grams from visual evidence such as plate size, bowl size, utensils, and relative proportions.

Then estimate calories, macronutrients, fiber, sugar, and the listed micronutrients for the visible portion. Do not invent exotic ingredients. If an ingredient cannot be confidently identified, make a conservative assumption and record it in assumptions.

Important:
- All nutrition values are ESTIMATES from an image, not laboratory measurements.
- Use realistic values for the apparent food and portion.
- Confidence values must be between 0 and 1.
- Return ONLY the requested JSON object.
"""


def data_url(content_type: str, raw: bytes) -> str:
    encoded = base64.b64encode(raw).decode("utf-8")
    return f"data:{content_type};base64,{encoded}"


@app.get("/api/health")
def health() -> dict[str, Any]:
    return {"ok": True, "model": MODEL}


@app.post("/api/analyze-food")
async def analyze_food(image: UploadFile = File(...)) -> dict[str, Any]:
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Please upload an image file.")

    raw = await image.read()
    if not raw:
        raise HTTPException(status_code=400, detail="The uploaded image is empty.")
    if len(raw) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="Image is too large. Please use an image under 20 MB.")

    try:
        completion = client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": PROMPT},
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Analyze this meal image and return the nutrition JSON."},
                        {
                            "type": "image_url",
                            "image_url": {"url": data_url(image.content_type, raw)},
                        },
                    ],
                },
            ],
            response_format={
                "type": "json_schema",
                "json_schema": {
                    "name": "berry_food_analysis",
                    "strict": True,
                    "schema": FOOD_SCHEMA,
                },
            },
            temperature=0.2,
        )

        content = completion.choices[0].message.content or "{}"
        result = json.loads(content)
        return {"success": True, "analysis": result}

    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Groq analysis failed: {exc}") from exc
