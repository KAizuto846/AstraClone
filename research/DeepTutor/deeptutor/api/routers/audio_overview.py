"""Astra-style "NotebookLM" audio overview — REST surface.

Thin HTTP wrapper over the two-voice ``audio_overview`` capability pipeline:
retrieve from a knowledge base, script a host/expert conversation, synthesize
both voices (Edge TTS by default), and publish the mp3 + transcript to the
public outputs tree so the frontend can render an audio player.
"""

from __future__ import annotations

import logging
import uuid

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from deeptutor.capabilities.audio_overview.pipeline import (
    AudioOverviewError,
    AudioOverviewPipeline,
)
from deeptutor.capabilities.audio_overview.request_config import AudioOverviewRequestConfig
from deeptutor.services.workspace.context import current_workspace_id

logger = logging.getLogger(__name__)

router = APIRouter()


class AudioOverviewRequest(BaseModel):
    """Request body for generating a two-voice audio overview from a KB."""

    kb_name: str = Field(..., min_length=1, max_length=200)
    topic: str = Field(default="", max_length=500)
    target_minutes: int = Field(default=5, ge=1, le=15)
    host_voice: str | None = Field(default=None, max_length=64)
    expert_voice: str | None = Field(default=None, max_length=64)
    language: str = Field(default="es", max_length=16)


@router.post("")
async def generate_audio_overview(payload: AudioOverviewRequest) -> dict:
    """Generate a KB-grounded two-voice podcast + transcript."""
    from deeptutor.services.path_service import get_path_service
    from deeptutor.services.prompt import get_prompt_manager

    path_service = get_path_service()
    output_root = path_service.get_public_outputs_root()
    workspace_id = current_workspace_id() or ""

    try:
        prompts = get_prompt_manager().load_prompts(
            "capabilities",
            "audio_overview",
            language=payload.language,
        )
    except Exception:
        prompts = {}
    if not prompts:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audio overview prompts are not installed for this language.",
        )

    pipeline = AudioOverviewPipeline(
        language=payload.language,
        system_prompt=str(prompts.get("system") or ""),
        instruction_prompt=str(prompts.get("instructions") or ""),
        workspace_output_dir=output_root / "audio-overview",
        workspace_logical_dir="audio-overview",
        workspace_id=workspace_id,
    )
    request_config = AudioOverviewRequestConfig(
        topic=payload.topic,
        target_minutes=payload.target_minutes,
        host_voice=payload.host_voice,
        expert_voice=payload.expert_voice,
    )

    turn_id = uuid.uuid4().hex[:12]
    try:
        retrieved = await pipeline.retrieve(
            topic=payload.topic or "Knowledge base overview",
            kb_name=payload.kb_name,
            request_config=request_config,
        )
        script = await pipeline.generate_script(
            topic=payload.topic or "Knowledge base overview",
            context=retrieved,
            request_config=request_config,
        )
        artifacts = await pipeline.publish(
            turn_id=turn_id,
            script=script,
            context=retrieved,
            request_config=request_config,
        )
    except AudioOverviewError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except Exception as exc:  # pragma: no cover - defensive
        logger.exception("audio overview generation failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Audio overview generation failed: {exc}",
        ) from exc

    return {
        "title": artifacts.title,
        "transcript": artifacts.transcript,
        "audio_url": f"/files/outputs/audio-overview/{artifacts.audio_path.name}",
        "transcript_url": f"/files/outputs/audio-overview/{artifacts.transcript_path.name}",
        "citations": artifacts.citations,
        "segments": [segment.model_dump() for segment in artifacts.script.segments],
    }


__all__ = ["router"]