from fastapi import APIRouter, File, UploadFile, HTTPException, Depends
from pydantic import BaseModel
import shutil
import os
import tempfile

# Import ML services
from app.services.ml.nlp_pipeline import create_need_card
from app.services.ml.ocr import process_file_to_need_card
from app.services.ml.prediction import generate_prediction_report

router = APIRouter(prefix="/ml", tags=["Machine Learning"])


class TextPayload(BaseModel):
    text: str
    source: str = "text"


@router.post("/analyze-text")
async def analyze_text(payload: TextPayload):
    """
    Analyzes raw text using NLP and extracts Need Type, Location, Quantity, and Urgency.
    """
    try:
        need_card = create_need_card(payload.text, source=payload.source)
        return {"success": True, "data": need_card}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload-media")
async def upload_media(file: UploadFile = File(...)):
    """
    Processes an uploaded image or audio file using OCR or Whisper.
    Extracts text and then analyzes it to create a Need Card.
    """
    try:
        # Create a temporary file to store the upload
        ext = os.path.splitext(file.filename)[1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as temp_file:
            shutil.copyfileobj(file.file, temp_file)
            temp_path = temp_file.name

        # Process the file
        result = process_file_to_need_card(file_path=temp_path)

        # Cleanup
        os.remove(temp_path)

        if "error" in result and result["error"]:
            raise HTTPException(status_code=400, detail=result["error"])

        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/predict")
async def predict_needs():
    """
    Generates a prediction report showing future needs and crisis zones.
    Currently uses simulated historical data.
    """
    try:
        report = generate_prediction_report()
        return {"success": True, "data": report}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
