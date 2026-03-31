"""
WebSocket connection manager + Telegram Bot notification dispatcher.
"""
import json
from typing import Dict, List, Optional
from fastapi import WebSocket
from app.core.config import settings


class ConnectionManager:
    def __init__(self):
        self.active: Dict[int, List[WebSocket]] = {}
        self.kiosk_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        if user_id not in self.active:
            self.active[user_id] = []
        self.active[user_id].append(websocket)

    async def connect_kiosk(self, websocket: WebSocket):
        await websocket.accept()
        self.kiosk_connections.append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: Optional[int] = None):
        if user_id and user_id in self.active:
            self.active[user_id] = [ws for ws in self.active[user_id] if ws != websocket]
        self.kiosk_connections = [ws for ws in self.kiosk_connections if ws != websocket]

    async def send_to_user(self, user_id: int, message: dict):
        connections = self.active.get(user_id, [])
        dead = []
        for ws in connections:
            try:
                await ws.send_text(json.dumps(message))
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.active[user_id].remove(ws)

    async def broadcast_kiosk(self, message: dict):
        dead = []
        for ws in self.kiosk_connections:
            try:
                await ws.send_text(json.dumps(message))
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.kiosk_connections.remove(ws)

    async def broadcast_to_class(self, user_ids: List[int], message: dict):
        for uid in user_ids:
            await self.send_to_user(uid, message)


manager = ConnectionManager()


async def send_telegram_notification(text: str):
    if not settings.TELEGRAM_BOT_TOKEN or not settings.TELEGRAM_CHAT_ID:
        return
    try:
        import httpx
        url = f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/sendMessage"
        async with httpx.AsyncClient() as client:
            await client.post(url, json={"chat_id": settings.TELEGRAM_CHAT_ID, "text": text})
    except Exception:
        pass
