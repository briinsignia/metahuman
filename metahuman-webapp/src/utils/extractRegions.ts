export const extractRegions = (audioData: any, duration: any) => {
  const minValue = 0.01;
  const minSilenceDuration = 0.1;
  const mergeDuration = 0.2;
  const scale = duration / audioData.length;
  const silentRegions = [];

  // Find all silent regions longer than minSilenceDuration
  let start = 0;
  let end = 0;
  let isSilent = false;
  for (let i = 0; i < audioData.length; i++) {
    if (audioData[i] < minValue) {
      if (!isSilent) {
        start = i;
        isSilent = true;
      }
    } else if (isSilent) {
      end = i;
      isSilent = false;
      if (scale * (end - start) > minSilenceDuration) {
        silentRegions.push({
          start: scale * start,
          end: scale * end,
        });
      }
    }
  }

  // Merge silent regions that are close together
  const mergedRegions = [];
  let lastRegion = null;
  for (let i = 0; i < silentRegions.length; i++) {
    if (lastRegion && silentRegions[i].start - lastRegion.end < mergeDuration) {
      lastRegion.end = silentRegions[i].end;
    } else {
      lastRegion = silentRegions[i];
      mergedRegions.push(lastRegion);
    }
  }

  // Find regions that are not silent
  const regions = [];
  let lastEnd = 0;
  for (let i = 0; i < mergedRegions.length; i++) {
    regions.push({
      start: lastEnd,
      end: mergedRegions[i].start,
    });
    lastEnd = mergedRegions[i].end;
  }

  return regions;
};
