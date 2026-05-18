import { getEventInfo } from './bobApi';


export const fetchEventDetail = async (bobUrl, eventId) => {
  return await fetchEventInfo(bobUrl, eventId);
};

export const fetchEventInfo = async (bobUrl, eventId, maxRetryCount = 3) => {
  for (let attempt = 0; attempt < maxRetryCount; attempt++) {
    try {
      const eventData = await getEventInfo(bobUrl, eventId);
      if (!eventData || eventData.openDate === '0000-00-00 00:00:00') {
        return null;
      }
      return eventData;
    } catch (error) {
      console.error(
          `Attempt ${attempt + 1}: Error fetching event details for eventId ${eventId} - ${error.message}`
      );
      if (attempt === maxRetryCount - 1) {
        throw error;
      }
    }
  }
};
