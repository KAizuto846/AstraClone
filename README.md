# Astra Clone — Tu tutor de estudio IA self-hosted (clon de Astra AI)

Réplica **gratuita y auto-gestionada** de la app *Astra AI – Study & Exam Prep*
(tutor con plan de estudio, tarjetas, quizzes y exámenes simulados a partir de tus
apuntes/PDFs/fotos). Sin suscripción a Astra: **solo pagas a tu propio proveedor
de API** (o usas modelos locales gratis vía Ollama).

Construido sobre **DeepTutor** (HKUDS, Apache-2.0, 40k★) — tutor IA multi-agente
con RAG — + **Ollama** (modelos locales) + tu **panel de modelos/API** integrado.

## Qué incluye (lo mismo que Astra)

- Chatea con un tutor IA personalizado paso a paso (todas las materias).
- Sube **apuntes, PDFs, diapositivas, fotos** → los convierte en lecciones guiadas,
  tarjetas de estudio, quizzes y **exámenes simulados**.
- **Plan de estudio** personalizado hacia una fecha de examen y meta.
- Modos: resolver ejercicio (Solver), Socrático, práctica diaria, dominio por tema.
- Panel **Settings → Models**: agrega tus APIs (OpenAI-compatible, Anthropic,
  DeepSeek, Gemini, OpenRouter, Ollama local…) y gestiona modelos desde ahí.

## Requisitos (ya instalados)

- Python 3.11–3.14, Node 18+ (Next.js), npm, Git.
- **Ollama** (opcional, para modelos locales gratis).
- Una API key de tu proveedor **si quieres modelos de pago** (ej. OpenAI,
  DeepSeek, OpenRouter — cualquier formato OpenAI).

## Instalación (ya hecha en este PC)

```bash
# 1) Clonar el motor tutor
git clone https://github.com/HKUDS/DeepTutor.git research/DeepTutor
# 2) Instalar
cd research/DeepTutor && python3 -m venv .venv
source .venv/bin/activate && pip install -e .
deeptutor init --cli   # crea workspace (ports: backend 8001, frontend 3782)
```

## Uso

```bash
~/.hermes/… # o directamente:
~/AstraClone/scripts/control.sh start    # levanta todo (Ollama + app)
~/AstraClone/scripts/control.sh stop
~/AstraClone/scripts/control.sh status
```

Luego abre **http://localhost:3782** (o 3000 si 3782 no responde).
En **Settings → Models** agrega tu proveedor (Base URL + API key + modelo) y guarda.
Para RAG crea una Knowledge Base subiendo tus PDFs/apuntes.

## Extras que agregué a DeepTutor

- **Podcast (estilo NotebookLM)** — convierte tu base de conocimiento en un podcast de dos voces con transcripción. Usa TTS Edge (gratis, sin API key) y se genera desde la pestaña "Podcast" de cada Knowledge Base.
- **Plan de examen con roadmap** — fija tu fecha de examen y calificación deseada, y la app arma un roadmap semanal con cuenta regresiva y prioridad por tema.
- **Perfil de aprendiz** — indica tu modalidad preferida y la app adapta el plan.
- **Búsqueda web local (SearXNG)** — resultados con citas desde tu propia instancia.
- **APK Android (TWA)** — la app instalable como aplicación nativa en tu teléfono.

## Arquitectura

- **DeepTutor** — tutor IA multi-agente + RAG (FastAPI backend :8001, Next.js frontend :3782).
- **Ollama** — modelos locales opcionales (smolvlm, moondream ya instalados) en :11434.
- **Panel de modelos** — Settings → Models del propio DeepTutor (API format:
  OpenAI Chat Completions / Responses / Anthropic; soporta proveedores locales).
- (Opcional) **LiteLLM / new-api** — si quieres un panel externo de gestión/factura
  de claves multicliente, agrégalo apuntando DeepTutor a su `/v1`.

## Costos

- App: **$0** (todo open-source y auto-hosted).
- Modelos: **$0** si usas Ollama local; o **solo lo que gaste tu API key** del
  proveedor que elijas en el panel. Sin intermediario, sin suscripción.

## Archivos de investigación

`research/` contiene clones de referencia: DeepTutor, Mr. Ranedeer (prompts de
tutor), TutoriaLLM, Anki FlashCard Generator. Todo con licencia permisiva (MIT/Apache).
