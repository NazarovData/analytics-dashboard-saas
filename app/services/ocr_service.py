"""
OCR Service for extracting text from images and PDFs
Поддержка распознавания текста из фотографий тетрадей
"""
import logging
import os
import tempfile
from typing import Optional, Tuple
from PIL import Image
import numpy as np

logger = logging.getLogger(__name__)

# Try to import OCR libraries
try:
    import pytesseract
    TESSERACT_AVAILABLE = True
except ImportError:
    TESSERACT_AVAILABLE = False
    logger.warning("pytesseract not available. Install with: pip install pytesseract")

try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False
    logger.warning("opencv-python not available. Install with: pip install opencv-python")

try:
    from pdf2image import convert_from_path, convert_from_bytes
    PDF2IMAGE_AVAILABLE = True
except ImportError:
    PDF2IMAGE_AVAILABLE = False
    logger.warning("pdf2image not available. Install with: pip install pdf2image")

try:
    import easyocr
    EASYOCR_AVAILABLE = True
    # Initialize EasyOCR reader (supports Tajik, Russian, English)
    try:
        easyocr_reader = easyocr.Reader(['en', 'ru', 'tg'], gpu=False)
        logger.info("EasyOCR initialized with languages: en, ru, tg")
    except Exception as e:
        logger.warning(f"EasyOCR initialization failed: {e}")
        EASYOCR_AVAILABLE = False
except ImportError:
    EASYOCR_AVAILABLE = False
    logger.warning("easyocr not available. Install with: pip install easyocr")


def preprocess_image(image: Image.Image) -> Image.Image:
    """
    Предобработка изображения для улучшения качества OCR
    - Увеличение контраста
    - Удаление шума
    - Поворот изображения (автоматическое выравнивание)
    """
    if not CV2_AVAILABLE:
        return image
    
    try:
        # Convert PIL to OpenCV format
        img_array = np.array(image)
        
        # Convert to grayscale if needed
        if len(img_array.shape) == 3:
            gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
        else:
            gray = img_array
        
        # Apply Gaussian blur to reduce noise
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        
        # Apply adaptive thresholding for better contrast
        thresh = cv2.adaptiveThreshold(
            blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
            cv2.THRESH_BINARY, 11, 2
        )
        
        # Convert back to PIL Image
        processed_image = Image.fromarray(thresh)
        return processed_image
    except Exception as e:
        logger.warning(f"Image preprocessing failed: {e}. Using original image.")
        return image


def extract_text_with_tesseract(image: Image.Image, languages: str = "rus+eng") -> str:
    """
    Извлечение текста с помощью Tesseract OCR
    """
    if not TESSERACT_AVAILABLE:
        raise ImportError("pytesseract is not installed")
    
    try:
        # Preprocess image
        processed_image = preprocess_image(image)
        
        # Extract text
        text = pytesseract.image_to_string(
            processed_image,
            lang=languages,
            config='--psm 6'  # Assume uniform block of text
        )
        return text.strip()
    except Exception as e:
        logger.error(f"Tesseract OCR failed: {e}")
        raise


def extract_text_with_easyocr(image: Image.Image) -> str:
    """
    Извлечение текста с помощью EasyOCR (лучше для таджикского языка)
    """
    if not EASYOCR_AVAILABLE:
        raise ImportError("easyocr is not installed or not initialized")
    
    try:
        # Convert PIL to numpy array
        img_array = np.array(image)
        
        # EasyOCR expects BGR format for color images
        if len(img_array.shape) == 3:
            img_array = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
        
        # Extract text
        results = easyocr_reader.readtext(img_array)
        
        # Combine all detected text
        text_lines = [result[1] for result in results]
        text = '\n'.join(text_lines)
        
        return text.strip()
    except Exception as e:
        logger.error(f"EasyOCR failed: {e}")
        raise


def extract_text_from_image(image_path: str, use_easyocr: bool = True) -> Tuple[str, dict]:
    """
    Основная функция для извлечения текста из изображения
    
    Args:
        image_path: Путь к файлу изображения
        use_easyocr: Использовать EasyOCR (лучше для таджикского) или Tesseract
    
    Returns:
        Tuple[str, dict]: Распознанный текст и метаданные
    """
    try:
        # Load image
        image = Image.open(image_path)
        
        metadata = {
            "format": image.format,
            "size": image.size,
            "mode": image.mode
        }
        
        # Try EasyOCR first (better for Tajik language)
        if use_easyocr and EASYOCR_AVAILABLE:
            try:
                text = extract_text_with_easyocr(image)
                metadata["ocr_engine"] = "easyocr"
                logger.info(f"Text extracted using EasyOCR: {len(text)} characters")
                return text, metadata
            except Exception as e:
                logger.warning(f"EasyOCR failed, trying Tesseract: {e}")
        
        # Fallback to Tesseract
        if TESSERACT_AVAILABLE:
            try:
                text = extract_text_with_tesseract(image, languages="rus+eng")
                metadata["ocr_engine"] = "tesseract"
                logger.info(f"Text extracted using Tesseract: {len(text)} characters")
                return text, metadata
            except Exception as e:
                logger.error(f"Tesseract OCR failed: {e}")
                raise
        
        raise ImportError("No OCR engine available. Install pytesseract or easyocr")
        
    except Exception as e:
        logger.error(f"Failed to extract text from image {image_path}: {e}")
        raise


def extract_text_from_pdf(pdf_path: str, use_easyocr: bool = True) -> Tuple[str, dict]:
    """
    Извлечение текста из PDF файла (конвертация в изображения)
    
    Args:
        pdf_path: Путь к PDF файлу
        use_easyocr: Использовать EasyOCR или Tesseract
    
    Returns:
        Tuple[str, dict]: Распознанный текст и метаданные
    """
    if not PDF2IMAGE_AVAILABLE:
        raise ImportError("pdf2image is not installed")
    
    try:
        # Convert PDF to images
        images = convert_from_path(pdf_path, dpi=300)
        
        all_text = []
        metadata = {
            "pages": len(images),
            "ocr_engine": None
        }
        
        for i, image in enumerate(images):
            logger.info(f"Processing PDF page {i+1}/{len(images)}")
            
            # Extract text from each page
            if use_easyocr and EASYOCR_AVAILABLE:
                try:
                    page_text = extract_text_with_easyocr(image)
                    if metadata["ocr_engine"] is None:
                        metadata["ocr_engine"] = "easyocr"
                except Exception as e:
                    logger.warning(f"EasyOCR failed for page {i+1}, trying Tesseract: {e}")
                    if TESSERACT_AVAILABLE:
                        page_text = extract_text_with_tesseract(image)
                        if metadata["ocr_engine"] is None:
                            metadata["ocr_engine"] = "tesseract"
                    else:
                        raise
            elif TESSERACT_AVAILABLE:
                page_text = extract_text_with_tesseract(image)
                if metadata["ocr_engine"] is None:
                    metadata["ocr_engine"] = "tesseract"
            else:
                raise ImportError("No OCR engine available")
            
            all_text.append(page_text)
        
        # Combine all pages
        full_text = '\n\n--- Page Break ---\n\n'.join(all_text)
        
        logger.info(f"Text extracted from PDF: {len(full_text)} characters from {len(images)} pages")
        return full_text, metadata
        
    except Exception as e:
        logger.error(f"Failed to extract text from PDF {pdf_path}: {e}")
        raise


def extract_text_from_bytes(file_bytes: bytes, filename: str, use_easyocr: bool = True) -> Tuple[str, dict]:
    """
    Извлечение текста из файла в байтах (для загрузки через API)
    
    Args:
        file_bytes: Содержимое файла в байтах
        filename: Имя файла (для определения типа)
        use_easyocr: Использовать EasyOCR или Tesseract
    
    Returns:
        Tuple[str, dict]: Распознанный текст и метаданные
    """
    file_ext = os.path.splitext(filename.lower())[1]
    
    # Create temporary file
    with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as tmp_file:
        tmp_file.write(file_bytes)
        tmp_path = tmp_file.name
    
    try:
        if file_ext == '.pdf':
            text, metadata = extract_text_from_pdf(tmp_path, use_easyocr=use_easyocr)
        else:
            text, metadata = extract_text_from_image(tmp_path, use_easyocr=use_easyocr)
        
        return text, metadata
    finally:
        # Clean up temporary file
        try:
            os.unlink(tmp_path)
        except Exception as e:
            logger.warning(f"Failed to delete temporary file {tmp_path}: {e}")



