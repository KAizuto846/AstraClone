"""Edge TTS adapter — free neural voices, no API key, no local model.

Uses Microsoft Edge's public read-aloud endpoint through the ``edge-tts``
package. Registered as ``edge_tts`` for the two-voice audio overview and for
any workspace voice feature that should work without a paid TTS provider.
"""

from __future__ import annotations

import logging

from deeptutor.services.voice.base import BaseTTSAdapter, VoiceProviderError
from deeptutor.services.voice.config import TTSConfig

logger = logging.getLogger(__name__)


class EdgeTTSAdapter(BaseTTSAdapter):
    """Stream ``text`` through edge-tts into a single mp3 clip."""

    async def synthesize(self, text: str, config: TTSConfig) -> tuple[bytes, str]:
        try:
            import edge_tts
        except ImportError as exc:  # pragma: no cover - dependency declared
            raise VoiceProviderError(
                "Edge TTS is not installed (pip install edge-tts)."
            ) from exc

        voice = config.voice or "es-MX-DaliaNeural"
        kwargs: dict = {}
        if config.speed is not None:
            kwargs["rate"] = f"{config.speed:+.0f}%"
        try:
            communicate = edge_tts.Communicate(
                text,
                voice,
                **kwargs,
            )
            chunks: list[bytes] = []
            async for chunk in communicate.stream():
                if chunk["type"] == "audio" and chunk.get("data"):
                    chunks.append(chunk["data"])
        except Exception as exc:
            raise VoiceProviderError(f"Edge TTS synthesis failed: {exc}") from exc

        if not chunks:
            raise VoiceProviderError("Edge TTS returned no audio.")
        return b"".join(chunks), "audio/mpeg"


__all__ = ["EdgeTTSAdapter"]