// src/services/googleCalendarService.js
// Motor de comunicação com a Google Calendar API v3

const CALENDAR_ID = 'primary';
const API_BASE = 'https://www.googleapis.com/calendar/v3';

/**
 * Busca os eventos do Google Calendar para um período de tempo.
 * @param {string} accessToken - Token OAuth 2.0 do usuário.
 * @param {Date} timeMin - Data início.
 * @param {Date} timeMax - Data fim.
 */
export async function fetchGoogleCalendarEvents(accessToken, timeMin, timeMax) {
  const params = new URLSearchParams({
    calendarId: CALENDAR_ID,
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 250,
  });

  const response = await fetch(
    `${API_BASE}/calendars/${CALENDAR_ID}/events?${params}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Google Calendar API Error: ${response.status}`);
  }

  const data = await response.json();
  
  // Converter eventos do Google para o formato do react-big-calendar
  return data.items.map((event) => ({
    id: event.id,
    title: event.summary || '(Sem título)',
    start: event.start.dateTime
      ? new Date(event.start.dateTime)
      : new Date(event.start.date),
    end: event.end.dateTime
      ? new Date(event.end.dateTime)
      : new Date(event.end.date),
    description: event.description || '',
    location: event.location || '',
    status: event.status,
    googleEvent: event, // Guardar evento original para referência
  }));
}

/**
 * Cria um novo evento no Google Calendar.
 * @param {string} accessToken - Token OAuth 2.0.
 * @param {object} eventData - Dados do evento.
 */
export async function createGoogleCalendarEvent(accessToken, eventData) {
  const googleEvent = {
    summary: eventData.title,
    description: eventData.description || '',
    location: eventData.location || '',
    start: {
      dateTime: eventData.start.toISOString(),
      timeZone: 'America/Sao_Paulo',
    },
    end: {
      dateTime: eventData.end.toISOString(),
      timeZone: 'America/Sao_Paulo',
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 60 },
        { method: 'email', minutes: 1440 },
      ],
    },
  };

  const response = await fetch(
    `${API_BASE}/calendars/${CALENDAR_ID}/events`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(googleEvent),
    }
  );

  if (!response.ok) {
    throw new Error(`Falha ao criar evento: ${response.status}`);
  }

  return response.json();
}

/**
 * Deleta um evento do Google Calendar.
 * @param {string} accessToken - Token OAuth 2.0.
 * @param {string} eventId - ID do evento.
 */
export async function deleteGoogleCalendarEvent(accessToken, eventId) {
  const response = await fetch(
    `${API_BASE}/calendars/${CALENDAR_ID}/events/${eventId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok && response.status !== 204) {
    throw new Error(`Falha ao deletar evento: ${response.status}`);
  }

  return true;
}

/**
 * Atualiza um evento existente no Google Calendar.
 * @param {string} accessToken - Token OAuth 2.0.
 * @param {string} eventId - ID do evento.
 * @param {object} eventData - Novos dados do evento.
 */
export async function updateGoogleCalendarEvent(accessToken, eventId, eventData) {
  const googleEvent = {
    summary: eventData.title,
    description: eventData.description || '',
    location: eventData.location || '',
    start: {
      dateTime: eventData.start.toISOString(),
      timeZone: 'America/Sao_Paulo',
    },
    end: {
      dateTime: eventData.end.toISOString(),
      timeZone: 'America/Sao_Paulo',
    },
  };

  const response = await fetch(
    `${API_BASE}/calendars/${CALENDAR_ID}/events/${eventId}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(googleEvent),
    }
  );

  if (!response.ok) {
    throw new Error(`Falha ao atualizar evento: ${response.status}`);
  }

  return response.json();
}
