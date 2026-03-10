"""
AI Chat API - Analytics AI powered by Claude
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import logging
from app.services.claude_validator import claude_validator

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai-chat", tags=["ai-chat"])


class ChatMessage(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str


class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []
    context: Optional[dict] = None  # Данные аналитики для контекста


class ChatResponse(BaseModel):
    message: str
    success: bool
    error: Optional[str] = None


@router.post("/message", response_model=ChatResponse)
async def send_message(request: ChatRequest):
    """
    Отправить сообщение в Analytics AI чат
    """
    try:
        if not claude_validator.is_available():
            return ChatResponse(
                message="",
                success=False,
                error="Claude AI не настроен. Добавьте ANTHROPIC_API_KEY в .env"
            )
        
        # Формируем системный промпт
        system_prompt = """Ты - Analytics AI, умный помощник для бизнес-аналитики.

Твоя задача:
- Отвечать на вопросы о данных и метриках
- Давать конкретные рекомендации для роста бизнеса
- Объяснять сложные концепции простым языком
- Помогать принимать решения на основе данных

Стиль общения:
- Дружелюбный и профессиональный
- Конкретный и по делу
- С примерами и цифрами
- На русском языке

Если есть контекст с данными - используй их для ответа.
Если данных нет - дай общие рекомендации."""

        # Формируем сообщения для Claude
        messages = []
        
        # Добавляем историю
        for msg in request.history[-10:]:  # Последние 10 сообщений
            messages.append({
                "role": msg.role,
                "content": msg.content
            })
        
        # Добавляем контекст если есть
        user_message = request.message
        if request.context:
            context_str = f"\n\n📊 Контекст данных:\n"
            analytics = request.context.get('analytics', {})
            if analytics:
                context_str += f"- Выручка: {analytics.get('total_revenue', 0):,.2f}₽\n"
                context_str += f"- Заказов: {analytics.get('total_orders', 0)}\n"
                context_str += f"- Средний чек: {analytics.get('average_check', 0):,.2f}₽\n"
                if analytics.get('unique_clients'):
                    context_str += f"- Клиентов: {analytics.get('unique_clients')}\n"
            
            user_message = f"{request.message}{context_str}"
        
        # Добавляем текущее сообщение
        messages.append({
            "role": "user",
            "content": user_message
        })
        
        # Отправляем в Claude
        response = claude_validator.client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=2000,
            system=system_prompt,
            messages=messages
        )
        
        # Получаем ответ
        assistant_message = response.content[0].text
        
        logger.info(f"Analytics AI ответил на вопрос: {request.message[:50]}...")
        
        return ChatResponse(
            message=assistant_message,
            success=True
        )
        
    except Exception as e:
        logger.error(f"Ошибка в AI чате: {e}", exc_info=True)
        return ChatResponse(
            message="",
            success=False,
            error=f"Ошибка: {str(e)}"
        )


@router.get("/health")
async def health_check():
    """Проверка доступности AI чата"""
    return {
        "status": "ok" if claude_validator.is_available() else "unavailable",
        "claude_available": claude_validator.is_available()
    }
