import base64
import json
import os
from typing import Any

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from dotenv import load_dotenv
from groq import Groq
from datetime import datetime
from supabase import create_client, Client

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
MODEL = os.getenv("GROQ_VISION_MODEL", "qwen/qwen3.8-27b")
MAX_IMAGE_BYTES = 20 * 1024 * 1024

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SECRET_KEY = os.getenv("SUPABASE_SECRET_KEY")
SUPABASE_BUCKET = os.getenv("SUPABASE_BUCKET", "berry-food-images")

supabase: Client | None = None


def get_supabase() -> Client:
    global supabase

    if supabase is None:
        if not SUPABASE_URL:
            raise HTTPException(
                status_code=500,
                detail="SUPABASE_URL is missing."
            )

        if not SUPABASE_SECRET_KEY:
            raise HTTPException(
                status_code=500,
                detail="SUPABASE_SECRET_KEY is missing."
            )

        supabase = create_client(
            SUPABASE_URL,
            SUPABASE_SECRET_KEY
        )

    return supabase

if not GROQ_API_KEY:
    raise RuntimeError("GROQ_API_KEY is missing. Add it to backend/.env")

client = Groq(api_key=GROQ_API_KEY)
app = FastAPI(title="Berry Food Tracker API", version="1.0.0")
BASE_DIR = Path(__file__).resolve().parent.parent
WWW_DIR = BASE_DIR / "www"

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
You are Berry AI, a food nutrition analyzer.

Analyze the food image and return ONE JSON object.

YOU MUST ALWAYS RETURN ALL 7 TOP-LEVEL FIELDS:
- meal_name
- portion_grams
- foods
- nutrition
- micronutrients
- confidence
- assumptions

NEVER omit any of these fields.

Required format:

meal_name: string
portion_grams: number

foods: array of food objects. Each food object MUST contain:
- name
- estimated_grams
- confidence

nutrition MUST contain:
- calories_kcal
- protein_g
- carbohydrates_g
- fat_g
- fiber_g
- sugar_g

micronutrients MUST contain:
- sodium_mg
- potassium_mg
- calcium_mg
- iron_mg
- magnesium_mg
- vitamin_a_ug
- vitamin_c_mg
- vitamin_d_ug
- vitamin_b12_ug
- folate_ug

confidence MUST contain:
- food_identification
- portion_estimation
- nutrition_estimation

assumptions MUST be an array of short strings.

IMPORTANT RULES:
1. Every required field must be present.
2. Never leave out nutrition or micronutrients.
3. If something is uncertain, estimate it conservatively.
4. Do not write long explanations.
5. Keep assumptions to a maximum of 3 short items.
6. Identify only foods that materially contribute to the meal.
7. Confidence values must be between 0 and 1.
8. All nutrition values are estimates from the image.
9. Return ONLY valid JSON.
10. Do not use markdown.
11. Do not add any text before or after the JSON.

The most important requirement is that the JSON must contain ALL required fields.
"""

def data_url(content_type: str, raw: bytes) -> str:
    encoded = base64.b64encode(raw).decode("utf-8")
    return f"data:{content_type};base64,{encoded}"


@app.get("/api/health")
def health() -> dict[str, Any]:
    return {"ok": True, "model": MODEL}


@app.post("/api/analyze-food")
async def analyze_food(
    image: UploadFile = File(...),
    meal_type: str = Form("Meal")
) -> dict[str, Any]:
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
max_completion_tokens=900,
temperature=0.2,
        )

        content = completion.choices[0].message.content or "{}"
        result = json.loads(content)
        now = datetime.now()

        date_folder = now.strftime("%Y-%m-%d")

        safe_meal_type = "".join(
            c if c.isalnum() or c in "-_" else "_"
            for c in meal_type.strip()
        )

        if not safe_meal_type:
            safe_meal_type = "Meal"

        timestamp = now.strftime("%H-%M-%S-%f")

        extension_map = {
            "image/jpeg": "jpg",
            "image/jpg": "jpg",
            "image/png": "png",
            "image/webp": "webp",
            "image/heic": "heic",
            "image/heif": "heif",
        }

        extension = extension_map.get(
            image.content_type.lower(),
            "jpg"
        )

        image_path = (
            f"{date_folder}/"
            f"{safe_meal_type}/"
            f"{timestamp}.{extension}"
        )

        analysis_path = (
            f"{date_folder}/"
            f"{safe_meal_type}/"
            f"{timestamp}.json"
        )

        storage = get_supabase()

        storage.storage.from_(SUPABASE_BUCKET).upload(
            image_path,
            raw,
            file_options={
                "content-type": image.content_type,
                "cache-control": "31536000",
                "upsert": False,
            },
        )

        record = {
            "date": date_folder,
            "meal_type": meal_type,
            "created_at": now.isoformat(),
            "image_file": image_path,
            "analysis": result,
        }

        storage.storage.from_(SUPABASE_BUCKET).upload(
            analysis_path,
            json.dumps(
                record,
                ensure_ascii=False,
                indent=2
            ).encode("utf-8"),
            file_options={
                "content-type": "application/json",
                "cache-control": "31536000",
                "upsert": False,
            },
        )

        return {
            "success": True,
            "analysis": result,
            "storage": {
                "bucket": SUPABASE_BUCKET,
                "date": date_folder,
                "meal_type": meal_type,
                "image_file": image_path,
                "analysis_file": analysis_path,
            },
        }
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Groq analysis failed: {exc}") from exc

# =====================================================
# SERVE FRONTEND
# =====================================================

app.mount(
    "/",
    StaticFiles(
        directory=WWW_DIR,
        html=True
    ),
    name="frontend"
)