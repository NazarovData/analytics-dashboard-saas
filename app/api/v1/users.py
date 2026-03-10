"""
User API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException
from typing import List

router = APIRouter()

@router.get("/me")
async def get_current_user():
    """Get current user info"""
    return {
        "id": 1,
        "email": "test@example.com",
        "message": "User endpoint - implement authentication"
    }

@router.get("/")
async def list_users():
    """List all users"""
    return {
        "users": [],
        "total": 0,
        "message": "Users endpoint - implement database"
    }

