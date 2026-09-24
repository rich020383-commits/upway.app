-- Voz del agente seleccionada en el panel de activación (/health/production):
-- agentVoice = identificador Telnyx (Telnyx.<modelo>.<voz> o clon),
-- agentVoiceLabel = etiqueta amigable mostrada en el panel.
ALTER TABLE "Tienda" ADD COLUMN "agentVoice" TEXT;
ALTER TABLE "Tienda" ADD COLUMN "agentVoiceLabel" TEXT;
