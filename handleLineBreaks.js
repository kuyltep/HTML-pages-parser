export function handleLineBreaks(zones, $) {
  const finalZones = [];

  zones.forEach((zone) => {
    if (Array.isArray(zone)) {
      const newZones = [];
      let currentZone = [];

      zone.forEach((element) => {
        if ($(element).is("br") || $(element).css("display") === "block") {
          if (currentZone.length > 0) {
            newZones.push(currentZone);
            currentZone = [];
          }
          newZones.push(element);
        } else {
          currentZone.push(element);
        }
      });

      if (currentZone.length > 0) {
        newZones.push(currentZone);
      }

      finalZones.push(...newZones);
    } else {
      finalZones.push(zone);
    }
  });

  return finalZones;
}
